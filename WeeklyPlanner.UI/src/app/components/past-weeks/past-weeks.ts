import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { WeeklyPlan } from '../../models/models';

interface PlanSummary {
    planId: number;
    startDate: string;
    isFrozen: boolean;
    totalPlannedHours: number;
    clientPercentage: number;
    techDebtPercentage: number;
    rnDPercentage: number;
    totalPlanned: number;
    totalCompleted: number;
    overallPercent: number;
    memberResults: { memberName: string; isLead: boolean; planned: number; completed: number; percent: number }[];
}

@Component({
    selector: 'app-past-weeks',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './past-weeks.html',
    styleUrls: ['./past-weeks.css']
})
export class PastWeeksComponent implements OnInit {
    api = inject(ApiService);
    router = inject(Router);
    cdr = inject(ChangeDetectorRef);

    allPlans: WeeklyPlan[] = [];
    frozenPlans: WeeklyPlan[] = [];
    summaries: (PlanSummary | null)[] = [];
    isLoading = true;
    expandedId: number | null = null;

    ngOnInit(): void {
        this.api.getWeeklyPlans().subscribe({
            next: (plans) => {
                this.allPlans = plans || [];
                this.frozenPlans = this.allPlans.filter(p => p.isFrozen).sort((a, b) => b.id - a.id);
                this.summaries = new Array(this.frozenPlans.length).fill(null);
                this.isLoading = false;
                this.cdr.detectChanges();

                // Load summaries for all frozen plans
                this.frozenPlans.forEach((plan, i) => {
                    this.api.getPlanSummary(plan.id).subscribe({
                        next: (s) => { this.summaries[i] = s; this.cdr.detectChanges(); },
                        error: () => { this.summaries[i] = null; this.cdr.detectChanges(); }
                    });
                });
            },
            error: () => { this.isLoading = false; this.cdr.detectChanges(); }
        });
    }

    toggle(planId: number): void {
        this.expandedId = this.expandedId === planId ? null : planId;
    }

    weekRange(startDate: string): string {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + 5);
        return `${this.fmt(start)} – ${this.fmt(end)}`;
    }

    private fmt(d: Date): string {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    goBack(): void { this.router.navigate(['/dashboard']); }
}
