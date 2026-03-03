import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { TeamMember } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  currentUser: TeamMember | null = null;
  members: TeamMember[] = [];

  constructor(private router: Router, private api: ApiService) { }

  loadMembers() {
    this.api.getTeamMembers().subscribe(res => {
      this.members = res || [];
    });
  }

  activePlan: any = null;

  loadActivePlan() {
    this.api.getWeeklyPlans().subscribe(plans => {
      // Just grab the most recent non-frozen plan or the latest plan for now
      if (plans && plans.length > 0) {
        this.activePlan = plans[plans.length - 1];
      } else {
        this.activePlan = null;
      }
    });
  }

  ngOnInit(): void {
    this.api.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.loadMembers();
    this.loadActivePlan();
  }

  // 🚀 Main dashboard actions
  startNewWeek() {
    this.router.navigate(['/setup']);
  }

  manageBacklog() {
    this.router.navigate(['/backlog']);
  }

  manageTeam() {
    this.router.navigate(['/team']);
  }

  viewPastWeeks() {
    console.log('View past weeks clicked');
  }

  planMyWork() {
    console.log('Plan My Work clicked');
  }

  reviewFreeze() {
    console.log('Review and Freeze clicked');
  }

  cancelPlan() {
    if (this.activePlan) {
      this.api.deleteWeeklyPlan(this.activePlan.id).subscribe(() => {
        this.activePlan = null;
      });
    }
  }

  // 👤 SELECT USER → Updates global state
  selectUser(member: TeamMember) {
    this.api.setCurrentUser(member);
  }
}