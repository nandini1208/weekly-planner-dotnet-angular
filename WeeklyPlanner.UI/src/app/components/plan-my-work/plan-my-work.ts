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
    showHoursModal = false;
    allAssignments: TaskAssignment[] = [];

    get plannedHours(): number {
        return this.myWork.reduce((s, w) => s + w.hours, 0);
    }

    get hoursLeft(): number {
        return this.capacity - this.plannedHours;
    }

    get selectedCategoryBudgetLeft(): number {
        if (!this.selectedItem) return 0;
        return this.getCategoryBudgetLeft(this.categoryLabel(this.selectedItem.category));
    }

    getCategoryBudgetLeft(catName: string): number {
        const cat = this.categories.find(c => c.name === catName);
        if (!cat) return 0;

        // Overall Category Budget - (Total hours claimed by EVERYONE across ALL assignments in this plan)
        const totalClaimedInCategory = this.allAssignments
            .filter(a => {
                const bi = this.backlogItems.find(b => b.id === a.backlogItemId);
                return bi && this.categoryLabel(bi.category) === catName;
            })
            .reduce((s, a) => s + a.plannedHours, 0);

        // Also subtract what's currently in my local (unsaved) myWork for this category, 
        // but ONLY if it's not already accounted for in allAssignments (i.e. if it's new)
        const myLocalNewClaimed = this.myWork
            .filter(w => !w.savedAssignmentId && this.categoryLabel(w.backlogItem.category) === catName)
            .reduce((s, w) => s + w.hours, 0);

        return cat.budget - totalClaimedInCategory - myLocalNewClaimed;
    }

    isItemPicked(itemId: number): boolean {
        // Return true if any member (including me) has picked this item in this plan
        return this.allAssignments.some(a => a.backlogItemId === itemId) ||
            this.myWork.some(w => w.backlogItem.id === itemId);
    }

    get filteredBacklog(): BacklogItem[] {
        return this.backlogItems.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(this.searchQuery.toLowerCase());
            return matchesSearch && (item.status || '').toLowerCase() !== 'archived';
        });
    }

    ngOnInit(): void {
        this.api.currentUser$.subscribe(user => {
            this.currentUser = user;
            this.checkAndLoad();
        });

        this.api.getWeeklyPlans().subscribe(plans => {
            if (plans && plans.length > 0) {
                const sorted = [...plans].sort((a, b) => b.id - a.id);
                this.plan = sorted[0];
                this.buildCategories();
                this.checkAndLoad();
            }
            this.cdr.detectChanges();
        });

        this.api.getBacklogItems().subscribe(items => {
            this.backlogItems = items || [];
            this.checkAndLoad();
            this.cdr.detectChanges();
        });
    }

    private checkAndLoad(): void {
        if (this.plan && this.currentUser && this.backlogItems.length > 0) {
            this.loadExistingAssignments();
        }
    }

    // Load any previously saved assignments for this user in the current plan
    loadExistingAssignments(): void {
        if (!this.plan || !this.currentUser || this.backlogItems.length === 0) return;

        this.api.getAssignments(this.plan.id).subscribe(assignments => {
            this.allAssignments = assignments || [];
            const mine = this.allAssignments.filter((a: TaskAssignment) => a.teamMemberId === this.currentUser!.id);

            this.myWork = mine.map((a: TaskAssignment) => ({
                backlogItem: this.backlogItems.find(b => b.id === a.backlogItemId) ||
                    { id: a.backlogItemId, title: 'Unknown', category: '', estimatedHours: 0, status: '' },
                hours: a.plannedHours,
                savedAssignmentId: a.id
            }));

            this.isDone = mine.length > 0;
            this.updateCategoryClaims();
            this.cdr.detectChanges();
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

    pickItem(item: BacklogItem): void {
        this.selectedItem = item;
        this.selectedHours = item.estimatedHours || 1;
        this.showHoursModal = true;
    }

    confirmAdd(): void {
        if (!this.selectedItem || !this.selectedHours) return;
        this.myWork.push({ backlogItem: this.selectedItem, hours: this.selectedHours });
        this.updateCategoryClaims();
        this.showHoursModal = false;
        this.showBacklogPicker = false; // Go back to My Plan view
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
