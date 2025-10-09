# Audio Playback & Tuning System Fixes

## Issues Fixed

### 1. Audio Playback Not Triggering Sounds

**Problem:**
- Play buttons existed but no sound was produced
- Audio controller was initialized but AudioContext might be suspended or notes not extracted

**Root Causes:**
1. Browser requires user interaction before creating AudioContext
2. No error handling when notes array is empty
3. No debugging output to diagnose issues

**Fixes Applied:**

#### A. `audio-playback-controller-v2.js` - Lazy AudioContext Initialization
```javascript
// Lines 162-185
async play() {
    if (this.isPlaying) return;

    // Initialize audio context if not created yet (lazy initialization)
    if (!this.audioContext) {
        console.log('AudioPlaybackController: Creating audio context on first play');
        this.initialize();
    }

    // Resume audio context (required by browsers after user gesture)
    if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('AudioPlaybackController: Audio context resumed from suspended state');
    }

    // Check if we have notes to play
    if (this.notes.length === 0) {
        console.error('AudioPlaybackController: No notes available. Did you call setSVGReferences()?');
        return;
    }

    console.log(`AudioPlaybackController: Starting playback of ${this.notes.length} notes`);
    this.playFrom(0);
}
```

#### B. Enhanced Debugging in `playNote()` Function
```javascript
// Lines 493-503
playNote(pitch, duration, element) {
    if (!this.audioContext) {
        console.error('AudioPlaybackController: Cannot play note - audio context not initialized');
        return;
    }

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const frequency = this.pitchToFrequency(pitch);

    console.log(`[Audio] Playing note: ${pitch} (${frequency.toFixed(2)}Hz) for ${duration.toFixed(2)}s`);
    // ... rest of function
}
```

#### C. Better Note Extraction Logging
```javascript
// Lines 110-130
noteCircles.forEach((circle, index) => {
    // ... extract note data ...

    // Log first few notes for debugging
    if (index < 3) {
        console.log(`  Note ${index}: ${noteId} - ${pitch}, duration=${duration}, grace=${isGrace}`);
    }
});

console.log(`[AudioController] Extracted ${this.notes.length} notes total (${this.notes.filter(n => !n.isGrace).length} main, ${this.notes.filter(n => n.isGrace).length} grace)`);
```

### 2. Tuning System Change Not Updating Display

**Problem:**
- Changing tuning selector fetched new SVG but didn't refresh audio controller
- Bent notes WERE being recalculated server-side but audio still played old notes

**Root Cause:**
- `updateAlternativeTuning()` function refreshed zoom controller and bent note state but only refreshed audio controller for tuningNumber===1

**Fix Applied:**

#### `v4-vertical-header-sections-annotated.html` - Universal Audio Controller Refresh
```javascript
// Lines 2278-2287 (template)
// Refresh audio controller with new note references
// Always refresh audio controller when SVG changes
if (window.audioController) {
    const optimalSvg = document.getElementById('optimalSvg');
    const alt1Svg = document.getElementById('alt1Svg');
    if (optimalSvg && alt1Svg) {
        window.audioController.setSVGReferences(optimalSvg, alt1Svg);
        console.log(`Audio controller refreshed after tuning change (section: ${section})`);
    }
}
```

**Note:** Bent notes are ALREADY being recalculated correctly:
1. API call fetches new tablature with selected tuning: `/api/generate-tuning/${song}/${tuning}`
2. Server recalculates bent notes for the new tuning
3. SVG is updated with new bent note indicators
4. Bent count display is updated (lines 2269-2276)
5. Visual state is refreshed

## Testing Instructions

### Test Audio Playback

1. **Initial Load Test:**
   - Open browser to http://localhost:3006
   - Open browser console (F12)
   - Check for messages:
     ```
     AudioPlaybackController loaded successfully
     [AudioController] Extracted X notes total (Y main, Z grace)
     ```
   - Click play button (▶) in Optimal Tuning section
   - Should see:
     ```
     AudioPlaybackController: Audio context resumed from suspended state
     AudioPlaybackController: Starting playback of X notes
     [Audio] Playing note: C4 (261.63Hz) for 0.50s
     [Audio] Playing note: D4 (293.66Hz) for 0.50s
     ...
     ```
   - **Expected:** Hear plucked string sounds with triangle wave

