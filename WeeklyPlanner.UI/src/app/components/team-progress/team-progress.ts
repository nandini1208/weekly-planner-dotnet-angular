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

interface CategoryProgress {
    label: string;
    budget: number;
    done: number;
}

export interface DetailView {
    type: 'category' | 'member';
    title: string;
    subtitle: string;
    tasks: { itemTitle: string; memberName: string; committed: number; done: number; status: string }[];
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

    selectedDetail: DetailView | null = null;

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

    get totalTasksDone(): number {
        let count = 0;
        this.members.forEach(m => {
            count += m.tasks.filter(t => t.status === 'Done').length;
        });
        return count;
    }

    get totalTasksPlanned(): number {
        let count = 0;
        this.members.forEach(m => {
            count += m.tasks.length;
        });
        return count;
    }

    get totalTasksBlocked(): number {
        let count = 0;
        this.members.forEach(m => {
            count += m.tasks.filter(t => t.status === 'Blocked').length;
        });
        return count;
    }

    get byCategory(): CategoryProgress[] {
        const cats: { [key: string]: CategoryProgress } = {
            'Client Focused': { label: 'Client Focused', budget: 0, done: 0 },
            'Tech Debt': { label: 'Tech Debt', budget: 0, done: 0 },
            'R&D': { label: 'R&D', budget: 0, done: 0 }
        };

        this.members.forEach(m => {
            m.tasks.forEach(t => {
                const label = this.categoryLabel(t.category);
                if (cats[label]) {
                    cats[label].budget += t.plannedHours;
                    cats[label].done += t.completedHours;
                }
            });
        });

        return Object.values(cats);
    }

    getCategoryPercent(done: number, budget: number): number {
        if (budget === 0) return 0;
        return Math.min(100, Math.round((done / budget) * 100));
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

    viewCategoryDetails(cat: CategoryProgress): void {
        const matchingTasks: { itemTitle: string; memberName: string; committed: number; done: number; status: string }[] = [];
        const percent = this.getCategoryPercent(cat.done, cat.budget);

        this.members.forEach(m => {
            m.tasks.forEach(t => {
                if (this.categoryLabel(t.category) === cat.label) {
                    matchingTasks.push({
                        itemTitle: t.title,
                        memberName: m.memberName,
                        committed: t.plannedHours,
                        done: t.completedHours,
                        status: t.status
                    });
                }
            });
        });

        this.selectedDetail = {
            type: 'category',
            title: `${cat.label} — Details`,
            subtitle: `Budget: ${cat.budget}h. Completed: ${cat.done}h (${percent}%)`,
            tasks: matchingTasks
        };
    }

    viewMemberDetails(m: MemberProgress): void {
        const percent = this.memberPercent(m);
        const matchingTasks = m.tasks.map(t => ({
            itemTitle: t.title,
            memberName: 'Team Member',
            committed: t.plannedHours,
            done: t.completedHours,
            status: t.status
        }));

        this.selectedDetail = {
            type: 'member',
            title: `${m.memberName} — Details`,
            subtitle: `Assigned: ${m.totalPlanned}h. Completed: ${m.totalCompleted}h (${percent}%)`,
            tasks: matchingTasks
        };
    }

    goBack(): void {
        if (this.selectedDetail) {
            this.selectedDetail = null;
        } else {
            this.router.navigate(['/dashboard']);
        }
    }
}
