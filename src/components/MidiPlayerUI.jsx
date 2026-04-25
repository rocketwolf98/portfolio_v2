import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Repeat, FolderPlus, ListMusic, UploadCloud, Shuffle, X, Sliders, Mic } from 'lucide-react';
import { midiPlayer } from '../utils/midiPlayerEngine';

export default function MidiPlayerUI({ isIdle }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showMixer, setShowMixer] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isInitializing, setIsInitializing] = useState(midiPlayer.isInitializing);
  const [time, setTime] = useState(0);

  // Mixer States
  const [volume, setVolume] = useState(midiPlayer.volume);
  const [reverb, setReverb] = useState(midiPlayer.reverb);
  const [chorus, setChorus] = useState(midiPlayer.chorus);
  const [polyphony, setPolyphony] = useState(midiPlayer.polyphony);
  
  // Karaoke state
  const [hasLyrics, setHasLyrics] = useState(false);
  const [isKaraoke, setIsKaraoke] = useState(false);
  const [lyricLines, setLyricLines] = useState({ current: '', next: '', lineIndex: -1, charEnd: 0 });
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleStateChange = (playing) => setIsPlaying(playing);
    const handlePlaylistChange = (list, index) => {
      setPlaylist([...list]);
      setCurrentIndex(index);
    };
    const handleShuffleChange = (shuffle) => setIsShuffle(shuffle);
    const handleTimeUpdate = (t) => setTime(t);

    midiPlayer.on('stateChange', handleStateChange);
    midiPlayer.on('playlistChange', handlePlaylistChange);
    midiPlayer.on('shuffleChange', handleShuffleChange);
    midiPlayer.on('timeUpdate', handleTimeUpdate);
    midiPlayer.on('initStatus', setIsInitializing);
    
    const handleMixerChange = (values) => {
      setVolume(values.volume);
      setReverb(values.reverb);
      setChorus(values.chorus);
      setPolyphony(values.polyphony);
    };
    midiPlayer.on('mixerChange', handleMixerChange);

    const handleHasLyrics = (v) => { setHasLyrics(v); if (!v) setIsKaraoke(false); };
    midiPlayer.on('hasLyrics', handleHasLyrics);

    const handleLyricLine = ({ next, current, lineIndex, charEnd }) => {
      setLyricLines({ next, current, lineIndex, charEnd });
    };
    midiPlayer.on('lyricLine', handleLyricLine);

    return () => {
      midiPlayer.off('stateChange', handleStateChange);
      midiPlayer.off('playlistChange', handlePlaylistChange);
      midiPlayer.off('shuffleChange', handleShuffleChange);
      midiPlayer.off('timeUpdate', handleTimeUpdate);
      midiPlayer.off('initStatus', setIsInitializing);
      midiPlayer.off('mixerChange', handleMixerChange);
      midiPlayer.off('hasLyrics', handleHasLyrics);
      midiPlayer.off('lyricLine', handleLyricLine);
    };
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.name.endsWith('.mid') || file.name.endsWith('.midi') || file.name.endsWith('.kar')
    );
    
    if (files.length > 0) {
      await midiPlayer.addFiles(files);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      await midiPlayer.addFiles(files);
    }
    // Reset input so the same files can be selected again if needed
    e.target.value = null;
  };

  const currentTrack = currentIndex >= 0 && currentIndex < playlist.length 
    ? playlist[currentIndex] 
    : null;

  const formatTime = (seconds) => {
    const totalSeconds = Math.max(0, Math.floor(seconds || 0));
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const btnBaseClass = "w-16 h-16 rounded-full border flex items-center justify-center transition-colors duration-300 shrink-0";
  const btnInactiveClass = "border-white text-white hover:bg-white hover:text-black";
  const btnActiveClass = "border-accent text-accent hover:bg-accent hover:text-white";

  return (
    <div 
      className="absolute inset-0 z-50 pointer-events-auto"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => {
        setShowPlaylist(false);
        setShowMixer(false);
      }}
    >
      {/* Drag & Drop Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center border-4 border-accent border-dashed m-4 rounded-xl z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <UploadCloud className="w-24 h-24 text-accent mb-4" />
            <h2 className="text-white font-serif text-3xl">Drop MIDI files here</h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Karaoke Lyric Overlay */}
      <AnimatePresence>
        {isKaraoke && (lyricLines.current || lyricLines.next) && (
          <motion.div
            className="absolute inset-x-0 bottom-40 flex flex-col items-center gap-4 pointer-events-none z-40 px-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Current line — bright accent with highlight (on top) */}
            <AnimatePresence mode="wait">
              <motion.p
                key={lyricLines.lineIndex}
                className="font-serif text-3xl md:text-[40px] text-center tracking-wide drop-shadow-lg"
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.95 }}
                transition={{ duration: 0.25 }}
              >
                <span className="text-accent">{lyricLines.current.substring(0, lyricLines.charEnd)}</span>
                <span className="text-white">{lyricLines.current.substring(lyricLines.charEnd)}</span>
              </motion.p>
            </AnimatePresence>

            {/* Next line — dim (below) */}
            <AnimatePresence mode="wait">
              <motion.p
                key={lyricLines.next}
                className="font-serif text-2xl md:text-[28px] text-white/40 text-center tracking-wide drop-shadow-lg"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                {lyricLines.next}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title / Current Track */}
      <AnimatePresence>
        {!isIdle && currentTrack && (
          <motion.div
            className="absolute top-12 left-12 pointer-events-none z-30 max-w-[80%]"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="font-serif text-[48px] text-white leading-tight tracking-wide drop-shadow-md truncate">
              now <span className="text-accent italic">{currentTrack.name}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Empty State Prompt / Timer */}
      <AnimatePresence>
        {!isIdle && (
           <motion.div
           className="absolute bottom-12 left-12 pointer-events-none z-30 flex items-center h-16"
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
         >
           {isInitializing ? (
             <p className="text-accent font-sans text-xl md:text-[32px] tracking-[1.28px] uppercase animate-pulse">
               Initializing MIDI Engine...
             </p>
           ) : playlist.length === 0 ? (
             <p className="text-[#808080] font-sans text-xl md:text-[32px] tracking-[1.28px] uppercase">
               drag and drop .mid / .kar file to play
             </p>
           ) : (
             <p className="text-[#808080] font-sans text-xl md:text-[32px] tracking-[1.28px]">
               {formatTime(time)}
             </p>
           )}
         </motion.div>
        )}
      </AnimatePresence>

      {/* Main Controls (Bottom Right) */}
      <AnimatePresence>
        {!isIdle && (
          <motion.div
            className="absolute bottom-12 right-12 flex items-center gap-4 z-40"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className={`${btnBaseClass} ${isPlaying ? btnActiveClass : btnInactiveClass} disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white disabled:border-white`}
              onClick={() => isPlaying ? midiPlayer.pause() : midiPlayer.play()}
              disabled={playlist.length === 0}
            >
              {isPlaying ? <Pause className="w-8 h-8 fill-current" strokeWidth={1} /> : <Play className="w-8 h-8 fill-current translate-x-1" strokeWidth={1} />}
            </button>
            
            <button 
              className={`${btnBaseClass} ${btnInactiveClass} disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white disabled:border-white`}
              onClick={() => midiPlayer.prev()}
              disabled={playlist.length === 0}
            >
              <SkipBack className="w-8 h-8" strokeWidth={1} />
            </button>
            
            <button 
              className={`${btnBaseClass} ${btnInactiveClass} disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white disabled:border-white`}
              onClick={() => midiPlayer.next()}
              disabled={playlist.length === 0}
            >
              <SkipForward className="w-8 h-8" strokeWidth={1} />
            </button>

            <button 
              className={`${btnBaseClass} ${isLooping ? btnActiveClass : btnInactiveClass}`}
              onClick={() => setIsLooping(midiPlayer.toggleLoop())}
            >
              <Repeat className="w-8 h-8" strokeWidth={1} />
            </button>

            <button 
              className={`${btnBaseClass} ${isShuffle ? btnActiveClass : btnInactiveClass}`}
              onClick={() => setIsShuffle(midiPlayer.toggleShuffle())}
            >
              <Shuffle className="w-8 h-8" strokeWidth={1} />
            </button>

            <button 
              className={`${btnBaseClass} ${btnInactiveClass}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <FolderPlus className="w-8 h-8" strokeWidth={1} />
            </button>
            
            <button 
              className={`${btnBaseClass} ${showPlaylist ? btnActiveClass : btnInactiveClass}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowPlaylist(!showPlaylist);
                setShowMixer(false);
              }}
            >
              <ListMusic className="w-8 h-8" strokeWidth={1} />
            </button>

            <button 
              className={`${btnBaseClass} ${showMixer ? btnActiveClass : btnInactiveClass}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowMixer(!showMixer);
                setShowPlaylist(false);
              }}
            >
              <Sliders className="w-8 h-8" strokeWidth={1} />
            </button>

            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept=".mid,.midi,.kar"
              className="hidden"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playlist Menu (Above PBC) */}
      <AnimatePresence>
        {showPlaylist && !isIdle && (
          <motion.div
            className="absolute right-12 bottom-[calc(3rem+80px)] w-[544px] max-w-[calc(100vw-6rem)] max-h-[60vh] bg-[#131313]/95 backdrop-blur-md z-40 flex flex-col rounded-xl overflow-hidden border border-white/10 shadow-2xl"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-[75px] bg-[#131313] px-10 flex items-center">
              <h3 className="font-sans font-normal text-white text-[20px] tracking-[0.8px] uppercase">Playlist</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-2 custom-scrollbar">
              {playlist.length === 0 ? (
                <p className="text-white/40 text-sm italic text-center mt-10">Empty playlist</p>
              ) : (
                playlist.map((track, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-lg cursor-pointer transition-colors duration-200 flex items-center gap-4 group ${idx === currentIndex ? 'bg-white/10' : 'hover:bg-white/5'}`}
                    onClick={() => midiPlayer.playTrack(idx)}
                  >
                    <div className="w-6 flex justify-center text-white/30 text-xs">
                      {idx === currentIndex && isPlaying ? (
                        <div className="flex items-end gap-0.5 h-3">
                          <motion.div className="w-1 bg-accent rounded-t" animate={{ height: ['40%', '100%', '60%'] }} transition={{ repeat: Infinity, duration: 0.5 }} />
                          <motion.div className="w-1 bg-accent rounded-t" animate={{ height: ['80%', '30%', '90%'] }} transition={{ repeat: Infinity, duration: 0.6 }} />
                          <motion.div className="w-1 bg-accent rounded-t" animate={{ height: ['50%', '80%', '40%'] }} transition={{ repeat: Infinity, duration: 0.4 }} />
                        </div>
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <p className={`text-sm truncate flex-1 ${idx === currentIndex ? 'text-accent' : 'text-white/80 group-hover:text-white'}`}>
                      {track.name}
                    </p>

                    <button 
                      className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-red-500 transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        midiPlayer.removeTrack(idx);
                      }}
                    >
                      <X className="w-4 h-4" strokeWidth={1} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mixer Menu (Above PBC) */}
      <AnimatePresence>
        {showMixer && !isIdle && (
          <motion.div
            className="absolute right-12 bottom-[calc(3rem+80px)] w-[400px] max-w-[calc(100vw-6rem)] bg-[#131313]/95 backdrop-blur-md z-40 flex flex-col rounded-xl overflow-hidden border border-white/10 shadow-2xl p-8 space-y-8"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-sans font-normal text-white text-[20px] tracking-[0.8px] uppercase mb-2">MIDI Settings</h3>
            
            {/* Volume */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm uppercase tracking-wider">
                <span className="text-white/60">Master Volume</span>
                <span className="text-accent">{Math.round(volume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={volume} 
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  midiPlayer.setVolume(val);
                }}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            {/* Reverb */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm uppercase tracking-wider">
                <span className="text-white/60">Reverb Level</span>
                <span className="text-accent">{Math.round(reverb * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={reverb} 
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setReverb(val);
                  midiPlayer.setReverb(val);
                }}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            {/* Chorus */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm uppercase tracking-wider">
                <span className="text-white/60">Chorus Level</span>
                <span className="text-accent">{Math.round(chorus * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={chorus} 
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setChorus(val);
                  midiPlayer.setChorus(val);
                }}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            {/* Polyphony */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm uppercase tracking-wider">
                <span className="text-white/60">Max Polyphony</span>
                <span className="text-accent">{polyphony} Voices</span>
              </div>
              <input 
                type="range" min="32" max="512" step="32" 
                value={polyphony} 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setPolyphony(val);
                  midiPlayer.setPolyphony(val);
                }}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>

            {/* Karaoke Mode — always visible, disabled when no lyrics detected */}
            <div className="pt-2 space-y-1">
              <button
                disabled={!hasLyrics}
                onClick={() => setIsKaraoke(midiPlayer.toggleKaraoke())}
                className={`w-full py-3 border font-sans text-sm tracking-[0.2em] uppercase transition-all duration-300 rounded-lg flex items-center justify-center gap-3 ${
                  !hasLyrics
                    ? 'border-white/10 text-white/20 cursor-not-allowed'
                    : isKaraoke
                      ? 'border-accent bg-accent text-white'
                      : 'border-accent/50 text-accent hover:bg-accent hover:text-white'
                }`}
              >
                <Mic className="w-4 h-4" />
                {isKaraoke ? 'Karaoke Mode On' : 'Karaoke Mode'}
              </button>
              {!hasLyrics && (
                <p className="text-white/25 text-xs text-center tracking-wider">
                  No lyrics found in this MIDI
                </p>
              )}
            </div>

            {/* Reset Button */}
            <div className="pt-4">
              <button
                onClick={() => midiPlayer.resetParameters()}
                className="w-full py-3 border border-accent/50 text-accent font-sans text-sm tracking-[0.2em] uppercase hover:bg-accent hover:text-white transition-all duration-300 rounded-lg"
              >
                Reset to Defaults
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
