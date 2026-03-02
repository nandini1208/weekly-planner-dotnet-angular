import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { BacklogComponent } from './backlog';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';

describe('Backlog', () => {
  let component: BacklogComponent;
  let fixture: ComponentFixture<BacklogComponent>;

  beforeEach(async () => {
    const apiServiceMock = {
      getBacklogItems: () => of([])
    };

    await TestBed.configureTestingModule({
      imports: [BacklogComponent],
      providers: [
        provideHttpClient(),
        { provide: ApiService, useValue: apiServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BacklogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
