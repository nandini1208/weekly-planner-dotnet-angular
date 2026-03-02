import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TeamMember, BacklogItem, WeeklyPlan, TaskAssignment, ProgressUpdate, ProgressUpdateRequest } from '../models/models';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private readonly baseUrl = 'http://localhost:5119/api';
    private http = inject(HttpClient);

    // Team
    getTeamMembers(): Observable<TeamMember[]> {
        return this.http.get<TeamMember[]>(`${this.baseUrl}/Team`);
    }

    addTeamMember(member: Partial<TeamMember>): Observable<TeamMember> {
        return this.http.post<TeamMember>(`${this.baseUrl}/Team`, member);
    }

    // Backlog
    getBacklogItems(): Observable<BacklogItem[]> {
        return this.http.get<BacklogItem[]>(`${this.baseUrl}/Backlog`);
    }

    addBacklogItem(item: Partial<BacklogItem>): Observable<BacklogItem> {
        return this.http.post<BacklogItem>(`${this.baseUrl}/Backlog`, item);
    }

    // Plan
    createPlan(plan: Partial<WeeklyPlan>): Observable<WeeklyPlan> {
        return this.http.post<WeeklyPlan>(`${this.baseUrl}/Plan`, plan);
    }

    freezePlan(planId: number): Observable<WeeklyPlan> {
        return this.http.post<WeeklyPlan>(`${this.baseUrl}/Plan/${planId}/freeze`, {});
    }

    assignTask(assignment: Partial<TaskAssignment>): Observable<TaskAssignment> {
        return this.http.post<TaskAssignment>(`${this.baseUrl}/Plan/assign`, assignment);
    }

    // Progress
    updateProgress(update: ProgressUpdateRequest): Observable<ProgressUpdate> {
        return this.http.post<ProgressUpdate>(`${this.baseUrl}/Progress/update`, update);
    }
}
