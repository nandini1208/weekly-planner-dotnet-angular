import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ApiService } from './services/api.service';
import { TeamMember } from './models/models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit {

  showLayout = false;

  // Header UI
  currentUser: TeamMember | null = null;
  isDark = true;
  showResetModal = false;
  showSeedModal = false;
  showLoadModal = false;
  loadError = '';
  importFileName = '';
  importData: any = null;

  // Footer states
  isExporting = false;
  isSeeding = false;
  footerToast = '';
  footerToastError = false;

  constructor(private router: Router, private api: ApiService, private zone: NgZone, private cdr: ChangeDetectorRef) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.showLayout = ['/dashboard', '/setup', '/backlog', '/team', '/review-freeze', '/plan-my-work', '/update-progress', '/team-progress', '/past-weeks'].some(
          path => event.urlAfterRedirects === path || event.urlAfterRedirects.startsWith(path + '?')
        );
      });
  }

  ngOnInit() {
    this.api.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  // 🌙 Dark / Light toggle
  toggleTheme() {
    this.isDark = !this.isDark;
    document.body.classList.toggle('light-mode', !this.isDark);
  }

  // Go Home
  goHome() {
    if (!this.currentUser) {
      this.api.setCurrentUser({ id: 0, name: '', isLead: false } as TeamMember);
    }
    this.router.navigate(['/dashboard']);
  }

  // 🔄 Switch user
  switchUser() {
    this.api.setCurrentUser(null);
    this.router.navigate(['/dashboard']);
  }

  // 🗑 Reset app
  resetApp() { this.showResetModal = true; }
  closeResetModal() { this.showResetModal = false; }

  isResetting = false;

  confirmReset() {
    if (this.isResetting) return;
    this.isResetting = true;
    this.api.resetAll().subscribe({
      next: () => {
        this.isResetting = false;
        localStorage.clear();
        this.showResetModal = false;
        this.router.navigate(['/team']);
      },
      error: (err) => {
        this.isResetting = false;
        console.error('Reset failed:', err);
      }
    });
  }

  // 📥 Download all data as JSON file
  downloadData() {
    if (this.isExporting) return;
    this.isExporting = true;
    this.api.exportAll().subscribe({
      next: (data) => {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `weekly-planner-backup-${date}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.isExporting = false;
        this.showFooterToast('✅ Data downloaded!', false);
      },
      error: (err) => {
        this.isExporting = false;
        this.showFooterToast('❌ Export failed. Try again.', true);
        console.error(err);
      }
    });
  }

  // 📂 Load data modal
  openLoadModal() {
    this.showLoadModal = true;
    this.loadError = '';
    this.importFileName = '';
    this.importData = null;
  }
  closeLoadModal() {
    this.showLoadModal = false;
    this.loadError = '';
    this.importFileName = '';
    this.importData = null;
  }

  // 📂 Called when user picks a file — validates and stores parsed data
  handleImportFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.importFileName = file.name;
    this.loadError = '';
    this.importData = null;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.zone.run(() => {
        try {
          const rawPayload = JSON.parse(e.target?.result as string);
          const payload = this.normalizeImportPayload(rawPayload);
          if (!payload) {
            this.loadError = "This file doesn't look like a backup from this app.";
            this.importData = null;
          } else {
            this.importData = payload;
            this.loadError = '';
          }
        } catch {
          this.loadError = "This file can't be read. Please check the file and try again.";
          this.importData = null;
        }
        input.value = '';
        this.cdr.detectChanges();
      });
    };
    reader.readAsText(file);
  }

  // 📂 Called when user clicks "Yes, Replace My Data" — executes the import
  executeImport() {
    if (!this.importData) return;
    const payload = this.importData;
    this.showLoadModal = false;
    this.loadError = '';
    this.importFileName = '';
    this.importData = null;

    const currentName = this.currentUser?.name;
    this.api.setCurrentUser(null);

    this.api.importData(payload).subscribe({
      next: () => {
        this.api.getTeamMembersDirect().subscribe(members => {
          if (currentName) {
            const sameUser = members.find(m => m.name === currentName);
            if (sameUser) this.api.setCurrentUser(sameUser);
          }
          this.api.getTeamMembers().subscribe();
          this.api.getWeeklyPlans().subscribe();
          this.api.setImportSuccess(true);
          setTimeout(() => this.api.clearImportSuccess(), 5000);
          this.router.navigate(['/dashboard']);
        });
      },
      error: (err) => {
        this.showFooterToast('❌ Import failed. Please try again.', true);
        console.error(err);
      }
    });
  }

  // 🌱 Seed modal
  openSeedModal() { this.showSeedModal = true; }
  closeSeedModal() { this.showSeedModal = false; }
  confirmSeed() { this.showSeedModal = false; this.seedData(); }

  // 🌱 Seed sample data — matches original reference app exactly
  seedData() {
    if (this.isSeeding) return;
    this.isSeeding = true;

    // Step 1: Reset all existing data first
    this.api.resetAll().subscribe({
      next: () => {
        // Step 2: Add the 4 original team members
        const sampleMembers = [
          { name: 'Alice Chen', isLead: true },
          { name: 'Bob Martinez', isLead: false },
          { name: 'Carol Singh', isLead: false },
          { name: 'Dave Kim', isLead: false }
        ];
        const sampleBacklog = [
          { title: 'Customer onboarding redesign', category: 'Client Focused', estimatedHours: 12, status: 'Available' },
          { title: 'Fix billing invoice formatting', category: 'Client Focused', estimatedHours: 4, status: 'Available' },
          { title: 'Customer feedback dashboard', category: 'Client Focused', estimatedHours: 16, status: 'Available' },
          { title: 'Migrate database to PostgreSQL 16', category: 'Tech Debt', estimatedHours: 20, status: 'Available' },
          { title: 'Remove deprecated API endpoints', category: 'Tech Debt', estimatedHours: 8, status: 'Available' },
          { title: 'Add unit tests for payment module', category: 'Tech Debt', estimatedHours: 10, status: 'Available' },
          { title: 'Experiment with LLM-based search', category: 'R&D', estimatedHours: 15, status: 'Available' },
          { title: 'Evaluate new caching strategy', category: 'R&D', estimatedHours: 6, status: 'Available' },
          { title: 'Build internal CLI tool', category: 'R&D', estimatedHours: 8, status: 'Available' },
          { title: 'Client SSO integration', category: 'Client Focused', estimatedHours: 18, status: 'Available' }
        ];

        const allObs: any[] = [
          ...sampleMembers.map(m => this.api.addTeamMember(m)),
          ...sampleBacklog.map(b => this.api.addBacklogItem(b))
        ];
        let done = 0;
        const total = allObs.length;
        const tryFinish = () => {
          done++;
          if (done >= total) {
            this.isSeeding = false;
            this.api.setCurrentUser(null);
            this.api.getTeamMembers().subscribe();
            this.showFooterToast('Sample data loaded! Pick a person to get started.', false);
            this.router.navigate(['/dashboard']);
            this.cdr.detectChanges();
          }
        };
        allObs.forEach((obs: any) => obs.subscribe({ next: tryFinish, error: () => tryFinish() }));
        // Safety: force reset seeding state after 8s in case counter doesn't match
        setTimeout(() => { this.isSeeding = false; this.cdr.detectChanges(); }, 8000);
      },
      error: () => {
        this.isSeeding = false;
        this.showFooterToast('❌ Failed to seed data.', true);
      }
    });
  }

  private showFooterToast(msg: string, isError: boolean) {
    this.footerToast = msg;
    this.footerToastError = isError;
    setTimeout(() => { this.footerToast = ''; }, 3000);
  }

  // Validate that the file is a backup from THIS app
  private normalizeImportPayload(raw: any): any {
    if (!raw || typeof raw !== 'object') return null;

    // Our app exports: { exportedAt, teamMembers, backlogItems, weeklyPlans, ... }
    // Must have exportedAt (proves it came from our Download) AND at least teamMembers
    if (raw.exportedAt && (raw.teamMembers || raw.backlogItems || raw.weeklyPlans)) {
      return raw;
    }

    // Anything else (original reference app, random JSON, etc.) = rejected
    return null;
  }
  activeNav: string = '';
  setActive(nav: string) { this.activeNav = nav; }
}
