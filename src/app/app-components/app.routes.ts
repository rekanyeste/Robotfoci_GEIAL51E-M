import { Routes } from '@angular/router';
import { Field } from '../components/field/field';
import { HomeComponent } from '../components/home.component/home.component';
import { LobbyComponent } from '../components/lobby/lobby.component';
import { LeaderboardComponent } from '../components/leaderboard.component/leaderboard.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'field', component: Field },
  { path: 'lobby', component: LobbyComponent },
  { path: 'leaderboard', component: LeaderboardComponent },
];
