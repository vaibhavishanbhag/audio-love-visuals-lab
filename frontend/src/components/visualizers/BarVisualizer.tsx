
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface BarVisualizerProps {
  onResultsUpdate: (data: {     appliedHtml: string;
    codeSnippet: string;
    fullHtml: string; }) => void;
}

const BarVisualizer = ({ onResultsUpdate }: BarVisualizerProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<number[]>(Array(50).fill(5));
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

  const updateVisualizer = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    const newData: number[] = [];
    const step = Math.floor(dataArrayRef.current.length / 50);

    for (let i = 0; i < 50; i++) {
      const index = i * step;
      newData[i] = 3 + ((dataArrayRef.current[index] / 255) * 97);
    }

    setAudioData(newData);
    animationRef.current = requestAnimationFrame(updateVisualizer);
  };

  useEffect(() => {
    if (!isRecording) {
      let idleAnimationId: number;

      const idleAnimation = () => {
        const idleData = Array(50).fill(0).map(() => Math.floor(Math.random() * 15) + 5);
        setAudioData(idleData);
        idleAnimationId = requestAnimationFrame(idleAnimation);
      };

      idleAnimationId = requestAnimationFrame(idleAnimation);
      return () => cancelAnimationFrame(idleAnimationId);
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

export default BarVisualizer;
