import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  backlogItems: BacklogItem[] = [];

  newItemTitle = '';
  newItemCategory = 'Client';
  newItemEstimate = 1;

  ngOnInit(): void {
    this.loadBacklog();
  }

  loadBacklog(): void {
    this.apiService.getBacklogItems().subscribe((items) => {
      this.backlogItems = items;
    });
  }

  addItem(): void {
    if (!this.newItemTitle.trim() || this.newItemEstimate <= 0) return;

    this.apiService.addBacklogItem({
      title: this.newItemTitle,
      category: this.newItemCategory,
      estimatedHours: this.newItemEstimate,
      status: 'To Do'
    }).subscribe({
      next: (item) => {
        this.backlogItems.push(item);
        this.newItemTitle = '';
        this.newItemEstimate = 1;
      }
    });
  }
}
