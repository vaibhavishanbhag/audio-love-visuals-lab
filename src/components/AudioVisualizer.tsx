
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

const AudioVisualizer = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<number[]>(Array(50).fill(5));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Function to toggle recording state
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
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
        updateVisualizer();
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    }
    
    setIsRecording(!isRecording);
  };
  
  // Function to update visualizer
  const updateVisualizer = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Sample data from frequency data for visualization
    const newData: number[] = [];
    const step = Math.floor(dataArrayRef.current.length / 50);
    
    for (let i = 0; i < 50; i++) {
      const index = i * step;
      // Scale value between 3 and 100 for better visualization
      newData[i] = 3 + ((dataArrayRef.current[index] / 255) * 97);
    }
    
    setAudioData(newData);
    animationRef.current = requestAnimationFrame(updateVisualizer);
  };
  
  // Generate idle animation when not recording
  useEffect(() => {
    if (!isRecording) {
      let idleAnimationId: number;
      
      const generateIdleAnimation = () => {
        const idleData = Array(50).fill(0).map(() => {
          // Generate random heights between 5 and 20
          return Math.floor(Math.random() * 15) + 5;
        });
        setAudioData(idleData);
        idleAnimationId = requestAnimationFrame(generateIdleAnimation);
      };
      
      idleAnimationId = requestAnimationFrame(generateIdleAnimation);
      
      return () => {
        cancelAnimationFrame(idleAnimationId);
      };
    }
  }, [isRecording]);

  return (
    <div className="mt-8 mx-auto w-full max-w-4xl px-4">
      <div className="visualizer-container">
        <div className="flex items-end justify-center h-full w-full px-4 pb-2">
          {audioData.map((value, index) => (
            <div
              key={index}
              className="visualizer-bar"
              style={{ height: `${value}%` }}
            />
          ))}
        </div>
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

export default AudioVisualizer;
