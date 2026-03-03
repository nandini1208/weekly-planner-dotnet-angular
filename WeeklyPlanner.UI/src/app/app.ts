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

  constructor(private router: Router, private api: ApiService) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.showLayout = ['/dashboard', '/setup', '/backlog', '/team'].some(
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
  }

  // 🗑 Reset app
  resetApp() {
    this.showResetModal = true;
  }

  closeResetModal() {
    this.showResetModal = false;
  }

  confirmReset() {
    this.api.resetAll().subscribe({
      next: () => {
        localStorage.clear();
        this.showResetModal = false;
        this.router.navigate(['/team']);
      },
      error: (err) => console.error('Reset failed:', err)
    });
  }

  activeNav: string = '';

  setActive(nav: string) {
    this.activeNav = nav;
  }
}