#!/usr/bin/env python3
"""
Analytical Tablature Visualizer
Overlays KPIC/KRIC analysis on đàn tranh tablature with interactive filtering
"""

from typing import Dict, List, Tuple, Optional
import json
from musicxml_to_dantranh import DanTranhConverter
from kpic_kric_analyzer import KPICKRICAnalyzer
from lyrical_musical_analyzer import LyricalMusicalAnalyzer

class AnalyticalTablatureVisualizer:
    def __init__(self):
        self.converter = DanTranhConverter()
        self.kpic_analyzer = KPICKRICAnalyzer()
        self.lyrical_analyzer = LyricalMusicalAnalyzer()
        
        # Analysis data
        self.processed_notes = []
        self.pitch_ngrams = {}
        self.rhythm_ngrams = {}
        self.syllable_mappings = []
        
    def create_analytical_tablature(self, musicxml_file: str, output_file: str = "analytical_tablature.html"):
        """Create interactive tablature with KPIC/KRIC overlays"""
        
        # Run all analyses
        print("Running KPIC/KRIC analysis...")
        self.kpic_analyzer.analyze_musicxml(musicxml_file)
        
        print("Running lyrical analysis...")  
        self.lyrical_analyzer.analyze_musicxml(musicxml_file)
        
        # Get processed data
        self.processed_notes = self.kpic_analyzer.processed_notes
        self.pitch_ngrams = self.kpic_analyzer.pitch_ngrams
        self.rhythm_ngrams = self.kpic_analyzer.rhythm_ngrams
        self.syllable_mappings = self.lyrical_analyzer.syllable_mappings
        
        # Generate HTML with tablature
        html_content = self._generate_analytical_html(musicxml_file)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"Analytical tablature created: {output_file}")
        return output_file
    
    def _generate_analytical_html(self, musicxml_file: str) -> str:
        """Generate HTML with analytical tablature"""
        
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytical Đàn Tranh Tablature</title>
    <style>
        {self._get_css_styles()}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🎼 Analytical Đàn Tranh Tablature</h1>
            <h2>{musicxml_file}</h2>
        </header>
        
        <div class="controls">
            <!-- Compact control grid -->
            <div class="controls-grid">
                <!-- Pattern Analysis -->
                <div class="control-section compact">
                    <h4 class="section-title collapsible" onclick="toggleSection('patterns')">
                        🎼 Patterns <span class="toggle-icon" id="patterns-icon">▼</span>
                    </h4>
                    <div class="section-content" id="patterns-content">
                        <div class="patterns-row">
                            <div class="pattern-column">
                                <div class="control-group-header">
                                    <label>KPIC:</label>
                                    <select id="kpicFilter" onchange="updateKpicPatternOptions()">
                                        <option value="none">None</option>
                                        <option value="kpic-max">MAX</option>
                                        <option value="kpic-2">2</option>
                                        <option value="kpic-3">3</option>
                                        <option value="kpic-4">4</option>
                                        <option value="kpic-5">5</option>
                                        <option value="kpic-6">6</option>
                                        <option value="kpic-7">7</option>
                                        <option value="kpic-8">8</option>
                                        <option value="kpic-9">9</option>
                                        <option value="kpic-10">10</option>
                                        <option value="kpic-15">15</option>
                                        <option value="kpic-20">20</option>
                                        <option value="kpic-30">30</option>
                                    </select>
                                </div>
                                <div class="pattern-selector" id="kpicPatternGroup" style="display: none;">
                                    <select id="specificKpicPattern" onchange="updateHighlighting()" multiple size="3">
                                    </select>
                                    <small>Hold Ctrl/Cmd for multiple</small>
                                </div>
                            </div>
                            
                            <div class="pattern-column">
                                <div class="control-group-header">
                                    <label>KRIC:</label>
                                    <select id="kricFilter" onchange="updateKricPatternOptions()">
                                        <option value="none">None</option>
                                        <option value="kric-max">MAX</option>
                                        <option value="kric-2">2</option>
                                        <option value="kric-3">3</option>
                                        <option value="kric-4">4</option>
                                        <option value="kric-5">5</option>
                                        <option value="kric-6">6</option>
                                        <option value="kric-7">7</option>
                                        <option value="kric-8">8</option>
                                        <option value="kric-9">9</option>
                                        <option value="kric-10">10</option>
                                        <option value="kric-15">15</option>
                                        <option value="kric-20">20</option>
                                        <option value="kric-30">30</option>
                                    </select>
                                </div>
                                <div class="pattern-selector" id="kricPatternGroup" style="display: none;">
                                    <select id="specificKricPattern" onchange="updateHighlighting()" multiple size="3">
                                    </select>
                                    <small>Hold Ctrl/Cmd for multiple</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Syllable Analysis -->
                <div class="control-section compact">
                    <h4 class="section-title collapsible" onclick="toggleSection('syllables')">
                        📝 Syllables <span class="toggle-icon" id="syllables-icon">▼</span>
                    </h4>
                    <div class="section-content" id="syllables-content">
                        <div class="inline-controls">
                            <div class="control-group">
                                <div class="control-group-header">
                                    <label>Type:</label>
                                    <select id="syllableFilter" onchange="updateHighlighting()">
                                        <option value="none">None</option>
                                        <option value="grace_main_units">Grace Units</option>
                                        <option value="repetitions">Repeated</option>
                                        <option value="melismatic">Melismas</option>
                                        <option value="tone_sac">Sắc ↗</option>
                                        <option value="tone_huyen">Huyền ↘</option>
                                        <option value="tone_hoi">Hỏi ↘↗</option>
                                        <option value="tone_nga">Ngã ↗~</option>
                                        <option value="tone_nang">Nặng ↓</option>
                                        <option value="tone_ngang">Ngang →</option>
                                        <option value="specific">Specific</option>
                                    </select>
                                </div>
                                <div class="pattern-selector" id="specificSyllableGroup" style="display: none;">
                                    <select id="specificSyllable" onchange="updateHighlighting()" multiple size="3">
                                    </select>
                                    <small>Hold Ctrl/Cmd for multiple</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- View Controls -->
                <div class="control-section compact">
                    <h4 class="section-title collapsible" onclick="toggleSection('view')">
                        🔍 View <span class="toggle-icon" id="view-icon">▼</span>
                    </h4>
                    <div class="section-content" id="view-content">
                        <div class="inline-controls">
                            <div class="control-group">
                                <div class="control-group-header">
                                    <label>X-Zoom:</label>
                                    <select id="zoomLevel" onchange="updateZoomFromSelect()">
                                        <option value="fit-width">Fit</option>
                                        <option value="1.0">100%</option>
                                        <option value="0.6">60%</option>
                                        <option value="0.4">40%</option>
                                        <option value="0.2">20%</option>
                                        <option value="0.1">10%</option>
                                        <option value="custom">Custom</option>
                                    </select>
                                    <input type="range" id="xZoomSlider" min="5" max="200" value="100" 
                                           oninput="updateZoomFromSlider('x')" style="width: 100px;">
                                    <span id="xZoomValue">100%</span>
                                </div>
                            </div>
                            
                            <div class="control-group">
                                <div class="control-group-header">
                                    <label>Y-Zoom:</label>
                                    <select id="yZoomLevel" onchange="updateYZoomFromSelect()">
                                        <option value="fit-height">Fit Height</option>
                                        <option value="0.05">5%</option>
                                        <option value="0.10">10%</option>
                                        <option value="0.15">15%</option>
                                        <option value="0.20">20%</option>
                                        <option value="0.30">30%</option>
                                        <option value="0.40">40%</option>
                                        <option value="0.50">50%</option>
                                        <option value="0.67" selected>67%</option>
                                        <option value="0.80">80%</option>
                                        <option value="1.0">100%</option>
                                        <option value="1.5">150%</option>
                                        <option value="2.0">200%</option>
                                        <option value="custom">Custom</option>
                                    </select>
                                    <input type="range" id="yZoomSlider" min="5" max="300" value="67" 
                                           oninput="updateZoomFromSlider('y')" style="width: 100px;">
                                    <span id="yZoomValue">67%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Settings & Actions -->
                <div class="control-section compact">
                    <h4 class="section-title collapsible" onclick="toggleSection('settings')">
                        ⚙️ Settings <span class="toggle-icon" id="settings-icon">▼</span>
                    </h4>
                    <div class="section-content" id="settings-content">
                        <div class="inline-controls">
                            <div class="control-group">
                                <div class="control-group-header">
                                    <label>Mode:</label>
                                    <select id="analysisMode" onchange="updateHighlighting()">
                                        <option value="full">Full</option>
                                        <option value="main_melody">Main</option>
                                        <option value="grace_units">Grace</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="control-group">
                                <div class="control-group-header">
                                    <label>Min Count:</label>
                                    <input type="range" id="minCount" min="2" max="10" value="2" onchange="updateHighlighting()" style="width: 60px;">
                                    <span id="minCountValue">2</span>
                                </div>
                            </div>
                            
                            <div class="control-group">
                                <div class="control-group-header">
                                    <button onclick="clearHighlighting()">Clear</button>
                                    <button onclick="showLegend()">Legend</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="legend" class="legend" style="display: none;">
            <h3>Color Legend</h3>
            <div class="legend-item"><span class="color-sample kpic-highlight"></span>KPIC Patterns</div>
            <div class="legend-item"><span class="color-sample kric-highlight"></span>KRIC Patterns</div>
            <div class="legend-item"><span class="color-sample syllable-repetition"></span>Repeated Syllables</div>
            <div class="legend-item"><span class="color-sample syllable-focus"></span>Focused Syllable</div>
            <div class="legend-item"><span class="color-sample grace-main-unit"></span>Grace-Main Units</div>
            <div class="legend-item"><span class="color-sample syllable-melismatic"></span>Melismatic Syllables</div>
            <div class="legend-item"><span class="color-sample grace-note"></span>Grace Notes</div>
        </div>
        
        <div class="tablature-container">
            {self._generate_svg_tablature()}
        </div>
        
        <div class="lyrics-section">
            <h3>Lyrics</h3>
            <div class="lyrics-content" id="lyricsDisplay">
                {self._generate_lyrics_section()}
            </div>
        </div>
        
        <div class="analysis-info" id="analysisInfo">
            <h3>Pattern Analysis</h3>
            <div id="patternDetails">Select a highlighting mode to see pattern details</div>
        </div>
    </div>
    
    <script>
        // Analysis data
        const analysisData = {self._prepare_analysis_data()};
        
        {self._get_javascript_code()}
    </script>
