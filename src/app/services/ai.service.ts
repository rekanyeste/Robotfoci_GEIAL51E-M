import { Injectable } from '@angular/core';
import * as models from '../models/robosoccer.models';
import { SoccerAIEngine, Vector2D } from './steering';
import { GameContext, calculateTarget, TeamState } from './roles';

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private currentRoomId: number | null = null;
  private wasStarted: boolean = false;
  private matchStartTime: number = 0;
  private matchSpeeds: number[] = [10, 10, 10, 10, 10];
  private engine = new SoccerAIEngine();
  constructor() {}

  public calculateMovements(
    room: models.Room,
    config: models.GameConfigMessage,
    playerId: number,
  ): { x: number; y: number }[] | null {
    const myPlayer = room.players.find((p) => p.id === playerId);
    if (!myPlayer || !myPlayer.characters || myPlayer.characters.length === 0) return null;

    if (this.currentRoomId !== room.roomId) {
      this.currentRoomId = room.roomId;
      this.wasStarted = false;
    }

    if (room.isStarted && !this.wasStarted) {
      this.wasStarted = true;
      this.matchStartTime = Date.now();
      for (let i = 0; i < 5; i++) {
        this.matchSpeeds[i] = 12 + (Math.random() * 4 - 2);
      }
    } else if (!room.isStarted) {
      this.wasStarted = false;
      return myPlayer.characters.map(() => ({ x: 0, y: 0 }));
    }

    const dir = myPlayer.team === models.TeamType.Blue ? 1 : -1;
    const fieldWidth = config.fieldWidth;
    const fieldHeight = config.fieldHeight;
    const ownGoalX = dir === 1 ? 0 : fieldWidth;
    const enemyGoalX = dir === 1 ? fieldWidth : 0;
    const isAttacking =
      (dir === 1 && room.ball.x > fieldWidth / 2) || (dir === -1 && room.ball.x < fieldWidth / 2);
    const teamState: TeamState = isAttacking ? 'ATTACK' : 'DEFEND';
    const chaserObj = myPlayer.characters.reduce((best: any, c: any) => {
      const d = Math.hypot(c.x - room.ball.x, c.y - room.ball.y);
      return !best || d < best.d ? { c, d } : best;
    }, null);
    const chaserId = chaserObj ? chaserObj.c.id : -1;
    const ctx = new GameContext(
      room.ball,
      dir,
      ownGoalX,
      enemyGoalX,
      fieldWidth,
      fieldHeight,
      teamState,
      chaserId,
    );

    const movements = myPlayer.characters.map((character, index) => {
      const target = calculateTarget(character, index, ctx);
      const isActive = character.id === chaserId;

      return this.engine.updateCharacter(
        character,
        target,
        myPlayer.characters,
        this.matchSpeeds[index],
        room.ball,
        enemyGoalX,
        isActive,
      );
    });

    return movements;
  }
}
