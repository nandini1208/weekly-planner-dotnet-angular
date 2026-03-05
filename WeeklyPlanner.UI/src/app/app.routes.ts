import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { TeamManagementComponent } from './components/team-management/team-management';
import { BacklogComponent } from './components/backlog/backlog';
import { PlanSetupComponent } from './components/plan-setup/plan-setup';
import { ReviewFreezeComponent } from './components/review-freeze/review-freeze';
import { PlanMyWorkComponent } from './components/plan-my-work/plan-my-work';
import { UpdateProgressComponent } from './components/update-progress/update-progress';
import { TeamProgressComponent } from './components/team-progress/team-progress';
import { PastWeeksComponent } from './components/past-weeks/past-weeks';

export const routes: Routes = [
    { path: '', redirectTo: '/team', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'team', component: TeamManagementComponent },
    { path: 'backlog', component: BacklogComponent },
    { path: 'setup', component: PlanSetupComponent },
    { path: 'review-freeze', component: ReviewFreezeComponent },
    { path: 'plan-my-work', component: PlanMyWorkComponent },
    { path: 'update-progress', component: UpdateProgressComponent },
    { path: 'team-progress', component: TeamProgressComponent },
    { path: 'past-weeks', component: PastWeeksComponent }
];
