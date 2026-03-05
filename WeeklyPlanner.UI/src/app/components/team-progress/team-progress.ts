import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { WeeklyPlan } from '../../models/models';

interface MemberProgress {
    memberId: number;
    memberName: string;
    isLead: boolean;
    capacity: number;
    totalPlanned: number;
    totalCompleted: number;
    tasks: TaskItem[];
    expanded: boolean;
}

interface TaskItem {
    assignmentId: number;
    title: string;
    category: string;
    plannedHours: number;
    completedHours: number;
    status: string;
    lastUpdated: string | null;
}

@Component({
    selector: 'app-team-progress',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './team-progress.html',
    styleUrls: ['./team-progress.css']
})
export class TeamProgressComponent implements OnInit {
    api = inject(ApiService);
    router = inject(Router);
    cdr = inject(ChangeDetectorRef);

    plan: WeeklyPlan | null = null;
    members: MemberProgress[] = [];
    isLoading = true;

    get totalTeamPlanned(): number {
        return this.members.reduce((s, m) => s + m.totalPlanned, 0);
    }

    get totalTeamCompleted(): number {
        return this.members.reduce((s, m) => s + m.totalCompleted, 0);
    }

    get overallPercent(): number {
        if (this.totalTeamPlanned === 0) return 0;
        return Math.min(100, Math.round((this.totalTeamCompleted / this.totalTeamPlanned) * 100));
    }

    ngOnInit(): void {
        this.api.getWeeklyPlans().subscribe(plans => {
            if (plans && plans.length > 0) {
                const sorted = [...plans].sort((a, b) => b.id - a.id);
                this.plan = sorted[0];
                this.loadProgress();
            } else {
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadProgress(): void {
        if (!this.plan) return;
        this.api.getTeamProgress(this.plan.id).subscribe({
            next: (data) => {
                this.members = data.map((m: any) => ({
                    ...m,
                    tasks: m.tasks || [],
                    expanded: false
                }));
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load team progress', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    memberPercent(m: MemberProgress): number {
        if (m.totalPlanned === 0) return 0;
        return Math.min(100, Math.round((m.totalCompleted / m.totalPlanned) * 100));
    }

    statusClass(status: string): string {
        if (status === 'Done') return 'status-done';
        if (status === 'In Progress') return 'status-progress';
        if (status === 'Blocked') return 'status-blocked';
        return 'status-todo';
    }

    categoryClass(cat: string): string {
        const l = (cat || '').toLowerCase();
        if (l.includes('client')) return 'cat-client';
        if (l.includes('tech')) return 'cat-tech';
        return 'cat-rnd';
    }

    categoryLabel(cat: string): string {
        const l = (cat || '').toLowerCase();
        if (l.includes('client')) return 'Client Focused';
        if (l.includes('tech')) return 'Tech Debt';
        return 'R&D';
    }

    toggleExpand(m: MemberProgress): void {
        m.expanded = !m.expanded;
    }

    goBack(): void {
        this.router.navigate(['/dashboard']);
    }
}
