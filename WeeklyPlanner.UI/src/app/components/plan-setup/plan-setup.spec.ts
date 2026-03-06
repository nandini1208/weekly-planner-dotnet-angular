import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { PlanSetupComponent } from './plan-setup';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

describe('PlanSetup', () => {
  let component: PlanSetupComponent;
  let fixture: ComponentFixture<PlanSetupComponent>;

  beforeEach(async () => {
    const apiServiceMock = {
      getTeamMembers: () => of([]),
      members$: of([]),
      createPlan: () => of({})
    };

    await TestBed.configureTestingModule({
      imports: [PlanSetupComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: ApiService, useValue: apiServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlanSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
