import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService } from '../../services/game.service';
import * as models from '../../models/robosoccer.models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './field.html',
  styleUrls: ['./field.scss'],
})
export class Field implements OnInit, OnDestroy {
  TeamType = models.TeamType;
  room: models.Room | null = null;
  config: models.GameConfigMessage | null = null;
  playerId: number | null = null;

  private roomSubscription: Subscription | undefined;
  private configSubscription: Subscription | undefined;
  private idSubscription: Subscription | undefined;

  constructor(private gameService: GameService) {}

  ngOnInit() {
    this.roomSubscription = this.gameService.roomState$.subscribe((room) => {
      this.room = room;
    });

    this.configSubscription = this.gameService.configState$.subscribe((config) => {
      this.config = config;
    });

    this.idSubscription = this.gameService.idState$.subscribe((ids) => {
      this.playerId = ids.playerId;
    });

    this.gameService.getId();
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
  }

  startGame() {
    this.gameService.startGame();
  }

  pickTeam(team: models.TeamType) {
    if (this.playerId) {
      this.gameService.pickTeam(this.playerId, team);
    }
  }

  onFieldClick(event: MouseEvent) {
    if (this.playerId) {
      const rect = (event.currentTarget as Element).getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.gameService.sendMovement(this.playerId, x, y);
    }
  }
}
