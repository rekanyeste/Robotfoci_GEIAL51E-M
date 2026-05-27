import { Injectable } from '@angular/core';
import * as models from '../models/robosoccer.models';
import { SoccerAIEngine, Vector2D } from './steering';
import { GameContext, calculateTarget, getRole } from './roles';

@Injectable({ providedIn: 'root' })
export class AiService {
  private engine = new SoccerAIEngine();
  private wallEnterTime: number = 0;
  private rescueRoutineActive: boolean = false;
  private rescuePhase: 'PREPARE' | 'STRIKE' = 'PREPARE';
  private rescueStartTime: number = 0;
  private rescueKickerId: number | null = null;

  public calculateMovements(
    room: models.Room,
    config: models.GameConfigMessage,
    playerId: number,
  ): { x: number; y: number }[] | null {
    const myPlayer = room.players.find((p) => p.id === playerId);
    if (!myPlayer || !myPlayer.characters.length || !room.isStarted) return null;

    const dir = myPlayer.team === models.TeamType.Blue ? 1 : -1;
    const { fieldWidth, fieldHeight } = config;
    const isNearXWall = room.ball.x < 150 || room.ball.x > fieldWidth - 150;
    const isNearYWall = room.ball.y < 150 || room.ball.y > fieldHeight - 150;
    const isBallInCorner = isNearXWall && isNearYWall;

    if (isBallInCorner) {
      if (this.wallEnterTime === 0) this.wallEnterTime = Date.now();
      if (Date.now() - this.wallEnterTime > 1500 && !this.rescueRoutineActive) {
        this.rescueRoutineActive = true;
        this.rescueStartTime = Date.now();
        this.rescuePhase = 'PREPARE';
        const isHomeTeam =
          (dir === 1 && room.ball.x < fieldWidth / 2) ||
          (dir === -1 && room.ball.x > fieldWidth / 2);
        if (isHomeTeam) {
          let bestDist = Infinity;
          let kickerId = -1;
          myPlayer.characters.forEach((c, index) => {
            if (getRole(index) !== 'GK') {
              const d = Math.hypot(c.x - room.ball.x, c.y - room.ball.y);
              if (d < bestDist) {
                bestDist = d;
                kickerId = c.id;
              }
            }
          });
          this.rescueKickerId = kickerId !== -1 ? kickerId : myPlayer.characters[0].id;
        } else {
          this.rescueKickerId = null;
        }
      }
    } else {
      this.wallEnterTime = 0;
      this.rescueRoutineActive = false;
      this.rescueKickerId = null;
    }
    if (this.rescueRoutineActive) {
      const elapsed = Date.now() - this.rescueStartTime;
      if (elapsed < 1000) this.rescuePhase = 'PREPARE';
      else if (elapsed < 1600) this.rescuePhase = 'STRIKE';
      else this.rescueStartTime = Date.now();
    }
    let bestScore = Infinity;
    let chaserId = -1;
    myPlayer.characters.forEach((c, index) => {
      const dist = Math.hypot(c.x - room.ball.x, c.y - room.ball.y);
      const role = getRole(index);
      let weight = role === 'ATT' || role === 'SUP' ? 0.7 : 2.0;
      if (role === 'GK') weight = dist < 450 ? 0.4 : 10.0;

      if (dist * weight < bestScore) {
        bestScore = dist * weight;
        chaserId = c.id;
      }
    });

    const ctx = new GameContext(
      room.ball,
      dir,
      dir === 1 ? 0 : fieldWidth,
      dir === 1 ? fieldWidth : 0,
      fieldWidth,
      fieldHeight,
      chaserId,
      myPlayer.characters,
    );
    (ctx as any).rescuePhase = this.rescueRoutineActive ? this.rescuePhase : 'NONE';
    (ctx as any).rescueKickerId = this.rescueKickerId;
    return myPlayer.characters.map((character, index) => {
      const target = calculateTarget(character, index, ctx);
      const isActive = this.rescueRoutineActive
        ? character.id === this.rescueKickerId
        : character.id === chaserId;

      return this.engine.updateCharacter(
        character,
        target,
        myPlayer.characters,
        room.ball,
        ctx.enemyGoalX,
        isActive,
      );
    });
  }
}
