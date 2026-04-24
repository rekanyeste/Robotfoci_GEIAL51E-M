import { Vector2D } from './steering';

export class GameContext {
  public rescuePhase: 'NONE' | 'PREPARE' | 'STRIKE' = 'NONE';
  public rescueKickerId: number | null = null;
  constructor(
    public ball: Vector2D,
    public dir: number,
    public ownGoalX: number,
    public enemyGoalX: number,
    public fieldWidth: number,
    public fieldHeight: number,
    public chaserId: number,
    public teammates: any[],
  ) {}
}

export const getRole = (index: number) => ['GK', 'DEF_L', 'DEF_R', 'ATT', 'SUP'][index] || 'SUP';
export function calculateTarget(char: any, index: number, ctx: GameContext): Vector2D {
  const role = getRole(index);
  if (ctx.rescuePhase !== 'NONE') {
    const isKicker = char.id === ctx.rescueKickerId;

    if (isKicker) {
      if (ctx.rescuePhase === 'PREPARE') {
        const toCenterX = ctx.fieldWidth / 2 - ctx.ball.x;
        const toCenterY = ctx.fieldHeight / 2 - ctx.ball.y;
        const len = Math.hypot(toCenterX, toCenterY) || 1;
        return { x: ctx.ball.x + (toCenterX / len) * 150, y: ctx.ball.y + (toCenterY / len) * 150 };
      } else {
        return { x: ctx.ball.x, y: ctx.ball.y };
      }
    } else {
      const dx = char.x - ctx.ball.x;
      const dy = char.y - ctx.ball.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < 350) {
        return { x: ctx.ball.x + (dx / dist) * 400, y: ctx.ball.y + (dy / dist) * 400 };
      }
      return { x: char.x, y: char.y };
    }
  }
  const centerY = ctx.fieldHeight / 2;
  const distToBall = Math.hypot(char.x - ctx.ball.x, char.y - ctx.ball.y);
  const isChaser = char.id === ctx.chaserId;
  if (role === 'GK') {
    const isBallInFront = ctx.ball.y > 300 && ctx.ball.y < ctx.fieldHeight - 300;
    if (distToBall < 200 && isBallInFront) return { x: ctx.ball.x, y: ctx.ball.y };
    return { x: ctx.ownGoalX + ctx.dir * 60, y: Math.max(380, Math.min(620, ctx.ball.y)) };
  }
  if (role.startsWith('DEF')) {
    const isBallHome =
      (ctx.dir === 1 && ctx.ball.x < 1000) || (ctx.dir === -1 && ctx.ball.x > 1000);
    if (isBallHome && distToBall < 350) return getKickTarget(ctx, char);
    return { x: ctx.ownGoalX + ctx.dir * 400, y: centerY + (role === 'DEF_L' ? -200 : 200) };
  }
  if (isChaser) {
    return getKickTarget(ctx, char);
  }
  const attLineX = ctx.enemyGoalX - ctx.dir * 600;
  return { x: attLineX, y: ctx.ball.y + (role === 'ATT' ? -150 : 150) };
}

function getKickTarget(ctx: GameContext, char: any): Vector2D {
  let targetX = ctx.enemyGoalX;
  let targetY = ctx.fieldHeight / 2;
  let dx = targetX - ctx.ball.x;
  let dy = targetY - ctx.ball.y;
  const dist = Math.hypot(dx, dy) || 1;
  dx /= dist;
  dy /= dist;
  let approachX = ctx.ball.x - dx * 80;
  let approachY = ctx.ball.y - dy * 80;
  approachX = Math.max(60, Math.min(ctx.fieldWidth - 60, approachX));
  approachY = Math.max(60, Math.min(ctx.fieldHeight - 60, approachY));
  const distToApproach = Math.hypot(char.x - approachX, char.y - approachY);
  if (distToApproach < 90) {
    return { x: ctx.ball.x, y: ctx.ball.y };
  } else {
    return { x: approachX, y: approachY };
  }
}
