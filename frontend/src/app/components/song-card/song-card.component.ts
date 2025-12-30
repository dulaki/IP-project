import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Song } from '../../models/song';

@Component({
  selector: 'app-song-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './song-card.component.html',
  styleUrls: ['./song-card.component.scss'],
})
export class SongCardComponent {
  @Input() song!: Song;
  @Output() selectSong = new EventEmitter<Song>();
  @Output() previewSong = new EventEmitter<Song>();

  onPreviewClick(event: Event): void {
    event.stopPropagation();
    this.previewSong.emit(this.song);
  }
}
