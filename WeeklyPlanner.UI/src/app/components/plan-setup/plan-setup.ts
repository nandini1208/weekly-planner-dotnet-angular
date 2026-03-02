import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { TeamMember, WeeklyPlan, TaskAssignment, BacklogItem } from '../../models/models';

@Component({
  selector: 'app-plan-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plan-setup.html',
  styleUrls: ['./plan-setup.css']
})
export class PlanSetupComponent implements OnInit {
  apiService = inject(ApiService);

  teamMembers: TeamMember[] = [];
  backlogItems: BacklogItem[] = [];
  currentPlan: WeeklyPlan | null = null;

  clientPct = 60;
  techDebtPct = 30;
  rndPct = 10;

  isFrozen = false;

  ngOnInit(): void {
    this.apiService.getTeamMembers().subscribe(m => this.teamMembers = m);
    this.apiService.getBacklogItems().subscribe(i => this.backlogItems = i);
  }

  get totalPct(): number {
    return this.clientPct + this.techDebtPct + this.rndPct;
  }

  get totalCapacity(): number {
    return this.teamMembers.length * 30; // 30 hours per member
  }

  createPlan(): void {
    if (this.totalPct !== 100) {
      alert("Percentages must equal 100%");
      return;
    }

    this.apiService.createPlan({
      startDate: new Date().toISOString(),
      clientPercentage: this.clientPct,
      techDebtPercentage: this.techDebtPct,
      rnDPercentage: this.rndPct,
      totalPlannedHours: this.totalCapacity,
      isFrozen: false
    }).subscribe({
      next: (plan) => this.currentPlan = plan,
      error: (err) => alert("Error creating plan: " + (err.error || err.message))
    });
  }

  freezePlan(): void {
    if (!this.currentPlan) return;

    this.apiService.freezePlan(this.currentPlan.id).subscribe({
      next: (plan) => {
        this.currentPlan = plan;
        this.isFrozen = true;
      },
      error: (err) => alert("Error freezing plan")
    });
  }
}
