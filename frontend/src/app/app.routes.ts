import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { SongsComponent } from './songs.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'songs', component: SongsComponent },
  { path: '**', redirectTo: 'songs' },
];
