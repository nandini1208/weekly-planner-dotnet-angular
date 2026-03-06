import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { PlanMyWorkComponent } from './plan-my-work';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

describe('PlanMyWork', () => {
    let component: PlanMyWorkComponent;
    let fixture: ComponentFixture<PlanMyWorkComponent>;

    beforeEach(async () => {
        const apiServiceMock = {
            getWeeklyPlans: () => of([]),
            getBacklogItems: () => of([]),
            currentUser$: of(null),
            members$: of([]),
            activePlan$: of(null),
            getAssignmentsByPlanId: () => of([])
        };

        await TestBed.configureTestingModule({
            imports: [PlanMyWorkComponent],
            providers: [
                provideHttpClient(),
                provideRouter([]),
                { provide: ApiService, useValue: apiServiceMock }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PlanMyWorkComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
