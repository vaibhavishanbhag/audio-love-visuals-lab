import React, { useRef, useEffect, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  opacity: number;
  life: number;
}

const ParticleVisualizer = () => {
  const [isRecording, setIsRecording] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  
  // Colors for particles
  const colors = [
    '#FF61D2', // Pink
    '#BF4FF8', // Purple
    '#6B6BFF', // Blue
    '#5EE6FF', // Cyan
    '#F8D84F', // Yellow
    '#FFA270', // Orange
  ];
  
  // Initialize the canvas and particles
  useEffect(() => {
    const initCanvas = () => {
      if (!canvasRef.current || !containerRef.current) return;
      
      const canvas = canvasRef.current;
      const container = containerRef.current;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      // Create initial particles
      createIdleParticles();
    };
    
    initCanvas();
    
    // Handle resize
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      
      const canvas = canvasRef.current;
      const container = containerRef.current;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Create idle particles when not recording
  const createIdleParticles = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const particles: Particle[] = [];
    
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 20 + 10,
        speedX: (Math.random() - 0.5) * 1.5,
        speedY: (Math.random() - 0.5) * 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.7 + 0.3,
        life: Math.random() * 100 + 100,
      });
    }
    
    particlesRef.current = particles;
    animateParticles();
  };
  
  // Create audio-reactive particles
  const createAudioParticles = (audioData: Uint8Array) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const particles = particlesRef.current.slice();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Add new particles based on audio data
    for (let i = 0; i < 5; i++) {
      const index = Math.floor(Math.random() * audioData.length);
      const value = audioData[index] / 255;
      
      if (value > 0.1) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 100;
        
        particles.push({
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
          size: value * 50 + 10,
          speedX: Math.cos(angle) * value * 3,
          speedY: Math.sin(angle) * value * 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: value * 0.8 + 0.2,
          life: value * 200 + 100,
        });
      }
    }
    
    // Limit the number of particles for performance
    while (particles.length > 200) {
      particles.shift();
    }
    
    particlesRef.current = particles;
  };
  
  // Animate the particles
  const animateParticles = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Clear the canvas with a semi-transparent black for trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const particles = particlesRef.current.slice();
    const newParticles: Particle[] = [];
    
    // Update and draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      
      // Update position
      p.x += p.speedX;
      p.y += p.speedY;
      
      // Bounce off walls
      if (p.x < 0 || p.x > canvas.width) p.speedX *= -0.9;
      if (p.y < 0 || p.y > canvas.height) p.speedY *= -0.9;
      
      // Slowly reduce speed (friction)
      p.speedX *= 0.99;
      p.speedY *= 0.99;
      
      // Reduce life
      p.life--;
      
      // Fade out as life decreases
      p.opacity = Math.min(p.life / 100, 1) * 0.7;
      
      // Only keep particles that are still alive
      if (p.life > 0) {
        // Draw the particle
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        newParticles.push(p);
      }
    }
    
    // Update the particles array
    particlesRef.current = newParticles;
    
    // Continue animation
    animationRef.current = requestAnimationFrame(animateParticles);
  };
  
  // Update audio visualization
  const updateVisualization = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    createAudioParticles(dataArrayRef.current);
    
    // Continue animation
    animationRef.current = requestAnimationFrame(updateVisualization);
  };
  
  // Toggle recording state
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      // Switch back to idle animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      createIdleParticles();
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Set up audio context and analyzer
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        
        // Configure analyzer
        analyserRef.current.fftSize = 256;
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
        
        // Create media recorder
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // This is where you would normally send the audio file for processing
          console.log("Recording stopped, audio URL:", audioUrl);
          
          // Clean up
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorderRef.current.start();
        
        // Switch to audio visualization
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        updateVisualization();
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    }
    
    setIsRecording(!isRecording);
  };

  return (
    <div className="mt-8 mx-auto w-full max-w-4xl px-4">
      <div className="visualizer-container" ref={containerRef}>
        <canvas ref={canvasRef} className="w-full h-full"></canvas>
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

export default ParticleVisualizer;
