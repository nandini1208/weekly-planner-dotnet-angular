import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { PastWeeksComponent } from './past-weeks';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';

describe('PastWeeks', () => {
    let component: PastWeeksComponent;
    let fixture: ComponentFixture<PastWeeksComponent>;

    beforeEach(async () => {
        const apiServiceMock = {
            getWeeklyPlans: () => of([]),
        };

        await TestBed.configureTestingModule({
            imports: [PastWeeksComponent],
            providers: [
                provideHttpClient(),
                { provide: ApiService, useValue: apiServiceMock }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PastWeeksComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
