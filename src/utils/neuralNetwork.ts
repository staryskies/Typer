import { NeuralNetwork } from '@/types/game';

export class NeuralNetworkUtils {
  static createRandomNetwork(inputNodes: number, hiddenNodes: number, outputNodes: number): NeuralNetwork {
    const weightsInputHidden: number[][] = [];
    const weightsHiddenOutput: number[][] = [];
    const biasHidden: number[] = [];
    const biasOutput: number[] = [];

    // Initialize weights between input and hidden layer
    for (let i = 0; i < inputNodes; i++) {
      weightsInputHidden[i] = [];
      for (let j = 0; j < hiddenNodes; j++) {
        weightsInputHidden[i][j] = this.randomWeight();
      }
    }

    // Initialize weights between hidden and output layer
    for (let i = 0; i < hiddenNodes; i++) {
      weightsHiddenOutput[i] = [];
      for (let j = 0; j < outputNodes; j++) {
        weightsHiddenOutput[i][j] = this.randomWeight();
      }
    }

    // Initialize biases
    for (let i = 0; i < hiddenNodes; i++) {
      biasHidden[i] = this.randomWeight();
    }

    for (let i = 0; i < outputNodes; i++) {
      biasOutput[i] = this.randomWeight();
    }

    return {
      inputNodes,
      hiddenNodes,
      outputNodes,
      weightsInputHidden,
      weightsHiddenOutput,
      biasHidden,
      biasOutput
    };
  }

  static feedForward(network: NeuralNetwork, inputs: number[]): number[] {
    if (inputs.length !== network.inputNodes) {
      throw new Error(`Expected ${network.inputNodes} inputs, got ${inputs.length}`);
    }

    // Calculate hidden layer values
    const hiddenValues: number[] = [];
    for (let j = 0; j < network.hiddenNodes; j++) {
      let sum = network.biasHidden[j];
      for (let i = 0; i < network.inputNodes; i++) {
        sum += inputs[i] * network.weightsInputHidden[i][j];
      }
      hiddenValues[j] = this.sigmoid(sum);
    }

    // Calculate output layer values
    const outputValues: number[] = [];
    for (let j = 0; j < network.outputNodes; j++) {
      let sum = network.biasOutput[j];
      for (let i = 0; i < network.hiddenNodes; i++) {
        sum += hiddenValues[i] * network.weightsHiddenOutput[i][j];
      }
      outputValues[j] = this.sigmoid(sum);
    }

    return outputValues;
  }

  static sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  static tanh(x: number): number {
    return Math.tanh(x);
  }

  static randomWeight(): number {
    return (Math.random() - 0.5) * 2; // Random value between -1 and 1
  }

  static mutate(network: NeuralNetwork, mutationRate: number, mutationStrength: number): NeuralNetwork {
    const mutated = this.copyNetwork(network);

    // Mutate input-hidden weights
    for (let i = 0; i < mutated.inputNodes; i++) {
      for (let j = 0; j < mutated.hiddenNodes; j++) {
        if (Math.random() < mutationRate) {
          mutated.weightsInputHidden[i][j] += (Math.random() - 0.5) * mutationStrength;
        }
      }
    }

    // Mutate hidden-output weights
    for (let i = 0; i < mutated.hiddenNodes; i++) {
      for (let j = 0; j < mutated.outputNodes; j++) {
        if (Math.random() < mutationRate) {
          mutated.weightsHiddenOutput[i][j] += (Math.random() - 0.5) * mutationStrength;
        }
      }
    }

    // Mutate hidden biases
    for (let i = 0; i < mutated.hiddenNodes; i++) {
      if (Math.random() < mutationRate) {
        mutated.biasHidden[i] += (Math.random() - 0.5) * mutationStrength;
      }
    }

    // Mutate output biases
    for (let i = 0; i < mutated.outputNodes; i++) {
      if (Math.random() < mutationRate) {
        mutated.biasOutput[i] += (Math.random() - 0.5) * mutationStrength;
      }
    }

    return mutated;
  }

  static crossover(parent1: NeuralNetwork, parent2: NeuralNetwork): NeuralNetwork {
    const child = this.copyNetwork(parent1);

    // Crossover input-hidden weights
    for (let i = 0; i < child.inputNodes; i++) {
      for (let j = 0; j < child.hiddenNodes; j++) {
        if (Math.random() < 0.5) {
          child.weightsInputHidden[i][j] = parent2.weightsInputHidden[i][j];
        }
      }
    }

    // Crossover hidden-output weights
    for (let i = 0; i < child.hiddenNodes; i++) {
      for (let j = 0; j < child.outputNodes; j++) {
        if (Math.random() < 0.5) {
          child.weightsHiddenOutput[i][j] = parent2.weightsHiddenOutput[i][j];
        }
      }
    }

    // Crossover biases
    for (let i = 0; i < child.hiddenNodes; i++) {
      if (Math.random() < 0.5) {
        child.biasHidden[i] = parent2.biasHidden[i];
      }
    }

    for (let i = 0; i < child.outputNodes; i++) {
      if (Math.random() < 0.5) {
        child.biasOutput[i] = parent2.biasOutput[i];
      }
    }

    return child;
  }

  static copyNetwork(network: NeuralNetwork): NeuralNetwork {
    return {
      inputNodes: network.inputNodes,
      hiddenNodes: network.hiddenNodes,
      outputNodes: network.outputNodes,
      weightsInputHidden: network.weightsInputHidden.map(row => [...row]),
      weightsHiddenOutput: network.weightsHiddenOutput.map(row => [...row]),
      biasHidden: [...network.biasHidden],
      biasOutput: [...network.biasOutput]
    };
  }

  static getNetworkInputs(sensorDistances: number[], speed: number, angle: number ,braking: number): number[] {
    // Normalize sensor distances (0-1 range)
    const normalizedSensors = sensorDistances.map(distance => Math.min(distance / 200, 1));
    
    // Normalize speed (0-1 range, assuming max speed of 200)
    const normalizedSpeed = Math.min(speed / 200, 1);
    
    // Normalize angle (-1 to 1 range)
    const normalizedAngle = Math.sin(angle);
    const normalizedAngleCos = Math.cos(angle);
    const normalizedBraking = Math.min(braking / 100, 1);

    return [...normalizedSensors, normalizedSpeed, normalizedAngle, normalizedAngleCos, normalizedBraking];
  }

  static interpretOutputs(outputs: number[]) {
    return {
      steering: outputs[0] * 2 - 1, // -1 = full left, +1 = full right
      acceleration: outputs[1],      // 0 = no throttle, 1 = full throttle
      braking: outputs[2]            // 0 = no brake, 1 = full brake
    };
  }


}
