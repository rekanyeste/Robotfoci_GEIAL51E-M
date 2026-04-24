export interface Vector2D {
  x: number;
  y: number;
}

export class SoccerAIEngine {
  private velocities = new Map<number, Vector2D>();
  private positionHistory = new Map<number, Vector2D[]>();

  updateCharacter(
    character: any,
    target: Vector2D,
    teammates: any[],
    maxSpeed: number,
    ball: Vector2D,
    enemyGoalX: number,
    isActive: boolean,
  ): Vector2D {
    const distToTarget = Math.hypot(target.x - character.x, target.y - character.y);
    if (distToTarget < 20) {
      this.velocities.set(character.id, { x: 0, y: 0 });
      return { x: 0, y: 0 };
    }

    const force = this.computeSteering(
      character,
      target,
      teammates,
      maxSpeed,
      ball,
      enemyGoalX,
      isActive,
    );

    let vel = this.velocities.get(character.id) || { x: 0, y: 0 };
    vel.x += force.x;
    vel.y += force.y;
    vel.x *= isActive ? 0.9 : 0.75;
    vel.y *= isActive ? 0.9 : 0.75;
    const speed = Math.hypot(vel.x, vel.y);
    if (speed > maxSpeed) {
      vel.x = (vel.x / speed) * maxSpeed;
      vel.y = (vel.y / speed) * maxSpeed;
    }
    this.velocities.set(character.id, vel);
    return {
      x: vel.x,
      y: vel.y,
    };
  }

  private computeSteering(
    character: any,
    target: Vector2D,
    teammates: any[],
    maxSpeed: number,
    ball: Vector2D,
    enemyGoalX: number,
    isActive: boolean,
  ): Vector2D {
    let history = this.positionHistory.get(character.id) || [];
    history.push({ x: character.x, y: character.y });
    if (history.length > 10) history.shift();
    this.positionHistory.set(character.id, history);

    if (history.length === 10) {
      const first = history[0];
      const last = history[9];
      if (Math.hypot(last.x - first.x, last.y - first.y) < 3) {
        this.positionHistory.set(character.id, []);
        return { x: (Math.random() - 0.5) * 20, y: (Math.random() - 0.5) * 20 };
      }
    }

    let force = { x: 0, y: 0 };
    const dx = target.x - character.x;
    const dy = target.y - character.y;
    const dist = Math.hypot(dx, dy) || 1;
    const slowRadius = 80;
    let desiredSpeed = maxSpeed;
    if (dist < slowRadius) {
      desiredSpeed = maxSpeed * (dist / slowRadius);
    }
    force.x += (dx / dist) * desiredSpeed * 0.4;
    force.y += (dy / dist) * desiredSpeed * 0.4;
    for (const other of teammates) {
      if (other.id === character.id) continue;
      const ox = character.x - other.x;
      const oy = character.y - other.y;
      const d = Math.hypot(ox, oy);

      if (d > 0 && d < 80) {
        force.x += (ox / d) * 1.5;
        force.y += (oy / d) * 1.5;
      }
    }
    const ballDist = Math.hypot(character.x - ball.x, character.y - ball.y);
    if (isActive && ballDist < 100) {
      const pushX = enemyGoalX - ball.x;
      const pushY = 500 - ball.y;
      const len = Math.hypot(pushX, pushY) || 1;
      force.x += (pushX / len) * 2.5;
      force.y += (pushY / len) * 2.5;
    }
    return force;
  }
}
