'use client'

import { useState, useRef } from 'react'
import GameCanvas from '@/components/GameCanvas'
import NeuralNetworkVisualizer from '@/components/NeuralNetworkVisualizer'
import ControlPanel from '@/components/ControlPanel'
import StatsPanel from '@/components/StatsPanel'
import { Car } from '@/types/game'
import { NeuralNetworkUtils } from '@/utils/neuralNetwork'
import { TrackGenerator } from '@/utils/track'

export default function Home() {
  const [track, setTrack] = useState(TrackGenerator.createSimpleOvalTrack(800, 600))
  const [isTraining, setIsTraining] = useState(false)
  const [generation, setGeneration] = useState(1)
  const [bestFitness, setBestFitness] = useState(0)
  const [populationSize, setPopulationSize] = useState(50)
  const [maxGenerationTime, setMaxGenerationTime ] = useState(10000)
  const [selectedCar, setSelectedCar] = useState<Car | null>(null)
  const [bestCar, setBestCar] = useState<Car | null>(null)
  const [aliveCount, setAliveCount] = useState(0)
  const [averageFitness, setAverageFitness] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)

  const handleCarSelect = (car: Car) => {
    setSelectedCar(car)
  }

  const handleStatsUpdate = (stats: { aliveCount: number; averageFitness: number; timeElapsed: number; bestCar: Car | null }) => {
    setAliveCount(stats.aliveCount)
    setAverageFitness(stats.averageFitness)
    setTimeElapsed(stats.timeElapsed)
    if (stats.bestCar) {
      setBestCar(stats.bestCar)
    }
  }

  const gameCanvasRef = useRef<{ resetSimulation: () => void } | null>(null)

  const handleReset = () => {
    // Stop training first
    setIsTraining(false)

    // Reset local state
    setSelectedCar(null)
    setBestCar(null)
    setGeneration(1)
    setBestFitness(0)
    setAliveCount(0)
    setAverageFitness(0)
    setTimeElapsed(0)

    // Reset the game engine through the canvas component
    if (gameCanvasRef.current) {
      gameCanvasRef.current.resetSimulation()
    }
  }

  const handleSaveBest = () => {
    if (selectedCar) {
      const networkData = JSON.stringify(selectedCar.brain)
      const blob = new Blob([networkData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `best-neural-network-gen${generation}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleLoadBest = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const networkData = JSON.parse(e.target?.result as string)
            // Load the network into the GameCanvas
            if (gameCanvasRef.current && 'loadBestNetwork' in gameCanvasRef.current) {
              (gameCanvasRef.current as any).loadBestNetwork(networkData)
              console.log('Network loaded successfully')
            }
          } catch (error) {
            console.error('Error loading network:', error)
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  // Get neural network inputs and outputs for visualization
  const getNetworkVisualizationData = () => {
    // Use selected car if available, otherwise use best car
    const carToVisualize = selectedCar || bestCar
    if (!carToVisualize) return { inputs: [], outputs: [] }

    const sensorDistances = carToVisualize.sensors.map((sensor: any) => sensor.distance)
    const inputs = NeuralNetworkUtils.getNetworkInputs(
      sensorDistances,
      carToVisualize.speed,
      carToVisualize.angle,
      carToVisualize.braking
    )

    const outputs = NeuralNetworkUtils.feedForward(carToVisualize.brain, inputs)

    return { inputs, outputs }
  }

  const { inputs, outputs } = getNetworkVisualizationData()

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Neural Truck Racing
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Neural network racing simulation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Canvas */}
          <div className="lg:col-span-3">
            <div className="card rounded p-4">
              <GameCanvas
                ref={gameCanvasRef}
                track={track}
                setTrack={setTrack}
                isTraining={isTraining}
                generation={generation}
                setGeneration={setGeneration}
                setBestFitness={setBestFitness}
                maxGenerationTime = {maxGenerationTime}
                setMaxGenerationTime = {setMaxGenerationTime}
                populationSize={populationSize}
                onCarSelect={handleCarSelect}
                onStatsUpdate={handleStatsUpdate}
              />
            </div>
          </div>

          <div className="card rounded-xl p-6 ">
              <NeuralNetworkVisualizer
                network={(selectedCar || bestCar)?.brain}
                inputs={inputs}
                outputs={outputs}
              />
              {(selectedCar || bestCar) && (
                <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
                  <h4 className="text-sm font-semibold text-white mb-2">
                    {selectedCar ? 'Selected Car Details' : 'Best Car Details'}
                  </h4>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div>ID: <span className="text-white">{(selectedCar || bestCar)?.id}</span></div>
                    <div>Fitness: <span className="text-white">{Math.round((selectedCar || bestCar)?.fitness || 0)}</span></div>
                    <div>Speed: <span className="text-white">{Math.round((selectedCar || bestCar)?.speed || 0)}</span></div>
                    <div>Checkpoints: <span className="text-white">{(selectedCar || bestCar)?.checkpointsPassed || 0}</span></div>
                    <div>Distance: <span className="text-white">{Math.round((selectedCar || bestCar)?.distanceTraveled || 0)}</span></div>
                    <div>Speed: <span className="text-white">{Math.round((selectedCar || bestCar)?.speed || 0)}</span></div>
                    <div>Rotation: <span className="text-white">{Math.round((selectedCar || bestCar)?.turnSpeed || 0)}</span></div>
                    <div>Braking: <span className="text-white">{Math.round((selectedCar || bestCar)?.braking || 0)}</span></div>
                  </div>
                  <StatsPanel
                    generation={generation}
                    bestFitness={bestFitness}
                    populationSize={populationSize}
                    aliveCount={aliveCount}
                    averageFitness={averageFitness}
                    timeElapsed={timeElapsed}
                    maxTime={maxGenerationTime}
                  />
                </div>
              )}
            </div>

          {/* Control Panel and Stats */}
          <div className="space-y-2">
            <div className="card rounded-xl p-6 white">
              <ControlPanel
                isTraining={isTraining}
                setIsTraining={setIsTraining}
                populationSize={populationSize}
                setPopulationSize={setPopulationSize}
                onReset={handleReset}
                onSaveBest={handleSaveBest}
                onLoadBest={handleLoadBest}
                maxGenerationTime={maxGenerationTime}
                setMaxGenerationTime={setMaxGenerationTime}
              />

        
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
