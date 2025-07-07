
import React, { useState } from 'react';
import VisualizerSelector, { VisualizerType } from './VisualizerSelector';
import CircularWaveVisualizer from './visualizers/CircularWaveVisualizer';
import ParticleSystemVisualizer from './visualizers/ParticleSystemVisualizer';
import WaveformVisualizer from './visualizers/WaveformVisualizer';
import BarVisualizer from './visualizers/BarVisualizer';

interface AudioVisualizerProps {
  onResultsUpdate: (data: { htmlContent: string; codeSnippet: string }) => void;
}

const AudioVisualizer = ({ onResultsUpdate }: AudioVisualizerProps) => {
  const [currentVisualizer, setCurrentVisualizer] = useState<VisualizerType>('bars');

  const renderVisualizer = () => {
    switch (currentVisualizer) {
      case 'circular':
        return <CircularWaveVisualizer onResultsUpdate={onResultsUpdate} />;
      case 'particles':
        return <ParticleSystemVisualizer onResultsUpdate={onResultsUpdate} />;
      case 'waveform':
        return <WaveformVisualizer onResultsUpdate={onResultsUpdate} />;
      case 'bars':
      default:
        return <BarVisualizer onResultsUpdate={onResultsUpdate} />;
    }
  };

  return (
    <div>
      <VisualizerSelector 
        currentVisualizer={currentVisualizer} 
        onVisualizerChange={setCurrentVisualizer}
      />
      {renderVisualizer()}
    </div>
  );
};

export default AudioVisualizer;
