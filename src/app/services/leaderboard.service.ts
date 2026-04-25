import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, tap, catchError } from 'rxjs';

export interface TeamStats {
  no?: number;
  name: string;
  p: number;
  w: number;
  d: number;
  l: number;
  f: number;
  a: number;
  diff: number;
  pts: number;
}

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly STORAGE_KEY = 'robotfoci_stats';
  private readonly DEFAULT_TXT = 'src/app/assets/leaderboard.txt';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  getStats(): Observable<TeamStats[]> {
    if (isPlatformBrowser(this.platformId)) {
      const localData = localStorage.getItem(this.STORAGE_KEY);
      if (localData) {
        return of(JSON.parse(localData));
      }
    }

    return this.http.get(this.DEFAULT_TXT, { responseType: 'text' }).pipe(
      map((text) => this.parseTxt(text)),
      catchError(() => of([])),
      tap((stats) => {
        if (isPlatformBrowser(this.platformId)) {
          this.saveToLocal(stats);
        }
      }),
    );
  }

  updateMatch(winnerName: string, loserName: string, winnerG: number, loserG: number) {
    this.getStats().subscribe({
      next: (allStats) => {
        let winner = allStats.find((t) => t.name === winnerName);
        if (!winner) {
          winner = { name: winnerName, p: 0, w: 0, d: 0, l: 0, f: 0, a: 0, diff: 0, pts: 0 };
          allStats.push(winner);
        }
        let loser = allStats.find((t) => t.name === loserName);
        if (!loser) {
          loser = { name: loserName, p: 0, w: 0, d: 0, l: 0, f: 0, a: 0, diff: 0, pts: 0 };
          allStats.push(loser);
        }
        winner.p += 1;
        winner.w += 1;
        winner.f += winnerG;
        winner.a += loserG;
        winner.diff = winner.f - winner.a;
        winner.pts += 3;

        loser.p += 1;
        loser.l += 1;
        loser.f += loserG;
        loser.a += winnerG;
        loser.diff = loser.f - loser.a;
        this.saveToLocal(allStats);
      },
    });
  }

  private saveToLocal(stats: TeamStats[]) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats));
    }
  }

  private parseTxt(text: string): TeamStats[] {
    if (!text) return [];
    return text
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .map((line) => {
        const [name, p, w, d, l, f, a, diff, pts] = line.split(';');
        return {
          name: name.trim(),
          p: +p || 0,
          w: +w || 0,
          d: +d || 0,
          l: +l || 0,
          f: +f || 0,
          a: +a || 0,
          diff: +diff || 0,
          pts: +pts || 0,
        };
      });
  }
}
