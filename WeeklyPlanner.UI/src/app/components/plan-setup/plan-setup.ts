import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { TeamMember, WeeklyPlan, BacklogItem } from '../../models/models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-plan-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plan-setup.html',
  styleUrls: ['./plan-setup.css']
})
export class PlanSetupComponent implements OnInit {
  apiService = inject(ApiService);
  router = inject(Router);

  teamMembers: TeamMember[] = [];
  selectedMemberIds = new Set<number>();

  planningDate: string = '';

  clientPct = 0;
  techDebtPct = 0;
  rndPct = 0;

  ngOnInit(): void {
    // Subscribe to reactive members stream and pre-select all
    this.apiService.members$.subscribe(members => {
      if (members && members.length > 0) {
        this.teamMembers = members;
        // Pre-select ALL members
        this.selectedMemberIds.clear();
        this.teamMembers.forEach(m => this.selectedMemberIds.add(m.id));
      }
    });
    // Trigger a fresh fetch from the API
    this.apiService.getTeamMembers().subscribe();

    // Auto-set date to next Tuesday
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, 2=Tue...
    const daysUntilTuesday = dayOfWeek <= 2 ? (2 - dayOfWeek) : (9 - dayOfWeek);
    const nextTuesday = new Date(today);
    nextTuesday.setDate(today.getDate() + daysUntilTuesday);
    this.planningDate = nextTuesday.toISOString().split('T')[0];
  }

  get totalPct(): number {
    return (this.clientPct || 0) + (this.techDebtPct || 0) + (this.rndPct || 0);
  }

  get selectedCount(): number {
    return this.selectedMemberIds.size;
  }

  get totalCapacity(): number {
    return this.selectedCount * 30; // 30 hours per member
  }

  get clientHours(): number {
    return Math.round(this.totalCapacity * ((this.clientPct || 0) / 100));
  }

  get techDebtHours(): number {
    return Math.round(this.totalCapacity * ((this.techDebtPct || 0) / 100));
  }

  get rndHours(): number {
    return Math.round(this.totalCapacity * ((this.rndPct || 0) / 100));
  }

  get isTuesdayValid(): boolean {
    if (!this.planningDate) return true; // Allow initial empty state
    // Parse "YYYY-MM-DD" in UTC
    const selectedDateObj = new Date(this.planningDate);
    return selectedDateObj.getUTCDay() === 2;
  }

  get workPeriod(): string {
    if (!this.planningDate || !this.isTuesdayValid) return '';
    const start = new Date(this.planningDate);
    // Add 1 day for Wednesday
    start.setUTCDate(start.getUTCDate() + 1);

    const end = new Date(start);
    // Add 5 more days for Monday
    end.setUTCDate(end.getUTCDate() + 5);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    return `${startStr} to ${endStr}`;
  }

  toggleMember(id: number) {
    if (this.selectedMemberIds.has(id)) {
      this.selectedMemberIds.delete(id);
    } else {
      this.selectedMemberIds.add(id);
    }
  }

  isMemberSelected(id: number): boolean {
    return this.selectedMemberIds.has(id);
  }

  showToastMsg = false;
  isCreating = false;

  createPlan(): void {
    if (this.totalPct !== 100) {
      alert("Percentages must equal 100%");
      return;
    }

    if (this.selectedCount === 0) {
      alert("Select at least one team member.");
      return;
    }

    if (!this.planningDate) {
      alert("Please pick a planning date.");
      return;
    }

    // Tuesday Validation (0=Sun, 1=Mon, 2=Tue, etc.)
    const selectedDateObj = new Date(this.planningDate);
    if (selectedDateObj.getUTCDay() !== 2) {
      alert(`${this.planningDate} is not a Tuesday. Please pick a Tuesday.`);
      return;
    }

    if (this.isCreating) return;
    this.isCreating = true;

    this.apiService.createPlan({
      startDate: new Date(this.planningDate).toISOString(),
      clientPercentage: this.clientPct,
      techDebtPercentage: this.techDebtPct,
      rnDPercentage: this.rndPct,
      totalPlannedHours: this.totalCapacity,
      isFrozen: false
    }).subscribe({
      next: () => {
        this.isCreating = false;
        this.showToastMsg = true;
        setTimeout(() => {
          this.showToastMsg = false;
          this.router.navigate(['/dashboard']);
        }, 800);
      },
      error: (err) => {
        this.isCreating = false;
        alert('Error creating plan: ' + (err.error || err.message));
      }
    });
  }
}