</body>
</html>"""
    
    def _generate_svg_tablature(self) -> str:
        """Generate SVG tablature similar to combined_view.svg format"""
        
        # Find which strings are used
        string_usage = {}
        note_positions = []
        
        x_pos = 120  # Starting position
        duration_unit = 40  # Base pixels per duration unit (will be scaled by zoom)
        
        for i, note_data in enumerate(self.processed_notes):
            string_num, technique = self.converter.find_best_string(note_data['note'])
            
            if string_num not in string_usage:
                string_usage[string_num] = []
            
            # Calculate note width (will be scaled by zoom later)
            if note_data.get('is_grace'):
                note_width = 20  # Grace notes are smaller
            else:
                note_width = note_data['duration'] * duration_unit
            
            note_info = {
                'index': i,
                'x': x_pos,
                'base_x': x_pos,  # Store original x for zoom calculations
                'width': note_width,
                'base_width': note_width,  # Store original width for zoom calculations
                'string': string_num,
                'note': note_data['note'],
                'duration': note_data['duration'],
                'lyric': note_data.get('lyric', ''),
                'is_grace': note_data.get('is_grace', False),
                'technique': technique
            }
            
            string_usage[string_num].append(note_info)
            note_positions.append(note_info)
            
            x_pos += note_width + 5  # Small gap between notes
        
        # Calculate SVG dimensions with proper padding
        svg_width = x_pos + 200  # More padding at the end
        string_y_positions = {}
        
        # Define string positions with cents-based spacing
        used_strings = sorted(string_usage.keys())
        y_start = 110
        
        # Calculate cents between adjacent strings in pentatonic tuning
        # C-D (200 cents), D-E (200 cents), E-G (300 cents), G-A (200 cents), A-C (300 cents)
        def get_cents_spacing(string1, string2):
            """Get cents between any two string numbers (can span multiple strings)"""
            if string1 == string2:
                return 0
            
            # Calculate total cents by walking through each string step
            total_cents = 0
            current_string = string1
            
            # Define the step-by-step cents in pentatonic tuning
            step_cents = {
                # Within octave steps
                ('C', 'D'): 200,  # Major second
                ('D', 'E'): 200,  # Major second  
                ('E', 'G'): 300,  # Minor third
                ('G', 'A'): 200,  # Major second
                ('A', 'C'): 300,  # Minor third (A4->C5)
            }
            
            while current_string < string2:
                current_note = self.converter.default_tuning[current_string]
                next_note = self.converter.default_tuning[current_string + 1]
                
                # Extract note names and octaves
                current_name = current_note[0]
                current_octave = int(current_note[1])
                next_name = next_note[0]
                next_octave = int(next_note[1])
                
                # If same note name but different octave, it's an octave jump
                if current_name == next_name and next_octave > current_octave:
                    total_cents += 1200
                elif (current_name, next_name) in step_cents:
                    total_cents += step_cents[(current_name, next_name)]
                else:
                    # Default to major second for unknown intervals
                    total_cents += 200
                
                current_string += 1
            
            return total_cents
        
        # Calculate proportional Y positions based on cents
        base_spacing = 0.3  # pixels per cent (adjustable for visual clarity)
        string_y_positions = {}
        
        if used_strings:
            string_y_positions[used_strings[0]] = y_start
            for i in range(1, len(used_strings)):
                prev_string = used_strings[i-1]
                curr_string = used_strings[i]
                cents = get_cents_spacing(prev_string, curr_string)
                spacing = cents * base_spacing
                string_y_positions[curr_string] = string_y_positions[prev_string] + spacing
        
        # Calculate actual height based on proportional spacing
        if string_y_positions:
            max_y = max(string_y_positions.values())
            svg_height = max_y + 150  # Add padding for labels and lyrics
        else:
            svg_height = y_start + 200
        
        # Generate SVG with base dimensions stored for zoom
        svg = f"""<svg width="{svg_width}" height="{svg_height}" xmlns="http://www.w3.org/2000/svg" id="tablatureSvg" 
                      data-base-width="{svg_width}">
