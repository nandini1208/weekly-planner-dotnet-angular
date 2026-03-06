import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ReviewFreezeComponent } from './review-freeze';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

describe('ReviewFreeze', () => {
    let component: ReviewFreezeComponent;
    let fixture: ComponentFixture<ReviewFreezeComponent>;

    beforeEach(async () => {
        const apiServiceMock = {
            activePlan$: of(null),
            currentUser$: of(null),
            getAssignmentsByPlanId: () => of([]),
            getTeamMembers: () => of([]),
            getWeeklyPlans: () => of([])
        };

        await TestBed.configureTestingModule({
            imports: [ReviewFreezeComponent],
            providers: [
                provideHttpClient(),
                provideRouter([]),
                { provide: ApiService, useValue: apiServiceMock }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ReviewFreezeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
