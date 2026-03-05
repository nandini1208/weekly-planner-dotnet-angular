import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
  nameError = false;
  duplicateNameError = false;

  // Toast
  memberAddedToast = false;
  toastMessage = '✅ Member added!';
  private toastTimeout: any;

  // Mode
  isManageMode = false;

  // Edit state (manage mode)
  editingMember: TeamMember | null = null;
  editName = '';

  private pendingRequests = 0;

  constructor(private api: ApiService, private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef) { }

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }

  ngOnInit(): void {
    this.isManageMode = this.route.snapshot.queryParamMap.get('mode') === 'manage';

    if (this.isManageMode) {
      // FROM DASHBOARD — load existing members
      this.api.getTeamMembers().subscribe();
    } else {
      // FRESH OPEN — wipe DB, start clean
      this.api.clearAllTeamMembers().subscribe();
    }

    this.api.members$.subscribe(members => {
      this.members = members;
      const lead = members.findIndex(m => m.isLead);
      this.leadIndex = lead !== -1 ? lead : null;
      this.cdr.detectChanges();
    });
  }

  // ─── ADD NEW MEMBER ─────────────────────────────────
  addMember() {
    if (!this.name.trim()) {
      this.nameError = true;
      this.duplicateNameError = false;
      return;
    }

    const isDuplicate = this.members.some(
      m => m.name.trim().toLowerCase() === this.name.trim().toLowerCase()
    );
    if (isDuplicate) {
      this.duplicateNameError = true;
      this.nameError = false;
      return;
    }

    this.nameError = false;
    this.duplicateNameError = false;

    const isFirstMember = this.members.length === 0;
    const newMember = { name: this.name.trim(), isLead: isFirstMember };
    this.name = '';

    this.showToast('✅ Member added!');

    this.pendingRequests++;
    this.api.addTeamMember(newMember).subscribe({
      next: () => {
        this.pendingRequests--;
      },
      error: (err) => { console.error(err); this.pendingRequests--; }
    });
  }

  // ─── EDIT NAME (manage mode) ─────────────────────────
  startEdit(member: TeamMember): void {
    this.editingMember = member;
    this.editName = member.name;
  }

  saveEdit(): void {
    if (!this.editingMember || !this.editName.trim()) return;

    const updated: TeamMember = { ...this.editingMember, name: this.editName.trim() };
    this.api.updateTeamMember(updated).subscribe({
      next: (saved) => {
        const idx = this.members.findIndex(m => m.id === saved.id);
        if (idx !== -1) this.members[idx] = saved;
        this.editingMember = null;
        this.showToast('✅ Name updated!');
      },
      error: (err) => console.error(err)
    });
  }

  cancelEdit(): void {
    this.editingMember = null;
  }

  // ─── MAKE LEAD ────────────────────────────────────────
  setLead(index: number) {
    const member = this.members[index];
    if (member?.id && member.id > 0) {
      this.pendingRequests++;
      this.api.makeLead(member.id).subscribe({
        next: () => this.pendingRequests--,
        error: (err) => { console.error(err); this.pendingRequests--; }
      });
    }
  }

  // ─── REMOVE ──────────────────────────────────────────
  remove(id: number, index: number) {
    if (!id || id <= 0) return;
    this.pendingRequests++;
    this.api.removeTeamMember(id).subscribe({
      next: () => this.pendingRequests--,
      error: (err) => { console.error(err); this.pendingRequests--; }
    });
  }

  // ─── DONE → DASHBOARD ────────────────────────────────
  goToDashboard() {
    if (this.pendingRequests > 0) {
      const check = setInterval(() => {
        if (this.pendingRequests <= 0) { clearInterval(check); this.router.navigate(['/dashboard']); }
      }, 50);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  // ─── TOAST ───────────────────────────────────────────
  showToast(msg: string): void {
    this.toastMessage = msg;
    this.memberAddedToast = true;
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => { this.memberAddedToast = false; }, 1000);
  }
}