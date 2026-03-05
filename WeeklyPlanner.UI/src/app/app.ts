import { Component, OnInit } from '@angular/core';
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

  // Footer states
  isExporting = false;
  isSeeding = false;
  footerToast = '';
  footerToastError = false;

  constructor(private router: Router, private api: ApiService) {
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
  openLoadModal() { this.showLoadModal = true; }
  closeLoadModal() { this.showLoadModal = false; }
  confirmLoad() {
    this.showLoadModal = false;
    // Trigger the hidden file input after modal closes
    setTimeout(() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click(), 50);
  }

  // 📂 Load data from JSON file
  loadData(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const payload = JSON.parse(e.target?.result as string);
        this.api.importData(payload).subscribe({
          next: () => {
            // Clear session and force-refresh members from DB
            this.api.setCurrentUser(null);
            this.api.getTeamMembers(); // updates membersSubject reactively
            this.showFooterToast('✅ Your data was loaded!', false);
            this.router.navigate(['/dashboard']);
          },
          error: (err) => {
            this.showFooterToast('❌ Import failed. Invalid file?', true);
            console.error(err);
          }
        });
      } catch {
        this.showFooterToast('❌ Invalid JSON file.', true);
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-loaded
    input.value = '';
  }

  // 🌱 Seed modal
  openSeedModal() { this.showSeedModal = true; }
  closeSeedModal() { this.showSeedModal = false; }
  confirmSeed() { this.showSeedModal = false; this.seedData(); }

  // 🌱 Seed sample data
  seedData() {
    if (this.isSeeding) return;
    this.isSeeding = true;

    const sampleMembers = [
      { name: 'Alice', isLead: false },
      { name: 'Bob', isLead: false },
      { name: 'Charlie', isLead: false }
    ];
    const sampleBacklog = [
      { title: 'Setup CI/CD pipeline', category: 'Tech Debt', estimatedHours: 6, status: 'Available' },
      { title: 'Client dashboard v2', category: 'Client Focused', estimatedHours: 8, status: 'Available' },
      { title: 'Research AI integration', category: 'R&D', estimatedHours: 4, status: 'Available' },
      { title: 'API performance audit', category: 'Tech Debt', estimatedHours: 3, status: 'Available' },
      { title: 'Mobile app prototype', category: 'Client Focused', estimatedHours: 10, status: 'Available' },
      { title: 'Code review automation', category: 'Tech Debt', estimatedHours: 5, status: 'Available' }
    ];

    const addMember$ = sampleMembers.map(m => this.api.addTeamMember(m));
    const addBacklog$ = sampleBacklog.map(b => this.api.addBacklogItem(b));
    const allObs: any[] = [...addMember$, ...addBacklog$];
    let done = 0;
    const total = allObs.length;
    const tryFinish = () => {
      done++;
      if (done >= total) {
        this.isSeeding = false;
        this.showFooterToast('✅ Sample data seeded!', false);
      }
    };

    allObs.forEach((obs: any) => obs.subscribe({ next: tryFinish, error: () => tryFinish() }));
  }

  private showFooterToast(msg: string, isError: boolean) {
    this.footerToast = msg;
    this.footerToastError = isError;
    setTimeout(() => { this.footerToast = ''; }, 3000);
  }

  activeNav: string = '';
  setActive(nav: string) { this.activeNav = nav; }
}
