import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { TeamProgressComponent } from './team-progress';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

describe('TeamProgress', () => {
    let component: TeamProgressComponent;
    let fixture: ComponentFixture<TeamProgressComponent>;

    beforeEach(async () => {
        const apiServiceMock = {
            activePlan$: of(null),
            currentUser$: of(null),
            getTeamProgress: () => of([]),
            getWeeklyPlans: () => of([]),
            getTeamMembers: () => of([])
        };

        await TestBed.configureTestingModule({
            imports: [TeamProgressComponent],
            providers: [
                provideHttpClient(),
                provideRouter([]),
                { provide: ApiService, useValue: apiServiceMock }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(TeamProgressComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
