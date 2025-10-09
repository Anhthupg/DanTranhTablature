# Đàn Tranh V3 Version Backups

This folder contains timestamped backups of the Đàn Tranh V3 system with descriptive keywords summarizing major changes.

## Version History

### v3.0.0-complete-library-130songs-12colors
**Keywords:** `complete-library` `130-songs` `12-colors` `auto-import` `musicxml-processing`

**Major Features:**
- Complete 130-song Vietnamese collection with real MusicXML data
- Auto-import system with pattern analysis and tuning detection
- Strict 12-color system compliance across all UI elements
- Theme system (white/dark/black backgrounds)
- V1-compatible pattern efficiency calculations
- Vietnamese spelling throughout ("Đàn Tranh")
- Query & Analysis panel with collection filters
- Vertical theme selector and proper UI interactions

**Git Tag:** `v3.0.0`
**Date:** September 25, 2025

---

### v3.0.1-fixed-vietnamese-titlecase-unicode
**Keywords:** `vietnamese-titlecase` `unicode-fix` `proper-capitalization` `word-boundaries`

**Improvements:**
- Fixed Vietnamese Title Case function for proper Unicode handling
- Correct capitalization for titles with diacritics (ắ, ậ, ể, etc.)
- Proper word boundary detection using space splitting
- Grammatically correct lowercase preservation for articles/conjunctions
- Updated technical documentation in CLAUDE.md

**Examples Fixed:**
- "thắp đèn" → "Thắp Đèn" ✓
- "đò đưa quan họ" → "Đò Đưa quan họ" ✓
- "trồng bông luống đậu" → "Trồng Bông Luống Đậu" ✓

**Git Tag:** `v3.0.1`
**Date:** September 25, 2025

---

### v3.0.3-color-consistency-theme-fixes
**Keywords:** `color-consistency` `theme-fixes` `traditional-badge` `dynamic-backgrounds`

**Improvements:**
- Fixed traditional region badge color to match teal thumbnail gradient
- Corrected dark theme background system with dynamic CSS variables
- Fixed dark theme card transparency (dark cards instead of white)
- Updated color comments to use simple objective names (blue, red, green, etc.)
- Consistent theme behavior across all three background options

**Theme System Fixed:**
- **Dark (Teal)**: Proper teal→purple gradient with dark semi-transparent cards
- **White**: Clean white→light blue gradient with white cards
- **Black**: Black→dark teal gradient with dark cards

**Git Tag:** `v3.0.3`
**Date:** September 25, 2025

---

### v3.1.0-complete-individual-viewers-slur-tie-conversion
**Keywords:** `individual-viewers` `slur-to-tie-conversion` `v1-compatibility` `visual-excellence` `smart-search`

**Major Features:**
- **Complete Individual Song Viewer System**: All 130 Vietnamese songs with V1-style tablature generation
- **V1-Compatible Slur-to-Tie Conversion**: 2-step process (explicit slurs + implicit ties) matching V1 exactly
- **Perfect Visual Presentation**: Professional-grade tablature with optimal typography and spacing
- **4-Theme System**: Standardized White, Light Grey, Dark Grey, Black themes across all pages
- **Enhanced Library Interface**: User-selectable sorting and smart search functionality

**Technical Achievements:**
- **Accurate Note Counts**: Post slur-to-tie conversion matching V1 analysis ("Bà rằng bà rí": 133 vs V1's 136)
- **Perfect String Detection**: Corrected string counts in library thumbnails (e.g., 7 strings not 5)
- **1-Based Note Indexing**: Notes numbered #1 to #133 instead of #0 to #156
- **X-Scroll Functionality**: Proper horizontal scrolling for wide tablatures
- **Protected String Labels**: 100px clear separation with proper SVG rendering order

**Visual Excellence:**
- **Y-Centered Elements**: Notes and resonance bands perfectly aligned on string lines
- **Thicker Strings**: 3px stroke width for enhanced visibility
- **Bigger String Numbers**: 14px font in note heads for better readability
- **Theme-Adaptive Colors**: All text and lines visible on all 4 background themes
- **Vietnamese Title Case**: Applied consistently across library and viewers
- **Neutral Note Colors**: Grey tones for note heads - 12-color system reserved for filtering

**User Interface:**
- **One-Line Controls**: Region filters, sort options, and view toggle unified
- **Smart Search**: Title, string count, learn-only notes with real-time results
- **Color-Coordinated Regions**: Filter buttons match song thumbnail colors
- **User-Selectable Sorting**: Strings Used, Learn Only Notes, Total Notes

**Git Tag:** `v3.1.0`
**Date:** September 25, 2025

---

### v3.1.1-enhanced-search-clear-button-vietnamese-diacritics
**Keywords:** `enhanced-search` `clear-button` `vietnamese-diacritics` `smart-filtering` `user-interface`

**Search Enhancements:**
- **Vietnamese Diacritic Normalization**: Search "doc" finds "hò đò dọc", "ba rang" finds "Bà rằng bà rí"
- **Clear Button (×)**: Red circular button appears when typing, one-click to clear search
- **Case-Insensitive Search**: Works with any capitalization
- **Smart Search Capabilities**: Title, string count, learn-only notes, enhanced phrases

**Library Interface Improvements:**
- **One-Line Control Layout**: Region filters, sort options, and view toggle unified
- **Color-Coordinated Region Buttons**: Match song thumbnail colors (Blue=Northern, Red=Southern, Green=Central, Teal=Traditional, Gold=Lullaby)
- **User-Selectable Sorting**: Strings Used, Learn Only Notes, Total Notes
- **Integrated Filter & Sort**: Selected regions prioritized at top with chosen sort order

**Technical Features:**
- **Persistent Card Storage**: Maintains full 130-song set during filtering
- **Enhanced Debug Logging**: Console output for troubleshooting search and filter functionality
- **Robust Error Handling**: Try-catch blocks prevent crashes during filtering
- **Stats Layout Fix**: Moved 200px left to avoid theme selector collision

**Git Tag:** `v3.1.1`
**Date:** September 25, 2025

---

## Backup Structure

Each version backup contains:
- Complete `/v3` directory with all source files
- Full `/data` folder with 130 processed songs and metadata
- `/musicxml` source files and processing scripts
- Updated documentation and configuration files

## Usage

To restore a specific version:
1. Stop all running servers
2. Copy desired version folder to replace `/v3`
3. Restart server with `npm run dev:v3`

## Keywords Legend

- `complete-library` - Full song collection implemented
- `12-colors` - Strict color system compliance
- `auto-import` - Automated MusicXML processing
- `vietnamese-titlecase` - Language-specific text formatting
- `unicode-fix` - Character encoding corrections
- `musicxml-processing` - Real data extraction vs placeholders
- `ui-interactions` - User interface improvements