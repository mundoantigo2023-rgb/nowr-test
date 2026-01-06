import { useCallback, useRef } from 'react';

// Creates a celebratory match sound using Web Audio API
export const useMatchSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playMatchSound = useCallback((isPrime: boolean = false) => {
    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      // Master gain for overall volume
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.3, now);
      masterGain.connect(ctx.destination);

      // Celebratory chord progression (major chord arpeggio)
      const frequencies = isPrime 
        ? [523.25, 659.25, 783.99, 1046.5, 1318.5] // C5 major with higher octave for Prime
        : [392, 493.88, 587.33, 783.99]; // G4 major chord

      frequencies.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // Use sine wave for a soft, pleasant tone
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, now);

        // Stagger the notes for arpeggio effect
        const noteDelay = index * (isPrime ? 0.08 : 0.1);
        const noteDuration = isPrime ? 0.6 : 0.5;

        // Envelope: attack, sustain, release
        gainNode.gain.setValueAtTime(0, now + noteDelay);
        gainNode.gain.linearRampToValueAtTime(0.4, now + noteDelay + 0.05);
        gainNode.gain.setValueAtTime(0.4, now + noteDelay + noteDuration - 0.1);
        gainNode.gain.linearRampToValueAtTime(0, now + noteDelay + noteDuration);

        oscillator.connect(gainNode);
        gainNode.connect(masterGain);

        oscillator.start(now + noteDelay);
        oscillator.stop(now + noteDelay + noteDuration);
      });

      // Add a subtle "shimmer" effect for Prime users
      if (isPrime) {
        const shimmerFreqs = [1567.98, 2093, 2637]; // Higher harmonics
        shimmerFreqs.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          const delay = 0.3 + index * 0.1;
          gain.gain.setValueAtTime(0, now + delay);
          gain.gain.linearRampToValueAtTime(0.15, now + delay + 0.05);
          gain.gain.linearRampToValueAtTime(0, now + delay + 0.4);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + delay);
          osc.stop(now + delay + 0.5);
        });
      }

    } catch (error) {
      console.log('Could not play match sound:', error);
    }
  }, []);

  return { playMatchSound };
};
