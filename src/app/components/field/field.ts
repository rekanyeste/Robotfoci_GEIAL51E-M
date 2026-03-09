import { Component, OnDestroy, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
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
  public leftGoalColor = '#0000FF';
  public rightGoalColor = '#FF0000';

  get redTeamPlayers(): models.Player[] {
    if (!this.room) return [];
    return this.room.players.filter(p => p.team === models.TeamType.Red);
  }

  get blueTeamPlayers(): models.Player[] {
    if (!this.room) return [];
    return this.room.players.filter(p => p.team === models.TeamType.Blue);
  }

  private roomSubscription: Subscription | undefined;
  private configSubscription: Subscription | undefined;
  private idSubscription: Subscription | undefined;

  private acceleration = { x: 0, y: 0 };
  private keysPressed: { [key: string]: boolean } = {};
  private readonly ACCELERATION_STEP = 10;
  private movementIntervalId: number | null = null;

  constructor(private gameService: GameService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.roomSubscription = this.gameService.roomState$.subscribe((room) => {
      console.log('Received room update in Field component:', room);
      this.room = room;
      this.cdr.detectChanges();
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
    if (this.movementIntervalId !== null) {
      clearInterval(this.movementIntervalId);
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

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd'].indexOf(key) === -1) return;

    if (this.keysPressed[key]) {
      return; // Key already down
    }
    this.keysPressed[key] = true;
    this.updateAccelerationAndInterval();
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd'].indexOf(key) === -1) return;
    
    this.keysPressed[key] = false;
    this.updateAccelerationAndInterval();
  }

  private updateAccelerationAndInterval() {
    let ax = 0;
    let ay = 0;

    const up = this.keysPressed['w'];
    const down = this.keysPressed['s'];
    const left = this.keysPressed['a'];
    const right = this.keysPressed['d'];

    if (up && !down) {
      ay = -this.ACCELERATION_STEP;
    } else if (down && !up) {
      ay = this.ACCELERATION_STEP;
    }

    if (left && !right) {
      ax = -this.ACCELERATION_STEP;
    } else if (right && !left) {
      ax = this.ACCELERATION_STEP;
    }

    this.acceleration.x = ax;
    this.acceleration.y = ay;

    const isMoving = ax !== 0 || ay !== 0;

    if (isMoving && this.movementIntervalId === null) {
      this.movementIntervalId = window.setInterval(() => {
        if (this.playerId) {
          this.gameService.sendMovement(this.playerId, this.acceleration.x, this.acceleration.y);
        }
      }, 33); // ~30 FPS
    } else if (!isMoving && this.movementIntervalId !== null) {
      clearInterval(this.movementIntervalId);
      this.movementIntervalId = null;
      if (this.playerId) {
        this.gameService.sendMovement(this.playerId, 0, 0);
      }
    }
  }
}
