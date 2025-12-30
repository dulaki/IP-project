import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { SongCardComponent } from './components/song-card/song-card.component';
import { FilterBarComponent, FilterState } from './components/filter-bar/filter-bar.component';
import { StatsPanelComponent } from './components/stats-panel/stats-panel.component';
import { Song } from './models/song';
import { SongService } from './services/song.service';

@Component({
  selector: 'app-songs',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, SongCardComponent, FilterBarComponent, StatsPanelComponent],
  templateUrl: './songs.component.html',
  styleUrl: './songs.component.scss',
})
export class SongsComponent implements OnInit {
  title = 'Top 100 of 2025';
  songs: Song[] = [];
  allGenres: string[] = [];
  filters: FilterState = { search: '', genre: '', type: 'all', sort: 'rank', order: 'asc' };
  genres: string[] = [];
  loading = false;
  error = '';
  selectedSong?: Song;
  private previewAudio?: HTMLAudioElement;

  constructor(private readonly songService: SongService) {}

  ngOnInit(): void {
    this.loadSongs(true);
  }

  handleFiltersChange(filters: FilterState): void {
    this.filters = { ...filters };
    this.loadSongs();
  }

  loadSongs(updateGenres = false): void {
    this.loading = true;
    this.error = '';
    const query = {
      ...this.filters,
      type: this.filters.type === 'all' || this.filters.type === 'collabduo' ? undefined : this.filters.type,
    };
    this.songService.getSongs(query).subscribe({
      next: (items) => {
        let result = items;
        if (this.filters.type === 'collabduo') {
          result = items.filter((s) => {
            const t = (s.type || '').toLowerCase();
            return t === 'collab' || t === 'duo';
          });
        }
        this.songs = this.filters.order === 'desc' ? [...result].reverse() : result;
        if (updateGenres || this.genres.length === 0) {
          this.allGenres = items.map((s) => (s.genre || '').toLowerCase()).filter(Boolean);
          this.genres = Array.from(new Set(this.allGenres)).sort();
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load songs. Is the backend running on http://localhost:4000?';
        this.loading = false;
      },
    });
  }

  selectSong(song: Song): void {
    this.selectedSong = song;
  }

  previewSong(song: Song): void {
    if (!song.previewUrl) return;
    if (this.previewAudio) {
      this.previewAudio.pause();
    }
    this.previewAudio = new Audio(song.previewUrl);
    this.previewAudio.play().catch(() => {
      this.error = 'Unable to play preview.';
    });
  }
}
