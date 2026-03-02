import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { TeamMember, BacklogItem, WeeklyPlan, TaskAssignment } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  apiService = inject(ApiService);

  teamMembers: TeamMember[] = [];
  backlogItems: BacklogItem[] = [];

  activeMemberId: number | null = null;
  selectedPlanId: number = 1; // Assuming Plan 1 for simplicity in this exercise phase

  showClaimForm = false;
  claimItemId: number = 0;
  claimHours: number = 0;

  // Track progress updates
  updateAssignmentId: number = 0;
  updateDoneHours: number = 0;
  updateStatus: string = 'In Progress';

  ngOnInit(): void {
    this.apiService.getTeamMembers().subscribe(m => this.teamMembers = m);
    this.apiService.getBacklogItems().subscribe(i => this.backlogItems = i);
  }

  selectMember(id: number) {
    this.activeMemberId = id;
    this.showClaimForm = false;
  }

  get activeMemberName(): string {
    return this.teamMembers.find(m => m.id === this.activeMemberId)?.name || '';
  }

  toggleClaimForm() {
    this.showClaimForm = !this.showClaimForm;
  }

  claimTask() {
    if (!this.activeMemberId || !this.claimItemId || this.claimHours <= 0) return;

    this.apiService.assignTask({
      weeklyPlanId: this.selectedPlanId,
      teamMemberId: this.activeMemberId,
      backlogItemId: Number(this.claimItemId),
      plannedHours: this.claimHours
    }).subscribe({
      next: (assignment) => {
        alert("Task claimed successfully!");
        this.showClaimForm = false;
        this.claimHours = 0;
      },
      error: (err) => alert(err.error || "Failed to claim task. You may have exceeded your 30 hour limit.")
    });
  }

  submitProgress() {
    if (!this.updateAssignmentId || this.updateDoneHours < 0) return;

    this.apiService.updateProgress({
      assignmentId: Number(this.updateAssignmentId),
      completedHours: this.updateDoneHours,
      status: this.updateStatus
    }).subscribe({
      next: () => {
        alert("Progress updated successfully!");
        this.apiService.getBacklogItems().subscribe(i => this.backlogItems = i); // Refresh backlog to see status change
      },
      error: (err) => alert("Failed to update progress.")
    });
  }
}
