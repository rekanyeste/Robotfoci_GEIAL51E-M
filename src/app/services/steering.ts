export interface Vector2D {
  x: number;
  y: number;
}

export class SoccerAIEngine {
  updateCharacter(
    character: any,
    target: Vector2D,
    teammates: any[],
    ball: Vector2D,
    enemyGoalX: number,
    isActive: boolean,
  ): Vector2D {
    const MAX_SPEED = 50;
    const MAX_ACCEL = 10;
    const dx = target.x - character.x;
    const dy = target.y - character.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (!isActive && dist < 30) {
      return { x: -character.x_velocity, y: -character.y_velocity };
    }
    const rampDist = 200;
    let speed = MAX_SPEED;
    if (!isActive && dist < rampDist) {
      speed = MAX_SPEED * (dist / rampDist);
    }
    let desiredVx = (dx / dist) * speed;
    let desiredVy = (dy / dist) * speed;
    for (const other of teammates) {
      if (other.id === character.id) continue;
      const ox = character.x - other.x;
      const oy = character.y - other.y;
      const d = Math.hypot(ox, oy);
      if (d > 0 && d < 120) {
        const push = (120 - d) / 120;
        desiredVx += (ox / d) * MAX_SPEED * push;
        desiredVy += (oy / d) * MAX_SPEED * push;
      }
    }
    let steerX = desiredVx - character.x_velocity;
    let steerY = desiredVy - character.y_velocity;
    const steerLen = Math.hypot(steerX, steerY) || 1;
    if (steerLen > MAX_ACCEL) {
      steerX = (steerX / steerLen) * MAX_ACCEL;
      steerY = (steerY / steerLen) * MAX_ACCEL;
    }
    return { x: steerX, y: steerY };
  }
}
