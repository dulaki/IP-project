import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Song } from '../../models/song';

@Component({
  selector: 'app-stats-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-panel.component.html',
  styleUrls: ['./stats-panel.component.scss'],
})
export class StatsPanelComponent {
  @Input() songs: Song[] = [];

  get total(): number {
    return this.songs.length;
  }

  get bandCount(): number {
    return this.songs.filter((s) => s.type === 'band').length;
  }

  get soloCount(): number {
    return this.songs.filter((s) => s.type === 'solo').length;
  }

  get collabCount(): number {
    return this.songs.filter((s) => s.type === 'collab').length;
  }

  get duoCount(): number {
    return this.songs.filter((s) => s.type === 'duo').length;
  }

  get otherCount(): number {
    return this.total - (this.bandCount + this.soloCount + this.collabCount + this.duoCount);
  }

  get collabDuoTotal(): number {
    return this.collabCount + this.duoCount;
  }

  get topGenres(): { genre: string; count: number }[] {
    const counts = new Map<string, number>();
    this.songs.forEach((song) => {
      const key = song.genre.toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}