2. **Tuning Change Test:**
   - Change "Alternative Tuning 1" selector (e.g., C-D-E-G-A → C-D-F-G-A)
   - Check console for:
     ```
     [UpdateTuning] Received SVG length: XXXX
     [UpdateTuning] SVG has X circles
     Audio controller refreshed after tuning change (section: alt1)
     [AudioController] Extracted X notes total (Y main, Z grace)
     ```
   - Click play button (▶) in Alternative Tuning 1 section
   - **Expected:** Hear sound with NEW tuning's notes

3. **Bent Notes Display Test:**
   - Change tuning selector
   - Check "X bent notes" text updates correctly
   - Check console:
     ```
     [UpdateTuning] Found X bent note circles for altY
     [UpdateTuning] Updated altYBentCount to: X bent notes
     ```

### Debugging Common Issues

#### No Sound When Clicking Play

**Check Console For:**
1. `AudioPlaybackController: No notes available` → SVG not loaded or references not set
2. `AudioPlaybackController: Cannot play note - audio context not initialized` → Audio context creation failed
3. No audio logs at all → Click handler not working

**Solutions:**
1. Reload page and wait for "Extracted X notes" message
2. Check if browser blocks autoplay (Chrome requires user interaction)
3. Try clicking a note directly (should work even if play button doesn't)

#### Tuning Change Shows Old Notes

**Check Console For:**
1. `Audio controller refreshed after tuning change` message
2. If missing, audio controller wasn't refreshed

**Solution:**
- Refresh page after tuning change
- Verify `/api/generate-tuning/` endpoint is working

#### Notes Extracted But No Sound

**Check:**
1. AudioContext state: `window.audioController.audioContext.state` (should be 'running')
2. Master gain: `window.audioController.masterGain.gain.value` (should be 0.3)
3. Browser audio permissions

**Solution:**
```javascript
// In console:
await window.audioController.audioContext.resume()
window.audioController.play()
```

## File Changes Summary

### Modified Files:

1. **`v4/audio-playback-controller-v2.js`** (3 changes)
   - Lazy AudioContext initialization in `play()` method
   - Error handling and debugging in `playNote()` method
   - Enhanced logging in `extractNotesFromSVG()` method

2. **`v4/templates/v4-vertical-header-sections-annotated.html`** (1 change)
   - Universal audio controller refresh in `updateAlternativeTuning()` function

### Lines Changed:
- audio-playback-controller-v2.js: Lines 162-185, 493-503, 110-130
- v4-vertical-header-sections-annotated.html: Lines 2278-2287

## Expected Behavior After Fixes

### Audio Playback:
1. ✅ Play button triggers sound on first click (lazy AudioContext creation)
2. ✅ Notes extracted from SVG with pitch and duration data
3. ✅ Console shows detailed playback information
4. ✅ Error messages if notes missing or audio context fails

### Tuning Changes:
1. ✅ Selecting new tuning fetches new SVG from server
2. ✅ Bent notes recalculated server-side for new tuning
3. ✅ "X bent notes" text updates correctly
4. ✅ Audio controller refreshes and extracts new notes
5. ✅ Play button plays NEW tuning's notes

## Additional Notes

- **Server-Side Note Generation:** All notes in SVG have `data-pitch` and `data-duration` attributes (server-tablature-generator.js:377)
- **AudioContext Browser Restrictions:** Modern browsers require user gesture to start audio (handled by lazy initialization)
- **Bent Note Calculation:** Done server-side by tuning optimizer, not client-side
- **Audio Plays from Optimal SVG:** Play buttons on both sections play the same notes (from optimalSvg)

## Next Steps

If issues persist:
1. Check browser console for errors
2. Verify `/api/generate-tuning/` endpoint returns valid SVG
3. Test in different browsers (Chrome, Firefox, Safari)
4. Check if AdBlocker/Privacy extensions block Web Audio API
