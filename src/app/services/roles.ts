import { Vector2D } from './steering';

export type TeamState = 'ATTACK' | 'DEFEND';

export class GameContext {
  constructor(
    public ball: Vector2D,
    public dir: number,
    public ownGoalX: number,
    public enemyGoalX: number,
    public fieldWidth: number,
    public fieldHeight: number,
    public teamState: TeamState,
    public chaserId: number,
  ) {}
}
const ROLES = ['GK', 'DEF_L', 'DEF_R', 'ATT', 'SUP'];

export function getRole(index: number): string {
  return ROLES[index] || 'SUP';
}

export function calculateTarget(char: any, index: number, ctx: GameContext): Vector2D {
  const role = getRole(index);
  const isChaser = char.id === ctx.chaserId;
  const centerY = ctx.fieldHeight / 2;
  let targetX = 0;
  let targetY = 0;

  if (role === 'GK') {
    targetX = ctx.ownGoalX + ctx.dir * 80;
    targetY = Math.max(350, Math.min(650, ctx.ball.y));
  } else if (isChaser) {
    let pushTargetX = ctx.enemyGoalX;
    let pushTargetY = centerY;
    if (ctx.ball.y < 150 || ctx.ball.y > 850) {
      pushTargetX = 1000;
      pushTargetY = centerY;
    }

    const pushDx = pushTargetX - ctx.ball.x;
    const pushDy = pushTargetY - ctx.ball.y;
    const pLen = Math.hypot(pushDx, pushDy) || 1;
    targetX = ctx.ball.x - (pushDx / pLen) * 60;
    targetY = ctx.ball.y - (pushDy / pLen) * 60;
  } else {
    const followBallY = ctx.ball.y;

    if (ctx.teamState === 'ATTACK') {
      if (role === 'DEF_L' || role === 'DEF_R') {
        targetX = 1000 - ctx.dir * 200;
        targetY = role === 'DEF_L' ? centerY - 250 : centerY + 250;
      } else {
        targetX = ctx.ball.x - ctx.dir * 350;
        targetY = role === 'ATT' ? followBallY - 200 : followBallY + 200;
      }
    } else {
      if (role === 'DEF_L' || role === 'DEF_R') {
        targetX = ctx.ownGoalX + ctx.dir * 300;
        targetY =
          role === 'DEF_L'
            ? Math.min(followBallY, centerY - 150)
            : Math.max(followBallY, centerY + 150);
      } else {
        targetX = 1000 - ctx.dir * 150;
        targetY = role === 'ATT' ? centerY - 250 : centerY + 250;
      }
    }
  }
  const margin = 60;
  targetX = Math.max(margin, Math.min(ctx.fieldWidth - margin, targetX));
  targetY = Math.max(margin, Math.min(ctx.fieldHeight - margin, targetY));
  if (isNaN(targetX) || isNaN(targetY)) {
    return { x: 1000, y: centerY };
  }
  return { x: targetX, y: targetY };
}
