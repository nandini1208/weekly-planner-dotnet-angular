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

  isSavingNew = false;
  categoryError = false;

  addItem(): void {
    const title = this.newItemTitle.trim();
    if (!title) return;

    if (!this.newItemCategory) {
      this.categoryError = true;
      return;
    }

    this.categoryError = false;

    if (this.isSavingNew) return;
    this.isSavingNew = true;

    // Optimistically add to UI
    const tempId = -Date.now(); // Fake ID
    const optimisticItem: BacklogItem = {
      id: tempId,
      title: title,
      category: this.newItemCategory,
      estimatedHours: this.newItemEstimate || 0,
      status: 'Available'
    };

    this.backlogItems.push(optimisticItem);

    this.showToast('✅ Backlog item saved!');
    this.showAddForm = false; // Hide the add form immediately so they see the list

    // Clear form inputs instantly
    this.newItemTitle = '';
    this.newItemDescription = '';
    this.newItemEstimate = null;
    this.newItemCategory = '';

    this.apiService.addBacklogItem({
      title: optimisticItem.title,
      category: optimisticItem.category,
      estimatedHours: optimisticItem.estimatedHours,
      status: 'Available'
    }).subscribe({
      next: (item) => {
        this.isSavingNew = false;
        // Replace optimistic item with real item from server
        const idx = this.backlogItems.findIndex(i => i.id === tempId);
        if (idx !== -1) {
          this.backlogItems[idx] = item;
        } else {
          this.backlogItems.push(item);
        }
      },
      error: (err) => {
        this.isSavingNew = false;
        // Revert optimistic update
        this.backlogItems = this.backlogItems.filter(i => i.id !== tempId);
        this.showAddForm = true; // Show it again if there was an error
        this.newItemTitle = optimisticItem.title; // Restore title
        this.newItemCategory = optimisticItem.category; // Restore category
        this.newItemEstimate = optimisticItem.estimatedHours || null; // Restore estimate
        console.error('Error adding backlog item', err);
      }
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

    // Store reference to restore if error
    const savingItem = this.editingItem;

    this.showToast('✅ Changes saved!');
    this.editingItem = null; // Hide form immediately

    const updated: BacklogItem = {
      ...savingItem,
      title: this.editTitle.trim(),
      category: this.editCategory,
      estimatedHours: this.editEstimate || 0
    };

    this.apiService.updateBacklogItem(updated).subscribe({
      next: (saved) => {
        const idx = this.backlogItems.findIndex(i => i.id === saved.id);
        if (idx !== -1) this.backlogItems[idx] = saved;
      },
      error: (err) => {
        this.editingItem = savingItem; // restore form
        console.error('Error updating backlog item', err);
      }
    });
  }

  cancelEdit(): void {
    this.editingItem = null;
  }

  archiveItem(item: BacklogItem): void {
    const originalStatus = item.status || 'Available';
    item.status = 'Archived';
    this.apiService.updateBacklogItem(item).subscribe({
      next: () => {
        // Optionally toast 'Archived!'
      },
      error: (err) => {
        item.status = originalStatus;
        console.error('Failed to archive', err);
      }
    })
  }

  // ─── HELPERS ─────────────────────────────────────────
  toastMessage = '✅ Backlog item saved!';

  showToast(msg?: string): void {
    this.toastMessage = msg || '✅ Backlog item saved!';
    this.savedToast = true;
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => { this.savedToast = false; }, 500);
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
