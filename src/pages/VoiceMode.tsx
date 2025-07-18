import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useChat, Message } from '@/contexts/ChatContext';
import './VoiceMode.css';

declare global {
  interface SpeechRecognitionEvent extends Event {
    results: ArrayLike<{ 0: { transcript: string } }>;
  }
  interface SpeechRecognition {
    lang: string;
    interimResults: boolean;
    onresult: ((e: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
  }
  interface Window {
    SpeechRecognition?: { new(): SpeechRecognition };
    webkitSpeechRecognition?: { new(): SpeechRecognition };
  }
}

const VoiceMode: React.FC = () => {
  const { sendMessage, currentConversation, isTyping } = useChat();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);
  const [waitingReply, setWaitingReply] = useState(false);
  const lastMessageRef = useRef<Message | null>(null);

  useEffect(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;
    const recog = new SpeechRecognitionCtor();
    recog.lang = 'en-US';
    recog.interimResults = false;
    recog.onresult = (e: SpeechRecognitionEvent) => {
      const text = Array.from(e.results).map((r) => r[0].transcript).join('');
      if (text.trim()) {
        sendMessage(text.trim());
        setWaitingReply(true);
      }
    };
    recog.onend = () => {
      if (listening) recog.start();
    };
    recognitionRef.current = recog;
  }, [sendMessage, listening]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    let frame = 0;
    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const radius = Math.min(width, height) * 0.25 * (listening ? 1.1 + 0.05 * Math.sin(frame / 5) : 1);
      const x = width / 2;
      const y = height / 2;
      const gradient = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
      gradient.addColorStop(0, '#9048f8');
      gradient.addColorStop(1, '#1b052c');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      frame += 1;
      requestAnimationFrame(draw);
    };
    draw();
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [listening]);

  useEffect(() => {
    if (waitingReply && !isTyping && currentConversation) {
      const last = currentConversation.messages[currentConversation.messages.length - 1];
      if (last && last.role === 'assistant' && last !== lastMessageRef.current) {
        lastMessageRef.current = last;
        const utter = new SpeechSynthesisUtterance(last.content);
        utter.lang = 'en-US';
        window.speechSynthesis.speak(utter);
        setWaitingReply(false);
      }
    }
  }, [waitingReply, isTyping, currentConversation]);

  const start = () => {
    recognitionRef.current?.start();
    setListening(true);
  };
  const stop = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };
  const toggle = useCallback(() => {
    if (listening) {
      stop();
    } else {
      start();
    }
  }, [listening]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [listening, toggle]);

  return (
    <div className={`voice-mode ${listening ? 'active' : ''}`} onClick={toggle}>
      <canvas ref={canvasRef} />
      <div className="voice-name">NYX VOICE</div>
      <div className="voice-hint">{listening ? 'Listening...' : 'Tap or press Space to speak'}</div>
    </div>
  );
};

export default VoiceMode;
