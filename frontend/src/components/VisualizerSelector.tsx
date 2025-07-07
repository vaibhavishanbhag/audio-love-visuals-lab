
import React from 'react';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

export type VisualizerType = 'bars' | 'circular' | 'particles' | 'waveform';

interface VisualizerSelectorProps {
  currentVisualizer: VisualizerType;
  onVisualizerChange: (visualizer: VisualizerType) => void;
}

const VisualizerSelector = ({ currentVisualizer, onVisualizerChange }: VisualizerSelectorProps) => {
  return (
    <div className="flex justify-center mb-8">
      <Tabs value={currentVisualizer} onValueChange={(value) => onVisualizerChange(value as VisualizerType)}>
        <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
          <TabsTrigger value="bars" className="text-sm">
            📊 Bars
          </TabsTrigger>
          <TabsTrigger value="circular" className="text-sm">
            🌊 Circular
          </TabsTrigger>
          <TabsTrigger value="particles" className="text-sm">
            ✨ Particles
          </TabsTrigger>
          <TabsTrigger value="waveform" className="text-sm">
            〰️ Waveform
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default VisualizerSelector;
