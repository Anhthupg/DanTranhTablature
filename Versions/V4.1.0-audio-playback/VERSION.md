# V4.1.0 - Audio Playback System

**Release Date:** September 30, 2025
**Major Feature:** Interactive Audio Playback with Visual Feedback

## Overview
V4.1.0 introduces a comprehensive audio playback system as an external controller component, enabling rhythm-accurate playback with synchronized visual feedback across both tablatures.

---

## New Features

### 1. AudioPlaybackController Component (560 lines)
**File:** `v4/audio-playback-controller.js`

**Core Functionality:**
- Web Audio API-based Dan Tranh sound synthesis
- V0.11.3-compatible triangle wave oscillator
- Rhythm-accurate timing using note durations
- Linked playback across both tablatures (same music)
- Audio context auto-resume on user interaction

**User Interface:**
- Minimal Play/Stop buttons centrally positioned
- Single click note: Play individual note with sound + animation
- Double click note: Start playback from that note onward
- Automatic stop button enable/disable

**Visual Feedback:**
- Red note glow (drop-shadow filter)
- Vertical bounce animation (8px down)
- Synchronized across both optimal and alternative tuning tablatures

### 2. Future Playback Modes (10+ Methods Ready)
All methods support optional looping via second parameter:

```javascript
// Pattern-based playback
audioController.playPattern('kpic-3-1', loop=false)

// Linguistic tone playback
audioController.playLinguisticTone('ngang', loop=false)

// Phrase playback
audioController.playPhrase(1, loop=true)  // Loop phrase 1

// Position-based playback
audioController.playPhrasePosition('beginning', loop=false)

// String/pitch filtering
audioController.playString(7, loop=false)
audioController.playPitch('G4', loop=false)

// Note type filtering
audioController.playGraceNotes(loop=false)
audioController.playBentNotes(loop=false)
audioController.playMainNotes(loop=false)

// Range playback
audioController.playRange(10, 20, loop=true)  // Notes 10-20, looped
```

---

## Modified Files

### 1. `server-tablature-generator.js`
**Changes:**
- Added `data-pitch` attribute to all note circles (e.g., "C4", "G5")
- Added `data-duration` attribute for rhythm timing
- Added unique `id` to each note circle (`note-0`, `note-1`, etc.)
- Added `note` class to all circles for audio controller selection

**Line 214-217:**
```javascript
const baseClass = isGrace ? 'grace-note' : (isBent ? 'bent-note' : 'note-circle');
const circleClass = `note ${baseClass}`;  // Always include 'note' class
const pitch = `${note.step}${note.octave}`;
const noteId = `note-${index}`;
svg += `    <circle id="${noteId}" ... data-pitch="${pitch}" data-duration="${note.duration || 1}"/>\n`;
```

### 2. `vertical-demo-server.js`
**Changes:**
- Added route for audio playback controller: `/audio-playback-controller.js`

**Line 115-119:**
```javascript
// V4.0.12: Serve the audio playback controller
app.get('/audio-playback-controller.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'audio-playback-controller.js'));
});
```

### 3. `library-controller.js`
**Changes:**
- Auto-refresh audio controller when switching songs
- Stops old playback, loads new note references

**Line 222-228:**
```javascript
// V4.0.12: Refresh audio controller with new song notes
if (window.audioController) {
    const optimalSvg = document.getElementById('optimalSvg');
    const alt1Svg = document.getElementById('alt1Svg');
    window.audioController.setSVGReferences(optimalSvg, alt1Svg);
    console.log('Audio controller refreshed with new song notes');
}
```

### 4. `v4-vertical-header-sections-annotated.html`
**Changes:**

**Script Reference (Line 17-18):**
```html
<!-- V4.0.12: External Audio Playback Controller -->
<script src="/audio-playback-controller.js"></script>
```

**CSS Animation (Line 41-60):**
```css
/* V4.0.12: Audio Playback - Note Playing Animation (Vertical) */
@keyframes note-vertical-pulse {
    0% { transform: translateY(0); filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.4)); }
    50% { transform: translateY(8px); filter: drop-shadow(0 0 20px rgba(255, 0, 0, 0.8)); }
    100% { transform: translateY(0); filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.4)); }
}

.note-playing {
    animation: note-vertical-pulse 0.6s ease-in-out;
    fill: #FF0000 !important;
}
```

**UI Controls (Line 407-417):**
```html
<!-- V4.0.12: AUDIO PLAYBACK CONTROLS (Minimal - Linked for both tablatures) -->
<div style="...centered buttons...">
    <button id="playButton">▶ Play</button>
    <button id="stopButton">■ Stop</button>
</div>
```

