import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { DashboardComponent } from './dashboard';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';

describe('Dashboard', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    const apiServiceMock = {
      getTeamMembers: () => of([]),
      getWeeklyPlans: () => of([]),
      getBacklogItems: () => of([]),
      currentUser$: of(null),
      members$: of([]),
      importSuccess$: of(false),
      activePlan$: of(null),
      setCurrentUser: () => { }
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideHttpClient(),
        { provide: ApiService, useValue: apiServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
