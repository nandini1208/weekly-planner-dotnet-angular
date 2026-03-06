import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { WeeklyPlan, TeamMember } from '../../models/models';

interface TaskProgress {
    assignmentId: number;
    title: string;
    category: string;
    plannedHours: number;
    completedHours: number;
    status: string;
    lastUpdated: string | null;
    saving: boolean;
    saved: boolean;
    error: string;
}

@Component({
    selector: 'app-update-progress',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './update-progress.html',
    styleUrls: ['./update-progress.css']
})
export class UpdateProgressComponent implements OnInit {
    api = inject(ApiService);
    router = inject(Router);
    cdr = inject(ChangeDetectorRef);

    plan: WeeklyPlan | null = null;
    currentUser: TeamMember | null = null;
    tasks: TaskProgress[] = [];
    isLoading = true;
    noTasks = false;

    readonly statuses = ['In Progress', 'Completed', 'Blocked'];

    // Modal state
    updatingTask: TaskProgress | null = null;
    tempHours: number = 0;
    tempStatus: string = 'To Do';
    tempNote: string = '';

    // Toast state
    showToast = false;

    get totalPlanned(): number {
        return this.tasks.reduce((s, t) => s + t.plannedHours, 0);
    }

    get totalCompleted(): number {
        return this.tasks.reduce((s, t) => s + (t.completedHours || 0), 0);
    }

    get overallPercent(): number {
        if (this.totalPlanned === 0) return 0;
        return Math.round((this.totalCompleted / this.totalPlanned) * 100);
    }

    get progressBarPercent(): number {
        return Math.min(100, this.overallPercent);
    }

    ngOnInit(): void {
        this.api.currentUser$.subscribe(user => {
            this.currentUser = user;
        });

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
        if (!this.plan || !this.currentUser) {
            // wait for both
            setTimeout(() => {
                if (this.plan && this.currentUser) this.loadProgress();
                else { this.isLoading = false; this.cdr.detectChanges(); }
            }, 300);
            return;
        }

        this.api.getMemberProgress(this.currentUser.id, this.plan.id).subscribe({
            next: (items) => {
                this.tasks = items.map(item => ({
                    assignmentId: item.assignmentId,
                    title: item.title,
                    category: item.category,
                    plannedHours: item.plannedHours,
                    completedHours: item.completedHours,
                    status: item.status,
                    lastUpdated: item.lastUpdated,
                    saving: false,
                    saved: false,
                    error: ''
                }));
                this.noTasks = this.tasks.length === 0;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load progress', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    // Open modal instead of inline save
    openUpdateModal(task: TaskProgress): void {
        this.updatingTask = task;
        this.tempHours = task.completedHours || 0;
        this.tempStatus = task.status || 'To Do';
        this.tempNote = ''; // Could load from backend if model supported notes
    }

    closeUpdateModal(): void {
        this.updatingTask = null;
    }

    confirmUpdateTask(): void {
        if (!this.updatingTask || this.updatingTask.saving) return;

        const task = this.updatingTask;
        task.saving = true;
        task.error = '';

        this.api.updateProgress({
            assignmentId: task.assignmentId,
            completedHours: this.tempHours,
            status: this.tempStatus
        }).subscribe({
            next: () => {
                task.completedHours = this.tempHours;
                task.status = this.tempStatus;
                task.saving = false;
                task.lastUpdated = new Date().toISOString();
                this.closeUpdateModal();
                this.triggerToast();
                this.cdr.detectChanges();
            },
            error: (err) => {
                task.saving = false;
                task.error = 'Save failed. Try again.';
                console.error(err);
                this.cdr.detectChanges();
            }
        });
    }

    triggerToast(): void {
        this.showToast = true;
        setTimeout(() => {
            this.showToast = false;
            this.cdr.detectChanges();
        }, 3000); // Hide after 3 seconds
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
        if (l.includes('r&d') || l.includes('rnd')) return 'R&D';
        return cat;
    }

    statusClass(status: string): string {
        if (status === 'Done') return 'status-done';
        if (status === 'In Progress') return 'status-progress';
        if (status === 'Blocked') return 'status-blocked';
        return 'status-todo';
    }

    goBack(): void {
        this.router.navigate(['/dashboard']);
    }
}