**Initialization (Line 1396-1407):**
```javascript
// V4.0.12: Initialize audio playback controller
window.audioController = new AudioPlaybackController();
window.audioController.initialize();

// Set SVG references for audio playback (both tablatures use same music)
setTimeout(() => {
    const optimalSvg = document.getElementById('optimalSvg');
    const alt1Svg = document.getElementById('alt1Svg');
    if (optimalSvg && window.audioController) {
        window.audioController.setSVGReferences(optimalSvg, alt1Svg);
    }
}, 200);
```

---

## Technical Implementation

### Sound Synthesis (V0.11.3-Compatible)
```javascript
// Triangle wave oscillator
oscillator.type = 'triangle';

// Grace notes: quieter, shorter resonance
const volume = isGrace ? 0.2 : 0.3;
const resonanceDuration = isGrace ? duration + 1.5 : duration + 3.0;

// Envelope: fast attack, slow exponential decay
gainNode.gain.setValueAtTime(0, now);
gainNode.gain.linearRampToValueAtTime(volume, now + 0.005);
gainNode.gain.linearRampToValueAtTime(volume * 0.8, now + 0.1);
gainNode.gain.exponentialRampToValueAtTime(0.001, now + resonanceDuration);
```

### Click Handling
```javascript
// 300ms delay to distinguish single vs double click
clickTimer = setTimeout(() => {
    // Single click: Play just this note
    this.playNote(note.pitch, note.duration, note.element);
    clickTimer = null;
}, 300);

// Double click: Start playback from this note
clearTimeout(clickTimer);
this.playFrom(index);
```

### Linked Playback Across Tablatures
```javascript
// Find corresponding elements in both SVGs
Object.values(this.svgElements).forEach(svg => {
    const element = svg.querySelector(`#${noteId}`);
    if (element) {
        element.style.fill = '#FF0000';  // Red glow
        element.style.filter = 'drop-shadow(0 0 10px rgba(255, 0, 0, 0.8))';
    }
});
```

---

## Architecture Benefits

### 1. External Component Pattern
- **560 lines** extracted from template
- Reusable across multiple pages
- Single source of truth for audio state
- Easy to test in isolation

### 2. Extensibility
- **10+ playback modes** ready for future use
- Filter-based architecture: `playFiltered(filterFn, loop)`
- Custom filters via data attributes
- Loop support built-in

### 3. Clean Integration
- Follows V4 controller pattern (ZoomController, LibraryController, MetricsController)
- Auto-initialization on page load
- Proper cleanup on stop
- State management built-in

---

## Usage Guide

### Basic Playback
```javascript
// Play entire tablature
window.audioController.play();

// Stop playback
window.audioController.stop();

// Set tempo
window.audioController.setTempo(140);  // 140 BPM
```

### Advanced Playback (Future)
```javascript
// Play only bent notes, looped
window.audioController.playBentNotes(true);

// Play specific pattern
window.audioController.playPattern('kpic-3-5');

// Play phrase 2, looped
window.audioController.playPhrase(2, true);

// Play notes with "ngang" tone
window.audioController.playLinguisticTone('ngang');
```

---

## Bug Fixes

### Issue 1: Wrong Sound
**Problem:** Used sawtooth wave, sounded harsh
**Fix:** Changed to triangle wave matching V0.11.3
**File:** `audio-playback-controller.js:338`

### Issue 2: Song Switch Plays Old Notes
**Problem:** Audio controller retained old note references
**Fix:** LibraryController now refreshes audio references on song load
**File:** `library-controller.js:222-228`

### Issue 3: Undefined Variable Error
**Problem:** Used `i` instead of `index` in forEach loop
**Fix:** Changed to `index` parameter
**File:** `server-tablature-generator.js:216`

---

## File Structure

```
Versions/V4.1.0-audio-playback/
├── VERSION.md                                      # This file
├── audio-playback-controller.js                    # NEW: Audio system (560 lines)
├── server-tablature-generator.js                   # MODIFIED: Added data attributes
├── library-controller.js                           # MODIFIED: Refresh on song switch
├── vertical-demo-server.js                         # MODIFIED: Added route
└── v4-vertical-header-sections-annotated.html      # MODIFIED: UI + initialization
```

---

## Statistics

**Lines Added:** 560 (new controller)
**Lines Modified:** ~30 across 4 files
**New Controller:** #5 (Zoom, VisualState, Library, Metrics, Audio)
**Playback Modes:** 10+ ready, 1 active
**Animation:** Vertical bounce (8px down)

---

## Next Steps

### Potential Future Enhancements:
1. Volume slider
2. Tempo adjustment UI
3. Playback mode selector (dropdown to choose which filter)
4. Visual playback progress bar
5. Export audio as WAV/MP3
6. Metronome overlay during playback
7. Practice mode (slow down playback)
8. Section/phrase loop UI controls

---

**V4.1.0 represents V4's first major feature release - transforming static tablature into interactive, audio-enabled musical analysis tool.**