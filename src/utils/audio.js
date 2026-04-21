const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;

export const playSound = (type) => {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  if (type === 'laser') {
    // High-pitched rapid sweep down (pew)
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
    oscillator.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.1); 
    
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } else if (type === 'boom') {
    // Low-pitched noise/sawtooth explosion
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(100, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
  } else if (type === 'start') {
    // Start arpeggio
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(554, audioCtx.currentTime + 0.05);
    oscillator.frequency.setValueAtTime(659, audioCtx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2);
  }
};
