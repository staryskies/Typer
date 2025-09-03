# Neural Racing Game

An AI-powered racing game where neural networks learn to drive through genetic algorithms. Watch as cars evolve over generations to become better drivers!

## Features

- **Real-time Neural Network Training**: Watch AI cars learn to drive using genetic algorithms
- **Interactive Visualization**: 
  - See neural network structure with input/output nodes
  - Visualize car sensors and decision-making process
  - Track fitness scores and generation progress
- **Customizable Parameters**: Adjust population size, mutation rates, and training settings
- **Save/Load Best Performers**: Export and import the best neural networks
- **Responsive Design**: Works on desktop and mobile devices

## How It Works

### Neural Network Architecture
- **Input Layer**: 8 nodes (5 distance sensors + speed + angle components)
- **Hidden Layer**: 8 nodes with sigmoid activation
- **Output Layer**: 2 nodes (steering and acceleration)

### Genetic Algorithm
1. **Population**: Start with random neural networks
2. **Fitness Evaluation**: Based on distance traveled and checkpoints passed
3. **Selection**: Tournament selection of best performers
4. **Crossover**: Combine successful neural networks
5. **Mutation**: Random changes to weights and biases
6. **Evolution**: Repeat for multiple generations

### Car Physics
- Realistic car movement with acceleration, friction, and turning
- 5 distance sensors for obstacle detection
- Collision detection with track boundaries
- Checkpoint system for progress tracking

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd neural-racing-game
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Deployment

This project is configured for easy deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically with zero configuration

Or deploy directly:
```bash
npm run build
```

## Usage

1. **Start Training**: Click "Start Training" to begin the genetic algorithm
2. **Select Cars**: Click on any car to view its neural network
3. **Adjust Parameters**: Change population size and other settings
4. **Monitor Progress**: Watch statistics and generation progress
5. **Save Best**: Export successful neural networks for later use

## Technical Details

### File Structure
```
src/
├── app/                 # Next.js app directory
├── components/          # React components
│   ├── GameCanvas.tsx   # Main game rendering
│   ├── NeuralNetworkVisualizer.tsx
│   ├── ControlPanel.tsx
│   └── StatsPanel.tsx
├── types/              # TypeScript type definitions
├── utils/              # Core game logic
│   ├── gameEngine.ts   # Main game loop
│   ├── neuralNetwork.ts # Neural network implementation
│   ├── geneticAlgorithm.ts # Evolution logic
│   ├── physics.ts      # Car physics and collision
│   └── track.ts        # Track generation
```

### Performance Optimizations
- Efficient collision detection algorithms
- Optimized rendering with HTML5 Canvas
- Genetic algorithm with elitism for faster convergence
- Responsive design for various screen sizes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Inspired by genetic algorithm research in AI
- Built with Next.js, React, and TypeScript
- Canvas-based rendering for smooth performance
