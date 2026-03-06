import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { UpdateProgressComponent } from './update-progress';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

describe('UpdateProgress', () => {
    let component: UpdateProgressComponent;
    let fixture: ComponentFixture<UpdateProgressComponent>;

    beforeEach(async () => {
        const apiServiceMock = {
            activePlan$: of(null),
            currentUser$: of(null),
            getMemberProgress: () => of([]),
            updateProgress: () => of({}),
            getWeeklyPlans: () => of([])
        };

        await TestBed.configureTestingModule({
            imports: [UpdateProgressComponent],
            providers: [
                provideHttpClient(),
                provideRouter([]),
                { provide: ApiService, useValue: apiServiceMock }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(UpdateProgressComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
