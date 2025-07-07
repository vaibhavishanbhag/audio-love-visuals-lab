
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface WaveformVisualizerProps {
  onResultsUpdate: (data: { htmlContent: string; codeSnippet: string }) => void;
}

const WaveformVisualizer = ({ onResultsUpdate }: WaveformVisualizerProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const toggleRecording = async () => {
    isRecording ? stopRecording() : await startRecording();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 1024;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');

        try {
          const res = await fetch('http://localhost:8000/process-audio/', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();

          const agentRes = await fetch('http://localhost:8000/ui-agent/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: data.transcription }),
          });

          const agentData = await agentRes.json();
          onResultsUpdate({
            htmlContent: agentData.htmlContent,
            codeSnippet: agentData.code,
          });
        } catch (err) {
          console.error('API error:', err);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      updateVisualizer();
      setIsRecording(true);
    } catch (err) {
      console.error('Mic access error:', err);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (audioContextRef.current) await audioContextRef.current.close();
    animationRef.current = null;
    audioContextRef.current = null;
    setIsRecording(false);
  };

  const updateVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current || !dataArrayRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerY = canvas.height / 2;
    const sliceWidth = canvas.width / dataArrayRef.current.length;

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#8b5cf6');
    gradient.addColorStop(0.5, '#06d6a0');
    gradient.addColorStop(1, '#3b82f6');

    // Draw waveform
    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const amplitude = (dataArrayRef.current[i] / 255) * (canvas.height / 2);
      const x = i * sliceWidth;
      const y = centerY - amplitude;
      
      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw reflection
    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const amplitude = (dataArrayRef.current[i] / 255) * (canvas.height / 2);
      const x = i * sliceWidth;
      const y = centerY + amplitude;
      
      ctx.lineTo(x, y);
    }

    const reflectionGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    reflectionGradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
    reflectionGradient.addColorStop(0.5, 'rgba(6, 214, 160, 0.3)');
    reflectionGradient.addColorStop(1, 'rgba(59, 130, 246, 0.3)');

    ctx.strokeStyle = reflectionGradient;
    ctx.lineWidth = 2;
    ctx.stroke();

    animationRef.current = requestAnimationFrame(updateVisualizer);
  };

  const idleAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerY = canvas.height / 2;
    const time = Date.now() * 0.002;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)');
    gradient.addColorStop(0.5, 'rgba(6, 214, 160, 0.5)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.5)');

    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let x = 0; x < canvas.width; x += 2) {
      const y = centerY + Math.sin(x * 0.01 + time) * 20;
      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.stroke();

    animationRef.current = requestAnimationFrame(idleAnimation);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    if (!isRecording && !animationRef.current) {
      animationRef.current = requestAnimationFrame(idleAnimation);
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording]);

  return (
    <div className="mt-8 mx-auto w-full max-w-4xl px-4">
      <div className="visualizer-container">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      
      <div className="flex justify-center mt-6">
        <button 
          onClick={toggleRecording}
          className={`mic-button relative ${isRecording ? 'recording' : ''}`}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
      </div>
    </div>
  );
};

export default WaveformVisualizer;
