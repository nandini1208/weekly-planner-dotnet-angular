import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { TeamManagementComponent } from './components/team-management/team-management';
import { BacklogComponent } from './components/backlog/backlog';
import { PlanSetupComponent } from './components/plan-setup/plan-setup';

export const routes: Routes = [
    { path: '', redirectTo: '/team', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'team', component: TeamManagementComponent },
    { path: 'backlog', component: BacklogComponent },
    { path: 'setup', component: PlanSetupComponent }
];
