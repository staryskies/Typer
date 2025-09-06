import { Vector2D, Car, Wall, Sensor } from '@/types/game';

export class Physics {
  static distance(p1: Vector2D, p2: Vector2D): number {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  }

  static normalize(vector: Vector2D): Vector2D {
    const length = Math.sqrt(vector.x ** 2 + vector.y ** 2);
    if (length === 0) return { x: 0, y: 0 };
    return { x: vector.x / length, y: vector.y / length };
  }

  static rotate(point: Vector2D, angle: number): Vector2D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: point.x * cos - point.y * sin,
      y: point.x * sin + point.y * cos
    };
  }

  static lineIntersection(
    line1Start: Vector2D,
    line1End: Vector2D,
    line2Start: Vector2D,
    line2End: Vector2D
  ): Vector2D | null {
    const x1 = line1Start.x, y1 = line1Start.y;
    const x2 = line1End.x, y2 = line1End.y;
    const x3 = line2Start.x, y3 = line2Start.y;
    const x4 = line2End.x, y4 = line2End.y;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) return null;

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1)
      };
    }

    return null;
  }

  static updateCarPhysics(car: Car, deltaTime: number) {
    const friction = 0.90;      // Base natural slowdown
    const brakeFactor = 6.0;    // Adjust for stopping power
    const accelFactor = 2.0;    // Acceleration strength

    // Apply throttle to speed
    car.speed += car.acceleration * accelFactor * deltaTime;

    // Apply braking (directly reduces speed)
    car.speed -= brakeFactor * car.braking;

    // Full stop if speed is very low
    if (car.speed < 0.05) {
      car.speed = 0;
    }
    // Apply natural friction
    car.speed *= friction;

    // Clamp speed to prevent reversing unless you want reverse
    car.speed = Math.max(car.speed, 0);

    // Update position
    car.position.x += Math.cos(car.angle) * car.speed * deltaTime;
    car.position.y += Math.sin(car.angle) * car.speed * deltaTime;
  }



  static checkWallCollision(car: Car, walls: Wall[]): boolean {
    const carRadius = 8; // Car collision radius
    
    for (const wall of walls) {
      const distance = this.pointToLineDistance(car.position, wall.start, wall.end);
      if (distance < carRadius) {
        return true;
      }
    }
    return false;
  }

  static pointToLineDistance(point: Vector2D, lineStart: Vector2D, lineEnd: Vector2D): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);

    let param = dot / lenSq;
    param = Math.max(0, Math.min(1, param));

    const xx = lineStart.x + param * C;
    const yy = lineStart.y + param * D;

    const dx = point.x - xx;
    const dy = point.y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  }

  static updateSensors(car: Car, walls: Wall[]): void {
    for (const sensor of car.sensors) {
      const sensorEnd = {
        x: car.position.x + Math.cos(car.angle + sensor.angle) * sensor.length,
        y: car.position.y + Math.sin(car.angle + sensor.angle) * sensor.length
      };

      sensor.endPoint = sensorEnd;
      sensor.distance = sensor.length;
      sensor.hit = false;

      // Check intersection with walls
      for (const wall of walls) {
        const intersection = this.lineIntersection(
          car.position,
          sensorEnd,
          wall.start,
          wall.end
        );

        if (intersection) {
          const distance = this.distance(car.position, intersection);
          if (distance < sensor.distance) {
            sensor.distance = distance;
            sensor.endPoint = intersection;
            sensor.hit = true;
          }
        }
      }
    }
  }
}
