import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SongQuery } from '../../models/song';

export interface FilterState extends SongQuery {
  type: 'all' | 'band' | 'solo' | 'collabduo' | string;
  order?: 'asc' | 'desc';
}

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-bar.component.html',
  styleUrls: ['./filter-bar.component.scss'],
})
export class FilterBarComponent {
  @Input() filters: FilterState = { sort: 'rank', type: 'all' };
  @Input() genres: string[] = [];
  @Output() filtersChange = new EventEmitter<FilterState>();

  handleChange(partial: Partial<FilterState>): void {
    this.filters = { ...this.filters, ...partial };
    this.filtersChange.emit(this.filters);
  }

  clearFilters(): void {
    this.filters = { search: '', genre: '', type: 'all', sort: 'rank' };
    this.filtersChange.emit(this.filters);
  }
}
