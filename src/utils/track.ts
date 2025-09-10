import { Track, Wall, Checkpoint, Vector2D } from '@/types/game';

export class TrackGenerator {
  static createSimpleOvalTrack(width: number, height: number): Track {
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) * 0.4;
    const innerRadius = Math.min(width, height) * 0.25;

    const walls: Wall[] = [];
    const checkpoints: Checkpoint[] = [];
    const segments = 64;

    // Create outer walls (perfect circle)
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;

      walls.push({
        start: {
          x: centerX + Math.cos(angle1) * outerRadius,
          y: centerY + Math.sin(angle1) * outerRadius
        },
        end: {
          x: centerX + Math.cos(angle2) * outerRadius,
          y: centerY + Math.sin(angle2) * outerRadius
        }
      });
    }

    // Create inner walls (perfect circle)
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;

      walls.push({
        start: {
          x: centerX + Math.cos(angle1) * innerRadius,
          y: centerY + Math.sin(angle1) * innerRadius
        },
        end: {
          x: centerX + Math.cos(angle2) * innerRadius,
          y: centerY + Math.sin(angle2) * innerRadius
        }
      });
    }

    // Create checkpoints
    const checkpointCount = 24;
    for (let i = 0; i < checkpointCount; i++) {
      const angle = (i / checkpointCount) * Math.PI * 2;
      const innerPoint = {
        x: centerX + Math.cos(angle) * innerRadius,
        y: centerY + Math.sin(angle) * innerRadius
      };
      const outerPoint = {
        x: centerX + Math.cos(angle) * outerRadius,
        y: centerY + Math.sin(angle) * outerRadius
      };

      checkpoints.push({
        start: innerPoint,
        end: outerPoint,
        id: i
      });
    }

    return {
      walls,
      generationTime: 0,
      checkpoints,
      startPosition: {
        x: centerX + (innerRadius + outerRadius) / 2,
        y: centerY
      },
      startAngle: 90
    };
  }

  static createSpiralTrack(width: number, height: number): Track {
    const walls: Wall[] = [];
    const checkpoints: Checkpoint[] = [];

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.35;
    const trackWidth = 50;
    const spiralTurns = 3;

    // Create spiral path points
    const pathPoints: Vector2D[] = [];
    const segments = 120;

    for (let i = 0; i < segments; i++) {
      const t = (i / segments) * spiralTurns * Math.PI * 2;
      const radius = maxRadius * (0.3 + 0.7 * (i / segments));

      const x = centerX + radius * Math.cos(t);
      const y = centerY + radius * Math.sin(t);

      pathPoints.push({ x, y });
    }

    // Create walls along the spiral path
    for (let i = 0; i < pathPoints.length; i++) {
      const current = pathPoints[i];
      const next = pathPoints[(i + 1) % pathPoints.length];

      // Calculate perpendicular direction
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length > 0) {
        const perpX = (-dy / length) * trackWidth / 2;
        const perpY = (dx / length) * trackWidth / 2;

        // Outer wall
        walls.push({
          start: { x: current.x + perpX, y: current.y + perpY },
          end: { x: next.x + perpX, y: next.y + perpY }
        });

        // Inner wall
        walls.push({
          start: { x: current.x - perpX, y: current.y - perpY },
          end: { x: next.x - perpX, y: next.y - perpY }
        });
      }
    }

    // Create checkpoints
    const checkpointCount = 15;
    for (let i = 0; i < checkpointCount; i++) {
      const pointIndex = Math.floor((i / checkpointCount) * pathPoints.length);
      const point = pathPoints[pointIndex];
      const nextPoint = pathPoints[(pointIndex + 1) % pathPoints.length];

      const dx = nextPoint.x - point.x;
      const dy = nextPoint.y - point.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length > 0) {
        const perpX = (-dy / length) * trackWidth / 2;
        const perpY = (dx / length) * trackWidth / 2;

        checkpoints.push({
          start: { x: point.x - perpX, y: point.y - perpY },
          end: { x: point.x + perpX, y: point.y + perpY },
          id: i
        });
      }
    }

    return {
      walls,
      generationTime: 0,
      checkpoints,
      startPosition: pathPoints[0],
      startAngle: Math.atan2(
        pathPoints[1].y - pathPoints[0].y,
        pathPoints[1].x - pathPoints[0].x
      )
    };
  }

  static createFigureEightTrack(width: number, height: number): Track {
    const walls: Wall[] = [];
    const checkpoints: Checkpoint[] = [];

    // ✅ Center of the canvas
    const centerX = width / 2;
    const centerY = height / 2;

    // ✅ Loop radius scales to fit the canvas
    const loopRadius = Math.min(width, height) * 0.28; // 20% of smaller dimension
    const trackWidth = Math.min(width, height) * 0.12; // 6% of smaller dimension

    // Generate path points for the figure-eight
    const pathPoints: Vector2D[] = [];
    const segments = 160;

    for (let i = 0; i < segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const scale = loopRadius * 1.5;

      // Figure-8 parametric equations
      const x = centerX + scale * Math.sin(t);
      const y = centerY + scale * Math.sin(t) * Math.cos(t);

      pathPoints.push({ x, y });
    }

    // Build walls
    for (let i = 0; i < pathPoints.length; i++) {
      const current = pathPoints[i];
      const next = pathPoints[(i + 1) % pathPoints.length];

      const dx = next.x - current.x;
      const dy = next.y - current.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length > 0) {
        const perpX = (-dy / length) * trackWidth / 2;
        const perpY = (dx / length) * trackWidth / 2;

        // Distance from center for crossover area
        const distanceFromCenter = Math.sqrt(
          (current.x - centerX) ** 2 + (current.y - centerY) ** 2
        );

        // Leave a gap only in the intersection center
        if (distanceFromCenter < loopRadius * 0.2) {
          continue;
        }

        // Outer wall
        walls.push({
          start: { x: current.x + perpX, y: current.y + perpY },
          end: { x: next.x + perpX, y: next.y + perpY }
        });

        // Inner wall
        walls.push({
          start: { x: current.x - perpX, y: current.y - perpY },
          end: { x: next.x - perpX, y: next.y - perpY }
        });
      }
    }

    // Create checkpoints evenly spaced
    const checkpointCount = 24;
    for (let i = 0; i < checkpointCount; i++) {
      const pointIndex = Math.floor((i / checkpointCount) * pathPoints.length);
      const point = pathPoints[pointIndex];
      const nextPoint = pathPoints[(pointIndex + 1) % pathPoints.length];

      const dx = nextPoint.x - point.x;
      const dy = nextPoint.y - point.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length > 0) {
        const perpX = (-dy / length) * trackWidth / 2;
        const perpY = (dx / length) * trackWidth / 2;

        // Don't place checkpoints inside the crossing area
        const distanceFromCenter = Math.sqrt(
          (point.x - centerX) ** 2 + (point.y - centerY) ** 2
        );

        if (distanceFromCenter > loopRadius * 0.3) {
          checkpoints.push({
            start: { x: point.x - perpX, y: point.y - perpY },
            end: { x: point.x + perpX, y: point.y + perpY },
            id: i
          });
        }
      }
    }

    // ✅ Start position aligned to canvas
    return {
      walls,
      generationTime: 0,
      checkpoints,
      startPosition: {
        x: centerX - loopRadius * 1.5, // far left of the left loop
        y: centerY
      },
      startAngle: -90 // facing right
    };
  }

  static createComplexTrack(width: number, height: number): Track {
    const walls: Wall[] = [];
    const checkpoints: Checkpoint[] = [];

    // Create a more complex track with turns and straights
    const trackPoints = [
      { x: width * 0.1, y: height * 0.5 },
      { x: width * 0.3, y: height * 0.2 },
      { x: width * 0.7, y: height * 0.15 },
      { x: width * 0.9, y: height * 0.4 },
      { x: width * 0.85, y: height * 0.8 },
      { x: width * 0.5, y: height * 0.9 },
      { x: width * 0.15, y: height * 0.75 }
    ];

    const trackWidth = 60;

    // Generate walls along the track
    for (let i = 0; i < trackPoints.length; i++) {
      const current = trackPoints[i];
      const next = trackPoints[(i + 1) % trackPoints.length];
      
      // Calculate perpendicular direction for track width
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const perpX = -dy / length * trackWidth / 2;
      const perpY = dx / length * trackWidth / 2;

      // Outer wall
      walls.push({
        start: { x: current.x + perpX, y: current.y + perpY },
        end: { x: next.x + perpX, y: next.y + perpY }
      });

      // Inner wall
      walls.push({
        start: { x: current.x - perpX, y: current.y - perpY },
        end: { x: next.x - perpX, y: next.y - perpY }
      });

      // Checkpoint
      checkpoints.push({
        start: { x: current.x - perpX, y: current.y - perpY },
        end: { x: current.x + perpX, y: current.y + perpY },
        id: i
      });
    }

    return {
      walls,
      checkpoints,
      generationTime: 0,
      startPosition: trackPoints[0],
      startAngle: Math.atan2(
        trackPoints[1].y - trackPoints[0].y,
        trackPoints[1].x - trackPoints[0].x
      )
    };
  }
}