<defs>
    <linearGradient id="resonanceBand" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#40E0D0;stop-opacity:0.8"/>
        <stop offset="25%" style="stop-color:#40E0D0;stop-opacity:0.6"/>
        <stop offset="50%" style="stop-color:#40E0D0;stop-opacity:0.4"/>
        <stop offset="75%" style="stop-color:#40E0D0;stop-opacity:0.2"/>
        <stop offset="100%" style="stop-color:#40E0D0;stop-opacity:0.05"/>
    </linearGradient>
    
    <linearGradient id="graceResonanceBand" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#FFA500;stop-opacity:0.6"/>
        <stop offset="50%" style="stop-color:#FFA500;stop-opacity:0.3"/>
        <stop offset="100%" style="stop-color:#FFA500;stop-opacity:0.05"/>
    </linearGradient>
    
    <!-- Analysis highlight patterns -->
    <pattern id="kpicPattern" patternUnits="userSpaceOnUse" width="4" height="4">
        <rect width="4" height="4" fill="#ffeb3b" opacity="0.6"/>
        <path d="M 0,4 l 4,-4 M -1,1 l 2,-2 M 3,5 l 2,-2" stroke="#ff9800" stroke-width="1"/>
    </pattern>
    
    <pattern id="kricPattern" patternUnits="userSpaceOnUse" width="4" height="4">
        <rect width="4" height="4" fill="#e3f2fd" opacity="0.6"/>
        <circle cx="2" cy="2" r="1" fill="#2196f3"/>
    </pattern>
    
    <style>
        .string-line {{ stroke: #008ECC; stroke-width: 2; }}
        .string-label {{ font-family: Arial; font-size: 12px; fill: #008ECC; }}
        .title {{ font-family: Arial; font-size: 20px; font-weight: bold; fill: purple; }}
        .string-number {{ font-family: Arial; font-size: 10px; fill: white; font-weight: bold; }}
        .note-circle {{ cursor: pointer; }}
        .note-circle:hover {{ stroke-width: 4; }}
        
        /* Analysis highlighting classes */
        .kpic-highlight {{ fill: url(#kpicPattern) !important; stroke: #ff9800 !important; stroke-width: 3 !important; }}
        .kric-highlight {{ fill: url(#kricPattern) !important; stroke: #2196f3 !important; stroke-width: 3 !important; }}
        .syllable-repetition {{ stroke: #f44336 !important; stroke-width: 4 !important; }}
        .syllable-focus {{ fill: #e91e63 !important; stroke: #ad1457 !important; stroke-width: 4 !important; }}
        .syllable-melismatic {{ fill: #9c27b0 !important; stroke: #6a1b9a !important; stroke-width: 4 !important; }}
        .grace-main-unit {{ fill: #4caf50 !important; stroke: #2e7d32 !important; stroke-width: 4 !important; }}
        .note-dimmed {{ opacity: 0.5 !important; }}
        .syllable-tone {{ stroke-width: 4 !important; }}
        .tone-sac {{ stroke: #ff5722 !important; /* Rising tone - orange */ }}
        .tone-huyen {{ stroke: #3f51b5 !important; /* Falling tone - blue */ }}
        .tone-hoi {{ stroke: #009688 !important; /* Dipping tone - teal */ }}
        .tone-nga {{ stroke: #ff9800 !important; /* Broken rising - amber */ }}
        .tone-nang {{ stroke: #795548 !important; /* Heavy tone - brown */ }}
        .tone-ngang {{ stroke: #607d8b !important; /* Flat tone - blue-grey */ }}
        .pattern-member {{ opacity: 0.8; }}
        
        /* Different colors for multiple patterns */
        .pattern-color-0 {{ stroke: #ff9800 !important; }}
        .pattern-color-1 {{ stroke: #4caf50 !important; }}
        .pattern-color-2 {{ stroke: #2196f3 !important; }}
        .pattern-color-3 {{ stroke: #9c27b0 !important; }}
        .pattern-color-4 {{ stroke: #f44336 !important; }}
    </style>
</defs>

<rect width="{svg_width}" height="{svg_height}" fill="floralwhite"/>
<text x="20" y="30" class="title">Analytical Đàn Tranh Tablature</text>
<text x="20" y="50" style="font-family: Arial; font-size: 14px; fill: #666;">KPIC/KRIC Analysis with Interactive Highlighting</text>
"""
        
        # Draw string lines and labels
        for string_num in used_strings:
            y_pos = string_y_positions[string_num]
            tuning = self.converter.default_tuning[string_num]
            
            svg += f'<line x1="120" y1="{y_pos}" x2="{svg_width-20}" y2="{y_pos}" class="string-line" data-base-x2="{svg_width-20}" data-base-y1="{y_pos}" data-base-y2="{y_pos}"/>\n'
            svg += f'<text x="20" y="{y_pos+5}" class="string-label" data-base-y="{y_pos+5}">String {string_num}: {tuning}</text>\n'
        
        # Draw notes
        for note_info in note_positions:
            x = note_info['x']
            string_num = note_info['string']
            y_pos = string_y_positions[string_num]
            
            # Resonance band with different styles for grace notes
            if note_info['is_grace']:
                band_height = 6
                band_gradient = 'graceResonanceBand'
                band_y = y_pos - 3
            else:
                band_height = 10
                band_gradient = 'resonanceBand'
                band_y = y_pos - 5
            
            svg += f'<rect x="{x}" y="{band_y}" width="{note_info["width"]}" height="{band_height}" '
            svg += f'fill="url(#{band_gradient})" stroke="none" rx="2" opacity="0.9"/>\n'
            
            # Note circle
            radius = 12 if not note_info['is_grace'] else 6
            fill_color = "#008080"
            stroke_color = "crimson"
            
            if note_info['is_grace']:
                fill_color = "#FFD700"
                stroke_color = "#0066FF"
            
            svg += f'<circle cx="{x}" cy="{y_pos}" r="{radius}" '
            svg += f'class="note-circle" '
            svg += f'fill="{fill_color}" stroke="{stroke_color}" stroke-width="2" '
            svg += f'data-note-index="{note_info["index"]}" '
            svg += f'data-is-grace="{str(note_info["is_grace"]).lower()}" '
            svg += f'data-base-x="{x}" data-base-y="{y_pos}" '
            svg += f'onclick="showNoteDetails({note_info["index"]})" '
            svg += f'id="note-{note_info["index"]}"/>\n'
            
            # String number in circle
            svg += f'<text x="{x}" y="{y_pos+4}" text-anchor="middle" class="string-number" '
            svg += f'data-base-x="{x}" data-base-y="{y_pos+4}">{string_num}</text>\n'
            
            # Pitch number above duration (for identification)
            svg += f'<text x="{x}" y="{y_pos-35}" text-anchor="middle" '
            svg += f'style="font-size: 9px; fill: #666; font-weight: bold;" '
            svg += f'data-base-x="{x}" data-base-y="{y_pos-35}">#{note_info["index"]}</text>\n'
            
            # Duration above note
            svg += f'<text x="{x}" y="{y_pos-20}" text-anchor="middle" '
            svg += f'style="font-size: 10px; fill: #000; font-weight: bold;" '
            svg += f'data-base-x="{x}" data-base-y="{y_pos-20}">{note_info["duration"]}</text>\n'
            
            # Lyric below (if exists) - rotated vertically to prevent overlap
            if note_info['lyric']:
                svg += f'<text x="{x}" y="{y_pos+40}" text-anchor="start" '
                svg += f'style="font-family: Arial; font-size: 11px; fill: #333;" '
                svg += f'transform="rotate(-90, {x}, {y_pos+40})" '
                svg += f'data-base-x="{x}" data-base-y="{y_pos+40}" '
                svg += f'class="lyric-text">{note_info["lyric"]}</text>\n'
        
        svg += '</svg>'
        return svg
    
    def _prepare_analysis_data(self) -> str:
        """Prepare analysis data for JavaScript"""
        
        # Get patterns for each analysis mode
        kpic_patterns = {}
        kpic_max_n = 2  # Default minimum
        
        # Generate patterns for all analysis modes
        analysis_modes = ['full', 'main_melody', 'grace_units']
        
        for mode in analysis_modes:
            mode_patterns = {}
            mode_max_n = 2
            
            for n in range(2, len(self.processed_notes)):  # Search up to full song length
                results = self.kpic_analyzer.query_pitch_ngrams(
                    n=n, min_count=2, analysis_mode=mode
                )
                
                if results:
                    mode_max_n = n  # Update to highest n with patterns
                    patterns = []
                    for result in results[:10]:  # Top 10
                        patterns.append({
                            'pattern': result['ngram'],
                            'count': result['count'],
                            'positions': result['positions'],
                            'analysis_mode': result.get('analysis_mode', mode)
                        })
                    mode_patterns[f'kpic-{n}'] = patterns
            
            # Add max pattern reference for this mode
            if mode_max_n > 2:
                mode_patterns['kpic-max'] = mode_patterns.get(f'kpic-{mode_max_n}', [])
            
            # Store patterns by mode
            kpic_patterns[mode] = mode_patterns
            if mode == 'full':  # Default mode
                kpic_patterns.update(mode_patterns)  # Add to root for backwards compatibility
                kpic_max_n = mode_max_n
        
        # Add max pattern reference
        if kpic_max_n > 2:
            kpic_patterns['kpic-max'] = kpic_patterns.get(f'kpic-{kpic_max_n}', [])
        
        kric_patterns = {}
        kric_max_n = 2  # Default minimum
        
        # Generate KRIC patterns for all analysis modes
        for mode in analysis_modes:
            mode_patterns = {}
            mode_max_n = 2
            
            for n in range(2, len(self.processed_notes)):  # Search up to full song length
                results = self.kpic_analyzer.query_rhythm_ngrams(
                    n=n, min_count=2, analysis_mode=mode
                )
                
                if results:
                    mode_max_n = n  # Update to highest n with patterns
                    patterns = []
                    for result in results[:10]:  # Top 10
                        patterns.append({
                            'pattern': result['ngram'],
                            'count': result['count'],
                            'positions': result['positions'],
                            'analysis_mode': result.get('analysis_mode', mode)
                        })
                    mode_patterns[f'kric-{n}'] = patterns
            
            # Add max pattern reference for this mode
            if mode_max_n > 2:
                mode_patterns['kric-max'] = mode_patterns.get(f'kric-{mode_max_n}', [])
            
            # Store patterns by mode
            kric_patterns[mode] = mode_patterns
            if mode == 'full':  # Default mode
                kric_patterns.update(mode_patterns)  # Add to root for backwards compatibility
                kric_max_n = mode_max_n
        
        # Add max pattern reference
        if kric_max_n > 2:
            kric_patterns['kric-max'] = kric_patterns.get(f'kric-{kric_max_n}', [])
        
        # Syllable analysis - include ALL syllables with their positions
        syllable_counts = {}
        syllable_positions = {}
        for i, syl in enumerate(self.syllable_mappings):
            if syl['syllable']:
                text = syl['syllable']
                if text not in syllable_counts:
                    syllable_counts[text] = 0
                    syllable_positions[text] = []
                syllable_counts[text] += 1
                syllable_positions[text].append(syl['position'])
        
        # Include both repeated and single syllables
        all_syllables = {}
        repeated_syllables = {}
        unique_syllables = []
        
        for text, count in syllable_counts.items():
            unique_syllables.append(text)
            all_syllables[text] = {
                'count': count,
                'positions': syllable_positions[text]
            }
            if count > 1:
                repeated_syllables[text] = {
                    'count': count,
                    'positions': syllable_positions[text]
                }
        
        # Get ornamentation statistics
        ornamentation_stats = self.kpic_analyzer.get_ornamentation_statistics()
        
        # Get melismatic and tone mark analysis
        melismatic_analysis = self.lyrical_analyzer.get_melismatic_analysis()
        tone_mark_analysis = self.lyrical_analyzer.get_tone_mark_analysis()
        
        # Prepare melismatic syllables for highlighting
        melismatic_positions = {}
        for mapping in self.lyrical_analyzer.syllable_mappings:
            if mapping['is_melismatic']:
                syllable = mapping['syllable']
                if syllable not in melismatic_positions:
                    melismatic_positions[syllable] = []
                melismatic_positions[syllable].append(mapping['position'])
        
        # Prepare tone-based syllables for highlighting (include all notes for each syllable)
        tone_positions = {}
        for tone_type in ['sắc', 'huyền', 'hỏi', 'ngã', 'nặng', 'ngang']:
            tone_positions[tone_type] = []
            for mapping in self.lyrical_analyzer.syllable_mappings:
                if mapping['tone_mark'] == tone_type:
                    # Find all note positions that belong to this syllable
                    syllable_note_positions = []
                    
                    # Add position of note with lyric
                    syllable_note_positions.append(mapping['position'])
                    
                    # Add all following notes without lyrics (they belong to this syllable)
                    next_pos = mapping['position'] + 1
                    while next_pos < len(self.processed_notes):
                        next_note = self.processed_notes[next_pos]
                        if next_note.get('lyric'):  # New syllable starts
                            break
                        syllable_note_positions.append(next_pos)
                        next_pos += 1
                    
                    # Add all preceding grace notes without lyrics (they belong to this syllable)
                    prev_pos = mapping['position'] - 1
                    while prev_pos >= 0:
                        prev_note = self.processed_notes[prev_pos]
                        if (prev_note.get('lyric') or not prev_note.get('is_grace')):
                            break
                        syllable_note_positions.insert(0, prev_pos)  # Insert at beginning
                        prev_pos -= 1
                    
                    tone_positions[tone_type].extend(syllable_note_positions)
        
        # Identify grace-main units (groups of grace notes followed by main note)
        grace_main_units = []
        i = 0
        while i < len(self.processed_notes):
            unit_positions = []
            
            # Collect consecutive grace notes
            while i < len(self.processed_notes) and self.processed_notes[i].get('is_grace'):
                unit_positions.append(i)
                i += 1
            
            # Add the following main note (if exists)
            if i < len(self.processed_notes) and not self.processed_notes[i].get('is_grace'):
                unit_positions.append(i)
                i += 1
            
            # If we have a grace-main unit (grace notes + main note), record it
            if len(unit_positions) > 1:  # At least one grace + one main
                grace_main_units.extend(unit_positions)
            elif not unit_positions:  # No grace notes, just skip
                i += 1
            else:  # Single main note, skip
                i += 1
        
        data = {
            'kpic_patterns': kpic_patterns,
            'kric_patterns': kric_patterns,
            'repeated_syllables': repeated_syllables,
            'all_syllables': all_syllables,
            'unique_syllables': sorted(unique_syllables),
            'melismatic_syllables': melismatic_positions,
            'tone_syllables': tone_positions,
            'melismatic_analysis': melismatic_analysis,
            'tone_mark_analysis': tone_mark_analysis,
            'grace_main_units': grace_main_units,
            'total_notes': len(self.processed_notes),
            'kpic_max_n': kpic_max_n,
            'kric_max_n': kric_max_n,
            'ornamentation_stats': ornamentation_stats
        }
        
        return json.dumps(data, ensure_ascii=False)
    
    def _generate_lyrics_section(self) -> str:
        """Generate an interactive lyrics section with editable phrase breaks"""
        if not hasattr(self, 'lyrical_analyzer') or not self.lyrical_analyzer.syllable_mappings:
            return "<p>No lyrics data available</p>"
        
        # Create a single line with all syllables and clickable break points
        syllables_html = []
        
        for i, mapping in enumerate(self.lyrical_analyzer.syllable_mappings):
            syllable = mapping.get('syllable', '').strip()
            if syllable:
                # Add syllable with metadata
                tone_mark = mapping.get('tone_mark', 'ngang')
                is_melismatic = mapping.get('is_melismatic', False)
                note_count = mapping.get('main_note_count', 0) + mapping.get('grace_note_count', 0)
                
                syllable_classes = ['syllable', 'editable-syllable']
                syllable_title = f"Syllable: {syllable}"
                
                if is_melismatic:
                    syllable_classes.append('melismatic')
                    syllable_title += f" (melismatic, {note_count} notes)"
                else:
                    syllable_title += f" ({note_count} note{'s' if note_count != 1 else ''})"
                
                if tone_mark != 'ngang':
                    syllable_title += f", tone: {tone_mark}"
                
                syllable_html = f'<span class="{" ".join(syllable_classes)}" ' + \
                              f'data-position="{mapping["position"]}" ' + \
                              f'data-syllable-index="{i}" ' + \
                              f'title="{syllable_title}">{syllable}</span>'
                
                syllables_html.append(syllable_html)
                
                # Add clickable break point after each syllable (except the last)
                if i < len(self.lyrical_analyzer.syllable_mappings) - 1:
                    # Check if this should be a default break
                    next_mapping = self.lyrical_analyzer.syllable_mappings[i + 1]
                    
                    # Vietnamese-aware default break conditions
                    is_default_break = self._should_break_here(syllable, i, mapping, next_mapping)
                    
                    break_class = 'line-break active' if is_default_break else 'line-break'
                    break_html = f'<span class="{break_class}" data-break-after="{i}" ' + \
                               f'onclick="toggleLineBreak({i})" title="Click to toggle line break">|</span>'
                    
                    syllables_html.append(break_html)
        
        # Wrap in a container with instructions
        lyrics_content = f'''
        <div class="lyrics-edit-container">
            <div class="edit-instructions">
                <strong>📝 Interactive Lyrics:</strong> Click the "|" symbols to add/remove line breaks. 
                <button onclick="resetLyricsBreaks()" style="margin-left: 10px; padding: 2px 6px; font-size: 11px;">Reset</button>
            </div>
            <div id="editable-lyrics" class="editable-lyrics">
                {" ".join(syllables_html)}
            </div>
        </div>'''
        
        return lyrics_content
    
    def _should_break_here(self, syllable, index, mapping, next_mapping):
        """Vietnamese syntax-aware phrase breaking based on semantic structure"""
        if not next_mapping:
            return True  # End of song
        
        current_syl = syllable.lower().rstrip('.,!?')
        next_syl = next_mapping.get('syllable', '').lower().rstrip('.,!?')
        
        # Get context syllables
        syllables_ahead = []
        for i in range(index + 1, min(index + 4, len(self.lyrical_analyzer.syllable_mappings))):
            syl = self.lyrical_analyzer.syllable_mappings[i].get('syllable', '').lower().rstrip('.,!?')
            if syl:
                syllables_ahead.append(syl)
        
        # Strong punctuation breaks
        if syllable.endswith(('.', '!', '?')):
            return True
        
        # Specific phrase boundaries based on your example:
        
        # 1. "ới rằng bà đi" | "ới đi là đâu"
        if current_syl == 'đi' and next_syl == 'ới':
            return True
        
        # 2. "ới đi là đâu" | "bà đi khắp chốn..."
        if current_syl == 'đâu' and next_syl == 'bà':
            return True
        
        # 3. "...dây tơ hồng" | "cái duyên ông chồng..."
        if current_syl == 'hồng' and next_syl == 'cái':
            return True
        
        # 4. Keep complete vocative endings together: "...tôi ơi bà rí ơi"
        # But break before the refrain: "bà rằng bà rí ơi"
        if current_syl == 'ơi' and next_syl == 'bà' and len(syllables_ahead) >= 2:
            if syllables_ahead[0] == 'bà' and syllables_ahead[1] in ['rằng', 'rí']:
                return True  # Break before refrain
        
        # Keep semantic units together:
        
        # Keep "bà rằng bà rí" complete
        if current_syl in ['bà', 'rằng'] and next_syl in ['rằng', 'bà', 'rí']:
            return False
        
        # Keep "ông chồng" together
        if current_syl == 'ông' and next_syl == 'chồng':
            return False
        
        # Keep "cái + noun" together
        if current_syl == 'cái' and next_syl in ['duyên', 'đời']:
            return False
        
        # Keep verb phrases together: "làm khổ cái đời tôi"
        if current_syl in ['làm', 'khổ'] and next_syl in ['khổ', 'cái']:
            return False
        if current_syl == 'cái' and next_syl in ['đời', 'duyên']:
            # Check if this is part of verb phrase
            if index > 0:
                prev_syl = self.lyrical_analyzer.syllable_mappings[index - 1].get('syllable', '').lower().rstrip('.,!?')
                if prev_syl in ['khổ', 'làm']:
                    return False
        if current_syl in ['đời', 'duyên'] and next_syl == 'tôi':
            return False
        
        # Keep "tôi ơi" together as emotional expression
        if current_syl == 'tôi' and next_syl == 'ơi':
            return False
        
        # Keep descriptive phrases: "chồng gì mà chồng bé"
        if current_syl == 'chồng' and next_syl in ['gì', 'bé']:
            return False
        if current_syl == 'gì' and next_syl == 'mà':
            return False
        if current_syl == 'mà' and next_syl == 'chồng':
            return False
        
        # Keep location/direction phrases: "đi là đâu", "khắp chốn"
        if current_syl in ['đi', 'là'] and next_syl in ['là', 'đâu']:
            return False
        if current_syl == 'khắp' and next_syl == 'chốn':
            return False
        
        # Comma breaks (softer boundaries)
        if syllable.endswith(','):
            return True
        
        # Musical pause indicates boundary
        if next_mapping and next_mapping['position'] - mapping['position'] > 4:
            return True
        
        return False
    
    def _get_css_styles(self) -> str:
        """CSS styles for the analytical tablature"""
        return """
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1600px;
            margin: 0 auto;
        }
        
        header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        header h1 {
            color: #2c3e50;
            margin-bottom: 10px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        
        header h2 {
            color: #7f8c8d;
            font-weight: normal;
            font-size: 1.1em;
        }
        
        .controls {
            background: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            margin-bottom: 15px;
        }
        
        .controls-grid {
            display: grid;
            grid-template-columns: 3fr 0.8fr 1.2fr 0.8fr;
            gap: 15px;
        }
        
        @media (max-width: 1200px) {
            .controls-grid {
                grid-template-columns: 1fr 1fr;
                grid-template-rows: auto auto;
            }
        }
        
        @media (max-width: 768px) {
            .controls-grid {
                grid-template-columns: 1fr;
            }
        }
        
        .control-section.compact {
            margin-bottom: 0;
            padding: 10px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background: #fafafa;
        }
        
        .section-title {
            margin: 0 0 10px 0;
            color: #2c3e50;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            user-select: none;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .section-title.collapsible:hover {
            color: #3498db;
        }
        
        .toggle-icon {
            font-size: 12px;
            transition: transform 0.3s;
        }
        
        .toggle-icon.collapsed {
            transform: rotate(-90deg);
        }
        
        .section-content {
            transition: max-height 0.3s ease-out;
            overflow: hidden;
        }
        
        .section-content.collapsed {
            max-height: 0;
            margin: 0;
            padding: 0;
        }
        
        .inline-controls {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
        }
        
        .inline-controls .control-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
            margin-bottom: 0;
            min-width: auto;
        }
        
        .control-group-header {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .inline-controls label {
            font-size: 12px;
            margin-bottom: 0;
            white-space: nowrap;
        }
        
        .inline-controls select {
            padding: 4px;
            font-size: 12px;
            min-width: 80px;
        }
        
        .inline-controls input[type="range"] {
            width: 80px;
        }
        
        .inline-controls button {
            padding: 4px 8px;
            font-size: 12px;
            margin-right: 5px;
        }
        
        .pattern-selector {
            margin-top: 8px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 5px;
        }
        
        .pattern-selector select {
            border: none;
            font-size: 11px;
            width: 100%;
            min-height: 60px;
        }
        
        .patterns-row {
            display: flex;
            gap: 15px;
        }
        
        .pattern-column {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .control-row {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 15px;
        }
        
        .control-row:last-child {
            margin-bottom: 0;
        }
        
        .control-group {
            display: flex;
            flex-direction: column;
            min-width: 200px;
        }
        
        .zoom-controls {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .custom-zoom {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .slider-container {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 5px;
        }
        
        .slider-container input[type="range"] {
            flex: 1;
        }
        
        .custom-zoom input {
            padding: 4px 6px;
            border: 1px solid #ddd;
            border-radius: 3px;
            font-size: 14px;
        }
        
        .control-group label {
            font-weight: 600;
            margin-bottom: 5px;
            color: #34495e;
        }
        
        select, input[type="range"] {
            padding: 8px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
        }
        
        select:focus {
            outline: none;
            border-color: #3498db;
        }
        
        button {
            padding: 10px 20px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            margin-right: 10px;
        }
        
        button:hover {
            background: #2980b9;
        }
        
        .tablature-container {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            overflow-x: auto;
        }
        
        .lyrics-section {
            background: white;
            padding: 10px;
            margin-top: 10px;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .lyrics-section h3 {
            color: #2c3e50;
            margin: 0 0 8px 0;
            font-size: 16px;
            border-bottom: 1px solid #3498db;
            padding-bottom: 4px;
        }
        
        .lyrics-content {
            font-size: 14px;
            line-height: 1.0;
            color: #2c3e50;
            font-family: serif;
        }
        
        .lyrics-line {
            margin-bottom: 0px;
            padding: 0;
            line-height: 1.1;
        }
        
        .syllable {
            margin-right: 4px;
            padding: 2px 4px;
            border-radius: 3px;
            transition: background-color 0.3s;
        }
        
        .syllable:hover {
            background-color: #ecf0f1;
            cursor: pointer;
        }
        
        .syllable.highlighted {
            background-color: #3498db;
            color: white;
        }
        
        .lyrics-edit-container {
            margin-top: 10px;
        }
        
        .edit-instructions {
            font-size: 12px;
            color: #7f8c8d;
            margin-bottom: 8px;
            padding: 5px;
            background: #ecf0f1;
            border-radius: 3px;
        }
        
        .editable-lyrics {
            line-height: 1.2;
        }
        
        .coverage-indicator {
            position: absolute;
            top: -5px;
            right: -5px;
            font-size: 8px;
            color: orange;
            font-weight: bold;
            z-index: 10;
        }
        
        .editable-syllable {
            position: relative;
            display: inline-block;
        }
        
        .line-break {
            color: #bdc3c7;
            cursor: pointer;
            margin: 0 2px;
            font-weight: bold;
            opacity: 0.3;
            transition: opacity 0.2s;
        }
        
        .line-break:hover {
            opacity: 0.8;
            color: #3498db;
        }
        
        .line-break.active {
            color: #3498db;
            opacity: 0.7;
        }
        
        .line-break.active::after {
            content: '\\A';
            white-space: pre;
            line-height: 0.1;
        }
        
        .legend {
            background: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        
        .legend h3 {
            margin-top: 0;
            color: #2c3e50;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .color-sample {
            width: 20px;
            height: 20px;
            border-radius: 3px;
            margin-right: 10px;
            border: 1px solid #ccc;
        }
        
        .color-sample.kpic-highlight {
            background: linear-gradient(45deg, #ffeb3b 25%, #ff9800 25%, #ff9800 50%, #ffeb3b 50%, #ffeb3b 75%, #ff9800 75%);
            background-size: 4px 4px;
        }
        
        .color-sample.kric-highlight {
            background: #e3f2fd;
            border-color: #2196f3;
        }
        
        .color-sample.syllable-repetition {
            background: white;
            border: 3px solid #f44336;
        }
        
        .color-sample.syllable-focus {
            background: #e91e63;
        }
        
        .color-sample.grace-main-unit {
            background: #4caf50;
            border-color: #2e7d32;
        }
        
        .color-sample.syllable-melismatic {
            background: #9c27b0;
            border-color: #6a1b9a;
        }
        
        .color-sample.grace-note {
            background: #FFD700;
            border-color: #0066FF;
        }
        
        .analysis-info {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .analysis-info h3 {
            color: #2c3e50;
            margin-top: 0;
        }
        
        #minCountValue {
            font-weight: bold;
            margin-left: 10px;
        }
        
        @media (max-width: 768px) {
            .control-row {
                flex-direction: column;
            }
            
            .control-group {
                min-width: auto;
            }
        }
        """
    
    def _get_javascript_code(self) -> str:
        """JavaScript for interactive functionality"""
        return """
        let currentHighlighting = null;
        
        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            populateSyllableDropdown();
            updateMinCountDisplay();
            updateMaxLabels();
            
            // Set default Y-zoom to 67%
            updateYZoom(currentYZoom);
            
            // Add listener for analysis mode changes
            document.getElementById('analysisMode').addEventListener('change', function() {
                // Refresh pattern options when analysis mode changes
                updateKpicPatternOptions();
                updateKricPatternOptions();
            });
        });
        
        function populateSyllableDropdown() {
            const select = document.getElementById('specificSyllable');
            select.innerHTML = '';
            
            // Use all_syllables data which includes both repeated and single syllables
            const sortedSyllables = Object.entries(analysisData.all_syllables)
                .sort((a, b) => {
                    if (b[1].count !== a[1].count) return b[1].count - a[1].count; // By frequency
                    return a[0].localeCompare(b[0]); // Then alphabetically
                });
            
            sortedSyllables.forEach(([syllable, data]) => {
                const option = document.createElement('option');
                option.value = syllable;
                option.textContent = data.count > 1 ? `${syllable} (${data.count}×)` : syllable;
                select.appendChild(option);
            });
        }
        
        function updateMaxLabels() {
            // Update KPIC-MAX label to show actual n value
            const kpicSelect = document.getElementById('kpicFilter');
            const kpicMaxOption = kpicSelect.querySelector('option[value="kpic-max"]');
            if (kpicMaxOption) {
                kpicMaxOption.textContent = `KPIC-MAX (KPIC-${analysisData.kpic_max_n} with 2+ reps)`;
            }
            
            // Update KRIC-MAX label to show actual n value
            const kricSelect = document.getElementById('kricFilter');
            const kricMaxOption = kricSelect.querySelector('option[value="kric-max"]');
            if (kricMaxOption) {
                kricMaxOption.textContent = `KRIC-MAX (KRIC-${analysisData.kric_max_n} with 2+ reps)`;
            }
        }
        
        function updateZoomFromSelect() {
            const zoomSelect = document.getElementById('zoomLevel');
            const xSlider = document.getElementById('xZoomSlider');
            const xValue = document.getElementById('xZoomValue');
            
            if (zoomSelect.value === 'fit-width') {
                // Calculate fit-to-width zoom level
                const fitZoomLevel = calculateFitWidthZoom();
                const fitPercent = Math.round(fitZoomLevel * 100);
                currentXZoom = fitZoomLevel;
                xSlider.value = fitPercent;
                xValue.textContent = fitPercent + '%';
                updateZoom();
            } else if (zoomSelect.value === 'custom') {
                // Use current stored zoom value
                updateZoom();
            } else {
                // Update slider to match selected value
                const zoomPercent = Math.round(parseFloat(zoomSelect.value) * 100);
                currentXZoom = parseFloat(zoomSelect.value);
                xSlider.value = zoomPercent;
                xValue.textContent = zoomPercent + '%';
                updateZoom();
            }
        }
        
        function calculateFitWidthZoom() {
            const svg = document.getElementById('tablatureSvg');
            const container = document.querySelector('.tablature-container');
            const containerWidth = container.clientWidth - 80; // More conservative padding
            
            // Use the original SVG base width which already includes all content + padding
            const baseWidth = parseInt(svg.getAttribute('data-base-width'));
            
            // The base width already accounts for all notes, widths, and original padding
            // So we can directly calculate fit zoom from this
            const fitZoomLevel = containerWidth / baseWidth;
            
            // Be more conservative with the zoom to ensure no cutoff
            const conservativeFitZoom = fitZoomLevel * 0.95; // Use 95% to add safety margin
            
            return Math.max(0.01, Math.min(5.0, conservativeFitZoom));
        }
        
        function updateZoomFromInput() {
            const customZoomInput = document.getElementById('customZoom');
            const zoomSelect = document.getElementById('zoomLevel');
            
            // Set dropdown to custom when user types
            zoomSelect.value = 'custom';
            updateZoom();
        }
        
        let currentXZoom = 1.0;
        let currentYZoom = 0.67;
        
        function updateZoomFromSlider(axis) {
            if (axis === 'x') {
                const xSlider = document.getElementById('xZoomSlider');
                const xValue = document.getElementById('xZoomValue');
                const zoomSelect = document.getElementById('zoomLevel');
                
                const sliderValue = parseInt(xSlider.value);
                xValue.textContent = sliderValue + '%';
                
                // Store current zoom level
                currentXZoom = sliderValue / 100;
                
                // Update the zoom select to custom
                zoomSelect.value = 'custom';
                updateZoom();
            } else if (axis === 'y') {
                const ySlider = document.getElementById('yZoomSlider');
                const yValue = document.getElementById('yZoomValue');
                const yZoomSelect = document.getElementById('yZoomLevel');
                
                const sliderValue = parseInt(ySlider.value);
                yValue.textContent = sliderValue + '%';
                
                // Store current zoom level
                currentYZoom = sliderValue / 100;
                
                // Update the Y-zoom select to custom
                yZoomSelect.value = 'custom';
                updateYZoom(currentYZoom);
            }
        }
        
        function updateYZoomFromSelect() {
            const yZoomSelect = document.getElementById('yZoomLevel');
            const ySlider = document.getElementById('yZoomSlider');
            const yValue = document.getElementById('yZoomValue');
            
            if (yZoomSelect.value === 'fit-height') {
                const fitZoomLevel = calculateFitHeightZoom();
                const fitPercent = Math.round(fitZoomLevel * 100);
                currentYZoom = fitZoomLevel;
                ySlider.value = fitPercent;
                yValue.textContent = fitPercent + '%';
                updateYZoom(currentYZoom);
            } else if (yZoomSelect.value === 'custom') {
                // Use current stored zoom value
                updateYZoom(currentYZoom);
            } else {
                // Update slider to match selected value
                const zoomPercent = Math.round(parseFloat(yZoomSelect.value) * 100);
                currentYZoom = parseFloat(yZoomSelect.value);
                ySlider.value = zoomPercent;
                yValue.textContent = zoomPercent + '%';
                updateYZoom(currentYZoom);
            }
        }
        
        function calculateFitHeightZoom() {
            const svg = document.getElementById('tablatureSvg');
            const container = window;
            const availableHeight = container.innerHeight - 300; // Reserve space for controls and margins
            
            const baseHeight = parseInt(svg.getAttribute('data-base-height') || svg.getAttribute('height'));
            const fitZoomLevel = availableHeight / baseHeight;
            
            // Be conservative to ensure no cutoff
            const conservativeFitZoom = fitZoomLevel * 0.9;
            
            return Math.max(0.05, Math.min(2.0, conservativeFitZoom));
        }
        
        function updateYZoom(yZoomLevel) {
            const svg = document.getElementById('tablatureSvg');
            const baseHeight = parseInt(svg.getAttribute('data-base-height') || svg.getAttribute('height'));
            
            if (!svg.getAttribute('data-base-height')) {
                svg.setAttribute('data-base-height', baseHeight);
            }
            
            // Scale the SVG height
            const newHeight = baseHeight * yZoomLevel;
            svg.setAttribute('height', newHeight);
            
            // Scale string line positions
            const stringLines = svg.querySelectorAll('.string-line');
            const stringLabels = svg.querySelectorAll('.string-label');
            const stringNumbers = svg.querySelectorAll('.string-number');
            const notes = svg.querySelectorAll('.note-circle');
            const resonanceBands = svg.querySelectorAll('rect[fill*="resonanceBand"]');
            const allTexts = svg.querySelectorAll('text');
            
            // Update string lines and labels
            stringLines.forEach((line) => {
                const baseY = parseFloat(line.getAttribute('data-base-y1') || line.getAttribute('y1'));
                if (!line.getAttribute('data-base-y1')) {
                    line.setAttribute('data-base-y1', baseY);
                    line.setAttribute('data-base-y2', baseY);
                }
                const scaledY = baseY * yZoomLevel;
                line.setAttribute('y1', scaledY);
                line.setAttribute('y2', scaledY);
            });
            
            stringLabels.forEach((label) => {
                const baseY = parseFloat(label.getAttribute('data-base-y') || label.getAttribute('y'));
                if (!label.getAttribute('data-base-y')) {
                    label.setAttribute('data-base-y', baseY);
                }
                const scaledY = baseY * yZoomLevel;
                label.setAttribute('y', scaledY);
            });
            
            // Update string numbers inside circles
            stringNumbers.forEach((number) => {
                const baseY = parseFloat(number.getAttribute('data-base-y') || number.getAttribute('y'));
                if (!number.getAttribute('data-base-y')) {
                    number.setAttribute('data-base-y', baseY);
                }
                const scaledY = baseY * yZoomLevel;
                number.setAttribute('y', scaledY);
            });
            
            // Update note positions
            notes.forEach((note) => {
                const baseY = parseFloat(note.getAttribute('data-base-y') || note.getAttribute('cy'));
                if (!note.getAttribute('data-base-y')) {
                    note.setAttribute('data-base-y', baseY);
                }
                const scaledY = baseY * yZoomLevel;
                note.setAttribute('cy', scaledY);
            });
            
            // Update resonance bands
            resonanceBands.forEach((band) => {
                const baseY = parseFloat(band.getAttribute('data-base-y') || band.getAttribute('y'));
                if (!band.getAttribute('data-base-y')) {
                    band.setAttribute('data-base-y', baseY);
                }
                const scaledY = baseY * yZoomLevel;
                band.setAttribute('y', scaledY);
            });
            
            // Update text elements with relative positioning to maintain readability
            allTexts.forEach((text) => {
                // Skip already handled elements
                if (text.classList.contains('string-label') || text.classList.contains('string-number')) {
                    return;
                }
                
                const baseY = parseFloat(text.getAttribute('data-base-y') || text.getAttribute('y'));
                if (!text.getAttribute('data-base-y') && text.getAttribute('y')) {
                    text.setAttribute('data-base-y', baseY);
                }
                if (text.getAttribute('data-base-y')) {
                    // For note-related text (pitch numbers, durations, lyrics), 
                    // maintain relative distance to notes for readability
                    const noteElements = svg.querySelectorAll('.note-circle');
                    let associatedNoteY = baseY; // default
                    
                    // Find the closest note to determine relative positioning
                    const textX = parseFloat(text.getAttribute('x') || text.getAttribute('data-base-x'));
                    let minDistance = Infinity;
                    
                    noteElements.forEach(note => {
                        const noteX = parseFloat(note.getAttribute('data-base-x') || note.getAttribute('cx'));
                        const noteY = parseFloat(note.getAttribute('data-base-y') || note.getAttribute('cy'));
                        const distance = Math.abs(textX - noteX);
                        
                        if (distance < minDistance) {
                            minDistance = distance;
                            associatedNoteY = noteY;
                        }
                    });
                    
                    // Calculate relative offset from the associated note
                    const relativeOffset = baseY - associatedNoteY;
                    const scaledNoteY = associatedNoteY * yZoomLevel;
                    const scaledY = scaledNoteY + relativeOffset; // Keep same relative distance
                    
                    text.setAttribute('y', scaledY);
                    
                    // Update transforms for rotated text (lyrics)
                    const transform = text.getAttribute('transform');
                    if (transform && transform.includes('rotate')) {
                        const x = parseFloat(text.getAttribute('x'));
                        text.setAttribute('transform', `rotate(-90, ${x}, ${scaledY})`);
                    }
                }
            });
            
            // Update connection lines
            const connectionLines = svg.querySelectorAll('.pattern-connection-line');
            connectionLines.forEach((line) => {
                const baseY1 = parseFloat(line.getAttribute('data-base-y1') || line.getAttribute('y1'));
                const baseY2 = parseFloat(line.getAttribute('data-base-y2') || line.getAttribute('y2'));
                
                if (!line.getAttribute('data-base-y1')) {
                    line.setAttribute('data-base-y1', baseY1);
                    line.setAttribute('data-base-y2', baseY2);
                }
                
                line.setAttribute('y1', baseY1 * yZoomLevel);
                line.setAttribute('y2', baseY2 * yZoomLevel);
            });
        }
        
        function getCurrentZoomLevel() {
            const zoomSelect = document.getElementById('zoomLevel');
            
            if (zoomSelect.value === 'fit-width') {
                return calculateFitWidthZoom();
            } else if (zoomSelect.value === 'custom') {
                return currentXZoom;
            } else {
                return parseFloat(zoomSelect.value);
            }
        }
        
        function updateZoom() {
            const zoomLevel = getCurrentZoomLevel();
            const svg = document.getElementById('tablatureSvg');
            const baseWidth = parseInt(svg.getAttribute('data-base-width'));
            
            // Scale the SVG width
            const newWidth = baseWidth * zoomLevel;
            svg.setAttribute('width', newWidth);
            
            // Scale all note positions and widths
            const notes = svg.querySelectorAll('.note-circle');
            const resonanceBands = svg.querySelectorAll('rect[fill*="resonanceBand"]');
            const texts = svg.querySelectorAll('text');
            
            // Get container width to determine if scrolling is needed
            const container = document.querySelector('.tablature-container');
            const containerWidth = container.clientWidth;
            const needsScrolling = newWidth > containerWidth;
            
            notes.forEach((note, index) => {
                const baseX = parseFloat(note.getAttribute('data-base-x') || note.getAttribute('cx'));
                if (!note.getAttribute('data-base-x')) {
                    note.setAttribute('data-base-x', baseX);
                }
                // Apply zoom proportionally, maintaining relative spacing
                // Start notes at 120px but scale the offset proportionally
                const baseOffset = baseX - 120; // Distance from starting position
                const scaledOffset = baseOffset * zoomLevel;
                const scaledX = 120 + scaledOffset;
                note.setAttribute('cx', scaledX);
            });
            
            // Scale resonance bands
            resonanceBands.forEach((band, index) => {
                const baseX = parseFloat(band.getAttribute('data-base-x') || band.getAttribute('x'));
                const baseWidth = parseFloat(band.getAttribute('data-base-width') || band.getAttribute('width'));
                
                if (!band.getAttribute('data-base-x')) {
                    band.setAttribute('data-base-x', baseX);
                    band.setAttribute('data-base-width', baseWidth);
                }
                
                // Apply zoom proportionally, maintaining relative spacing
                const baseOffset = baseX - 120;
                const scaledOffset = baseOffset * zoomLevel;
                const scaledX = 120 + scaledOffset;
                band.setAttribute('x', scaledX);
                band.setAttribute('width', baseWidth * zoomLevel);
            });
            
            // Scale text positions (notes and lyrics, not string labels)
            texts.forEach((text, index) => {
                const baseX = parseFloat(text.getAttribute('data-base-x') || text.getAttribute('x'));
                if (!text.getAttribute('data-base-x')) {
                    text.setAttribute('data-base-x', baseX);
                }
                // Only scale note-related text (x > 120), keep string labels fixed
                if (baseX > 120) {
                    const baseOffset = baseX - 120;
                    const scaledOffset = baseOffset * zoomLevel;
                    const scaledX = 120 + scaledOffset;
                    text.setAttribute('x', scaledX);
                    
                    // For lyric text with rotation, update the transform with current Y position
                    if (text.classList.contains('lyric-text')) {
                        const currentY = parseFloat(text.getAttribute('y'));
                        text.setAttribute('transform', `rotate(-90, ${scaledX}, ${currentY})`);
                    }
                }
            });
            
            // Scale connection lines
            const connectionLines = svg.querySelectorAll('.pattern-connection-line');
            connectionLines.forEach((line, index) => {
                const baseX1 = parseFloat(line.getAttribute('data-base-x1') || line.getAttribute('x1'));
                const baseX2 = parseFloat(line.getAttribute('data-base-x2') || line.getAttribute('x2'));
                
                if (!line.getAttribute('data-base-x1')) {
                    line.setAttribute('data-base-x1', baseX1);
                    line.setAttribute('data-base-x2', baseX2);
                }
                
                // Apply zoom scaling to X coordinates
                const baseOffset1 = baseX1 - 120;
                const baseOffset2 = baseX2 - 120;
                const scaledOffset1 = baseOffset1 * zoomLevel;
                const scaledOffset2 = baseOffset2 * zoomLevel;
                const scaledX1 = 120 + scaledOffset1;
                const scaledX2 = 120 + scaledOffset2;
                
                line.setAttribute('x1', scaledX1);
                line.setAttribute('x2', scaledX2);
                // Y coordinates don't change with X-axis zoom
            });
            
            // Update string lines to extend beyond the last note
            const stringLines = svg.querySelectorAll('.string-line');
            
            // Find the rightmost note position after scaling
            let maxNoteX = 120; // Minimum starting position
            notes.forEach((note) => {
                const noteX = parseFloat(note.getAttribute('cx'));
                maxNoteX = Math.max(maxNoteX, noteX);
            });
            
            // Extend string lines beyond the last note with padding
            const lineEndX = maxNoteX + 100; // Add 100px padding beyond last note
            
            stringLines.forEach((line) => {
                line.setAttribute('x2', lineEndX);
            });
            
            // Also update SVG width if needed to accommodate the extended lines
            if (lineEndX > newWidth) {
                svg.setAttribute('width', lineEndX + 50);
            }
            
            // Update container scroll behavior based on actual content size vs container size
            if (needsScrolling) {
                container.style.overflowX = 'auto';
                container.style.overflowY = 'hidden';
            } else {
                container.style.overflowX = 'hidden';
                container.style.overflowY = 'hidden';
            }
        }
        
        function updateKpicPatternOptions() {
            const kpicFilter = document.getElementById('kpicFilter').value;
            const patternGroup = document.getElementById('kpicPatternGroup');
            const patternSelect = document.getElementById('specificKpicPattern');
            
            if (kpicFilter === 'none') {
                patternGroup.style.display = 'none';
                updateHighlighting();
                return;
            }
            
            // Show pattern selection dropdown
            patternGroup.style.display = 'block';
            
            // Populate with actual patterns based on current analysis mode
            const analysisMode = document.getElementById('analysisMode').value;
            const modePatterns = analysisData.kpic_patterns[analysisMode] || analysisData.kpic_patterns;
            const patterns = modePatterns[kpicFilter] || [];
            patternSelect.innerHTML = '';
            
            patterns.forEach((pattern, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${pattern.pattern.join(' → ')} (${pattern.count}×)`;
                patternSelect.appendChild(option);
            });
            
            updateHighlighting();
        }
        
        function updateKricPatternOptions() {
            const kricFilter = document.getElementById('kricFilter').value;
            const patternGroup = document.getElementById('kricPatternGroup');
            const patternSelect = document.getElementById('specificKricPattern');
            
            if (kricFilter === 'none') {
                patternGroup.style.display = 'none';
                updateHighlighting();
                return;
            }
            
            // Show pattern selection dropdown
            patternGroup.style.display = 'block';
            
            // Populate with actual patterns based on current analysis mode
            const analysisMode = document.getElementById('analysisMode').value;
            const modePatterns = analysisData.kric_patterns[analysisMode] || analysisData.kric_patterns;
            const patterns = modePatterns[kricFilter] || [];
            patternSelect.innerHTML = '';
            
            patterns.forEach((pattern, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${pattern.pattern.join(' → ')} (${pattern.count}×)`;
                patternSelect.appendChild(option);
            });
            
            updateHighlighting();
        }
        
        function updateHighlighting() {
            // Clear previous highlighting
            clearHighlighting();
            
            const kpicFilter = document.getElementById('kpicFilter').value;
            const kricFilter = document.getElementById('kricFilter').value;
            const syllableFilter = document.getElementById('syllableFilter').value;
            const minCount = parseInt(document.getElementById('minCount').value);
            const analysisMode = document.getElementById('analysisMode').value;
            
            // Show/hide specific syllable dropdown
            const specificGroup = document.getElementById('specificSyllableGroup');
            if (syllableFilter === 'specific') {
                specificGroup.style.display = 'block';
            } else {
                specificGroup.style.display = 'none';
            }
            
            let patternDetails = '';
            
            // Apply KPIC highlighting (specific patterns)
            if (kpicFilter !== 'none') {
                // Get patterns based on weighting mode
                const modePatterns = analysisData.kpic_patterns[analysisMode] || analysisData.kpic_patterns;
                const patterns = modePatterns[kpicFilter] || [];
                const patternSelect = document.getElementById('specificKpicPattern');
                const selectedIndices = Array.from(patternSelect.selectedOptions).map(opt => parseInt(opt.value));
                
                if (selectedIndices.length === 0) {
                    // If no patterns selected, show all that meet min count
                    const filteredPatterns = patterns.filter(p => p.count >= minCount);
                    selectedIndices.push(...filteredPatterns.map((_, i) => i));
                }
                
                const selectedPatterns = selectedIndices.map(i => patterns[i]).filter(Boolean);
                
                selectedPatterns.forEach((pattern, patternIndex) => {
                    const colorIndex = patternIndex % 5; // Cycle through 5 colors
                    const patternColors = ['#ff9800', '#e91e63', '#9c27b0', '#3f51b5', '#009688']; // KPIC colors
                    
                    pattern.positions.forEach(startPos => {
                        const ngramSize = pattern.pattern.length;
                        const patternPositions = [];
                        
                        for (let i = 0; i < ngramSize; i++) {
                            const noteIndex = startPos + i;
                            const noteElement = document.getElementById(`note-${noteIndex}`);
                            if (noteElement) {
                                noteElement.classList.add('kpic-highlight', 'pattern-member', `pattern-color-${colorIndex}`);
                                noteElement.setAttribute('data-pattern-type', 'KPIC');
                                noteElement.setAttribute('data-pattern-info', 
                                    `${kpicFilter.toUpperCase()}: ${pattern.pattern.join('→')} (${pattern.count}×)`);
                                patternPositions.push(noteIndex);
                            }
                        }
                        
                        // Draw connection lines for this pattern instance
                        if (patternPositions.length > 1) {
                            drawGraceAwareConnections(patternPositions, patternColors[colorIndex], 3, `kpic-${patternIndex}-${startPos}`);
                        }
                        
                        // Highlight corresponding lyrics with coverage analysis
                        highlightCorrespondingLyrics(patternPositions, patternColors[colorIndex], `KPIC-${kpicFilter}`, patternIndex);
                    });
                });
                
                patternDetails += `<h4>${kpicFilter.toUpperCase()} Selected Patterns</h4>`;
                patternDetails += '<ul>';
                selectedPatterns.forEach(p => {
                    patternDetails += `<li>${p.pattern.join(' → ')} <strong>(${p.count}×)</strong> at positions: ${p.positions.join(', ')}</li>`;
                });
                patternDetails += '</ul>';
            }
            
            // Apply KRIC highlighting (specific patterns)
            if (kricFilter !== 'none') {
                // Get patterns based on analysis mode
                const modePatterns = analysisData.kric_patterns[analysisMode] || analysisData.kric_patterns;
                const patterns = modePatterns[kricFilter] || [];
                const patternSelect = document.getElementById('specificKricPattern');
                const selectedIndices = Array.from(patternSelect.selectedOptions).map(opt => parseInt(opt.value));
                
                if (selectedIndices.length === 0) {
                    // If no patterns selected, show all that meet min count
                    const filteredPatterns = patterns.filter(p => p.count >= minCount);
                    selectedIndices.push(...filteredPatterns.map((_, i) => i));
                }
                
                const selectedPatterns = selectedIndices.map(i => patterns[i]).filter(Boolean);
                
                selectedPatterns.forEach((pattern, patternIndex) => {
                    const colorIndex = patternIndex % 5; // Cycle through 5 colors
                    const patternColors = ['#2196f3', '#4caf50', '#ff5722', '#9c27b0', '#ff9800']; // KRIC colors
                    
                    pattern.positions.forEach(startPos => {
                        const ngramSize = pattern.pattern.length;
                        const patternPositions = [];
                        
                        for (let i = 0; i < ngramSize; i++) {
                            const noteIndex = startPos + i;
                            const noteElement = document.getElementById(`note-${noteIndex}`);
                            if (noteElement) {
                                noteElement.classList.add('kric-highlight', 'pattern-member', `pattern-color-${colorIndex}`);
                                noteElement.setAttribute('data-pattern-type', 'KRIC');
                                noteElement.setAttribute('data-pattern-info', 
                                    `${kricFilter.toUpperCase()}: ${pattern.pattern.join('→')} (${pattern.count}×)`);
                                patternPositions.push(noteIndex);
                            }
                        }
                        
                        // Draw connection lines for this pattern instance
                        if (patternPositions.length > 1) {
                            drawGraceAwareConnections(patternPositions, patternColors[colorIndex], 3, `kric-${patternIndex}-${startPos}`);
                        }
                        
                        // Highlight corresponding lyrics with coverage analysis
                        highlightCorrespondingLyrics(patternPositions, patternColors[colorIndex], `KRIC-${kricFilter}`, patternIndex);
                    });
                });
                
                patternDetails += `<h4>${kricFilter.toUpperCase()} Selected Patterns</h4>`;
                patternDetails += '<ul>';
                selectedPatterns.forEach(p => {
                    patternDetails += `<li>${p.pattern.join(' → ')} <strong>(${p.count}×)</strong> at positions: ${p.positions.join(', ')}</li>`;
                });
                patternDetails += '</ul>';
            }
            
            // Apply syllable highlighting
            if (syllableFilter === 'grace_main_units') {
                // Highlight all grace-main units
                analysisData.grace_main_units.forEach(pos => {
                    const noteElement = document.getElementById(`note-${pos}`);
                    if (noteElement) {
                        noteElement.classList.add('grace-main-unit');
                        noteElement.setAttribute('data-syllable-info', 
                            `Grace-Main Unit (position ${pos})`);
                    }
                });
                
                // Draw connection lines for grace-main units
                if (analysisData.grace_main_units.length > 1) {
                    drawGraceAwareConnections(analysisData.grace_main_units, '#2e7d32', 2, 'grace-main-units', 'grace-unit');
                }
                
                const unitCount = analysisData.grace_main_units.length;
                patternDetails += `<h4>Grace-Main Units</h4>`;
                patternDetails += `<p>Highlighted ${unitCount} notes that are part of grace-main units.</p>`;
                patternDetails += `<p>Grace-main units consist of one or more grace notes followed by a main note.</p>`;
            } else if (syllableFilter === 'melismatic') {
                // Highlight multi-note syllables
                Object.entries(analysisData.melismatic_syllables).forEach(([syllable, positions]) => {
                    positions.forEach(pos => {
                        const noteElement = document.getElementById(`note-${pos}`);
                        if (noteElement) {
                            noteElement.classList.add('syllable-melismatic');
                            noteElement.setAttribute('data-syllable-info', 
                                `Melismatic syllable: "${syllable}"`);
                        }
                    });
                    
                    // Draw connection lines only for consecutive notes within each melismatic syllable
                    if (positions.length > 1) {
                        drawGraceAwareConnections(positions, '#6a1b9a', 2, `melisma-${syllable}`, 'melisma');
                    }
                });
                
                const melismaCount = Object.keys(analysisData.melismatic_syllables).length;
                patternDetails += `<h4>Multi-note Syllables (Melismas)</h4>`;
                patternDetails += `<p>Found ${melismaCount} melismatic syllables.</p>`;
                patternDetails += '<ul>';
                Object.entries(analysisData.melismatic_syllables).slice(0, 10).forEach(([syl, positions]) => {
                    patternDetails += `<li>"${syl}" - ${positions.length} occurrence(s)</li>`;
                });
                patternDetails += '</ul>';
            } else if (syllableFilter.startsWith('tone_')) {
                // Highlight syllables by tone mark
                const toneType = syllableFilter.replace('tone_', '');
                const toneMap = {
                    'sac': 'sắc', 'huyen': 'huyền', 'hoi': 'hỏi',
                    'nga': 'ngã', 'nang': 'nặng', 'ngang': 'ngang'
                };
                const tone = toneMap[toneType];
                
                if (analysisData.tone_syllables && analysisData.tone_syllables[tone]) {
                    const toneColors = {
                        'sắc': '#ff5722',    // Rising tone - orange
                        'huyền': '#3f51b5',  // Falling tone - blue  
                        'hỏi': '#009688',    // Dipping tone - teal
                        'ngã': '#ff9800',    // Broken rising - amber
                        'nặng': '#795548',   // Heavy tone - brown
                        'ngang': '#607d8b'   // Flat tone - blue-grey
                    };
                    
                    analysisData.tone_syllables[tone].forEach(pos => {
                        const noteElement = document.getElementById(`note-${pos}`);
                        if (noteElement) {
                            noteElement.classList.add('syllable-tone', `tone-${toneType}`);
                            noteElement.setAttribute('data-syllable-info', 
                                `Tone: ${tone}`);
                        }
                    });
                    
                    // Draw connection lines for tone groups (connect consecutive notes within each tone)
                    if (analysisData.tone_syllables[tone].length > 1) {
                        drawGraceAwareConnections(analysisData.tone_syllables[tone], toneColors[tone], 2, `tone-${tone}`, 'melisma');
                    }
                    
                    const toneCount = analysisData.tone_syllables[tone].length;
                    patternDetails += `<h4>Tone Mark: ${tone.charAt(0).toUpperCase() + tone.slice(1)}</h4>`;
                    patternDetails += `<p>Found ${toneCount} notes with ${tone} tone (including melismatic notes).</p>`;
                }
            } else if (syllableFilter === 'repetitions') {
                Object.entries(analysisData.repeated_syllables).forEach(([syllable, data]) => {
                    if (data.count >= minCount) {
                        data.positions.forEach(pos => {
                            const noteElement = document.getElementById(`note-${pos}`);
                            if (noteElement) {
                                noteElement.classList.add('syllable-repetition');
                                noteElement.setAttribute('data-syllable-info', 
                                    `Syllable: "${syllable}" (${data.count}×)`);
                            }
                        });
                        
                        // Draw connection lines only for consecutive notes within each repeated syllable  
                        if (data.positions.length > 1) {
                            drawGraceAwareConnections(data.positions, '#f44336', 2, `repetition-${syllable}`, 'melisma');
                        }
                    }
                });
                
                const repeatCount = Object.keys(analysisData.repeated_syllables)
                    .filter(syl => analysisData.repeated_syllables[syl].count >= minCount).length;
                
                patternDetails += `<h4>Repeated Syllables (min count: ${minCount})</h4>`;
                patternDetails += `<p>Found ${repeatCount} syllables with repetitions.</p>`;
                patternDetails += '<ul>';
                Object.entries(analysisData.repeated_syllables)
                    .filter(([syl, data]) => data.count >= minCount)
                    .sort((a, b) => b[1].count - a[1].count)
                    .slice(0, 10)
                    .forEach(([syl, data]) => {
                        patternDetails += `<li>"${syl}" <strong>(${data.count}×)</strong></li>`;
                    });
                patternDetails += '</ul>';
                
            } else if (syllableFilter === 'specific') {
                const syllableSelect = document.getElementById('specificSyllable');
                const selectedSyllables = Array.from(syllableSelect.selectedOptions).map(opt => opt.value);
                
                if (selectedSyllables.length > 0) {
                    selectedSyllables.forEach((selectedSyllable, syllableIndex) => {
                        const colorIndex = syllableIndex % 5; // Cycle through 5 colors
                        const syllableColors = ['#e91e63', '#9c27b0', '#3f51b5', '#009688', '#ff9800']; // Syllable colors
                        
                        // Get syllable data from all_syllables (includes both repeated and single)
                        const data = analysisData.all_syllables[selectedSyllable];
                        if (!data) return; // Skip if syllable not found
                        
                        const positions = data.positions;
                        const count = data.count;
                        
                        positions.forEach(pos => {
                            const noteElement = document.getElementById(`note-${pos}`);
                            if (noteElement) {
                                noteElement.classList.add('syllable-focus', `pattern-color-${colorIndex}`);
                                noteElement.setAttribute('data-syllable-info', 
                                    `Selected syllable: "${selectedSyllable}" (${count}×)`);
                            }
                        });
                        
                        // Draw connection lines only for consecutive notes within each selected syllable
                        if (positions.length > 1) {
                            drawGraceAwareConnections(positions, syllableColors[colorIndex], 2, `syllable-${selectedSyllable}`, 'melisma');
                        }
                    });
                    
                    patternDetails += `<h4>Selected Syllables</h4>`;
                    patternDetails += '<ul>';
                    selectedSyllables.forEach(syl => {
                        const data = analysisData.all_syllables[syl];
                        if (data) {
                            patternDetails += `<li>"${syl}" appears ${data.count} times at positions: ${data.positions.join(', ')}</li>`;
                        }
                    });
                    patternDetails += '</ul>';
                }
            }
            
            // Apply dimming to non-highlighted notes if any highlighting is active
            const hasHighlighting = kpicFilter !== 'none' || kricFilter !== 'none' || syllableFilter !== 'none';
            if (hasHighlighting) {
                const notes = document.querySelectorAll('.note-circle');
                notes.forEach(note => {
                    // Check if this note has any highlighting classes
                    const hasHighlightClass = note.classList.contains('kpic-highlight') ||
                                            note.classList.contains('kric-highlight') ||
                                            note.classList.contains('syllable-repetition') ||
                                            note.classList.contains('syllable-focus') ||
                                            note.classList.contains('syllable-melismatic') ||
                                            note.classList.contains('grace-main-unit') ||
                                            note.classList.contains('syllable-tone') ||
                                            note.classList.contains('pattern-member') ||
                                            Array.from(note.classList).some(cls => cls.startsWith('pattern-color-')) ||
                                            Array.from(note.classList).some(cls => cls.startsWith('tone-'));
                    
                    // If no highlighting class, dim the note
                    if (!hasHighlightClass) {
                        note.classList.add('note-dimmed');
                    }
                });
            }
            
            // Update analysis info
            const analysisInfo = document.getElementById('patternDetails');
            if (patternDetails) {
                analysisInfo.innerHTML = patternDetails;
            } else {
                analysisInfo.innerHTML = 'Select a highlighting mode to see pattern details';
            }
        }
        
        function highlightCorrespondingLyrics(notePositions, color, patternType, patternIndex) {
            // Create a more accurate syllable-note mapping
            const syllableCoverage = new Map(); // syllableIndex -> {total: X, covered: Y}
            
            // For each note position, find which syllable it belongs to
            notePositions.forEach(notePos => {
                // Find syllables that might contain this note
                const syllables = document.querySelectorAll('.editable-syllable');
                syllables.forEach(syllableElement => {
                    const syllablePos = parseInt(syllableElement.getAttribute('data-position'));
                    const syllableIndex = parseInt(syllableElement.getAttribute('data-syllable-index'));
                    
                    // Better syllable boundary detection
                    // A note belongs to a syllable if it's within the syllable's range
                    // We need to estimate syllable note ranges
                    
                    let syllableStartPos = syllablePos;
                    let syllableEndPos = syllablePos;
                    
                    // Look for next syllable to determine range
                    const nextSyllableElement = document.querySelector(`[data-syllable-index="${syllableIndex + 1}"]`);
                    if (nextSyllableElement) {
                        const nextSyllablePos = parseInt(nextSyllableElement.getAttribute('data-position'));
                        syllableEndPos = nextSyllablePos - 1;
                    } else {
                        // Last syllable, extend to end
                        syllableEndPos = syllablePos + 5; // Reasonable estimate
                    }
                    
                    // Check if note is within syllable range
                    if (notePos >= syllableStartPos && notePos <= syllableEndPos) {
                        if (!syllableCoverage.has(syllableIndex)) {
                            syllableCoverage.set(syllableIndex, {total: 0, covered: 0});
                        }
                        const coverage = syllableCoverage.get(syllableIndex);
                        coverage.covered++;
                        
                        // Estimate total notes in syllable (simplified)
                        coverage.total = Math.max(coverage.total, syllableEndPos - syllableStartPos + 1);
                    }
                });
            });
            
            // Apply highlighting with coverage indicators
            syllableCoverage.forEach((coverage, syllableIndex) => {
                const syllableElement = document.querySelector(`[data-syllable-index="${syllableIndex}"]`);
                if (syllableElement) {
                    // Store original title for clearing
                    if (!syllableElement.getAttribute('data-original-title')) {
                        syllableElement.setAttribute('data-original-title', syllableElement.title || '');
                    }
                    
                    // Add pattern highlighting with same colors as tablature
                    syllableElement.classList.add(`lyrics-pattern-${patternIndex}`);
                    syllableElement.style.backgroundColor = color;
                    syllableElement.style.color = 'white';
                    syllableElement.style.borderRadius = '3px';
                    syllableElement.style.padding = '2px 4px';
                    syllableElement.style.fontWeight = 'bold';
                    
                    // Coverage analysis
                    const coverageRatio = coverage.covered / coverage.total;
                    
                    if (coverageRatio < 1.0) {
                        // Partial coverage - add warning indicators
                        syllableElement.style.border = '2px dashed orange';
                        syllableElement.style.position = 'relative';
                        
                        // Add coverage percentage to title
                        const coveragePercent = Math.round(coverageRatio * 100);
                        syllableElement.title = syllableElement.getAttribute('data-original-title') + 
                            ` [${patternType} Pattern ${patternIndex + 1} - ${coveragePercent}% coverage]`;
                        
                        // Add visual indicator
                        if (!syllableElement.querySelector('.coverage-indicator')) {
                            const indicator = document.createElement('span');
                            indicator.className = 'coverage-indicator';
                            indicator.textContent = '⚠';
                            indicator.style.position = 'absolute';
                            indicator.style.top = '-5px';
                            indicator.style.right = '-5px';
                            indicator.style.fontSize = '8px';
                            indicator.style.color = 'orange';
                            indicator.style.fontWeight = 'bold';
                            syllableElement.style.position = 'relative';
                            syllableElement.appendChild(indicator);
                        }
                    } else {
                        // Full coverage
                        syllableElement.title = syllableElement.getAttribute('data-original-title') + 
                            ` [${patternType} Pattern ${patternIndex + 1} - Full Match]`;
                    }
                }
            });
        }
        
        function drawConsecutiveConnections(positions, color, strokeWidth = 2, patternId = '') {
            // Only connect consecutive positions to avoid long-distance network connections
            const svg = document.querySelector('svg');
            if (!svg || positions.length < 2) return;
            
            // Sort positions
            const sortedPositions = [...positions].sort((a, b) => a - b);
            
            // Find groups of consecutive positions
            const consecutiveGroups = [];
            let currentGroup = [sortedPositions[0]];
            
            for (let i = 1; i < sortedPositions.length; i++) {
                if (sortedPositions[i] === sortedPositions[i-1] + 1) {
                    // Consecutive position, add to current group
                    currentGroup.push(sortedPositions[i]);
                } else {
                    // Non-consecutive, start new group
                    if (currentGroup.length > 1) {
                        consecutiveGroups.push(currentGroup);
                    }
                    currentGroup = [sortedPositions[i]];
                }
            }
            
            // Add the last group if it has multiple positions
            if (currentGroup.length > 1) {
                consecutiveGroups.push(currentGroup);
            }
            
            // Draw connections within each consecutive group
            consecutiveGroups.forEach((group, groupIndex) => {
                for (let i = 0; i < group.length - 1; i++) {
                    const currentPos = group[i];
                    const nextPos = group[i + 1];
                    
                    const currentNote = document.getElementById(`note-${currentPos}`);
                    const nextNote = document.getElementById(`note-${nextPos}`);
                    
                    if (currentNote && nextNote) {
                        // Get note centers
                        const currentX = parseFloat(currentNote.getAttribute('cx'));
                        const currentY = parseFloat(currentNote.getAttribute('cy'));
                        const nextX = parseFloat(nextNote.getAttribute('cx'));
                        const nextY = parseFloat(nextNote.getAttribute('cy'));
                        
                        // Create connection line
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        line.setAttribute('x1', currentX);
                        line.setAttribute('y1', currentY);
                        line.setAttribute('x2', nextX);
                        line.setAttribute('y2', nextY);
                        line.setAttribute('stroke', color);
                        line.setAttribute('stroke-width', strokeWidth);
                        line.setAttribute('opacity', '0.8');
                        line.setAttribute('class', `pattern-connection-line pattern-${patternId}-group-${groupIndex}`);
                        
                        // Store base coordinates for zoom scaling
                        line.setAttribute('data-base-x1', currentX);
                        line.setAttribute('data-base-y1', currentY);
                        line.setAttribute('data-base-x2', nextX);
                        line.setAttribute('data-base-y2', nextY);
                        
                        // Insert line before notes so it appears behind them
                        const firstNote = svg.querySelector('.note-circle');
                        if (firstNote) {
                            svg.insertBefore(line, firstNote);
                        } else {
                            svg.appendChild(line);
                        }
                    }
                }
            });
        }
        
        function drawGraceAwareConnections(positions, color, strokeWidth = 2, patternId = '', contextType = 'pattern') {
            // Smart connection logic that respects grace-main units
            const svg = document.querySelector('svg');
            if (!svg || positions.length < 2) return;
            
            // Sort positions to ensure proper connection order
            const sortedPositions = [...positions].sort((a, b) => a - b);
            
            // Helper function to create a line
            function createConnectionLine(pos1, pos2, lineId) {
                const note1 = document.getElementById(`note-${pos1}`);
                const note2 = document.getElementById(`note-${pos2}`);
                
                if (!note1 || !note2) return;
                
                // Use base coordinates if available, otherwise current coordinates
                const baseX1 = parseFloat(note1.getAttribute('data-base-x') || note1.getAttribute('cx'));
                const baseY1 = parseFloat(note1.getAttribute('data-base-y') || note1.getAttribute('cy'));
                const baseX2 = parseFloat(note2.getAttribute('data-base-x') || note2.getAttribute('cx'));
                const baseY2 = parseFloat(note2.getAttribute('data-base-y') || note2.getAttribute('cy'));
                
                // Use current coordinates for display
                const x1 = parseFloat(note1.getAttribute('cx'));
                const y1 = parseFloat(note1.getAttribute('cy'));
                const x2 = parseFloat(note2.getAttribute('cx'));
                const y2 = parseFloat(note2.getAttribute('cy'));
                
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x1);
                line.setAttribute('y1', y1);
                line.setAttribute('x2', x2);
                line.setAttribute('y2', y2);
                line.setAttribute('stroke', color);
                line.setAttribute('stroke-width', strokeWidth);
                line.setAttribute('opacity', '0.8');
                line.setAttribute('class', `pattern-connection-line pattern-${patternId}-${lineId}`);
                
                // Store base coordinates for zoom scaling
                line.setAttribute('data-base-x1', baseX1);
                line.setAttribute('data-base-y1', baseY1);
                line.setAttribute('data-base-x2', baseX2);
                line.setAttribute('data-base-y2', baseY2);
                
                // Insert line before notes so it appears behind them
                const firstNote = svg.querySelector('.note-circle');
                if (firstNote) {
                    svg.insertBefore(line, firstNote);
                } else {
                    svg.appendChild(line);
                }
            }
            
            // Context-aware connection logic
            if (contextType === 'melisma') {
                // For melismas: connect only main notes to avoid tangles
                const mainNotePositions = sortedPositions.filter(pos => {
                    const note = document.getElementById(`note-${pos}`);
                    return note && note.getAttribute('data-is-grace') !== 'true';
                });
                
                for (let i = 0; i < mainNotePositions.length - 1; i++) {
                    createConnectionLine(mainNotePositions[i], mainNotePositions[i + 1], `melisma-main-${i}`);
                }
            } else if (contextType === 'grace-unit') {
                // For grace units: grace→main only
                for (let i = 0; i < sortedPositions.length; i++) {
                    const currentPos = sortedPositions[i];
                    const currentNote = document.getElementById(`note-${currentPos}`);
                    if (!currentNote) continue;
                    
                    const currentIsGrace = currentNote.getAttribute('data-is-grace') === 'true';
                    
                    if (currentIsGrace && i + 1 < sortedPositions.length) {
                        const nextPos = sortedPositions[i + 1];
                        const nextNote = document.getElementById(`note-${nextPos}`);
                        const nextIsGrace = nextNote && nextNote.getAttribute('data-is-grace') === 'true';
                        
                        // Connect grace to next note (grace or main)
                        if (!nextIsGrace) {
                            // Grace to main - solid connection
                            createConnectionLine(currentPos, nextPos, `grace-to-main-${i}`);
                        }
                    }
                }
            } else {
                // Default pattern connections
                for (let i = 0; i < sortedPositions.length; i++) {
                    const currentPos = sortedPositions[i];
                    const currentNote = document.getElementById(`note-${currentPos}`);
                    if (!currentNote) continue;
                    
                    const currentIsGrace = currentNote.getAttribute('data-is-grace') === 'true';
                    
                    if (currentIsGrace) {
                        // Grace note: connect to immediately following note
                        if (i + 1 < sortedPositions.length) {
                            const nextPos = sortedPositions[i + 1];
                            createConnectionLine(currentPos, nextPos, `grace-${i}`);
                        }
                    } else {
                        // Main note: connect to next main note (skip grace notes)
                        for (let j = i + 1; j < sortedPositions.length; j++) {
                            const targetPos = sortedPositions[j];
                            const targetNote = document.getElementById(`note-${targetPos}`);
                            if (!targetNote) continue;
                            
                            const targetIsGrace = targetNote.getAttribute('data-is-grace') === 'true';
                            
                            if (!targetIsGrace) {
                                createConnectionLine(currentPos, targetPos, `main-${i}-${j}`);
                                break;
                            }
                        }
                    }
                }
            }
        }
        
        function drawPatternConnections(positions, color, strokeWidth = 2, patternId = '') {
            const svg = document.querySelector('svg');
            if (!svg || positions.length < 2) return;
            
            // Sort positions to ensure proper connection order
            const sortedPositions = [...positions].sort((a, b) => a - b);
            
            for (let i = 0; i < sortedPositions.length - 1; i++) {
                const currentPos = sortedPositions[i];
                const nextPos = sortedPositions[i + 1];
                
                const currentNote = document.getElementById(`note-${currentPos}`);
                const nextNote = document.getElementById(`note-${nextPos}`);
                
                if (currentNote && nextNote) {
                    // Get note centers
                    const currentX = parseFloat(currentNote.getAttribute('cx'));
                    const currentY = parseFloat(currentNote.getAttribute('cy'));
                    const nextX = parseFloat(nextNote.getAttribute('cx'));
                    const nextY = parseFloat(nextNote.getAttribute('cy'));
                    
                    // Create connection line
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', currentX);
                    line.setAttribute('y1', currentY);
                    line.setAttribute('x2', nextX);
                    line.setAttribute('y2', nextY);
                    line.setAttribute('stroke', color);
                    line.setAttribute('stroke-width', strokeWidth);
                    line.setAttribute('opacity', '0.8');
                    line.setAttribute('class', `pattern-connection-line pattern-${patternId}`);
                    
                    // Store base coordinates for zoom scaling
                    line.setAttribute('data-base-x1', currentX);
                    line.setAttribute('data-base-y1', currentY);
                    line.setAttribute('data-base-x2', nextX);
                    line.setAttribute('data-base-y2', nextY);
                    
                    // Insert line before notes so it appears behind them
                    const firstNote = svg.querySelector('.note-circle');
                    if (firstNote) {
                        svg.insertBefore(line, firstNote);
                    } else {
                        svg.appendChild(line);
                    }
                }
            }
        }
        
        function clearHighlighting() {
            const notes = document.querySelectorAll('.note-circle');
            notes.forEach(note => {
                note.classList.remove('kpic-highlight', 'kric-highlight', 'syllable-repetition', 'syllable-focus', 
                                     'syllable-melismatic', 'grace-main-unit', 'syllable-tone', 'pattern-member',
                                     'tone-sac', 'tone-huyen', 'tone-hoi', 'tone-nga', 'tone-nang', 'tone-ngang',
                                     'note-dimmed');
                // Remove pattern color classes
                for (let i = 0; i < 5; i++) {
                    note.classList.remove(`pattern-color-${i}`);
                }
                note.removeAttribute('data-pattern-type');
                note.removeAttribute('data-pattern-info');
                note.removeAttribute('data-syllable-info');
            });
            
            // Remove all pattern connection lines
            const existingLines = document.querySelectorAll('.pattern-connection-line');
            existingLines.forEach(line => line.remove());
            
            // Clear lyrics highlighting
            const lyricsElements = document.querySelectorAll('.editable-syllable');
            lyricsElements.forEach(syllable => {
                // Remove pattern highlighting classes
                for (let i = 0; i < 10; i++) {
                    syllable.classList.remove(`lyrics-pattern-${i}`);
                }
                // Reset styles
                syllable.style.backgroundColor = '';
                syllable.style.color = '';
                syllable.style.border = '';
                syllable.style.borderRadius = '';
                syllable.style.padding = '2px 4px';
                
                // Reset title to original content
                const originalTitle = syllable.getAttribute('data-original-title');
                if (originalTitle) {
                    syllable.title = originalTitle;
                } else {
                    // Remove pattern info from title
                    syllable.title = syllable.title.replace(/\s*\[.*?Pattern.*?\]/g, '');
                }
            });
        }
        
        function showLegend() {
            const legend = document.getElementById('legend');
            legend.style.display = legend.style.display === 'none' ? 'block' : 'none';
        }
        
        function toggleSection(sectionId) {
            const content = document.getElementById(`${sectionId}-content`);
            const icon = document.getElementById(`${sectionId}-icon`);
            
            if (content.classList.contains('collapsed')) {
                content.classList.remove('collapsed');
                icon.classList.remove('collapsed');
                icon.textContent = '▼';
            } else {
                content.classList.add('collapsed');
                icon.classList.add('collapsed');
                icon.textContent = '▶';
            }
        }
        
        function toggleLineBreak(syllableIndex) {
            const breakElement = document.querySelector(`[data-break-after="${syllableIndex}"]`);
            if (!breakElement) return;
            
            // Simply toggle the active class - CSS handles the line break
            breakElement.classList.toggle('active');
        }
        
        function resetLyricsBreaks() {
            const breaks = document.querySelectorAll('.line-break');
            breaks.forEach(breakEl => {
                // Reset to default state based on punctuation
                const syllableIndex = parseInt(breakEl.getAttribute('data-break-after'));
                const syllables = document.querySelectorAll('.editable-syllable');
                const syllable = syllables[syllableIndex];
                
                if (syllable) {
                    const syllableText = syllable.textContent;
                    const isDefaultBreak = syllableText.endsWith(('.', '!', '?', ','));
                    
                    if (isDefaultBreak) {
                        breakEl.classList.add('active');
                    } else {
                        breakEl.classList.remove('active');
                    }
                }
            });
        }
        
        function showNoteDetails(noteIndex) {
            const noteElement = document.getElementById(`note-${noteIndex}`);
            if (!noteElement) return;
            
            let details = `Note ${noteIndex + 1} Details:\\n`;
            
            const patternType = noteElement.getAttribute('data-pattern-type');
            const patternInfo = noteElement.getAttribute('data-pattern-info');
            const syllableInfo = noteElement.getAttribute('data-syllable-info');
            
            if (patternInfo) {
                details += `${patternInfo}\\n`;
            }
            
            if (syllableInfo) {
                details += `${syllableInfo}\\n`;
            }
            
            if (!patternInfo && !syllableInfo) {
                details += 'No current pattern highlighting';
            }
            
            alert(details);
        }
        
        function updateMinCountDisplay() {
            const slider = document.getElementById('minCount');
            const display = document.getElementById('minCountValue');
            
            slider.addEventListener('input', function() {
                display.textContent = slider.value;
            });
        }
        """

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Create Analytical Tablature with KPIC/KRIC Overlays')
    parser.add_argument('musicxml_file', help='Path to MusicXML file')
    parser.add_argument('--output', default='analytical_tablature.html', help='Output HTML file')
    parser.add_argument('--open', action='store_true', help='Open in browser after creation')
    
    args = parser.parse_args()
    
    visualizer = AnalyticalTablatureVisualizer()
    output_file = visualizer.create_analytical_tablature(args.musicxml_file, args.output)
    
    if args.open:
        import webbrowser
        import os
        webbrowser.open(f'file://{os.path.abspath(output_file)}')

if __name__ == "__main__":
    main()