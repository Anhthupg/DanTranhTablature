# Dan Tranh Dynamic String System - Integration Guide

## Overview
This guide explains how to integrate the new dynamic string system into your existing Dan Tranh library at localhost:3002.

## Files Created

1. **danTranh.module.js** - Core module with DanTranhTablature class
2. **library-integration.js** - Integration script for existing libraries
3. **dan_tranh_integrated.html** - Standalone demo of the integrated system

## Key Features

- **Dynamic String Generation**: Automatically detects which strings are used (1-30+ strings)
- **Proportional Spacing**: Strings spaced based on musical intervals (semitones)
- **Chromatic Support**: Full support for sharps/flats (C#, Eb, etc.)
- **Microtone Ready**: Structure for future microtone support (e.g., C4+15cents)
- **Bending Visualization**: Shows bending curves for notes between open strings
- **Multiple Display Modes**: Show only played strings or all available strings

## Integration Steps

### Step 1: Include the Module Files

Add to your HTML head section:

```html
<script type="module">
    import { DanTranhTablature } from './danTranh.module.js';
    import './library-integration.js';
</script>
```

### Step 2: Update Your Song Data Format

Ensure your songs have this structure:

```javascript
const song = {
    title: "Song Title",
    composer: "Composer Name",
    notes: [
        { pitch: 'C4', time: 0, duration: 1 },
        { pitch: 'F4', time: 1, duration: 1 },
        { pitch: 'G4', time: 2, duration: 1 },
        { pitch: 'C5', time: 3, duration: 1 },
        // For bent notes:
        { pitch: 'E4', time: 4, duration: 1, bent: true }
    ],
    // Optional: specify open strings
    openStrings: ['C4', 'F4', 'G4', 'C5']
};
```

### Step 3: Replace Old Tablature Elements

The integration script will automatically:
1. Find all existing tablature containers
2. Replace them with the new dynamic system
3. Add string count indicators to song thumbnails
4. Preserve existing song data

### Step 4: Initialize the System

The library-integration.js script auto-initializes. You can also manually control it:

```javascript
// Access the library integration
const library = window.DanTranhLibrary;

// Access the song database
const database = window.DanTranhSongDatabase;

// Load a specific song
const song = database.getSong('xia_ca_me');
if (song) {
    const tablature = new DanTranhTablature('container-id', options);
    tablature.loadSong(song);
}
```

## Configuration Options

```javascript
const options = {
    baseSpacing: 20,      // Pixels per semitone
    minSpacing: 40,       // Minimum string spacing
    maxSpacing: 120,      // Maximum string spacing
    showIntervals: true,  // Show interval names
    showBending: true,    // Show bending curves
    displayMode: 'played', // 'played' or 'all'
    onNoteClick: function(note, index) {
        // Handle note click
    }
};
```

## Fixing String Issues

### Problem: "Xỉa Cá Mè" shows only 2 strings instead of 4

**Solution**: The new system automatically detects all used pitches.

Before (hardcoded strings):
```html
<!-- Only D4, G4, A4, C5, D5, E5, G5 were defined -->
```

After (dynamic strings):
```javascript
// Automatically detects C4, F4, G4, C5 from the song data
```

### Problem: Songs with 1-2 strings display incorrectly

**Solution**: The system now handles any number of strings:

```javascript
// Single string song
{
    notes: [
        { pitch: 'C4', time: 0, duration: 1 },
        { pitch: 'C4', time: 1, duration: 1 }
    ]
}

// Two string song
{
    notes: [
        { pitch: 'C4', time: 0, duration: 1 },
        { pitch: 'G4', time: 1, duration: 1 }
    ]
}
```

## String Spacing Algorithm

The system calculates proportional spacing based on musical intervals:

1. **Detect used strings** from song data
2. **Calculate semitone intervals** between consecutive strings
3. **Apply proportional spacing**: `spacing = semitones * baseSpacing`
4. **Apply constraints**: min 40px, max 120px between strings

Example:
- C4 to F4 = 5 semitones = 100px spacing
- F4 to G4 = 2 semitones = 40px spacing
- G4 to C5 = 5 semitones = 100px spacing

## Updating All 130 Songs

The integration script provides batch processing:

```javascript
// Get all songs
const allSongs = database.getAllSongs();

// Process each song
allSongs.forEach(song => {
    // The system will automatically detect strings
    const config = tablature.getStringConfiguration();
    console.log(`${song.title}: ${config.count} strings`);
});
```

## API Reference

### DanTranhTablature Class

```javascript
// Create instance
const tablature = new DanTranhTablature(containerId, options);

// Load a song
tablature.loadSong(song);

// Update options
tablature.setOptions({ displayMode: 'all' });

// Get string configuration
const config = tablature.getStringConfiguration();
// Returns: { strings: [...], positions: [...], count: N }

// Export as SVG
const svgString = tablature.exportSVG();
```

### LibraryIntegration Class

```javascript
// Auto-initialized as window.DanTranhLibrary

// Setup all thumbnails
library.setupThumbnails();

// Load song by ID
library.loadSongById('xia_ca_me');

// Handle navigation
library.handleNavigation();
```

## Testing

1. Open `dan_tranh_integrated.html` to see the standalone demo
2. Test with different songs to verify string configurations:
   - "Xỉa Cá Mè" - Should show 4 strings (C4, F4, G4, C5)
   - "Single String Melody" - Should show 1 string
   - "Two String Harmony" - Should show 2 strings
   - "Chromatic Exercise" - Should show multiple chromatic strings

## Troubleshooting

### Issue: Old tablature still showing
- Clear browser cache
- Ensure library-integration.js is loaded
- Check console for error messages

### Issue: String count incorrect
- Verify song data format
- Check for bent notes (marked with `bent: true`)
- Ensure pitch notation is correct (e.g., 'C4', not 'c4')

### Issue: Spacing looks wrong
- Adjust `baseSpacing` option (default: 20)
- Check min/max spacing constraints
- Verify interval calculations

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Support

For issues or questions:
- Check console logs for detailed error messages
- Verify song data format matches specifications
- Test with the standalone demo first

## Version History

- **v3.0** - Complete dynamic string system
- **v2.0** - Added proportional spacing
- **v1.0** - Initial hardcoded implementation