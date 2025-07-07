
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface ParticleSystemVisualizerProps {
  onResultsUpdate: (data: {     appliedHtml: string;
    codeSnippet: string;
    fullHtml: string; }) => void;
}

type Particle = {
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
};

const ParticleSystemVisualizer = ({ onResultsUpdate }: ParticleSystemVisualizerProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  const colors = ['#FF36AB', '#3A86FF', '#8338EC', '#FF006E', '#FB5607', '#FFBE0B', '#06D6A0'];

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
      analyserRef.current.fftSize = 256;
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
          onResultsUpdate(agentData);
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

  const createParticle = (canvas: HTMLCanvasElement, audioData?: number) => {
    const intensity = audioData ? audioData / 255 : 0.2;
    
    const particle: Particle = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      size: 3 + Math.random() * 8 * (intensity + 0.2),
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 3 * (intensity + 0.5),
      vy: (Math.random() - 0.5) * 3 * (intensity + 0.5),
      life: 0,
      maxLife: 100 + Math.random() * 100
    };
    
    return particle;
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const updateVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current || !dataArrayRef.current) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const averageAudio = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;
    
    const particlesToAdd = Math.max(1, Math.floor(averageAudio / 20));
    for (let i = 0; i < particlesToAdd; i++) {
      particlesRef.current.push(createParticle(canvas, averageAudio));
    }
    
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.life++;
      
      const opacity = particle.life < particle.maxLife * 0.7 
        ? 1 
        : 1 - ((particle.life - particle.maxLife * 0.7) / (particle.maxLife * 0.3));
      
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      const rgbColor = hexToRgb(particle.color);
      if (rgbColor) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${opacity})`;
        ctx.fill();
      }
      
      return (
        particle.life < particle.maxLife &&
        particle.x > -particle.size &&
        particle.x < canvas.width + particle.size &&
        particle.y > -particle.size &&
        particle.y < canvas.height + particle.size
      );
    });
    
    animationRef.current = requestAnimationFrame(updateVisualizer);
  };

  const idleAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (Math.random() > 0.7) {
      particlesRef.current.push(createParticle(canvas));
    }
    
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.life++;
      
      const opacity = particle.life < particle.maxLife * 0.7 
        ? 1 
        : 1 - ((particle.life - particle.maxLife * 0.7) / (particle.maxLife * 0.3));
      
      particle.x += particle.vx * 0.5;
      particle.y += particle.vy * 0.5;
      
      const rgbColor = hexToRgb(particle.color);
      if (rgbColor) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${opacity})`;
        ctx.fill();
      }
      
      return (
        particle.life < particle.maxLife &&
        particle.x > -particle.size &&
        particle.x < canvas.width + particle.size &&
        particle.y > -particle.size &&
        particle.y < canvas.height + particle.size
      );
    });
    
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
      <div className="visualizer-container bg-black bg-opacity-90">
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

export default ParticleSystemVisualizer;
