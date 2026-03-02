import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  apiService = inject(ApiService);
  teamMembers: TeamMember[] = [];

  newMemberName: string = '';
  isLead: boolean = false;
  hasLead: boolean = false;

  ngOnInit(): void {
    this.loadTeam();
  }

  loadTeam(): void {
    this.apiService.getTeamMembers().subscribe((members) => {
      this.teamMembers = members;
      this.hasLead = members.some(m => m.isLead);
    });
  }

  addMember(): void {
    if (!this.newMemberName.trim()) return;

    // Only allow one lead
    const memberIsLead = this.isLead && !this.hasLead;

    this.apiService.addTeamMember({
      name: this.newMemberName,
      isLead: memberIsLead
    }).subscribe({
      next: (member) => {
        this.teamMembers.push(member);
        this.newMemberName = '';
        if (memberIsLead) this.hasLead = true;
      },
      error: (err) => alert(err.error || 'Got an error adding team member')
    });
  }
}
