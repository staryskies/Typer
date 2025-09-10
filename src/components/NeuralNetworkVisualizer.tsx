"use client";

import React, { useRef, useEffect, useState } from "react";
import { NeuralNetwork } from "@/types/game";

interface NeuralNetworkVisualizerProps {
  network?: NeuralNetwork;
  inputs?: number[];
  outputs?: number[];
  className?: string;
}

const NeuralNetworkVisualizer: React.FC<NeuralNetworkVisualizerProps> = ({
  network,
  inputs = [],
  outputs = [],
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !network) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height
    );
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(1, "#16213e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;
    const margin = isExpanded ? 80 : 50;

    // Calculate positions
    const inputX = margin;
    const hiddenX = width / 2;
    const outputX = width - margin;

    const minSpacing = isExpanded ? 40 : 25;
    const inputSpacing = Math.max(
      minSpacing,
      (height - 2 * margin) / Math.max(1, network.inputNodes - 1)
    );
    const hiddenSpacing = Math.max(
      minSpacing,
      (height - 2 * margin) / Math.max(1, network.hiddenNodes - 1)
    );
    const outputSpacing = Math.max(
      minSpacing,
      (height - 2 * margin) / Math.max(1, network.outputNodes - 1)
    );

    // Draw connections with enhanced visuals
    ctx.shadowBlur = 3;

    // Input to hidden connections
    for (let i = 0; i < network.inputNodes; i++) {
      for (let j = 0; j < network.hiddenNodes; j++) {
        const weight = network.weightsInputHidden[i][j];
        const opacity = Math.min(Math.abs(weight) * 0.8 + 0.2, 1);
        const thickness = Math.max(Math.abs(weight) * 3, 0.5);

        if (weight > 0) {
          ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
          ctx.shadowColor = "rgba(0, 212, 255, 0.5)";
        } else {
          ctx.strokeStyle = `rgba(239, 68, 68, ${opacity})`;
          ctx.shadowColor = "rgba(239, 68, 68, 0.5)";
        }

        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(inputX, margin + i * inputSpacing);
        ctx.lineTo(hiddenX, margin + j * hiddenSpacing);
        ctx.stroke();
      }
    }

    // Hidden to output connections
    for (let i = 0; i < network.hiddenNodes; i++) {
      for (let j = 0; j < network.outputNodes; j++) {
        const weight = network.weightsHiddenOutput[i][j];
        const opacity = Math.min(Math.abs(weight) * 0.8 + 0.2, 1);
        const thickness = Math.max(Math.abs(weight) * 3, 0.5);

        if (weight > 0) {
          ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`;
          ctx.shadowColor = "rgba(16, 185, 129, 0.5)";
        } else {
          ctx.strokeStyle = `rgba(245, 158, 11, ${opacity})`;
          ctx.shadowColor = "rgba(245, 158, 11, 0.5)";
        }

        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(hiddenX, margin + i * hiddenSpacing);
        ctx.lineTo(outputX, margin + j * outputSpacing);
        ctx.stroke();
      }
    }

    ctx.shadowBlur = 0;

    // Draw nodes with enhanced styling
    const nodeRadius = isExpanded ? 20 : 15;
    const inputLabels = [
      "Sensor 1",
      "Sensor 2",
      "Sensor 3",
      "Sensor 4",
      "Sensor 5",
      "Speed",
      "Angle Sin",
      "Angle Cos",
      "Braking",
    ];

    // Input nodes
    for (let i = 0; i < network.inputNodes; i++) {
      const y = margin + i * inputSpacing;
      const activation = inputs[i] || 0;

      // Node glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgba(0, 212, 255, ${activation})`;

      // Node gradient
      const gradient = ctx.createRadialGradient(
        inputX,
        y,
        0,
        inputX,
        y,
        nodeRadius
      );
      gradient.addColorStop(0, `rgba(0, 212, 255, ${0.8 + activation * 0.2})`);
      gradient.addColorStop(1, `rgba(0, 150, 200, ${0.4 + activation * 0.6})`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(inputX, y, nodeRadius, 0, 2 * Math.PI);
      ctx.fill();

      // Node border
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Activation value inside node
      ctx.fillStyle = "#ffffff";
      ctx.font = isExpanded ? "bold 10px Arial" : "bold 8px Arial";
      ctx.textAlign = "center";
      ctx.fillText(activation.toFixed(2), inputX, y + 2);

      // Label
      ctx.fillStyle = "#b4b4b4";
      ctx.font = isExpanded ? "11px Arial" : "9px Arial";
      ctx.textAlign = "right";
      const label = inputLabels[i] || `Input ${i}`;
      ctx.fillText(label, inputX - nodeRadius - 8, y + 3);

      // Show weight values in expanded mode
      if (isExpanded) {
        ctx.fillStyle = "#888888";
        ctx.font = "8px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${activation.toFixed(3)}`, inputX, y + nodeRadius + 15);
      }
    }

    // Hidden nodes
    for (let i = 0; i < network.hiddenNodes; i++) {
      const y = margin + i * hiddenSpacing;

      // Calculate hidden node activation (simplified)
      let hiddenActivation = 0;
      for (let j = 0; j < network.inputNodes; j++) {
        hiddenActivation += (inputs[j] || 0) * network.weightsInputHidden[j][i];
      }
      hiddenActivation = Math.max(0, Math.min(1, Math.abs(hiddenActivation)));

      // Node glow effect
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(139, 92, 246, ${hiddenActivation})`;

      // Node gradient
      const gradient = ctx.createRadialGradient(
        hiddenX,
        y,
        0,
        hiddenX,
        y,
        nodeRadius
      );
      gradient.addColorStop(
        0,
        `rgba(139, 92, 246, ${0.8 + hiddenActivation * 0.2})`
      );
      gradient.addColorStop(
        1,
        `rgba(100, 60, 200, ${0.4 + hiddenActivation * 0.6})`
      );

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(hiddenX, y, nodeRadius, 0, 2 * Math.PI);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Activation value
      ctx.fillStyle = "#ffffff";
      ctx.font = isExpanded ? "bold 10px Arial" : "bold 8px Arial";
      ctx.textAlign = "center";
      ctx.fillText(hiddenActivation.toFixed(2), hiddenX, y + 2);

      // Label
      ctx.fillStyle = "#b4b4b4";
      ctx.font = isExpanded ? "11px Arial" : "9px Arial";
      ctx.fillText(`Hidden ${i}`, hiddenX, y - nodeRadius - 10);

      // Show bias values in expanded mode
      if (isExpanded && network.biasHidden[i] !== undefined) {
        ctx.fillStyle = "#666666";
        ctx.font = "8px Arial";
        ctx.fillText(
          `bias: ${network.biasHidden[i].toFixed(2)}`,
          hiddenX,
          y + nodeRadius + 15
        );
      }
    }

    // Output nodes
    const outputLabels = ["Steering", "Acceleration", "Braking"];
    for (let i = 0; i < network.outputNodes; i++) {
      const y = margin + i * outputSpacing;
      const activation = outputs[i] || 0;

      // Node glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgba(16, 185, 129, ${activation})`;

      // Node gradient
      const gradient = ctx.createRadialGradient(
        outputX,
        y,
        0,
        outputX,
        y,
        nodeRadius
      );
      gradient.addColorStop(0, `rgba(16, 185, 129, ${0.8 + activation * 0.2})`);
      gradient.addColorStop(1, `rgba(10, 150, 100, ${0.4 + activation * 0.6})`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(outputX, y, nodeRadius, 0, 2 * Math.PI);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Activation value
      ctx.fillStyle = "#ffffff";
      ctx.font = isExpanded ? "bold 10px Arial" : "bold 8px Arial";
      ctx.textAlign = "center";
      ctx.fillText(activation.toFixed(2), outputX, y + 2);

      // Label
      ctx.fillStyle = "#b4b4b4";
      ctx.font = isExpanded ? "11px Arial" : "9px Arial";
      ctx.textAlign = "left";
      const label = outputLabels[i] || `Output ${i}`;
      ctx.fillText(label, outputX + nodeRadius + 8, y + 3);

      // Show bias and interpretation in expanded mode
      if (isExpanded) {
        ctx.fillStyle = "#666666";
        ctx.font = "8px Arial";
        ctx.textAlign = "left";
        if (network.biasOutput[i] !== undefined) {
          ctx.fillText(
            `bias: ${network.biasOutput[i].toFixed(2)}`,
            outputX + nodeRadius + 8,
            y + 15
          );
        }

        // Show interpretation
        let interpretation = "";
        if (i === 0) {
          interpretation =
            activation > 0.5
              ? "Turn Right"
              : activation < 0.5
                ? "Turn Left"
                : "Straight";
        } else if (i === 1) {
          interpretation =
            activation > 0.7 ? "Fast" : activation > 0.3 ? "Medium" : "Slow";
        } else if (i === 2) {
          interpretation = activation > 0.5 ? "Braking" : "No Brake";
        }
        ctx.fillStyle = "#aaaaaa";
        ctx.fillText(interpretation, outputX + nodeRadius + 8, y + 28);
      }
    }

    // Draw legend
    ctx.fillStyle = "#fff";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Neural Network", 10, 20);

    ctx.font = "10px Arial";
    ctx.fillText("Green: Positive weights", 10, height - 40);
    ctx.fillText("Red: Negative weights", 10, height - 25);
    ctx.fillText("Brightness: Weight strength", 10, height - 10);
  }, [network, inputs, outputs]);

  if (!network) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
        <h3 className="text-lg font-semibold mb-2">Neural Network</h3>
        <div className="text-gray-400 text-center py-8">
          No network selected
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-2">
        Neural Network Visualization
      </h3>
      <canvas
        ref={canvasRef}
        width={350}
        height={280}
        className="w-full neural-canvas rounded-lg"
      />
      <div className="mt-2 text-sm text-gray-300">
        <div>
          Inputs: {network.inputNodes} | Hidden: {network.hiddenNodes} |
          Outputs: {network.outputNodes}
        </div>
      </div>
    </div>
  );
};

export default NeuralNetworkVisualizer;
