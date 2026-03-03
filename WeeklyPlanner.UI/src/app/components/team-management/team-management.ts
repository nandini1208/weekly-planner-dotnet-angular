import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { TeamMember } from '../../models/models';

@Component({
  selector: 'app-team-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-management.html',
  styleUrls: ['./team-management.css']
})
export class TeamManagementComponent implements OnInit {

  name: string = '';
  members: TeamMember[] = [];
  leadIndex: number | null = null;
  nameError: boolean = false;

  // Track ongoing backend requests to block navigation until complete
  private pendingRequests = 0;

  constructor(private api: ApiService, private router: Router) { }

  ngOnInit(): void {
    // Subscribe to the global members list
    this.api.members$.subscribe(members => {
      this.members = members;

      // Find current lead index
      const lead = members.findIndex(m => m.isLead);
      this.leadIndex = lead !== -1 ? lead : null;
    });

    // Clear all existing members on initial reload via API
    this.pendingRequests++;
    this.api.clearAllTeamMembers().subscribe({
      next: () => {
        this.pendingRequests--;
      },
      error: (err) => {
        console.error(err);
        this.pendingRequests--;
      }
    });
  }

  addMember() {
    if (!this.name.trim()) {
      this.nameError = true;
      return;
    }

    this.nameError = false;

    // We are the first member, so we will immediately become lead
    const isFirstMember = this.members.length === 0;

    const newMember = { name: this.name, isLead: isFirstMember };
    this.name = '';

    this.pendingRequests++;
    this.api.addTeamMember(newMember).subscribe({
      next: (res) => {
        this.pendingRequests--;
      },
      error: (err) => {
        console.error(err);
        this.pendingRequests--;
      }
    });
  }

  setLead(index: number) {
    const member = this.members[index];
    if (member?.id && member.id > 0) {
      this.pendingRequests++;
      this.api.makeLead(member.id).subscribe({
        next: () => this.pendingRequests--,
        error: (err) => {
          console.error(err);
          this.pendingRequests--;
        }
      });
    }
  }

  remove(id: number, index: number) {
    if (!id || id <= 0) return;

    this.pendingRequests++;
    this.api.removeTeamMember(id).subscribe({
      next: () => this.pendingRequests--,
      error: (err) => {
        console.error(err);
        this.pendingRequests--;
      }
    });
  }

  goToDashboard() {
    // Prevent UI from racing the backend responses
    if (this.pendingRequests > 0) {
      // Simple polling to wait for backend calls to finish
      const checkInterval = setInterval(() => {
        if (this.pendingRequests <= 0) {
          clearInterval(checkInterval);
          this.router.navigate(['/dashboard']);
        }
      }, 50);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}