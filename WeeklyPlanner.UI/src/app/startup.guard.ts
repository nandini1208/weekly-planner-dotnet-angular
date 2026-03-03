import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TeamMember } from './models/models';

export const startupGuard = () => {
    const http = inject(HttpClient);
    const router = inject(Router);

    // Direct HTTP call — don't use BehaviorSubject which emits [] immediately
    return http.get<TeamMember[]>('http://localhost:5119/api/Team').pipe(
        map(members => {
            if (members && members.length > 0) {
                // Members exist → skip setup, go straight to dashboard
                return router.createUrlTree(['/dashboard']);
            }
            return true; // no members → allow team setup page
        }),
        catchError(() => of(true)) // on error, show setup page
    );
};
