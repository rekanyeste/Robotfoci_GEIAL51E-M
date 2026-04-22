import {
  Component,
  OnDestroy,
  OnInit,
  HostListener,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import * as models from '../../models/robosoccer.models';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AiService } from '../../services/ai.service';

@Component({
  selector: 'app-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './field.html',
  styleUrls: ['./field.scss'],
})
export class Field implements OnInit, OnDestroy {
  room: models.Room | null = null;
  config: models.GameConfigMessage | null = null;
  playerId: number | null = null;
  winner: models.TeamType | null = null;
  public TeamType = models.TeamType;
  public leftGoalColor = '#0000FF';
  public rightGoalColor = '#FF0000';
  private roomSubscription: Subscription | undefined;
  private configSubscription: Subscription | undefined;
  private idSubscription: Subscription | undefined;
  private gameOverSubscription: Subscription | undefined;
  private collisionSubscription: Subscription | undefined;

  constructor(
    private gameService: GameService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private aiService: AiService,
    private ngZone: NgZone,
  ) {}

  ngOnInit() {
    this.roomSubscription = this.gameService.roomState$.subscribe((room) => {
      this.room = room;
      this.cdr.detectChanges();
      if (this.playerId !== null && this.room && this.config) {
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
      this.winner = winner;
      this.cdr.detectChanges();
    });

    this.collisionSubscription = this.gameService.collisionState$.subscribe((collision) => {
      if (collision) {
        console.log('Collision detected:', collision);
      }
    });

    if (this.playerId === null) {
      this.gameService.getId();
    }
  }

  ngOnDestroy(): void {
    if (this.roomSubscription) {
      this.roomSubscription.unsubscribe();
    }
    if (this.configSubscription) {
      this.configSubscription.unsubscribe();
    }
    if (this.idSubscription) {
      this.idSubscription.unsubscribe();
    }
    if (this.gameOverSubscription) {
      this.gameOverSubscription.unsubscribe();
    }
    if (this.collisionSubscription) {
      this.collisionSubscription.unsubscribe();
    }
  }

  restart(): void {
    this.gameService.restartGame();
    this.router.navigate(['/lobby']);
  }

  getAllCharacters(): (models.Character & { team: models.TeamType | null; label: string })[] {
    if (!this.room) {
      return [];
    }
    return this.room.players
      .flatMap((player) =>
        player.characters.map((character, index) => {
          let label = 'CS';
          if (index === 0) label = 'K';
          else if (index === 1 || index === 2) label = 'V';

          return {
            ...character,
            team: player.team,
            label: label,
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
