import { Car, Track, GameState, Checkpoint } from '@/types/game';
import { Physics } from './physics';
import { NeuralNetworkUtils } from './neuralNetwork';
import { GeneticAlgorithm } from './geneticAlgorithm';
import { TrackGenerator } from './track';




export class GameEngine {
  private gameState: GameState;
  private track: Track;
  private geneticAlgorithm: GeneticAlgorithm;
  private lastUpdateTime: number;
  private generationTime: number;
  private maxGenerationTime: number;
  private playerCar: Car | null = null;
  private startupDelay: number = 3000; // 3 seconds
  private gameStartTime: number = 0;
  private playerRespawnTime: number = 0;

  constructor(track: Track, populationSize: number = 50, maxGenerationTime: number = 15000) {
    this.track = track;
    this.geneticAlgorithm = new GeneticAlgorithm();
    this.lastUpdateTime = Date.now();
    this.generationTime = 0;
    this.maxGenerationTime = maxGenerationTime; // 20 seconds per generation (faster)

    this.gameState = {
      cars: this.geneticAlgorithm.createInitialPopulation(
        populationSize,
        track.startPosition,
        track.startAngle
      ),
      generation: 1,
      bestFitness: 0,
      isRunning: false,
      timeElapsed: 0,
      generationTime: 0,
      maxTime: this.maxGenerationTime
    };

    // Don't create player car by default - only when race mode starts
  }

  update(): GameState {
    if (!this.gameState.isRunning) {
      return this.gameState;
    }

    const currentTime = Date.now();

    // Check if we're still in startup delay
    const timeSinceStart = currentTime - this.gameStartTime;
    if (timeSinceStart < this.startupDelay) {
      // During startup delay, show countdown but don't move cars
      this.gameState.timeElapsed = Math.ceil((this.startupDelay - timeSinceStart) / 1000);
      return this.gameState;
    }

    const deltaTime = Math.min((currentTime - this.lastUpdateTime) / 1000, 0.016); // Cap at 60fps
    const simulationSpeed = 8.0; // 2x speed simulation
    const adjustedDeltaTime = deltaTime * simulationSpeed;
    this.lastUpdateTime = currentTime;
    this.generationTime += adjustedDeltaTime * 1000;
    this.gameState.generationTime = this.generationTime;
    this.gameState.maxTime = this.maxGenerationTime;


    // Update each car
    for (const car of this.gameState.cars) {
      if (!car.alive) continue;

      // Update sensors
      Physics.updateSensors(car, this.track.walls);

      // Skip neural network processing for player car
      if (car.id !== 'player') {
        // Get neural network inputs
        const sensorDistances = car.sensors.map(sensor => sensor.distance);
        const inputs = NeuralNetworkUtils.getNetworkInputs(
          sensorDistances,
          car.speed,
          car.angle,
          car.braking
        );

        // Get neural network outputs
        const outputs = NeuralNetworkUtils.feedForward(car.brain, inputs);
        const { steering, acceleration, braking } = NeuralNetworkUtils.interpretOutputs(outputs);

        car.angle += steering * car.turnSpeed;

        // Assign braking value to the car
        car.braking = braking;

        // Apply either braking or throttle
        if (braking > 0.1) {
          car.acceleration = 0; // Stop accelerating when braking
        } else {
          // Clamp acceleration to reasonable range and scale appropriately
          const clampedAccel = Math.max(0, Math.min(1, acceleration));
          car.acceleration = clampedAccel; // No additional multiplier - let physics handle it
        }
      }
      // Player car controls are handled in updatePlayerCar method

      // Update physics with adjusted time
      Physics.updateCarPhysics(car, adjustedDeltaTime);

      // Check wall collisions
      if (Physics.checkWallCollision(car, this.track.walls)) {
        car.alive = false;

        // If player car dies, set respawn timer
        if (car.id === 'player' && this.playerRespawnTime === 0) {
          this.playerRespawnTime = currentTime + 1000; // Respawn in 1 second
          console.log('Player car crashed, respawning in 1 second');
        }
        continue;
      }

      // Check checkpoint collisions
      this.checkCheckpointCollisions(car);

      // Calculate fitness
      this.geneticAlgorithm.calculateFitness(car , this.gameState);
    }

    // Update best fitness
    const bestCar = this.geneticAlgorithm.getBestCar(this.gameState.cars);
    this.gameState.bestFitness = Math.max(this.gameState.bestFitness, bestCar.fitness);

    // Check for player car respawn
    if (this.playerRespawnTime > 0 && currentTime >= this.playerRespawnTime) {
      this.resetPlayerCar();
      this.playerRespawnTime = 0; // Reset the timer
    }

    // Check if generation should end
    const aliveCount = this.geneticAlgorithm.getAliveCount(this.gameState.cars);
    const shouldEndGeneration = aliveCount === 0 || this.generationTime >= this.maxGenerationTime;

    if (shouldEndGeneration) {
      this.nextGeneration();
    }

    this.gameState.timeElapsed = this.generationTime;
    return this.gameState;
  }

