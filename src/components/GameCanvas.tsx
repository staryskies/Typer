"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { GameEngine } from "@/utils/gameEngine";
import { TrackGenerator } from "@/utils/track";
import { Car, Track } from "@/types/game";

interface GameCanvasProps {
  track: Track;
  isTraining: boolean;
  generation: number;
  setGeneration: (gen: number) => void;
  setBestFitness: (fitness: number) => void;
  maxGenerationTime: number;
  setMaxGenerationTime: (maxGenerationTime: number) => void;
  populationSize: number;
  setTrack: (track: Track) => void;
  onCarSelect?: (car: Car) => void;
  onStatsUpdate?: (stats: {
    aliveCount: number;
    averageFitness: number;
    timeElapsed: number;
    bestCar: Car | null;
  }) => void;
}

const GameCanvas = React.forwardRef<any, GameCanvasProps>(
  (
    {
      isTraining,
      generation,
      setGeneration,
      setBestFitness,
      populationSize,
      onCarSelect,
      onStatsUpdate,
      maxGenerationTime,
      setMaxGenerationTime,
      track,
      setTrack,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameEngineRef = useRef<GameEngine | null>(null);
    const animationFrameRef = useRef<number>();
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);
    const [keys, setKeys] = useState({
      w: false,
      a: false,
      s: false,
      d: false,
    });
    const [raceMode, setRaceMode] = useState(false);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      resetSimulation: () => {
        if (gameEngineRef.current) {
          gameEngineRef.current.reset();
          setSelectedCar(null);
          setRaceMode(false);
        }
      },
      loadBestNetwork: (networkData: any) => {
        if (gameEngineRef.current) {
          const gameState = gameEngineRef.current.getGameState();
          // Replace ALL cars' brains with the loaded network
          gameState.cars.forEach((car) => {
            car.brain = JSON.parse(JSON.stringify(networkData)); // Deep copy to avoid reference issues
          });
          console.log(`Network loaded into all ${gameState.cars.length} cars`);
        }
      },
      updatePlayerCar: (controls: {
        w: boolean;
        a: boolean;
        s: boolean;
        d: boolean;
      }) => {
        if (gameEngineRef.current) {
          gameEngineRef.current.updatePlayerCar(controls);
        }
      },
      startRace: () => {
        setRaceMode(true);
        if (gameEngineRef.current) {
          gameEngineRef.current.startRace();
        }
      },
    }));
    // Initialize game engine

    // Handle training state changes
    useEffect(() => {
      if (!gameEngineRef.current) return;

      if (isTraining) {
        setRaceMode(false); // Exit race mode when training starts
        // Remove player car during training for performance
        if (gameEngineRef.current.removePlayerCar) {
          gameEngineRef.current.removePlayerCar();
        }
        gameEngineRef.current.start();
      } else {
        gameEngineRef.current.stop();
      }
    }, [isTraining]);

    useEffect(() => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const initialTrack = TrackGenerator.createSimpleOvalTrack(
        canvas.width,
        canvas.height
      );

      setTrack(initialTrack); // update parent state
      gameEngineRef.current = new GameEngine(
        initialTrack,
        populationSize,
        maxGenerationTime
      ); // use same track
      console.log(maxGenerationTime);
    }, [populationSize]);

    // Update max generation time when it changes
    useEffect(() => {
      if (gameEngineRef.current) {
        gameEngineRef.current.setMaxGenerationTime(maxGenerationTime);
      }
    }, [maxGenerationTime]);

    // Keyboard event listeners for player car
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        if (["w", "a", "s", "d"].includes(key)) {
          e.preventDefault();
          setKeys((prev) => ({ ...prev, [key]: true }));
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        if (["w", "a", "s", "d"].includes(key)) {
          e.preventDefault();
          setKeys((prev) => ({ ...prev, [key]: false }));
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
      };
    }, []);

    // Game loop with performance optimization
    const gameLoop = useCallback(() => {
      if (!gameEngineRef.current || !canvasRef.current) return;

      // Update player car with keyboard input
      if (gameEngineRef.current.updatePlayerCar) {
        gameEngineRef.current.updatePlayerCar(keys);

        // Debug: Log when keys are pressed
        if (keys.w || keys.a || keys.s || keys.d) {
          console.log("Keys pressed:", keys);
        }
      }

      const gameState = gameEngineRef.current.update();

      // Update parent component state (throttled)
      setGeneration(gameState.generation);
      setBestFitness(gameState.bestFitness);

      // Update additional stats
      if (onStatsUpdate) {
        const aliveCount = gameState.cars.filter((car) => car.alive).length;
        const averageFitness =
          gameState.cars.reduce((sum, car) => sum + car.fitness, 0) /
          gameState.cars.length;
        const bestCar = gameEngineRef.current.getBestCar();
        onStatsUpdate({
          aliveCount,
          averageFitness,
          timeElapsed: gameState.timeElapsed,
          bestCar,
        });
      }

      // Render the game
      render();

      // Show countdown only in race mode
      if (
        raceMode &&
        !isTraining &&
        gameState.timeElapsed > 0 &&
        gameState.timeElapsed <= 3
      ) {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx && canvas) {
          // Draw countdown overlay
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw countdown number
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 72px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            gameState.timeElapsed.toString(),
            canvas.width / 2,
            canvas.height / 2
          );

          // Draw "GET READY" text
          ctx.font = "bold 24px Arial";
          ctx.fillText("GET READY", canvas.width / 2, canvas.height / 2 - 100);
        }
      }

      // Show crash message if player car is dead
      const playerCar = gameState.cars.find((car) => car.id === "player");
      if (raceMode && !isTraining && playerCar && !playerCar.alive) {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx && canvas) {
          // Draw crash overlay
          ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw "CRASHED" text
          ctx.fillStyle = "#ff0000";
          ctx.font = "bold 48px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("CRASHED!", canvas.width / 2, canvas.height / 2);

          // Draw respawn message
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 20px Arial";
          ctx.fillText(
            "Respawning in 1 second...",
            canvas.width / 2,
            canvas.height / 2 + 60
          );
        }
      }

      // Always continue the animation loop for player controls and rendering
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }, [isTraining, setGeneration, setBestFitness, keys]);

    // Always run game loop for player controls and rendering
    useEffect(() => {
      gameLoop();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [gameLoop]);

    const render = () => {
      if (!canvasRef.current || !gameEngineRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear canvas with simple black background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const track = gameEngineRef.current.getTrack();
      const gameState = gameEngineRef.current.getGameState();

      // Draw track walls - simple and clean
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      for (const wall of track.walls) {
        ctx.beginPath();
        ctx.moveTo(wall.start.x, wall.start.y);
        ctx.lineTo(wall.end.x, wall.end.y);
        ctx.stroke();
      }

      // Draw start/finish line (first checkpoint)
      if (track.checkpoints.length > 0) {
        const startFinish = track.checkpoints[0];
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(startFinish.start.x, startFinish.start.y);
        ctx.lineTo(startFinish.end.x, startFinish.end.y);
        ctx.stroke();

        // Add "START/FINISH" text
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        const midX = (startFinish.start.x + startFinish.end.x) / 2;
        const midY = (startFinish.start.y + startFinish.end.y) / 2;
        ctx.fillText("START/FINISH", midX, midY - 15);
      }

      // Draw other checkpoints - simple gray lines
      ctx.strokeStyle = "#666666";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      for (let i = 1; i < track.checkpoints.length; i++) {
        const checkpoint = track.checkpoints[i];
        ctx.beginPath();
        ctx.moveTo(checkpoint.start.x, checkpoint.start.y);
        ctx.lineTo(checkpoint.end.x, checkpoint.end.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw cars
      for (const car of gameState.cars) {
        if (!car.alive) continue;

        // Draw sensors for selected car - simple lines
        if (car === selectedCar) {
          ctx.strokeStyle = "#ffff00";
          ctx.lineWidth = 1;
          for (const sensor of car.sensors) {
            ctx.beginPath();
            ctx.moveTo(car.position.x, car.position.y);
            ctx.lineTo(sensor.endPoint.x, sensor.endPoint.y);
            ctx.stroke();

            // Draw sensor hit point
            if (sensor.hit) {
              ctx.fillStyle = "#ff0000";
              ctx.beginPath();
              ctx.arc(sensor.endPoint.x, sensor.endPoint.y, 3, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
        }

        // Draw simple rectangular car
        ctx.save();
        ctx.translate(car.position.x, car.position.y);
        ctx.rotate(car.angle);

        // Highlight player car differently
        const isPlayerCar = car.id === "player";
        let carColor = car.color;

        if (isPlayerCar) {
          // Player car: bright green with glow effect
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#00ff00";
          carColor = "#00ff00";
        } else if (car === selectedCar) {
          // Selected AI car: yellow
          carColor = "#ffff00";
        }

        // Simple car body - rectangle
        ctx.fillStyle = carColor;
        ctx.fillRect(-8, -4, 16, 8);

        // Reset shadow
        ctx.shadowBlur = 0;

        // Simple direction indicator
        ctx.fillStyle = isPlayerCar ? "#000000" : "#ffffff";
        ctx.fillRect(6, -2, 4, 4);

        ctx.restore();

        // Draw fitness text for best car
        if (car === gameEngineRef.current.getBestCar()) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "12px Arial";
          ctx.fillText(
            `Best: ${Math.round(car.fitness)}`,
            car.position.x + 15,
            car.position.y - 10
          );
        }
      }

      // Draw UI overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(10, 10, 200, 80);

      ctx.fillStyle = "#ffffff";
      ctx.font = "14px Arial";
      ctx.fillText(`Generation: ${gameState.generation}`, 70, 30);
      ctx.fillText(
        `Best Fitness: ${Math.round(gameState.bestFitness)}`,
        70,
        50
      );
      ctx.fillText(
        `Cars Alive: ${gameState.cars.filter((c) => c.alive).length}`,
        70,
        70
      );
      ctx.fillText(
        `Time: ${Math.round(gameState.timeElapsed / 1000)}s`,
        70,
        90
      );
    };

    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || !gameEngineRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Find closest car to click
      const gameState = gameEngineRef.current.getGameState();
      let closestCar: Car | null = null;
      let closestDistance = Infinity;

      for (const car of gameState.cars) {
        if (!car.alive) continue;

        const distance = Math.sqrt(
          (car.position.x - x) ** 2 + (car.position.y - y) ** 2
        );

        if (distance < 20 && distance < closestDistance) {
          closestCar = car;
          closestDistance = distance;
        }
      }

      setSelectedCar(closestCar);
      if (closestCar && onCarSelect) {
        onCarSelect(closestCar);
      }
    };

    const resetSimulation = () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.reset();
        setSelectedCar(null);
      }
    };

    const changeTrack = (TrackChoice: string) => {
      if (!canvasRef.current) return;

      let newTrack: Track;
      const canvas = canvasRef.current;

      if (TrackChoice === "FigureEight") {
        newTrack = TrackGenerator.createFigureEightTrack(
          canvas.width,
          canvas.height
        );
      } else {
        newTrack = TrackGenerator.createSimpleOvalTrack(
          canvas.width,
          canvas.height
        );
      }

      // Update parent state
      setTrack(newTrack);

      // Recreate the GameEngine so it's fully clean
      if (gameEngineRef.current) {
        gameEngineRef.current.setTrack(newTrack);
        setTrack(newTrack); // Update parent state to re-render with new track
      }
      console.log(maxGenerationTime);

      // Clear selected car since all old cars are gone
      setSelectedCar(null);

      // Render immediately to reflect the new track
      render();
    };

    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Racing Simulation</h3>
          <div className="flex items-center gap-4">
            {!isTraining && !raceMode && (
              <button
                onClick={() => {
                  setRaceMode(true);
                  if (gameEngineRef.current) {
                    gameEngineRef.current.startRace();
                  }
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition-colors"
              >
                Start Race
              </button>
            )}
            <div className="text-sm text-gray-300">
              <div className="text-green-400 font-semibold">
                Player Controls:
              </div>
              <div>W/S: Accelerate/Brake | A/D: Steer</div>
            </div>
          </div>
          <button
            onClick={resetSimulation}
            disabled={isTraining}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => changeTrack("FigureEight")}
            disabled={isTraining}
            className="px-2 py-2 bg-dark-blue-200 hover:bg-dark-blue-300 disabled:opacity-50 disabled:allowed text-white rounded transition-colors"
          >
            Change Track Figure Eight
          </button>
          <button
            onClick={() => changeTrack("SimpleOval")}
            disabled={isTraining}
            className="px-2 py-2 bg-dark-blue-200 hover:bg-dark-blue-300 disabled:opacity-50 disabled:allowed text-white rounded transition-colors"
          >
            Change Track Oval
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={600}
          height={600}
          onClick={handleCanvasClick}
          className="w-full border border-gray-600 rounded cursor-pointer"
          style={{ maxWidth: "100%", height: "auto" }}
        />

        <div className="mt-2 text-sm text-gray-300">
          Click on a car to view its neural network and sensors
          {selectedCar && (
            <span className="text-yellow-400 ml-2">
              • Selected: {selectedCar.id} (Fitness:{" "}
              {Math.round(selectedCar.fitness)})
            </span>
          )}
        </div>
      </div>
    );
  }
);

GameCanvas.displayName = "GameCanvas";

export default GameCanvas;
