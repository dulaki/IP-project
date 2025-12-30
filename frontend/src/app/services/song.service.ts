import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Song, SongQuery } from '../models/song';

interface SongResponse {
  count: number;
  items: Song[];
}

@Injectable({
  providedIn: 'root',
})
export class SongService {
  private readonly baseUrl = this.resolveBaseUrl();

  constructor(private readonly http: HttpClient) {}

  private resolveBaseUrl(): string {
    const fromWindow = (window as any).__API_BASE_URL__;
    if (typeof fromWindow === 'string' && fromWindow.length > 0) {
      return fromWindow;
    }
    return 'http://localhost:4000/api';
  }

  getSongs(query: SongQuery = {}): Observable<Song[]> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http
      .get<SongResponse>(`${this.baseUrl}/songs`, { params })
      .pipe(map((res) => res.items));
  }

  getSong(id: string): Observable<Song> {
    return this.http.get<Song>(`${this.baseUrl}/songs/${id}`);
  }
}
