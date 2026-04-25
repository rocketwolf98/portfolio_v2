import { useState, useEffect } from 'react';

const KONAMI_CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
  'Enter'
];

export function useKonamiCode(callback) {
  const [inputIndex, setInputIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key;
      
      // If the key matches the current position in the sequence
      if (key === KONAMI_CODE[inputIndex] || key.toLowerCase() === KONAMI_CODE[inputIndex].toLowerCase()) {
        const nextIndex = inputIndex + 1;
        
        if (nextIndex === KONAMI_CODE.length) {
          // Sequence completed
          callback();
          setInputIndex(0); // Reset for next time
        } else {
          setInputIndex(nextIndex);
        }
      } else {
        // Reset if they hit the wrong key, but allow immediate restart if it matches first key
        if (key === KONAMI_CODE[0] || key.toLowerCase() === KONAMI_CODE[0].toLowerCase()) {
          setInputIndex(1);
        } else {
          setInputIndex(0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputIndex, callback]);
}
