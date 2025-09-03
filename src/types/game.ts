export interface Vector2D {
  x: number;
  y: number;
}

export interface Car {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  angle: number;
  speed: number;
  maxSpeed: number;
  acceleration: number;
  friction: number;
  turnSpeed: number;
  sensors: Sensor[];
  fitness: number;
  alive: boolean;
  distanceTraveled: number;
  checkpointsPassed: number;
  brain: NeuralNetwork;
  color: string;
}

export interface Sensor {
  angle: number;
  length: number;
  distance: number;
  hit: boolean;
  endPoint: Vector2D;
}

export interface Track {
  walls: Wall[];
  checkpoints: Checkpoint[];
  startPosition: Vector2D;
  startAngle: number;
}

export interface Wall {
  start: Vector2D;
  end: Vector2D;
}

export interface Checkpoint {
  start: Vector2D;
  end: Vector2D;
  id: number;
}

export interface NeuralNetwork {
  inputNodes: number;
  hiddenNodes: number;
  outputNodes: number;
  weightsInputHidden: number[][];
  weightsHiddenOutput: number[][];
  biasHidden: number[];
  biasOutput: number[];
}

export interface GameState {
  cars: Car[];
  generation: number;
  bestFitness: number;
  isRunning: boolean;
  timeElapsed: number;
  maxTime: number;
}