  private checkCheckpointCollisions(car: Car): void {
    for (const checkpoint of this.track.checkpoints) {
      // Simple line intersection check between car position and checkpoint
      const carRadius = 8;
      const distance = Physics.pointToLineDistance(
        car.position,
        checkpoint.start,
        checkpoint.end
      );

      if (distance < carRadius) {
        // Check if this is the next expected checkpoint
        const expectedCheckpoint = car.checkpointsPassed % this.track.checkpoints.length;
        if (checkpoint.id === expectedCheckpoint) {
          car.checkpointsPassed++;
        }
      }
    }
  }

  private nextGeneration(): void {
    console.log(`Generation ${this.gameState.generation} completed`);
    console.log(`Best fitness: ${this.gameState.bestFitness}`);

    // Filter out player car before evolution
    const aiCars = this.gameState.cars.filter(car => car.id !== 'player');
    console.log(`Average fitness: ${this.geneticAlgorithm.getAverageFitness(aiCars)}`);

    // Evolve population (AI cars only)
    this.gameState.cars = this.geneticAlgorithm.evolvePopulation(
      aiCars,
      this.track.startPosition,
      this.track.startAngle,
      this.gameState
    );

    // Reset generation state
    this.gameState.generation++;
    this.generationTime = 0;
    this.gameState.generationTime = 0;
    this.maxGenerationTime = this.gameState.maxTime;
    this.gameState.timeElapsed = 0;
    this.lastUpdateTime = Date.now(); // Reset the timer for new generation
    this.gameStartTime = Date.now(); // Reset startup delay for new generation
    this.playerRespawnTime = 0; // Reset respawn timer for new generation

    // Remove player car during training - it will be recreated when race mode starts
    this.removePlayerCar();
  }

  start(): void {
    this.gameState.isRunning = true;
    this.gameStartTime = Date.now();
    this.lastUpdateTime = Date.now();
  }

  stop(): void {
    this.gameState.isRunning = false;
  }

  reset(): void {
    // Count current AI cars (exclude player car)
    const aiCarCount = this.gameState.cars.filter(car => car.id !== 'player').length;

    this.gameState.cars = this.geneticAlgorithm.createInitialPopulation(
      aiCarCount,
      this.track.startPosition,
      this.track.startAngle
    );
    this.gameState.generation = 1;
    this.gameState.bestFitness = 0;
    this.gameState.timeElapsed = 0;
    this.generationTime = 0;
    this.gameState.generationTime = 0;
    this.gameState.isRunning = false;
    this.lastUpdateTime = Date.now(); // Reset the timer
    this.gameStartTime = Date.now(); // Reset startup delay
    this.playerRespawnTime = 0; // Reset respawn timer

    // Remove player car during normal mode - it will be recreated when race mode starts
    this.removePlayerCar();
  }

  getGameState(): GameState {
    return this.gameState;
  }

  getTrack(): Track {
    return this.track;
  }

  getBestCar(): Car {
    return this.geneticAlgorithm.getBestCar(this.gameState.cars);
  }

  getAliveCars(): Car[] {
    return this.gameState.cars.filter(car => car.alive);
  }

  getTimeElapsed(): number {
    return this.gameState.timeElapsed;
  }



  setPopulationSize(size: number): void {
    if (size !== this.gameState.cars.length) {
      this.gameState.cars = this.geneticAlgorithm.createInitialPopulation(
        size,
        this.track.startPosition,
        this.track.startAngle
      );
    }
  }

  setMaxGenerationTime(limit: number): void {
    this.maxGenerationTime = limit;
    this.gameState.maxTime = limit;

  }

  public setTrack(newTrack: Track): void {
    this.track = newTrack; // Actually update the track reference

    // Reset all car positions to new track's start position
    this.gameState.cars.forEach(car => {
      car.position = { x: newTrack.startPosition.x, y: newTrack.startPosition.y };
      car.velocity = { x: 0, y: 0 };
      car.angle = newTrack.startAngle;
      car.speed = 0;
      car.acceleration = 0;
      car.braking = 0;
      car.alive = true;
      car.fitness = 0;
      car.distanceTraveled = 0;
      car.checkpointsPassed = 0;
    });

    // Reset player car if it exists
    if (this.playerCar) {
      this.playerCar.position = { x: newTrack.startPosition.x, y: newTrack.startPosition.y };
      this.playerCar.velocity = { x: 0, y: 0 };
      this.playerCar.angle = newTrack.startAngle;
      this.playerCar.speed = 0;
      this.playerCar.acceleration = 0;
      this.playerCar.braking = 0;
      this.playerCar.alive = true;
      this.playerCar.fitness = 0;
      this.playerCar.distanceTraveled = 0;
      this.playerCar.checkpointsPassed = 0;
    }
  }

