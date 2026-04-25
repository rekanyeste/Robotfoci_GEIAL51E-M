import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LeaderboardService, TeamStats } from '../../services/leaderboard.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss',
})
export class LeaderboardComponent implements OnInit {
  teams: TeamStats[] = [];

  constructor(
    private leaderboardService: LeaderboardService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.leaderboardService.getStats().subscribe({
      next: (data) => {
        this.teams = data
          .sort((a, b) => b.pts - a.pts || b.diff - a.diff)
          .map((t, i) => ({ ...t, no: i + 1 }));
      },
      error: (err) => {
        console.error('Error fetching stats:', err);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
