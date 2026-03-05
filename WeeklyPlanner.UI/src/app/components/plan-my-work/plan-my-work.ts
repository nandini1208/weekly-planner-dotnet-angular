import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { WeeklyPlan, TeamMember, BacklogItem, TaskAssignment } from '../../models/models';

interface CategoryBudget {
    name: string;
    budget: number;
    claimed: number;
}

interface MyWorkItem {
    backlogItem: BacklogItem;
    hours: number;
    savedAssignmentId?: number; // Set once saved to DB
}

@Component({
    selector: 'app-plan-my-work',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './plan-my-work.html',
    styleUrls: ['./plan-my-work.css']
})
export class PlanMyWorkComponent implements OnInit {
    api = inject(ApiService);
    router = inject(Router);
    cdr = inject(ChangeDetectorRef);

    plan: WeeklyPlan | null = null;
    currentUser: TeamMember | null = null;
    backlogItems: BacklogItem[] = [];
    myWork: MyWorkItem[] = [];
    categories: CategoryBudget[] = [];

    capacity = 30;
    showBacklogPicker = false;
    searchQuery = '';
    selectedHours: number | null = null;
    selectedItem: BacklogItem | null = null;
    isSaving = false;
    isDone = false;
    saveError = '';

    get plannedHours(): number {
        return this.myWork.reduce((s, w) => s + w.hours, 0);
    }

    get hoursLeft(): number {
        return this.capacity - this.plannedHours;
    }

    get filteredBacklog(): BacklogItem[] {
        return this.backlogItems.filter(item => {
            const notAlreadyPicked = !this.myWork.find(w => w.backlogItem.id === item.id);
            const matchesSearch = item.title.toLowerCase().includes(this.searchQuery.toLowerCase());
            return notAlreadyPicked && matchesSearch && (item.status || '').toLowerCase() !== 'archived';
        });
    }

    ngOnInit(): void {
        this.api.currentUser$.subscribe(user => {
            this.currentUser = user;
            // Re-load assignments whenever user changes
            if (this.plan && user) this.loadExistingAssignments();
        });

        this.api.getWeeklyPlans().subscribe(plans => {
            if (plans && plans.length > 0) {
                const sorted = [...plans].sort((a, b) => b.id - a.id);
                this.plan = sorted[0];
                this.buildCategories();
            }
            this.cdr.detectChanges();
        });

        this.api.getBacklogItems().subscribe(items => {
            this.backlogItems = items || [];
            // Now that backlog is loaded, load assignments
            if (this.plan && this.currentUser) this.loadExistingAssignments();
            this.cdr.detectChanges();
        });
    }

    // Load any previously saved assignments for this user in the current plan
    loadExistingAssignments(): void {
        if (!this.plan || !this.currentUser) return;

        this.api.getAssignments(this.plan.id).subscribe(assignments => {
            const mine = assignments.filter((a: TaskAssignment) => a.teamMemberId === this.currentUser!.id);
            if (mine.length > 0) {
                this.myWork = mine.map((a: TaskAssignment) => ({
                    backlogItem: this.backlogItems.find(b => b.id === a.backlogItemId) ||
                        { id: a.backlogItemId, title: 'Unknown', category: '', estimatedHours: 0, status: '' },
                    hours: a.plannedHours,
                    savedAssignmentId: a.id
                }));
                this.isDone = true; // Already submitted
                this.updateCategoryClaims();
                this.cdr.detectChanges();
            }
        });
    }

    buildCategories(): void {
        if (!this.plan) return;
        const t = this.plan.totalPlannedHours;
        this.categories = [
            { name: 'Client Focused', budget: Math.round(t * this.plan.clientPercentage / 100), claimed: 0 },
            { name: 'Tech Debt', budget: Math.round(t * this.plan.techDebtPercentage / 100), claimed: 0 },
            { name: 'R&D', budget: Math.round(t * this.plan.rnDPercentage / 100), claimed: 0 }
        ];
    }

    updateCategoryClaims(): void {
        for (const cat of this.categories) {
            cat.claimed = this.myWork
                .filter(w => this.categoryLabel(w.backlogItem.category) === cat.name)
                .reduce((s, w) => s + w.hours, 0);
        }
    }

    categoryLabel(cat: string): string {
        if (!cat) return 'Client Focused';
        const l = cat.toLowerCase();
        if (l.includes('client')) return 'Client Focused';
        if (l.includes('tech')) return 'Tech Debt';
        if (l.includes('r&d') || l.includes('rnd')) return 'R&D';
        return cat;
    }

    categoryClass(name: string): string {
        if (name === 'Client Focused') return 'cat-client';
        if (name === 'Tech Debt') return 'cat-tech';
        return 'cat-rnd';
    }

    openPicker(): void {
        this.showBacklogPicker = true;
        this.selectedItem = null;
        this.selectedHours = null;
        this.searchQuery = '';
    }

    selectItem(item: BacklogItem): void {
        this.selectedItem = item;
        this.selectedHours = item.estimatedHours || null;
    }

    confirmAdd(): void {
        if (!this.selectedItem || !this.selectedHours) return;
        this.myWork.push({ backlogItem: this.selectedItem, hours: this.selectedHours });
        this.updateCategoryClaims();
        this.showBacklogPicker = false;
        this.selectedItem = null;
        this.selectedHours = null;
        this.cdr.detectChanges();
    }

    removeWork(idx: number): void {
        this.myWork.splice(idx, 1);
        this.updateCategoryClaims();
        this.cdr.detectChanges();
    }

    goBack(): void {
        this.router.navigate(['/dashboard']);
    }

    // Save all work items as TaskAssignments to the database
    donePlanning(): void {
        if (!this.plan || !this.currentUser || this.isSaving || this.myWork.length === 0) return;
        this.isSaving = true;
        this.saveError = '';

        // First delete any existing assignments for this member, then re-create
        this.api.deleteMemberAssignments(this.plan.id, this.currentUser.id).subscribe({
            next: () => {
                const saves$ = this.myWork.map(w =>
                    this.api.assignTask({
                        weeklyPlanId: this.plan!.id,
                        teamMemberId: this.currentUser!.id,
                        backlogItemId: w.backlogItem.id,
                        plannedHours: w.hours
                    })
                );

                forkJoin(saves$).subscribe({
                    next: (saved: TaskAssignment[]) => {
                        saved.forEach((a, i) => { this.myWork[i].savedAssignmentId = a.id; });
                        this.isSaving = false;
                        this.isDone = true;
                        this.cdr.detectChanges();
                    },
                    error: (err: any) => {
                        this.isSaving = false;
                        this.saveError = 'Failed to save. Please try again.';
                        console.error('Assignment save failed', err);
                        this.cdr.detectChanges();
                    }
                });
            },
            error: (err: any) => {
                this.isSaving = false;
                this.saveError = 'Failed to clear old assignments. Please try again.';
                console.error(err);
                this.cdr.detectChanges();
            }
        });
    }

    // Undo: delete all saved assignments so the user can re-plan
    undoDone(): void {
        if (!this.plan || !this.currentUser) return;
        this.api.deleteMemberAssignments(this.plan.id, this.currentUser.id).subscribe({
            next: () => {
                this.myWork.forEach(w => delete w.savedAssignmentId);
                this.isDone = false;
                this.cdr.detectChanges();
            },
            error: (err: any) => console.error('Undo failed', err)
        });
    }
}
