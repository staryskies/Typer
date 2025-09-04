import { Car, Track, GameState, Checkpoint } from '@/types/game';
import { Physics } from './physics';
import { NeuralNetworkUtils } from './neuralNetwork';
import { GeneticAlgorithm } from './geneticAlgorithm';

export class GameEngine {
  private gameState: GameState;
  private track: Track;
  private geneticAlgorithm: GeneticAlgorithm;
  private lastUpdateTime: number;
  private generationTime: number;
  private maxGenerationTime: number;

  constructor(track: Track, populationSize: number = 50) {
    this.track = track;
    this.geneticAlgorithm = new GeneticAlgorithm();
    this.lastUpdateTime = Date.now();
    this.generationTime = 0;
    this.maxGenerationTime = 40000; // 20 seconds per generation (faster)

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
  }

  update(): GameState {
    if (!this.gameState.isRunning) {
      return this.gameState;
    }

    const currentTime = Date.now();
    const deltaTime = Math.min((currentTime - this.lastUpdateTime) / 1000, 0.016); // Cap at 60fps
    const simulationSpeed = 12.0; // 2x speed simulation
    const adjustedDeltaTime = deltaTime * simulationSpeed;
    this.lastUpdateTime = currentTime;
    this.generationTime += adjustedDeltaTime * 1000;
    this.gameState.generationTime = this.generationTime;


    // Update each car
    for (const car of this.gameState.cars) {
      if (!car.alive) continue;

      // Update sensors
      Physics.updateSensors(car, this.track.walls);

      // Get neural network inputs
      const sensorDistances = car.sensors.map(sensor => sensor.distance);
      const inputs = NeuralNetworkUtils.getNetworkInputs(
        sensorDistances,
        car.speed,
        car.angle
      );

      // Get neural network outputs
      const outputs = NeuralNetworkUtils.feedForward(car.brain, inputs);
      const { steering, acceleration } = NeuralNetworkUtils.interpretOutputs(outputs);

      // Apply neural network decisions
      car.angle += steering * car.turnSpeed;
      car.acceleration = acceleration * 10; // Increased acceleration for faster simulation

      // Update physics with adjusted time
      Physics.updateCarPhysics(car, adjustedDeltaTime);

      // Check wall collisions
      if (Physics.checkWallCollision(car, this.track.walls)) {
        car.alive = false;
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
    console.log(`Average fitness: ${this.geneticAlgorithm.getAverageFitness(this.gameState.cars)}`);

    // Evolve population
    this.gameState.cars = this.geneticAlgorithm.evolvePopulation(
      this.gameState.cars,
      this.track.startPosition,
      this.track.startAngle,
      this.gameState
    );

    // Reset generation state
    this.gameState.generation++;
    this.generationTime = 0;
    
    this.gameState.timeElapsed = 0;
  }

  start(): void {
    this.gameState.isRunning = true;
    this.lastUpdateTime = Date.now();
  }

  stop(): void {
    this.gameState.isRunning = false;
  }

  reset(): void {
    this.gameState.cars = this.geneticAlgorithm.createInitialPopulation(
      this.gameState.cars.length,
      this.track.startPosition,
      this.track.startAngle
    );
    this.gameState.generation = 1;
    this.gameState.bestFitness = 0;
    this.gameState.timeElapsed = 0;
    this.generationTime = 0;
    this.gameState.isRunning = false;
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

  public setTrack(newTrack: Track): void {
    this.track = newTrack;

    // Recreate the cars on the new track
    this.gameState.cars = this.geneticAlgorithm.createInitialPopulation(
      this.gameState.cars.length,
      newTrack.startPosition,
      newTrack.startAngle
    );

    // Reset state for new track
    this.gameState.generation = 1;
    this.gameState.bestFitness = 0;
    this.gameState.timeElapsed = 0;
    this.generationTime = 0;
    this.gameState.isRunning = false;
  }

}
