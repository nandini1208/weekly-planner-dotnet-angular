import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
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
  showImportSuccess = false;

  constructor(
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) { }

  loadMembers() {
    this.api.getTeamMembers().subscribe(res => {
      this.members = res || [];
      this.cdr.detectChanges();
    });
  }

  activePlan: any = null;
  showPlanBanner = false;

  loadActivePlan() {
    this.api.getWeeklyPlans().subscribe(plans => {
      if (plans && plans.length > 0) {
        const sortedPlans = [...plans].sort((a, b) => b.id - a.id);
        this.activePlan = sortedPlans[0];
        // Show the "Planning is open!" banner briefly then auto-hide it
        this.showPlanBanner = true;
        setTimeout(() => { this.showPlanBanner = false; this.cdr.detectChanges(); }, 500);
      } else {
        this.activePlan = null;
      }
      this.cdr.detectChanges();
    });
  }

  // 🏁 TRACK FINISHED WEEK
  justFinishedWeek = false;

  ngOnInit(): void {
    this.api.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.cdr.detectChanges();
    });

    // Subscribe to reactive members list
    this.api.members$.subscribe(members => {
      this.members = members || [];
      this.cdr.detectChanges();
    });

    // Subscribe to import success flag
    this.api.importSuccess$.subscribe(success => {
      this.showImportSuccess = success;
      this.cdr.detectChanges();
    });

    // Subscribe to reactive active plan
    this.api.activePlan$.subscribe(plan => {
      this.activePlan = plan;
      if (plan) {
        // Show the feedback banner briefly if we just got a plan
        this.showPlanBanner = true;
        setTimeout(() => { this.showPlanBanner = false; this.cdr.detectChanges(); }, 800);
      }
      this.cdr.detectChanges();
    });

    // Force initial fetch
    this.api.getTeamMembers().subscribe();
    this.api.getWeeklyPlans().subscribe();

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.api.getTeamMembers().subscribe();
        this.api.getWeeklyPlans().subscribe();
      });
  }

  // 🚀 Main dashboard actions
  startNewWeek() {
    this.router.navigate(['/setup']);
  }

  manageBacklog() {
    this.router.navigate(['/backlog']);
  }

  manageTeam() {
    this.router.navigate(['/team'], { queryParams: { mode: 'manage' } });
  }

  viewPastWeeks() {
    this.router.navigate(['/past-weeks']);
  }

  planMyWork() {
    this.router.navigate(['/plan-my-work']);
  }

  reviewFreeze() {
    this.router.navigate(['/review-freeze']);
  }

  updateProgress() {
    this.router.navigate(['/update-progress']);
  }

  teamProgress() {
    this.router.navigate(['/team-progress']);
  }

  showCancelModal = false;
  isCancelling = false;

  cancelPlan() {
    if (this.activePlan) {
      this.showCancelModal = true;
    }
  }

  closeCancelModal() {
    this.showCancelModal = false;
  }

  confirmCancelPlan() {
    if (!this.activePlan || this.isCancelling) return;
    this.isCancelling = true;

    this.api.deleteWeeklyPlan(this.activePlan.id).subscribe({
      next: () => {
        this.activePlan = null;
        this.showCancelModal = false;
        this.isCancelling = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isCancelling = false;
        console.error('Error cancelling plan', err);
      }
    });
  }

  // 👤 SELECT USER → Updates global state
  selectUser(member: TeamMember) {
    this.api.setCurrentUser(member);
  }

  // 🏁 FINISH WEEK MODAL
  showFinishModal = false;
  isFinishing = false;

  confirmFinishWeek() {
    this.showFinishModal = true;
  }

  closeFinishModal() {
    this.showFinishModal = false;
  }

  executeFinishWeek() {
    if (!this.activePlan || this.isFinishing) return;
    this.isFinishing = true;

    this.api.finishWeek(this.activePlan.id).subscribe({
      next: () => {
        this.activePlan = null;
        this.showFinishModal = false;
        this.isFinishing = false;
        this.justFinishedWeek = true; // Show "This week is done!" state

        // Hide progress toast if any
        this.showPlanBanner = false;

        this.api.getWeeklyPlans().subscribe();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isFinishing = false;
        console.error('Error finishing week', err);
      }
    });
  }
}