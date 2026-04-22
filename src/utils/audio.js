import { WorkletSynthesizer, DEFAULT_SYNTH_CONFIG } from 'spessasynth_lib';
import processorUrl from 'spessasynth_lib/dist/spessasynth_processor.min.js?url';
import sf2Url from '../assets/soundfont/GeneralUser GS 1.35.sf2?url';

let synth = null;
let audioCtx = null;
let initPromise = null;
let ambientInterval = null;

const initAudio = async () => {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    await audioCtx.audioWorklet.addModule(processorUrl);
    synth = new WorkletSynthesizer(audioCtx, DEFAULT_SYNTH_CONFIG);
    synth.connect(audioCtx.destination);
    
    const response = await fetch(sf2Url);
    const data = await response.arrayBuffer();
    await synth.soundBankManager.addSoundBank(data, 'gs-font');
    await synth.isReady;
    
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    
    return synth;
  })();

  return initPromise;
};

export const startAmbient = async () => {
  const s = await initAudio();
  if (ambientInterval) return;

  const channel = 15;
  const seashoreChannel = 11;
  
  // Setup Pad
  s.programChange(channel, 89); // Pad 1 (New Age)
  s.controllerChange(channel, 7, 80); // Increased Volume (was 40)
  s.controllerChange(channel, 91, 100); // Reverb depth

  // Setup Seashore
  s.programChange(seashoreChannel, 122); // Seashore
  s.controllerChange(seashoreChannel, 7, 60); // Increased volume (was 30)
  
  const playSeashore = () => {
    s.noteOn(seashoreChannel, 60, 80); // Increased velocity (was 60)
  };
  playSeashore();
  const seashoreInterval = setInterval(playSeashore, 10000); // Re-trigger every 10s

  const playDroneNote = () => {
    const notes = [36, 43, 46, 48]; // C2, G2, Bb2, C3
    const note = notes[Math.floor(Math.random() * notes.length)];
    const velocity = 50 + Math.random() * 30; // Increased velocity (was 30-50)
    const duration = 4000 + Math.random() * 4000;

    s.noteOn(channel, note, velocity);
    setTimeout(() => s.noteOff(channel, note), duration);
  };

  // 3D Panning effect for Seashore
  let pan = 64;
  let panDirection = 1;
  const panInterval = setInterval(() => {
    pan += panDirection * 2;
    if (pan >= 127 || pan <= 0) panDirection *= -1;
    s.controllerChange(seashoreChannel, 10, pan); // CC 10 is Pan
  }, 100);

  playDroneNote();
  const droneInterval = setInterval(playDroneNote, 5000);
  
  ambientInterval = { droneInterval, panInterval, seashoreInterval, seashoreChannel };
};

export const stopAmbient = () => {
  if (ambientInterval) {
    clearInterval(ambientInterval.droneInterval);
    clearInterval(ambientInterval.panInterval);
    clearInterval(ambientInterval.seashoreInterval);
    if (synth) {
      synth.stopAll(false);
    }
    ambientInterval = null;
  }
  if (synth) {
    synth.stopAll(false);
  }
};

export const playSound = async (type, spatial = null) => {
  try {
    const s = await initAudio();
    if (!s) return;

    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    // Default spatial settings
    let pan = 64; // Center
    let volume = 100; // Default

    if (spatial) {
      // Panning: X position from -30 to 30 mapped to 0-127
      pan = Math.max(0, Math.min(127, ((spatial.x + 30) / 60) * 127));
      
      // Volume: Distance (Z position). Camera is at 15.
      // Asteroids spawn at -150 and pass camera at 15.
      const dist = Math.abs(15 - spatial.z);
      volume = Math.max(20, Math.min(127, 127 - (dist / 1.5)));
    }

    if (type === 'laser') {
      const channel = 1;
      s.controllerChange(channel, 10, pan);
      s.controllerChange(channel, 7, volume);
      s.controllerChange(channel, 0, 2); // Laser variation
      s.programChange(channel, 127);
      s.noteOn(channel, 72, 90);
      setTimeout(() => s.noteOff(channel, 72), 150);
      
    } else if (type === 'boom') {
      const channel = 2;
      s.controllerChange(channel, 10, pan);
      s.controllerChange(channel, 7, volume);
      s.controllerChange(channel, 0, 3); // Explosion variation
      s.programChange(channel, 127);
      s.noteOn(channel, 40, 110);
      setTimeout(() => s.noteOff(channel, 40), 1500);
      
    } else if (type === 'alarm') {
      const channel = 14;
      s.programChange(channel, 80); // Square Lead
      const pulse = (count) => {
        if (count <= 0) return;
        s.noteOn(channel, 84, 100);
        setTimeout(() => {
          s.noteOff(channel, 84);
          setTimeout(() => pulse(count - 1), 100);
        }, 100);
      };
      pulse(6); // 6 rapid pulses
      
    } else if (type === 'warp') {
      const channel = 13;
      s.controllerChange(channel, 0, 7); // Bank 7
      s.programChange(channel, 125);     // Jetplane
      s.noteOn(channel, 60, 100);
      
      // Pitch bend up
      let bend = 8192;
      const bendInterval = setInterval(() => {
        bend += 150;
        if (bend >= 16383) {
          clearInterval(bendInterval);
          s.noteOff(channel, 60);
        }
        s.pitchWheel(channel, bend);
      }, 20);

      // Add reverse cymbal build-up
      const cymChannel = 12;
      s.programChange(cymChannel, 119); // Reverse Cymbal
      s.noteOn(cymChannel, 60, 100);

    } else if (type === 'start') {
      const channel = 3;
      s.controllerChange(channel, 0, 1); // Bank 1
      s.programChange(channel, 124);     // Telephone 2
      
      const sequence = [0, 150, 300];
      sequence.forEach((time) => {
        setTimeout(() => {
          s.noteOn(channel, 72, 100);
          setTimeout(() => s.noteOff(channel, 72), 100);
        }, time);
      });
    }
  } catch (err) {
    console.warn('Audio play failed:', err);
  }
};
