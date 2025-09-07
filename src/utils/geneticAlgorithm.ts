import { Car, NeuralNetwork, Sensor, Vector2D, GameState } from '@/types/game';
import { NeuralNetworkUtils } from './neuralNetwork';

export class GeneticAlgorithm {
  private mutationRate: number;
  private mutationStrength: number;
  private elitismRate: number;

  constructor(
    mutationRate: number = 0.5,
    mutationStrength: number = 0.7,
    elitismRate: number = 0.3
  ) {
    this.mutationRate = mutationRate;
    this.mutationStrength = mutationStrength;
    this.elitismRate = elitismRate;
  }

  createInitialPopulation(
    populationSize: number,
    startPosition: Vector2D,
    startAngle: number
  ): Car[] {
    const population: Car[] = [];
    const sensorCount = 5;
    const inputNodes = sensorCount + 4; // sensors + speed + angle_sin + angle_cos
    const hiddenNodes = 8;
    const outputNodes = 3;; // steering + acceleration + braking

    for (let i = 0; i < populationSize; i++) {
      const car: Car = {
        id: `car_${i}`,
        position: { x: startPosition.x, y: startPosition.y },
        velocity: { x: 0, y: 0 },
        angle: startAngle,
        speed: 0,
        maxSpeed: 125, 
        acceleration: 0,
        braking: 0,
        friction: 0.92, 
        turnSpeed: 6, 
        sensors: this.createSensors(sensorCount),
        fitness: 0,
        alive: true,
        distanceTraveled: 0,
        checkpointsPassed: 0,
        brain: NeuralNetworkUtils.createRandomNetwork(inputNodes, hiddenNodes, outputNodes),
        color: this.getRandomColor()
      };
      population.push(car);
    }

    return population;
  }

  private createSensors(count: number): Sensor[] {
    const sensors: Sensor[] = [];
    const angleStep = Math.PI / (count - 1); // Spread sensors from -90° to +90°
    const startAngle = -Math.PI / 2;

    for (let i = 0; i < count; i++) {
      sensors.push({
        angle: startAngle + i * angleStep,
        length: 300, // Longer sensor range for faster speeds
        distance: 300,
        hit: false,
        endPoint: { x: 0, y: 0 }
      });
    }

    return sensors;
  }

  private getRandomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  calculateFitness(car: Car, gameState: GameState): number {
    let fitness = 0;

    // Distance traveled
    fitness += car.distanceTraveled * 0.05;

    // Bonus for checkpoints
    fitness += car.checkpointsPassed * 800;

    // Survive longer = better
    fitness += gameState.generationTime / 100;

    // Penalize crashing
    if (!car.alive) {
      fitness *= 0.3;
    }

    if (car.braking > 0.8) {
      fitness -= 50; // small penalty for holding brake constantly
    }

    car.fitness = Math.max(0, fitness);
    return car.fitness;
  }


  evolvePopulation(population: Car[], startPosition: Vector2D, startAngle: number , Gamestate: GameState): Car[] {
    // Calculate fitness for all cars
    population.forEach(car => this.calculateFitness(car , Gamestate));

    // Sort by fitness (descending)
    population.sort((a, b) => b.fitness - a.fitness);

    // Calculate fitness diversity for adaptive mutation
    const fitnessValues = population.map(car => car.fitness);
    const maxFitness = Math.max(...fitnessValues);
    const minFitness = Math.min(...fitnessValues);
    const fitnessRange = maxFitness - minFitness;
    const averageFitness = fitnessValues.reduce((sum, f) => sum + f, 0) / fitnessValues.length;

    // Adaptive mutation: larger changes if scores are similar, smaller if diverse
    const diversityThreshold = Math.max(100, averageFitness * 0.1); // 10% of average or minimum 100
    const isLowDiversity = fitnessRange < diversityThreshold;

    const adaptiveMutationRate = isLowDiversity ? 0.8 : 0.5; // High mutation if low diversity
    const adaptiveMutationStrength = isLowDiversity ? 1.5 : 0.3; // Strong mutations if low diversity

    console.log(`Fitness range: ${fitnessRange.toFixed(2)}, Diversity: ${isLowDiversity ? 'LOW' : 'HIGH'}, Mutation rate: ${adaptiveMutationRate}`);

    const newPopulation: Car[] = [];

    // Elitist selection: only keep top 20% as parents
    const eliteCount = Math.floor(population.length * 0.3);
    const eliteParents = population.slice(0, eliteCount);

    // Keep only the absolute best car unchanged
    const bestCar = this.createCarFromBrain(
      population[0].brain,
      startPosition,
      startAngle,
      'best_elite'
    );
    newPopulation.push(bestCar);

    // Create offspring only from elite parents
    while (newPopulation.length < population.length) {
      // Select parents only from elite group
      const parent1 = eliteParents[Math.floor(Math.random() * eliteParents.length)];
      const parent2 = eliteParents[Math.floor(Math.random() * eliteParents.length)];

      let childBrain: NeuralNetwork;

      if (Math.random() < 0.7) { //70% chance of crossover
        childBrain = NeuralNetworkUtils.crossover(parent1.brain, parent2.brain);
      } else {
        childBrain = NeuralNetworkUtils.copyNetwork(parent1.brain);
      }

      // Apply adaptive mutation
      childBrain = NeuralNetworkUtils.mutate(childBrain, adaptiveMutationRate, adaptiveMutationStrength);

      const childCar = this.createCarFromBrain(
        childBrain,
        startPosition,
        startAngle,
        `gen_${newPopulation.length}`
      );

      newPopulation.push(childCar);
    }

    return newPopulation;
  }

  private tournamentSelection(population: Car[], tournamentSize: number): Car {
    const tournament: Car[] = [];
    
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * population.length);
      tournament.push(population[randomIndex]);
    }

    // Return the best car from the tournament
    return tournament.reduce((best, current) => 
      current.fitness > best.fitness ? current : best
    );
  }

  private createCarFromBrain(
    brain: NeuralNetwork,
    startPosition: Vector2D,
    startAngle: number,
    id: string
  ): Car {
    return {
      id,
      position: { x: startPosition.x, y: startPosition.y },
      velocity: { x: 0, y: 0 },
      angle: startAngle,
      speed: 0,
      maxSpeed: 150,
      braking: 0,
      acceleration: 0,
      friction: 0.95,
      turnSpeed: 0.03,
      sensors: this.createSensors(5),
      fitness: 0,
      alive: true,
      distanceTraveled: 0,
      checkpointsPassed: 0,
      brain: NeuralNetworkUtils.copyNetwork(brain),
      color: this.getRandomColor()
    };
  }

  getBestCar(population: Car[]): Car {
    return population.reduce((best, current) => 
      current.fitness > best.fitness ? current : best
    );
  }

  getAverageFitness(population: Car[]): number {
    const totalFitness = population.reduce((sum, car) => sum + car.fitness, 0);
    return totalFitness / population.length;
  }

  getAliveCount(population: Car[]): number {
    return population.filter(car => car.alive).length;
  }
}
