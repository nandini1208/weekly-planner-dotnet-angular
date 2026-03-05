import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { WeeklyPlan, TeamMember, TaskAssignment } from '../../models/models';

interface MemberSummary {
    member: TeamMember;
    plannedHours: number;
    capacity: number;
    status: string;
    items: { title: string; category: string; hours: number }[];
}

interface CategorySummary {
    name: string;
    budget: number;
    planned: number;
}

@Component({
    selector: 'app-review-freeze',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './review-freeze.html',
    styleUrls: ['./review-freeze.css']
})
export class ReviewFreezeComponent implements OnInit {
    api = inject(ApiService);
    router = inject(Router);
    cdr = inject(ChangeDetectorRef);

    plan: WeeklyPlan | null = null;
    members: TeamMember[] = [];
    assignments: TaskAssignment[] = [];
    memberSummaries: MemberSummary[] = [];
    categorySummaries: CategorySummary[] = [];
    blockingReasons: string[] = [];
    canFreeze = false;
    isFreezing = false;
    showFreezeSuccess = false;
    showCancelModal = false;
    isCancelling = false;
    isLoading = true;

    ngOnInit(): void {
        this.api.getWeeklyPlans().subscribe(plans => {
            if (plans && plans.length > 0) {
                const sorted = [...plans].sort((a, b) => b.id - a.id);
                this.plan = sorted[0];
                this.loadData();
            } else {
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadData(): void {
        if (!this.plan) return;

        // Load members + assignments in parallel, then build summaries
        forkJoin({
            members: this.api.getTeamMembersDirect(),
            assignments: this.api.getAssignments(this.plan.id)
        }).subscribe({
            next: ({ members, assignments }) => {
                this.members = members;
                this.assignments = assignments;
                this.buildSummaries();
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load review data', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    buildSummaries(): void {
        if (!this.plan) return;

        const plan = this.plan;
        const totalHours = plan.totalPlannedHours;
        const capacity = Math.round(totalHours / Math.max(this.members.length, 1));

        // --- Category summaries ---
        this.categorySummaries = [
            { name: 'Client Focused', budget: Math.round(totalHours * plan.clientPercentage / 100), planned: 0 },
            { name: 'Tech Debt', budget: Math.round(totalHours * plan.techDebtPercentage / 100), planned: 0 },
            { name: 'R&D', budget: Math.round(totalHours * plan.rnDPercentage / 100), planned: 0 }
        ];

        // --- Member summaries with real hours ---
        this.memberSummaries = this.members.map(m => {
            const mine = this.assignments.filter(a => a.teamMemberId === m.id);
            const planned = mine.reduce((s, a) => s + a.plannedHours, 0);
            const items = mine.map(a => ({
                title: a.backlogItem?.title || `Item #${a.backlogItemId}`,
                category: this.categoryLabel(a.backlogItem?.category || ''),
                hours: a.plannedHours
            }));
            return { member: m, plannedHours: planned, capacity, status: '', items };
        });

        // --- Tally category planned hours from real assignments ---
        for (const assignment of this.assignments) {
            const cat = this.categoryLabel(assignment.backlogItem?.category || '');
            const found = this.categorySummaries.find(c => c.name === cat);
            if (found) found.planned += assignment.plannedHours;
        }

        this.evaluate();
    }

    evaluate(): void {
        const reasons: string[] = [];

        for (const ms of this.memberSummaries) {
            ms.status = ms.plannedHours >= ms.capacity ? '✅ Ready' : 'Not yet';
            if (ms.plannedHours < ms.capacity) {
                reasons.push(
                    `${ms.member.name} has ${ms.plannedHours}h planned (needs ${ms.capacity - ms.plannedHours} more).`
                );
            }
        }

        for (const cat of this.categorySummaries) {
            if (cat.planned !== cat.budget) {
                reasons.push(
                    `${cat.name} has ${cat.planned}h planned but budget is ${cat.budget}h.`
                );
            }
        }

        this.blockingReasons = reasons;
        this.canFreeze = reasons.length === 0;
    }

    categoryLabel(cat: string): string {
        if (!cat) return 'Client Focused';
        const l = cat.toLowerCase();
        if (l.includes('client')) return 'Client Focused';
        if (l.includes('tech')) return 'Tech Debt';
        return 'R&D';
    }

    freeze(): void {
        if (!this.plan || !this.canFreeze || this.isFreezing) return;
        this.isFreezing = true;

        this.api.freezePlan(this.plan.id).subscribe({
            next: () => {
                this.isFreezing = false;
                this.showFreezeSuccess = true;
                setTimeout(() => { this.router.navigate(['/dashboard']); }, 1000);
            },
            error: (err) => {
                this.isFreezing = false;
                console.error('Failed to freeze plan', err);
            }
        });
    }

    goBack(): void { this.router.navigate(['/dashboard']); }

    categoryStatus(cat: CategorySummary): string {
        if (cat.planned === cat.budget) return '✅';
        return `⚠ Off by ${Math.abs(cat.planned - cat.budget)}h`;
    }

    categoryClass(name: string): string {
        if (name === 'Client Focused') return 'cat-client';
        if (name === 'Tech Debt') return 'cat-tech';
        return 'cat-rnd';
    }

    memberProgress(ms: MemberSummary): number {
        return Math.min(100, Math.round((ms.plannedHours / ms.capacity) * 100));
    }

    cancelPlan(): void {
        if (!this.plan || this.isCancelling) return;
        this.isCancelling = true;
        this.api.deleteWeeklyPlan(this.plan.id).subscribe({
            next: () => {
                this.isCancelling = false;
                this.showCancelModal = false;
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.isCancelling = false;
                console.error('Failed to cancel plan', err);
            }
        });
    }
}
