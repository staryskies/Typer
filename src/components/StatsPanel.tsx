'use client'

import React from 'react';

interface StatsPanelProps {
  generation: number;
  bestFitness: number;
  populationSize: number;
  aliveCount?: number;
  averageFitness?: number;
  timeElapsed?: number;
  maxTime?: number;
}

const StatsPanel: React.FC<StatsPanelProps> = ({
  generation,
  bestFitness,
  populationSize,
  aliveCount = 0,
  averageFitness = 0,
  timeElapsed = 0,
  maxTime = 30000
}) => {
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = Math.min((timeElapsed / maxTime) * 100, 100);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Statistics</h3>
      
      <div className="space-y-4">
        {/* Generation Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700 rounded p-3">
            <div className="text-2xl font-bold text-blue-400">{generation}</div>
            <div className="text-sm text-gray-300">Generation</div>
          </div>
          <div className="bg-gray-700 rounded p-3">
            <div className="text-2xl font-bold text-green-400">
              {Math.round(bestFitness)}
            </div>
            <div className="text-sm text-gray-300">Best Fitness</div>
          </div>
        </div>

        {/* Population Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700 rounded p-3">
            <div className="text-xl font-bold text-yellow-400">{aliveCount}</div>
            <div className="text-sm text-gray-300">Cars Alive</div>
          </div>
          <div className="bg-gray-700 rounded p-3">
            <div className="text-xl font-bold text-purple-400">{populationSize}</div>
            <div className="text-sm text-gray-300">Population</div>
          </div>
        </div>

        {/* Average Fitness */}
        <div className="bg-gray-700 rounded p-3">
          <div className="text-xl font-bold text-orange-400">
            {Math.round(averageFitness)}
          </div>
          <div className="text-sm text-gray-300">Average Fitness</div>
        </div>

        {/* Generation Progress */}
        <div>
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>Generation Progress</span>
            <span>{formatTime(timeElapsed)} / {formatTime(maxTime)}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="border-t border-gray-600 pt-4">
          <h4 className="text-sm font-semibold mb-2">Performance</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Survival Rate:</span>
              <span className="text-white">
                {Math.round((aliveCount / populationSize) * 100)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Fitness Growth:</span>
              <span className="text-white">
                {averageFitness > 0 ? 
                  `${Math.round((bestFitness / averageFitness) * 100)}%` : 
                  'N/A'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="border-t border-gray-600 pt-4">
          <h4 className="text-sm font-semibold mb-2">Fitness Components</h4>
          <div className="text-xs text-gray-300 space-y-1">
            <div>• Distance traveled × 0.1</div>
            <div>• Checkpoints passed × 500</div>
            <div>• Speed bonus × 0.01</div>
            <div>• Crash penalty × 0.5</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
