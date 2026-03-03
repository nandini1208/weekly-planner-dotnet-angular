import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { BacklogItem } from '../../models/models';

@Component({
  selector: 'app-backlog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './backlog.html',
  styleUrls: ['./backlog.css']
})
export class BacklogComponent implements OnInit {
  apiService = inject(ApiService);
  router = inject(Router);

  backlogItems: BacklogItem[] = [];

  // Add form state
  showAddForm = false;
  newItemTitle = '';
  newItemDescription = '';
  newItemCategory = '';
  newItemEstimate: number | null = null;

  // Edit form state
  editingItem: BacklogItem | null = null;
  editTitle = '';
  editDescription = '';
  editCategory = '';
  editEstimate: number | null = null;

  // Filters
  searchQuery = '';
  statusFilter = 'available';
  activeCat: string | null = null;

  // Toast
  savedToast = false;
  toastTimeout: any;

  ngOnInit(): void {
    this.apiService.getBacklogItems().subscribe(items => {
      this.backlogItems = items || [];
    });
  }

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }

  get filteredItems(): BacklogItem[] {
    return this.backlogItems.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(this.searchQuery.toLowerCase());
      let matchesStatus = true;
      const s = (item.status || '').toLowerCase();
      if (this.statusFilter === 'available') matchesStatus = s === 'available' || s === 'to do' || !item.status;
      if (this.statusFilter === 'completed') matchesStatus = s === 'done' || s === 'completed';
      if (this.statusFilter === 'archived') matchesStatus = s === 'archived';
      const matchesCat = this.activeCat ? this.categoryLabel(item.category) === this.activeCat : true;
      return matchesSearch && matchesStatus && matchesCat;
    });
  }

  setCat(cat: string): void {
    this.activeCat = this.activeCat === cat ? null : cat;
  }

  // ─── ADD ────────────────────────────────────────────
  addItem(): void {
    const title = this.newItemTitle.trim();
    if (!title || !this.newItemCategory) return;

    this.apiService.addBacklogItem({
      title,
      category: this.newItemCategory,
      estimatedHours: this.newItemEstimate || 0,
      status: 'Available'
    }).subscribe({
      next: (item) => {
        this.backlogItems.push(item);
        this.newItemTitle = '';
        this.newItemDescription = '';
        this.newItemEstimate = null;
        this.newItemCategory = '';
        this.showAddForm = false;
        this.showToast();
      },
      error: (err) => console.error('Error adding backlog item', err)
    });
  }

  // ─── EDIT ────────────────────────────────────────────
  openEdit(item: BacklogItem): void {
    this.editingItem = item;
    this.editTitle = item.title;
    this.editDescription = '';          // description not in model currently
    this.editCategory = this.categoryLabel(item.category);
    this.editEstimate = item.estimatedHours || null;
    this.showAddForm = false;           // close add form if open
  }

  saveEdit(): void {
    if (!this.editingItem) return;

    const updated: BacklogItem = {
      ...this.editingItem,
      title: this.editTitle.trim(),
      category: this.editCategory,
      estimatedHours: this.editEstimate || 0
    };

    this.apiService.updateBacklogItem(updated).subscribe({
      next: (saved) => {
        const idx = this.backlogItems.findIndex(i => i.id === saved.id);
        if (idx !== -1) this.backlogItems[idx] = saved;
        this.editingItem = null;
        this.showToast();
      },
      error: (err) => console.error('Error updating backlog item', err)
    });
  }

  cancelEdit(): void {
    this.editingItem = null;
  }

  // ─── HELPERS ─────────────────────────────────────────
  showToast(): void {
    this.savedToast = true;
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => { this.savedToast = false; }, 3000);
  }

  categoryLabel(cat: string): string {
    if (!cat) return 'Client Focused';
    const lower = cat.toLowerCase();
    if (lower.includes('client')) return 'Client Focused';
    if (lower.includes('tech')) return 'Tech Debt';
    if (lower.includes('r&d') || lower.includes('rnd')) return 'R&D';
    return cat;
  }

  categoryClass(cat: string): string {
    const label = this.categoryLabel(cat);
    if (label === 'Client Focused') return 'cat-client';
    if (label === 'Tech Debt') return 'cat-tech';
    if (label === 'R&D') return 'cat-rnd';
    return 'cat-client';
  }
}
