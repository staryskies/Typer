'use client'

import React from 'react';

interface ControlPanelProps {
  isTraining: boolean;
  setIsTraining: (training: boolean) => void;
  populationSize: number;
  setPopulationSize: (size: number) => void;
  onReset?: () => void;
  onSaveBest?: () => void;
  onLoadBest?: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isTraining,
  setIsTraining,
  populationSize,
  setPopulationSize,
  onReset,
  onSaveBest,
  onLoadBest
}) => {
  const handlePopulationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 10 && value <= 200) {
      setPopulationSize(value);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Training Controls</h3>
      
      <div className="space-y-4">
        {/* Start/Stop Training */}
        <div>
          <button
            onClick={() => setIsTraining(!isTraining)}
            className={`w-full py-2 px-4 rounded font-semibold transition-colors ${
              isTraining
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isTraining ? 'Stop Training' : 'Start Training'}
          </button>
        </div>

        {/* Population Size */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Population Size: {populationSize}
          </label>
          <input
            type="range"
            min="10"
            max="200"
            step="10"
            value={populationSize}
            onChange={handlePopulationChange}
            disabled={isTraining}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>10</span>
            <span>200</span>
          </div>
        </div>

        {/* Reset Button */}
        <div>
          <button
            onClick={onReset}
            disabled={isTraining}
            className="w-full py-2 px-4 rounded font-semibold bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reset Simulation
          </button>
        </div>

        {/* Save/Load Best */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onSaveBest}
            className="py-2 px-3 rounded text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Save Best
          </button>
          <button
            onClick={onLoadBest}
            className="py-2 px-3 rounded text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-colors"
          >
            Load Best
          </button>
        </div>

        {/* Training Parameters */}
        <div className="border-t border-gray-600 pt-4">
          <h4 className="text-sm font-semibold mb-2">Racing Circuit Info</h4>
          <div className="text-xs text-gray-300 space-y-1">
            <div>• <span className="text-blue-400">Rough racing circuit</span> with alternating bends</div>
            <div>• <span className="text-green-400">Start/Finish line</span> with lap counting</div>
            <div>• <span className="text-purple-400">2x speed simulation</span> for faster training</div>
            <div>• <span className="text-yellow-400">Enhanced sensors</span> (300px range)</div>
            <div>• Fitness rewards speed & aggressive driving</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default ControlPanel;
