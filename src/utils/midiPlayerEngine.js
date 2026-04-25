import { getSynth, getAudioContext } from './audio';
import { Sequencer } from 'spessasynth_lib';

class MidiPlayerEngine {
  constructor() {
    this.sequencer = null;
    this.playlist = [];
    this.currentIndex = -1;
    
    // Callbacks (supporting multiple listeners)
    this.listeners = {
      stateChange: new Set(),
      timeUpdate: new Set(),
      playlistChange: new Set(),
      trackWarping: new Set(),
      shuffleChange: new Set(),
      initStatus: new Set(),
      mixerChange: new Set(),
      lyricLine: new Set(),
      hasLyrics: new Set()
    };
    
    this.isPlaying = false;
    this.isLooping = false;
    this.hasEverPlayed = false;
    this.isShuffle = false;
    this.currentTime = 0;
    this.duration = 0;
    
    this.synth = null;
    this.updateInterval = null;
    this.isTransitioning = false;
    this.transitionTimeout = null;
    this.isInitializing = false;
    this.loadingPromise = null;
    this.isPlaybackLoading = false;

    // Karaoke state
    this.karaokeEnabled = false;
    this.lyrics = [];
    this._decoder = new TextDecoder('utf-8');
    this._karaokeLineBuffer = '';
    this._karaokePrevLine  = '';
    this._karaokeLines = [];         // Array of full sentence strings
    this._karaokeSyllableMap = [];   // Maps syllable index to line index
    this._currentLineIndex = -1;
    this._lastCharEnd = 0;

    // MIDI Parameters
    this.volume = 0.5;
    this.reverb = 0.5;
    this.chorus = 0.5;
    this.polyphony = 128;
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].add(callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].delete(callback);
    }
  }

  emit(event, ...args) {
    if (this.listeners[event]) {
      for (const cb of this.listeners[event]) {
        cb(...args);
      }
    }
  }

  async init() {
    if (this.synth) return;
    if (this.isInitializing) return;
    
    this.isInitializing = true;
    this.emit('initStatus', true);
    
    try {
      this.synth = await getSynth();
      this.applyParameters();
    } finally {
      this.isInitializing = false;
      this.emit('initStatus', false);
    }
  }

  applyParameters() {
    if (!this.synth) return;
    // SpessaSynth v4.x uses these parameter names
    this.synth.setMasterParameter('masterGain', this.volume);
    this.synth.setMasterParameter('reverbGain', this.reverb);
    this.synth.setMasterParameter('chorusGain', this.chorus);
    this.synth.setMasterParameter('voiceCap', this.polyphony);
  }

  resetParameters() {
    this.volume = 0.5;
    this.reverb = 0.5;
    this.chorus = 0.5;
    this.polyphony = 128;
    this.applyParameters();
    this.emit('mixerChange', {
      volume: this.volume,
      reverb: this.reverb,
      chorus: this.chorus,
      polyphony: this.polyphony
    });
  }

  handleSongEnd() {
    if (this.isLooping) {
      this.transitionToTrack(this.currentIndex);
    } else {
      this.next();
    }
  }

  async addFiles(files) {
    await this.init();
    const oldLength = this.playlist.length;
    
    for (const file of files) {
      if (file.name.toLowerCase().endsWith('.mid') || file.name.toLowerCase().endsWith('.midi') || file.name.toLowerCase().endsWith('.kar')) {
        const arrayBuffer = await file.arrayBuffer();
        this.playlist.push({
          name: file.name.replace(/\.(midi?|kar)$/i, ''),
          binary: arrayBuffer
        });
      }
    }
    
    // Update playlist state immediately so UI shows the tracks
    this.emit('playlistChange', this.playlist, this.currentIndex);
    
    // Automatically play the first newly added track if we weren't playing anything
    // or if we just added the very first track.
    if (this.playlist.length > oldLength && this.currentIndex === -1) {
      await this.playTrack(oldLength);
    }
  }

  async playTrack(index) {
    // Serialize playback requests
    if (this.loadingPromise) {
      await this.loadingPromise;
    }

    this.loadingPromise = (async () => {
      try {
        await this.init();
        this.applyParameters();
    
    if (index < 0 || index >= this.playlist.length) {
      this.stop();
      return;
    }
    
    this.currentIndex = index;
    const track = this.playlist[index];
    this.currentTime = 0;
    this.emit('timeUpdate', 0, 0);
    
    // Load track into sequencer
    if (!this.sequencer) {
      this.sequencer = new Sequencer(this.synth);
      // Listen for song end
      this.synth.eventHandler.addEvent("songEnded", "midiPlayer", () => {
        this.handleSongEnd();
      });
    }
    
    this.sequencer.loadNewSongList([{ binary: track.binary }]);
    
    // --- Lyric / text detection ---
    // Reset hasLyrics for the new track
    this.emit('hasLyrics', false);

    this.sequencer.eventHandler.addEvent('songChange', 'lyricDetector', (midiData) => {
      this.sequencer.eventHandler.removeEvent('songChange', 'lyricDetector');
      
      const hasLyricEvents = !!(midiData?.lyrics?.length);
      if (hasLyricEvents) {
        this._prepareKaraokeLines(midiData.lyrics);
        this.emit('hasLyrics', true);
        return;
      }

      this.sequencer.getMIDI().then(fullMidi => {
        let bestTrack = null;
        let maxEvents = 0;
        
        for (const t of fullMidi.tracks) {
          const events = t.events.filter(m => m.statusByte === 1 || m.statusByte === 5);
          if (events.length > maxEvents) {
            maxEvents = events.length;
            bestTrack = events;
          }
        }

        if (bestTrack) {
          const allLyricEvents = bestTrack.filter(m => {
            const raw = this._decoder.decode(m.data).trim();
            return raw.length >= 1 && !/^[@TLKV#!]/.test(raw);
          });
          
          if (allLyricEvents.length > 0) {
            this._prepareKaraokeLines(allLyricEvents);
            this.emit('hasLyrics', true);
          }
        }
      }).catch(() => {});
    });

    // Real-time lyric delivery
    this.sequencer.eventHandler.addEvent('textEvent', 'karaokePlayer', ({ event, lyricsIndex }) => {
      if (!this.karaokeEnabled || this._karaokeLines.length === 0) return;

      let info = null;
      
      if (lyricsIndex !== -1) {
        info = this._karaokeSyllableMap[lyricsIndex];
      } else if (event.statusByte === 1) {
        // Fallback for non-indexed text events (keep old behavior but emit charEnd: 0)
        const raw = this._decoder.decode(event.data);
        if (/^[@]/.test(raw.trim())) return;
        const isNewLine = raw.startsWith('/');
        const isNewPage = raw.startsWith('\\');
        
        if (isNewPage) {
          this._karaokePrevLine = '';
          this._karaokeLineBuffer = raw.replace(/^[\\]/, '').replace(/\r/g, '');
        } else if (isNewLine) {
          this._karaokePrevLine = this._karaokeLineBuffer;
          this._karaokeLineBuffer = raw.replace(/^\//, '').replace(/\r/g, '');
        } else {
          this._karaokeLineBuffer += raw.replace(/\r/g, '');
        }
        this.emit('lyricLine', { 
          previous: this._karaokePrevLine, 
          current: this._karaokeLineBuffer,
          lineIndex: -1,
          charEnd: this._karaokeLineBuffer.length
        });
        return;
      }

      if (info && (info.lineIdx !== this._currentLineIndex || info.charEnd !== this._lastCharEnd)) {
        this._currentLineIndex = info.lineIdx;
        this._lastCharEnd = info.charEnd;
        const current = this._karaokeLines[info.lineIdx];
        const next = info.lineIdx < this._karaokeLines.length - 1 ? this._karaokeLines[info.lineIdx + 1] : '';
        this.emit('lyricLine', { 
          next, 
          current, 
          lineIndex: info.lineIdx, 
          charEnd: info.charEnd 
        });
      }
    });
    
    // Ensure AudioContext is active (needed because this might be inside a timeout)
    const ctx = await getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    this.sequencer.play();
    this.isPlaying = true;
    this.hasEverPlayed = true;
    
    this.emit('stateChange', this.isPlaying);
    this.emit('playlistChange', this.playlist, this.currentIndex);
    
      this.startUpdating();
      // Force one immediate update
      this.emit('timeUpdate', this.sequencer.currentTime, this.sequencer.duration);
      } finally {
        // Handled by loadingPromise cleanup
      }
    })();
    
    try {
      await this.loadingPromise;
    } finally {
      this.loadingPromise = null;
    }
  }

  async play() {
    if (this.playlist.length === 0) return;
    
    // Ensure AudioContext is active (user gesture)
    const ctx = await getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // If sequencer isn't ready, no track selected, or sequencer was loaded but never
    // successfully played (e.g. AudioContext was suspended during auto-play on file drop),
    // do a full playTrack() to properly initialize playback under this user gesture.
    if (!this.sequencer || this.currentIndex === -1 || !this.hasEverPlayed) {
      await this.playTrack(this.currentIndex === -1 ? 0 : this.currentIndex);
      return;
    }
    
    this.sequencer.play();
    this.isPlaying = true;
    this.emit('stateChange', this.isPlaying);
    this.startUpdating();
  }

  pause() {
    if (!this.sequencer) return;
    this.sequencer.pause();
    this.isPlaying = false;
    this.emit('stateChange', this.isPlaying);
    this.stopUpdating();
  }

  transitionToTrack(index) {
    if (this.isTransitioning) {
      clearTimeout(this.transitionTimeout);
    }
    
    this.pause();
    this.isTransitioning = true;
    
    // Update state immediately for UI feedback during the warp
    this.currentIndex = index;
    this.currentTime = 0;
    this.emit('playlistChange', this.playlist, this.currentIndex);
    this.emit('timeUpdate', 0, 0);
    this.emit('trackWarping');
    
    this.transitionTimeout = setTimeout(() => {
      this.isTransitioning = false;
      this.playTrack(index);
    }, 4000);
  }

  removeTrack(index) {
    if (index < 0 || index >= this.playlist.length) return;
    
    this.playlist.splice(index, 1);
    
    if (index === this.currentIndex) {
      this.stop();
    } else if (index < this.currentIndex) {
      this.currentIndex--;
    }
    
    this.emit('playlistChange', this.playlist, this.currentIndex);
  }

  next() {
    if (this.playlist.length === 0) return;
    let nextIndex;
    if (this.isShuffle) {
      nextIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      nextIndex = this.currentIndex + 1;
      if (nextIndex >= this.playlist.length) {
        nextIndex = 0;
      }
    }
    this.transitionToTrack(nextIndex);
  }

  prev() {
    if (this.playlist.length === 0) return;
    let prevIndex;
    if (this.isShuffle) {
      prevIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      prevIndex = this.currentIndex - 1;
      if (prevIndex < 0) {
        prevIndex = this.playlist.length - 1;
      }
    }
    this.transitionToTrack(prevIndex);
  }

  stop() {
    if (this.sequencer) {
      this.sequencer.pause();
      // Workaround to reset sequencer
      this.sequencer.currentTime = 0;
    }
    this.isPlaying = false;
    this.currentTime = 0;
    this.currentIndex = -1;
    this.emit('stateChange', this.isPlaying);
    this.emit('timeUpdate', this.currentTime, this.duration);
    this.stopUpdating();
  }
  
  toggleLoop() {
    this.isLooping = !this.isLooping;
    return this.isLooping;
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    this.emit('shuffleChange', this.isShuffle);
    return this.isShuffle;
  }

  setVolume(val) {
    this.volume = val;
    this.applyParameters();
  }

  setReverb(val) {
    this.reverb = val;
    this.applyParameters();
  }

  setChorus(val) {
    this.chorus = val;
    this.applyParameters();
  }

  setPolyphony(val) {
    this.polyphony = val;
    this.applyParameters();
  }

  toggleKaraoke() {
    this.karaokeEnabled = !this.karaokeEnabled;
    return this.karaokeEnabled;
  }

  _prepareKaraokeLines(syllableEvents) {
    this._karaokeLines = [];
    this._karaokeSyllableMap = [];
    this._currentLineIndex = -1;
    this._karaokeLineBuffer = '';
    this._karaokePrevLine = '';

    let currentLine = '';
    let lineIdx = 0;

    syllableEvents.forEach((msg, i) => {
      const raw = this._decoder.decode(msg.data);
      const isNewLine = raw.startsWith('/');
      const isNewPage = raw.startsWith('\\');

      if (isNewLine || isNewPage) {
        if (currentLine.trim()) {
          this._karaokeLines.push(currentLine.trim());
          lineIdx = this._karaokeLines.length;
        }
        currentLine = raw.replace(/^[\\\/]/, '').replace(/\r/g, '');
      } else {
        currentLine += raw.replace(/\r/g, '');
      }
      
      this._karaokeSyllableMap[i] = Math.max(0, lineIdx - (isNewLine || isNewPage ? 0 : 0));
      // Adjust: if it's a new line, this syllable belongs to the NEW line
      this._karaokeSyllableMap[i] = currentLine.length > 0 ? this._karaokeLines.length : Math.max(0, this._karaokeLines.length - 1);
    });

    // Push the final line
    if (currentLine.trim()) {
      this._karaokeLines.push(currentLine.trim());
    }

    // Re-map syllables correctly with line index and char end position
    let currentMappingLine = 0;
    let tempLine = '';
    syllableEvents.forEach((msg, i) => {
      const raw = this._decoder.decode(msg.data);
      const cleanSyllable = raw.replace(/^[\\\/]/, '').replace(/\r/g, '');
      
      if ((raw.startsWith('/') || raw.startsWith('\\')) && tempLine.trim()) {
        currentMappingLine++;
        tempLine = '';
      }
      
      tempLine += cleanSyllable;
      this._karaokeSyllableMap[i] = {
        lineIdx: currentMappingLine,
        charEnd: tempLine.trim().length
      };
    });
  }

  startUpdating() {
    this.stopUpdating();
    this.updateInterval = setInterval(() => {
      if (this.sequencer && this.isPlaying) {
        this.currentTime = this.sequencer.currentTime;
        // The spessasynth sequencer duration isn't directly exposed easily without getting the parsed MIDI,
        // so we'll just track current time for the rings.
        this.emit('timeUpdate', this.currentTime, 0); 
      }
    }, 100);
  }

  stopUpdating() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  destroy() {
    this.stop();
    this.playlist = [];
    this.emit('playlistChange', this.playlist, this.currentIndex);
  }
}

export const midiPlayer = new MidiPlayerEngine();
