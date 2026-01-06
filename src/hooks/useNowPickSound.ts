import { useCallback, useRef } from 'react';

// Creates a subtle, futuristic "boost" sound for NowPick profiles
export const useNowPickSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastPlayedRef = useRef<number>(0);

  const playNowPickSound = useCallback(() => {
    // Debounce: don't play more than once per 500ms
    const now = Date.now();
    if (now - lastPlayedRef.current < 500) return;
    lastPlayedRef.current = now;

    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const currentTime = ctx.currentTime;

      // Master gain - keep it subtle
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.15, currentTime);
      masterGain.connect(ctx.destination);

      // Quick "whoosh" sweep up effect
      const sweepOsc = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      
      sweepOsc.type = 'sine';
      sweepOsc.frequency.setValueAtTime(200, currentTime);
      sweepOsc.frequency.exponentialRampToValueAtTime(800, currentTime + 0.15);
      
      sweepGain.gain.setValueAtTime(0, currentTime);
      sweepGain.gain.linearRampToValueAtTime(0.3, currentTime + 0.05);
      sweepGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.2);
      
      sweepOsc.connect(sweepGain);
      sweepGain.connect(masterGain);
      
      sweepOsc.start(currentTime);
      sweepOsc.stop(currentTime + 0.25);

      // Soft "ding" accent note
      const dingOsc = ctx.createOscillator();
      const dingGain = ctx.createGain();
      
      dingOsc.type = 'sine';
      dingOsc.frequency.setValueAtTime(880, currentTime + 0.1); // A5
      
      dingGain.gain.setValueAtTime(0, currentTime + 0.1);
      dingGain.gain.linearRampToValueAtTime(0.25, currentTime + 0.12);
      dingGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.35);
      
      dingOsc.connect(dingGain);
      dingGain.connect(masterGain);
      
      dingOsc.start(currentTime + 0.1);
      dingOsc.stop(currentTime + 0.4);

      // Subtle harmonic shimmer
      const shimmerOsc = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      
      shimmerOsc.type = 'triangle';
      shimmerOsc.frequency.setValueAtTime(1760, currentTime + 0.15); // A6
      
      shimmerGain.gain.setValueAtTime(0, currentTime + 0.15);
      shimmerGain.gain.linearRampToValueAtTime(0.1, currentTime + 0.17);
      shimmerGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.35);
      
      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(masterGain);
      
      shimmerOsc.start(currentTime + 0.15);
      shimmerOsc.stop(currentTime + 0.4);

    } catch (error) {
      console.log('Could not play NowPick sound:', error);
    }
  }, []);

  return { playNowPickSound };
};
