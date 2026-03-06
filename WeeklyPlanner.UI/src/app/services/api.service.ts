import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { TeamMember, BacklogItem, WeeklyPlan, TaskAssignment, ProgressUpdate, ProgressUpdateRequest } from '../models/models';

/**
 * Core API service for managing team members, backlog items, weekly plans, and progress tracking.
 * Maintains global state via BehaviorSubjects for reactive UI updates across components.
 */
@Injectable({
    providedIn: 'root'
})
export class ApiService {
    /** API base URL — defaults to Azure in production, localhost in development. */
    private readonly baseUrl = (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
        ? 'https://weeklyplanner-api-3b6d2a4c.azurewebsites.net/api'
        : 'http://localhost:5119/api';
    private http = inject(HttpClient);

    // ─── Reactive State ───────────────────────────────────────────────────────

    // --- REACTIVE STATE MANAGEMENT ---
    // Using BehaviorSubjects ensures all components receive real-time updates when data changes locally or via API.
    private currentUserSubject = new BehaviorSubject<TeamMember | null>(null);
    private membersSubject = new BehaviorSubject<TeamMember[]>([]);
    private plansSubject = new BehaviorSubject<WeeklyPlan[]>([]);
    private importSuccessSubject = new BehaviorSubject<boolean>(false);
    private activePlanSubject = new BehaviorSubject<WeeklyPlan | null>(null);

    /** Observable stream of the currently active user. Subscribe to react to user changes. */
    currentUser$ = this.currentUserSubject.asObservable();

    /** Observable stream of the team members list. Components subscribe to receive live updates. */
    members$ = this.membersSubject.asObservable();

    /** Observable stream of the active weekly plan. */
    activePlan$ = this.activePlanSubject.asObservable();

    importSuccess$ = this.importSuccessSubject.asObservable();

    // ─── Session ──────────────────────────────────────────────────────────────

    /** Sets the currently active user (called on login/switch). Pass null to clear the session. */
    setCurrentUser(user: TeamMember | null) {
        this.currentUserSubject.next(user);
    }

    setImportSuccess(val: boolean) {
        this.importSuccessSubject.next(val);
    }

    clearImportSuccess() {
        this.importSuccessSubject.next(false);
    }

    /**
     * Deletes all data in the database and clears in-memory state.
     * Used by the "Reset App" footer button.
     */
    resetAll(): Observable<any> {
        return new Observable(observer => {
            this.http.delete(`${this.baseUrl}/Reset`).subscribe({
                next: (res) => {
                    // Clear all in-memory state
                    this.membersSubject.next([]);
                    this.currentUserSubject.next(null);
                    this.activePlanSubject.next(null);
                    observer.next(res);
                    observer.complete();
                },
                error: (err) => observer.error(err)
            });
        });
    }

    // ─── Team Members ─────────────────────────────────────────────────────────

    /**
     * Fetches all team members from the API and updates the membersSubject.
     * Returns the members$ observable so components can reactively receive updates.
     */
    getTeamMembers(): Observable<TeamMember[]> {
        this.http.get<TeamMember[]>(`${this.baseUrl}/Team`).subscribe({
            next: (members) => {
                const sorted = this.sortMembers(members);
                this.membersSubject.next(sorted);
            },
            error: (err) => console.error('Error fetching members', err)
        });
        return this.members$;
    }

    private sortMembers(members: TeamMember[]): TeamMember[] {
        if (!members) return [];
        return [...members].sort((a, b) => {
            if (a.isLead && !b.isLead) return -1;
            if (!a.isLead && b.isLead) return 1;
            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Direct HTTP GET for team members without updating the BehaviorSubject.
     * Use this inside forkJoin to avoid reactive side-effects.
     */
    getTeamMembersDirect(): Observable<TeamMember[]> {
        return this.http.get<TeamMember[]>(`${this.baseUrl}/Team`);
    }

    /**
     * Posts a new team member to the API with an optimistic UI update:
     * a temporary member with a negative ID is shown immediately, then replaced
     * with the real server-assigned ID once the response arrives.
     */
    addTeamMember(member: Partial<TeamMember>): Observable<TeamMember> {
        return new Observable(observer => {
            // Optimistic UI Update: Create a temporary member
            const tempId = -Math.round(Math.random() * 1000000);
            const tempMember: TeamMember = { isLead: false, ...member, id: tempId } as TeamMember;

            const currentMembers = this.membersSubject.value;
            this.membersSubject.next([...currentMembers, tempMember]);

            this.http.post<TeamMember>(`${this.baseUrl}/Team`, member).subscribe({
                next: (newMember) => {
                    // Replace temp ID with real DB ID and sort
                    const updatedMembers = this.membersSubject.value.map(m => m.id === tempId ? newMember : m);
                    this.membersSubject.next(this.sortMembers(updatedMembers));
                    observer.next(newMember);
                    observer.complete();
                },
                error: (err) => {
                    // Revert on failure
                    const revertedMembers = this.membersSubject.value.filter(m => m.id !== tempId);
                    this.membersSubject.next(revertedMembers);
                    observer.error(err);
                }
            });
        });
    }

    makeLead(memberId: number): Observable<any> {
        return new Observable(observer => {
            // Optimistic UI Update
            const currentMembers = this.membersSubject.value.map(m => ({
                ...m,
                isLead: m.id === memberId
            }));
            this.membersSubject.next(currentMembers);

            // Also update currentUser if they were just demoted/promoted
            const currentUser = this.currentUserSubject.value;
            if (currentUser) {
                const updatedUser = currentMembers.find(m => m.id === currentUser.id);
                if (updatedUser) this.currentUserSubject.next(updatedUser);
            }

            this.http.put(`${this.baseUrl}/Team/${memberId}/makeLead`, {}).subscribe({
                next: (res) => {
                    observer.next(res);
                    observer.complete();
                },
                error: (err) => observer.error(err)
            });
        });
    }

    updateTeamMember(member: TeamMember): Observable<TeamMember> {
        return new Observable(observer => {
            this.http.put<TeamMember>(`${this.baseUrl}/Team/${member.id}`, member).subscribe({
                next: (saved) => {
                    const updated = this.membersSubject.value.map(m => m.id === saved.id ? saved : m);
                    this.membersSubject.next(updated);
                    observer.next(saved);
                    observer.complete();
                },
                error: (err) => observer.error(err)
            });
        });
    }

    removeTeamMember(memberId: number): Observable<any> {
        return new Observable(observer => {
            // Optimistic UI Update
            const previousMembers = this.membersSubject.value;
            const updatedMembers = previousMembers.filter(m => m.id !== memberId);
            this.membersSubject.next(updatedMembers);

            this.http.delete(`${this.baseUrl}/Team/${memberId}`).subscribe({
                next: (res) => {
                    observer.next(res);
                    observer.complete();
                },
                error: (err) => {
                    // Revert on failure
                    this.membersSubject.next(previousMembers);
                    observer.error(err);
                }
            });
        });
    }

    clearAllTeamMembers(): Observable<any> {
        return new Observable(observer => {
            this.http.delete(`${this.baseUrl}/Team`).subscribe({
                next: (res) => {
                    this.membersSubject.next([]);
                    observer.next(res);
                    observer.complete();
                },
                error: (err) => observer.error(err)
            });
        });
    }

    // Backlog
    getBacklogItems(): Observable<BacklogItem[]> {
        return this.http.get<BacklogItem[]>(`${this.baseUrl}/Backlog`);
    }

    addBacklogItem(item: Partial<BacklogItem>): Observable<BacklogItem> {
        return this.http.post<BacklogItem>(`${this.baseUrl}/Backlog`, item);
    }

    updateBacklogItem(item: BacklogItem): Observable<BacklogItem> {
        return this.http.put<BacklogItem>(`${this.baseUrl}/Backlog/${item.id}`, item);
    }

    // Plan
    getWeeklyPlans(): Observable<WeeklyPlan[]> {
        const obs = this.http.get<WeeklyPlan[]>(`${this.baseUrl}/Plan?t=${new Date().getTime()}`);
        obs.subscribe({
            next: (plans) => {
                if (plans && plans.length > 0) {
                    const sorted = [...plans].sort((a, b) => b.id - a.id);
                    const active = sorted.find(p => !p.isCompleted);
                    this.activePlanSubject.next(active || null);
                } else {
                    this.activePlanSubject.next(null);
                }
            },
            error: (err) => console.error('Error fetching plans', err)
        });
        return obs;
    }

    createPlan(plan: Partial<WeeklyPlan>): Observable<WeeklyPlan> {
        return this.http.post<WeeklyPlan>(`${this.baseUrl}/Plan`, plan);
    }

    freezePlan(planId: number): Observable<WeeklyPlan> {
        return this.http.post<WeeklyPlan>(`${this.baseUrl}/Plan/${planId}/freeze`, {});
    }

    deleteWeeklyPlan(planId: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/Plan/${planId}`);
    }

    assignTask(assignment: Partial<TaskAssignment>): Observable<TaskAssignment> {
        return this.http.post<TaskAssignment>(`${this.baseUrl}/Plan/assign`, assignment);
    }

    getAssignments(planId: number): Observable<TaskAssignment[]> {
        return this.http.get<TaskAssignment[]>(`${this.baseUrl}/Plan/${planId}/assignments`);
    }

    deleteMemberAssignments(planId: number, memberId: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/Plan/${planId}/assignments/member/${memberId}`);
    }

    // Progress
    updateProgress(update: ProgressUpdateRequest): Observable<ProgressUpdate> {
        return this.http.post<ProgressUpdate>(`${this.baseUrl}/Progress/update`, update);
    }

    getMemberProgress(memberId: number, planId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/Progress/member/${memberId}/plan/${planId}`);
    }

    getTeamProgress(planId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/Progress/plan/${planId}/team`);
    }

    getPlanSummary(planId: number): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/Plan/${planId}/summary`);
    }

    finishWeek(planId: number): Observable<WeeklyPlan> {
        return this.http.post<WeeklyPlan>(`${this.baseUrl}/Plan/${planId}/finish`, {});
    }

    // Export / Import
    exportAll(): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/Export/all`);
    }

    importData(payload: any): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/Export/import`, payload);
    }

    seedData(): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/Seed`, {});
    }
}
