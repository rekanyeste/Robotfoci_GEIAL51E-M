import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GameService } from '../../services/game.service';
import { AiService } from '../../services/ai.service';
import { LeaderboardService } from '../../services/leaderboard.service';
import * as models from '../../models/robosoccer.models';
import confetti from 'canvas-confetti';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './field.html',
  styleUrls: ['./field.scss'],
})
export class Field implements OnInit, OnDestroy {
  room: models.Room | null = null;
  config: models.GameConfigMessage | null = null;
  playerId: number | null = null;
  winner: models.TeamType | null = null;
  gameTime: number = 0;
  displayCountdown: number = 0;
  private timerInterval: any;
  private previousTicks: number = 0;
  private initialTicks: number = 0;
  public TeamType = models.TeamType;
  private roomSubscription: Subscription | undefined;
  private configSubscription: Subscription | undefined;
  private idSubscription: Subscription | undefined;
  private gameOverSubscription: Subscription | undefined;
  private collisionSubscription: Subscription | undefined;
  private previousScore: { blue: number; red: number } | null = null;
  private isCounting = false;

  constructor(
    private gameService: GameService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private aiService: AiService,
    private leaderboardService: LeaderboardService,
    private audioService: AudioService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {
    this.audioService.stop();
    this.audioService.play('stadium-ambience');

    this.roomSubscription = this.gameService.roomState$.subscribe((room) => {
      if (room?.score) {
        if (this.previousScore) {
          if (room.score.blue > this.previousScore.blue || room.score.red > this.previousScore.red) {
            this.audioService.play('goal');
          }
        }

        this.previousScore = { blue: room.score.blue, red: room.score.red };
      }

      this.room = room;
      if (this.winner) {
        this.displayCountdown = 0;
        this.cdr.detectChanges();
        return;
      }
      const rawTicks = this.room?.countdownTicks ?? 0;
      if (rawTicks > 0) {
        this.isCounting = true;

        if (this.initialTicks === 0 || rawTicks > this.initialTicks) {
          this.initialTicks = rawTicks;
        }

        let currentSecond = Math.ceil((rawTicks / this.initialTicks) * 5);
        if (currentSecond < 1) currentSecond = 1;
        if (currentSecond > 5) currentSecond = 5;
        if (this.displayCountdown !== currentSecond) {
          this.displayCountdown = currentSecond;
        }
      } else if (rawTicks === 0 && this.room?.isStarted) {
        this.displayCountdown = 0;
        this.initialTicks = 0;
        
        if (this.isCounting && !this.winner) {
          this.audioService.play('game-start');
          this.isCounting = false;
        }

        if (!this.timerInterval && !this.winner) {
          this.startTimer();
        }
      }

      this.previousTicks = rawTicks;
      this.cdr.detectChanges();
      if (
        this.playerId !== null &&
        this.room?.isStarted &&
        this.config &&
        rawTicks === 0 &&
        !this.winner
      ) {
        const coordinates = this.aiService.calculateMovements(
          this.room,
          this.config,
          this.playerId,
        );
        if (coordinates && coordinates.length > 0) {
          this.gameService.sendMovement(coordinates);
        }
      }
    });

    this.configSubscription = this.gameService.configState$.subscribe((config) => {
      this.config = config;
      this.cdr.detectChanges();
    });

    this.idSubscription = this.gameService.idState$.subscribe((ids) => {
      this.playerId = ids.playerId;
      this.cdr.detectChanges();
    });

    this.gameOverSubscription = this.gameService.gameOverState$.subscribe((winner) => {
      if (winner !== null && this.winner === null) {
        this.winner = winner;
        this.displayCountdown = 0;
        this.stopTimer();
        this.cdr.detectChanges();
        this.fireConfetti();

        if (this.room) {
          const redPlayer = this.room.players.find((p) => p.team === models.TeamType.Red);
          const bluePlayer = this.room.players.find((p) => p.team === models.TeamType.Blue);
          const isRedWinner = winner === models.TeamType.Red;
          const winnerName = isRedWinner ? redPlayer?.name : bluePlayer?.name;
          const loserName = isRedWinner ? bluePlayer?.name : redPlayer?.name;
          if (winnerName && loserName) {
            this.leaderboardService.updateMatch(winnerName, loserName, 1, 0);
          }
        }
      }
    });

    if (this.playerId === null) {
      this.gameService.getId();
    }
  }

  getWinnerNames(): string {
    if (!this.room || !this.winner) return '';
    return this.room.players
      .filter((p) => p.team === this.winner)
      .map((p) => p.name)
      .join(' & ');
  }

  fireConfetti() {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#ffffff', this.winner === this.TeamType.Red ? '#ff4d4d' : '#4da6ff'],
        zIndex: 10000,
      });

      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#ffffff', this.winner === this.TeamType.Red ? '#ff4d4d' : '#4da6ff'],
        zIndex: 10000,
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }

  private startTimer() {
    if (isPlatformBrowser(this.platformId)) {
      this.timerInterval = setInterval(() => {
        if (this.room?.isStarted && this.displayCountdown === 0 && !this.winner) {
          this.gameTime++;
          this.cdr.detectChanges();
        }
      }, 1000);
    }
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  get formattedTime(): string {
    const minutes = Math.floor(this.gameTime / 60);
    const seconds = this.gameTime % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.roomSubscription?.unsubscribe();
    this.configSubscription?.unsubscribe();
    this.idSubscription?.unsubscribe();
    this.gameOverSubscription?.unsubscribe();
    this.collisionSubscription?.unsubscribe();
  }

  restart(): void {
    this.gameTime = 0;
    this.winner = null;
    this.displayCountdown = 0;
    this.previousTicks = 0;
    this.initialTicks = 0;
    this.previousScore = null;
    this.isCounting = false;
    this.stopTimer();
    this.gameService.restartGame();
    this.router.navigate(['/lobby']);
    this.audioService.play('background-music');
  }

  getAllCharacters() {
    if (!this.room || !this.room.ball) return [];
    const ball = this.room.ball;
    return this.room.players
      .flatMap((player) =>
        player.characters.map((character, index) => {
          let label = 'CS';
          if (index === 0) label = 'K';
          else if (index === 1 || index === 2) label = 'V';
          const angle = Math.atan2(ball.y - character.y, ball.x - character.x) * (180 / Math.PI);

          return {
            ...character,
            team: player.team,
            label: label,
            angle: angle,
          };
        }),
      )
      .filter((c) => c.team === models.TeamType.Red || c.team === models.TeamType.Blue);
  }

  leaveRoom(): void {
    this.gameService.leaveRoom();
    this.router.navigate(['/']);
  }
}
