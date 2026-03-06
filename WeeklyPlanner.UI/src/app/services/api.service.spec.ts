import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { TeamMember, BacklogItem, WeeklyPlan } from '../models/models';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';

describe('ApiService', () => {
    let service: ApiService;
    let httpMock: HttpTestingController;

    const mockMembers: TeamMember[] = [
        { id: 1, name: 'Alice', isLead: true },
        { id: 2, name: 'Bob', isLead: false }
    ];

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [ApiService]
        });
        service = TestBed.inject(ApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('State Management', () => {
        it('should update currentUser$', async () => {
            const user: TeamMember = { id: 1, name: 'Alice', isLead: true };
            service.setCurrentUser(user);
            const curr = await firstValueFrom(service.currentUser$.pipe(filter(u => !!u)));
            expect(curr!.name).toBe('Alice');
        });

        it('should handle import success state', async () => {
            service.setImportSuccess(true);
            const val = await firstValueFrom(service.importSuccess$.pipe(filter(v => v === true)));
            expect(val).toBe(true);
            service.clearImportSuccess();
            const val2 = await firstValueFrom(service.importSuccess$.pipe(filter(v => v === false)));
            expect(val2).toBe(false);
        });
    });

    describe('Team Members', () => {
        it('should get team members and sort them (lead first)', async () => {
            const unsorted: TeamMember[] = [
                { id: 2, name: 'Bob', isLead: false },
                { id: 1, name: 'Alice', isLead: true }
            ];

            const promise = firstValueFrom(service.getTeamMembers().pipe(filter(m => m.length > 0)));

            const req = httpMock.expectOne(request => request.url.includes('/api/Team'));
            expect(req.request.method).toBe('GET');
            req.flush(unsorted);

            const members = await promise;
            expect(members.length).toBe(2);
            expect(members[0].isLead).toBe(true);
            expect(members[0].name).toBe('Alice');
        });

        it('should handle addTeamMember with optimistic update', async () => {
            const newMember: Partial<TeamMember> = { name: 'Charlie', isLead: false };
            const serverResponse: TeamMember = { id: 3, name: 'Charlie', isLead: false };

            const promise = firstValueFrom(service.addTeamMember(newMember));

            const req = httpMock.expectOne(request => request.url.includes('/api/Team') && request.method === 'POST');
            req.flush(serverResponse);

            const res = await promise;
            expect(res.id).toBe(3);
        });

        it('should revert optimistic update on addTeamMember error', async () => {
            const newMember: Partial<TeamMember> = { name: 'Fail', isLead: false };

            const promise = firstValueFrom(service.addTeamMember(newMember));

            const req = httpMock.expectOne(request => request.url.includes('/api/Team') && request.method === 'POST');
            req.flush('Error', { status: 500, statusText: 'Server Error' });

            try {
                await promise;
                expect.fail('Should have failed');
            } catch (err: any) {
                expect(err.status).toBe(500);
            }
        });

        it('should remove team member optimistically', async () => {
            // Setup initial members
            const getObs = service.getTeamMembers();
            const getReq = httpMock.expectOne(request => request.url.includes('/api/Team'));
            getReq.flush(mockMembers);
            await firstValueFrom(getObs.pipe(filter(m => m.length > 0)));

            const promise = firstValueFrom(service.removeTeamMember(1));

            const delReq = httpMock.expectOne(request => request.url.includes('/api/Team/1') && request.method === 'DELETE');
            delReq.flush({});

            await promise;
        });
    });

    describe('Weekly Plans', () => {
        it('should fetch plans and set active plan', async () => {
            const plans: WeeklyPlan[] = [
                { id: 1, isCompleted: true, startDate: '2023-01-01', totalPlannedHours: 0, clientPercentage: 50, techDebtPercentage: 50, rnDPercentage: 0, isFrozen: true },
                { id: 2, isCompleted: false, startDate: '2023-01-08', totalPlannedHours: 0, clientPercentage: 40, techDebtPercentage: 40, rnDPercentage: 20, isFrozen: false }
            ];

            service.getWeeklyPlans();

            const req = httpMock.expectOne(request => request.url.includes('/api/Plan'));
            req.flush(plans);

            const active = await firstValueFrom(service.activePlan$.pipe(filter(p => !!p)));
            expect(active!.id).toBe(2);
        });

        it('should create a new plan', async () => {
            const plan: Partial<WeeklyPlan> = { clientPercentage: 30, techDebtPercentage: 30, rnDPercentage: 40 };
            const response = { id: 3, totalPlannedHours: 0, ...plan } as WeeklyPlan;

            const promise = firstValueFrom(service.createPlan(plan));

            const req = httpMock.expectOne(request => request.url.includes('/api/Plan') && request.method === 'POST');
            req.flush(response);

            const res = await promise;
            expect(res.id).toBe(3);
        });
    });

    describe('Export / Import', () => {
        it('should export all data', async () => {
            const promise = firstValueFrom(service.exportAll());

            const req = httpMock.expectOne(request => request.url.includes('/api/Export/all'));
            req.flush({ test: true });

            const data = await promise;
            expect(data.test).toBe(true);
        });

        it('should seed data', async () => {
            const promise = firstValueFrom(service.seedData());

            const req = httpMock.expectOne(request => request.url.includes('/api/Seed'));
            req.flush({ success: true });

            const res = await promise;
            expect(res.success).toBe(true);
        });
    });
});
