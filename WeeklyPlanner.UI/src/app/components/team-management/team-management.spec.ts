import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { TeamManagementComponent } from './team-management';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';

describe('TeamManagement', () => {
  let component: TeamManagementComponent;
  let fixture: ComponentFixture<TeamManagementComponent>;

  beforeEach(async () => {
    const apiServiceMock = {
      getTeamMembers: () => of([])
    };

    await TestBed.configureTestingModule({
      imports: [TeamManagementComponent],
      providers: [
        provideHttpClient(),
        { provide: ApiService, useValue: apiServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TeamManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