  private createPlayerCar(): void {
    this.playerCar = {
      id: 'player',
      position: { x: this.track.startPosition.x, y: this.track.startPosition.y },
      velocity: { x: 0, y: 0 },
      angle: this.track.startAngle,
      speed: 0,
      maxSpeed: 150,
      acceleration: 0,
      braking: 0,
      friction: 0.95,
      turnSpeed: 0.08,
      sensors: [
        { angle: -Math.PI/2, length: 200, distance: 200, hit: false, endPoint: { x: 0, y: 0 } },
        { angle: -Math.PI/4, length: 200, distance: 200, hit: false, endPoint: { x: 0, y: 0 } },
        { angle: 0, length: 200, distance: 200, hit: false, endPoint: { x: 0, y: 0 } },
        { angle: Math.PI/4, length: 200, distance: 200, hit: false, endPoint: { x: 0, y: 0 } },
        { angle: Math.PI/2, length: 200, distance: 200, hit: false, endPoint: { x: 0, y: 0 } }
      ],
      fitness: 0,
      alive: true,
      distanceTraveled: 0,
      checkpointsPassed: 0,
      brain: NeuralNetworkUtils.createRandomNetwork(9, 8, 3), // Dummy brain, not used
      color: '#00ff00' // Bright green for player
    };

    // Add player car to the game state and maintain reference
    this.gameState.cars.push(this.playerCar);
    console.log('Player car created and added to game state');
  }

  public updatePlayerCar(keys: { w: boolean; a: boolean; s: boolean; d: boolean }): void {
    // Find player car in the current cars array (in case reference was lost)
    if (!this.playerCar) {
      this.playerCar = this.gameState.cars.find(car => car.id === 'player') || null;
    }

    if (!this.playerCar || !this.playerCar.alive) {
      if (!this.playerCar) console.log('No player car found');
      if (this.playerCar && !this.playerCar.alive) console.log('Player car is dead');
      return;
    }

    // Debug: Log player car state
    if (keys.w || keys.a || keys.s || keys.d) {
      console.log('Player car controls:', keys, 'Position:', this.playerCar.position, 'Speed:', this.playerCar.speed);
    }

    // Handle player input
    if (keys.w) {
      this.playerCar.acceleration = 1.0; // Full throttle
      this.playerCar.braking = 0;
    } else if (keys.s) {
      this.playerCar.acceleration = 0;
      this.playerCar.braking = 1.0; // Full brake
    } else {
      this.playerCar.acceleration = 0;
      this.playerCar.braking = 0;
    }

    // Handle steering
    let steering = 0;
    if (keys.a) steering -= 1; // Turn left
    if (keys.d) steering += 1; // Turn right

    this.playerCar.angle += steering * this.playerCar.turnSpeed;
  }

  public getPlayerCar(): Car | null {
    return this.playerCar;
  }

  private resetPlayerCar(): void {
    if (!this.playerCar) return;

    // Reset player car to starting position
    this.playerCar.position = { x: this.track.startPosition.x, y: this.track.startPosition.y };
    this.playerCar.velocity = { x: 0, y: 0 };
    this.playerCar.angle = this.track.startAngle;
    this.playerCar.speed = 0;
    this.playerCar.acceleration = 0;
    this.playerCar.braking = 0;
    this.playerCar.alive = true;
    this.playerCar.fitness = 0;
    this.playerCar.distanceTraveled = 0;
    this.playerCar.checkpointsPassed = 0;

    console.log('Player car respawned at starting position');
  }

  public removePlayerCar(): void {
    if (this.playerCar) {
      // Remove player car from game state
      this.gameState.cars = this.gameState.cars.filter(car => car.id !== 'player');
      this.playerCar = null;
      console.log('Player car removed from game');
    }
  }

  public startRace(): void {
    // Create player car only when race starts
    if (!this.playerCar) {
      this.createPlayerCar();
    }

    // Reset all car positions but keep their neural networks
    this.gameState.cars.forEach(car => {
      if (car.id !== 'player') {
        // Reset AI car position and state but keep brain
        car.position = { x: this.track.startPosition.x, y: this.track.startPosition.y };
        car.velocity = { x: 0, y: 0 };
        car.angle = this.track.startAngle;
        car.speed = 0;
        car.acceleration = 0;
        car.braking = 0;
        car.alive = true;
        car.fitness = 0;
        car.distanceTraveled = 0;
        car.checkpointsPassed = 0;
        // Keep car.brain unchanged
      }
    });

    // Reset player car position
    if (this.playerCar) {
      this.playerCar.position = { x: this.track.startPosition.x, y: this.track.startPosition.y };
      this.playerCar.velocity = { x: 0, y: 0 };
      this.playerCar.angle = this.track.startAngle;
      this.playerCar.speed = 0;
      this.playerCar.acceleration = 0;
      this.playerCar.braking = 0;
      this.playerCar.alive = true;
      this.playerCar.fitness = 0;
      this.playerCar.distanceTraveled = 0;
      this.playerCar.checkpointsPassed = 0;
    }

    // Reset timing for race start
    this.gameStartTime = Date.now();
    this.lastUpdateTime = Date.now();
    this.generationTime = 0;
    this.gameState.generationTime = 0;
    this.gameState.timeElapsed = 0;
    this.gameState.isRunning = true;
    this.playerRespawnTime = 0; // Reset respawn timer
  }

}
