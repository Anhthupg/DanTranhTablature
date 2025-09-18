#!/usr/bin/env python3
"""
Analytical Tablature Visualizer - Improved Version
Overlays KPIC/KRIC analysis on đàn tranh tablature with optimized connection drawing
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
                                    <select id="kpicPattern" multiple size="3" onchange="highlightKpicPattern()">
                                    </select>
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
                                    <select id="kricPattern" multiple size="3" onchange="highlightKricPattern()">
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Analysis Mode -->
                <div class="control-section compact">
                    <h4 class="section-title">🔬 Analysis</h4>
                    <div class="control-group-header">
                        <label>Mode:</label>
                        <select id="analysisMode">
                            <option value="full">Full Analysis</option>
                            <option value="main_melody">Main Melody</option>
                            <option value="grace_units">Grace Units</option>
                        </select>
                    </div>
                    <div class="control-group-header">
                        <label>Min Count:</label>
                        <input type="range" id="minCount" min="2" max="10" value="2" oninput="updateMinCountDisplay()">
                        <span id="minCountValue">2</span>
                    </div>
                </div>
                
                <!-- Syllable Analysis -->
                <div class="control-section compact">
                    <h4 class="section-title collapsible" onclick="toggleSection('syllables')">
                        📝 Syllables <span class="toggle-icon" id="syllables-icon">▼</span>
                    </h4>
                    <div class="section-content" id="syllables-content">
                        <div class="control-group-header">
                            <label>Type:</label>
                            <select id="syllableAnalysis" onchange="highlightSyllableAnalysis()">
                                <option value="none">None</option>
                                <option value="specific">Specific Syllable</option>
                                <option value="melismatic">Multi-note syllables (melismas)</option>
                                <option value="repetitions">Repeated Syllables</option>
                                <option value="grace-main">Grace-Main Units</option>
                                <option value="tone-sac">Tone: Sắc (rising)</option>
                                <option value="tone-huyen">Tone: Huyền (falling)</option>
                                <option value="tone-hoi">Tone: Hỏi (dipping)</option>
                                <option value="tone-nga">Tone: Ngã (broken rising)</option>
                                <option value="tone-nang">Tone: Nặng (heavy)</option>
                                <option value="tone-ngang">Tone: Ngang (flat)</option>
                            </select>
                        </div>
                        <div class="pattern-selector" id="syllableSpecificGroup" style="display: none;">
                            <select id="specificSyllable" onchange="highlightSpecificSyllable()">
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- Zoom Controls -->
                <div class="control-section compact">
                    <h4 class="section-title">🔍 View</h4>
                    <div class="zoom-controls">
                        <button onclick="resetZoom()">Reset</button>
                        <button onclick="showLegend()">Legend</button>
                    </div>
                    <div class="custom-zoom">
                        <label>Y:</label>
                        <input type="range" id="yZoom" min="20" max="150" value="67" oninput="updateYZoom(this.value)">
                        <span id="yZoomValue">67%</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="legend" id="legend" style="display: none;">
            <h4>Legend</h4>
            <div class="legend-content">
                <div class="legend-item">
                    <span class="legend-color" style="background: #ff4444;"></span>
                    <span>KPIC Patterns (Pitch)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background: #4444ff;"></span>
                    <span>KRIC Patterns (Rhythm)</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background: #6a1b9a;"></span>
                    <span>Melismatic Syllables</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background: #2e7d32;"></span>
                    <span>Grace-Main Units</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color" style="background: #f44336;"></span>
                    <span>Repeated Syllables</span>
                </div>
            </div>
        </div>
        
        <!-- Tablature Container -->
        <div class="tablature-container">
            {self._generate_svg_tablature()}
        </div>
        
        <!-- Interactive Lyrics -->
        <div class="lyrics-section">
            <h3>📝 Interactive Lyrics 
                <button onclick="resetLyricsBreaks()" style="font-size: 12px; margin-left: 10px;">Reset Breaks</button>
            </h3>
            <div class="lyrics-container">
                {self._generate_interactive_lyrics()}
            </div>
        </div>
    </div>
    
    <script>
        // Analysis data injection
        const analysisData = {json.dumps(self._prepare_analysis_data(), ensure_ascii=False, indent=2)};
        
        // Pattern colors
        const patternColors = ['#ff4444', '#44ff44', '#4444ff', '#ffaa44', '#ff44ff'];
        
        // Tone colors for Vietnamese tone marks
        const toneColors = {{
            'sac': '#e91e63',      // Pink for rising tone
            'huyen': '#3f51b5',    // Indigo for falling tone  
            'hoi': '#ff9800',      // Orange for dipping tone
            'nga': '#4caf50',      // Green for broken rising tone
            'nang': '#795548',     // Brown for heavy tone
            'ngang': '#607d8b'     // Blue grey for flat tone
        }};
        
        let currentYZoom = 67;
        
        {self._get_core_javascript()}
        {self._get_pattern_highlighting_javascript()}
        {self._get_syllable_analysis_javascript()}
        {self._get_ui_control_javascript()}
    </script>
</body>
</html>"""

    def _generate_svg_tablature(self) -> str:
        """Generate SVG tablature using the base converter"""
        # Use existing converter to generate SVG
        svg_content = self.converter.convert_to_svg(self.processed_notes)
        return svg_content

    def _generate_interactive_lyrics(self) -> str:
        """Generate interactive lyrics with line break controls"""
        if not self.syllable_mappings:
            return "<p>No lyrics found</p>"
        
        lyrics_elements = []
        
        for i, mapping in enumerate(self.syllable_mappings):
            syllable_class = "editable-syllable"
            syllable_text = mapping['syllable']
            note_count = mapping['note_count']
            
            # Add syllable span
            title = f"Syllable: {syllable_text} | Notes: {note_count}"
            lyrics_elements.append(f'''
            <span class="{syllable_class}" 
                  data-syllable-index="{i}"
                  data-original-title="{title}"
                  title="{title}">{syllable_text}</span>
            ''')
            
            # Add line break control
            is_punctuation_break = syllable_text.endswith(('.', '!', '?', ','))
            break_class = "line-break active" if is_punctuation_break else "line-break"
            
            lyrics_elements.append(f'''
            <span class="{break_class}" 
                  data-break-after="{i}"
                  onclick="toggleLineBreak({i})"
                  title="Click to toggle line break">|</span>
            ''')
        
        return ''.join(lyrics_elements)

    def _prepare_analysis_data(self) -> dict:
        """Prepare analysis data for JavaScript"""
        
        # Get KPIC/KRIC analysis for all modes
        analysis_modes = ['full', 'main_melody', 'grace_units']
        analysis_data = {
            'processed_notes': self.processed_notes,
            'syllable_mappings': self.syllable_mappings
        }
        
        # Add pattern data for each analysis mode
        for mode in analysis_modes:
            pitch_patterns = self.kpic_analyzer.query_pitch_ngrams(analysis_mode=mode)
            rhythm_patterns = self.kpic_analyzer.query_rhythm_ngrams(analysis_mode=mode)
            
            analysis_data[f'{mode}_pitch_patterns'] = pitch_patterns
            analysis_data[f'{mode}_rhythm_patterns'] = rhythm_patterns
        
        # Build syllable analysis data from existing mappings
        repeated_syllables = {}
        all_syllables = {}
        grace_main_units = []
        melismatic_syllables = []
        tone_syllables = {}
        
        for mapping in self.syllable_mappings:
            syllable = mapping['syllable']
            position = mapping['position']
            note_count = mapping['note_count']
            
            # Build all_syllables data
            if syllable not in all_syllables:
                all_syllables[syllable] = {'count': 0, 'positions': []}
            all_syllables[syllable]['count'] += 1
            all_syllables[syllable]['positions'].append(position)
            
            # Build repeated_syllables data
            if all_syllables[syllable]['count'] > 1:
                repeated_syllables[syllable] = all_syllables[syllable]
            
            # Add melismatic syllables
            if mapping.get('is_melismatic', False):
                melismatic_syllables.append(syllable)
            
            # Add grace-main units (notes with grace notes)
            if mapping.get('grace_note_count', 0) > 0:
                grace_main_units.append(position)
            
            # Add tone mark analysis
            tone_mark = mapping.get('tone_mark', 'ngang')
            if tone_mark not in tone_syllables:
                tone_syllables[tone_mark] = []
            tone_syllables[tone_mark].append(position)
        
        analysis_data['repeated_syllables'] = repeated_syllables
        analysis_data['all_syllables'] = all_syllables
        analysis_data['grace_main_units'] = grace_main_units
        analysis_data['melismatic_analysis'] = {'melismatic_syllables': list(set(melismatic_syllables))}
        analysis_data['tone_syllables'] = tone_syllables
        
        return analysis_data

    def _get_css_styles(self) -> str:
        """Consolidated CSS styles"""
        return """
        /* Base Styles */
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
        
        /* Header Styles */
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
        
        /* Control Panel Styles */
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
        
        /* Form Controls */
        .control-group-header {
            display: flex;
            align-items: center;
            gap: 5px;
            margin-bottom: 8px;
        }
        
        .control-group-header label {
            font-size: 12px;
            white-space: nowrap;
            min-width: 40px;
        }
        
        .control-group-header select,
        .control-group-header input {
            padding: 4px;
            font-size: 12px;
            flex: 1;
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
        
        /* Zoom Controls */
        .zoom-controls {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }
        
        .zoom-controls button {
            padding: 4px 8px;
            font-size: 12px;
            border: 1px solid #ccc;
            border-radius: 4px;
            background: white;
            cursor: pointer;
        }
        
        .zoom-controls button:hover {
            background: #f0f0f0;
        }
        
        .custom-zoom {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .custom-zoom input[type="range"] {
            width: 80px;
        }
        
        .custom-zoom span {
            font-size: 11px;
            min-width: 30px;
        }
        
        /* Legend Styles */
        .legend {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .legend h4 {
            margin: 0 0 10px 0;
            color: #2c3e50;
        }
        
        .legend-content {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .legend-color {
            width: 20px;
            height: 12px;
            border-radius: 2px;
            display: inline-block;
        }
        
        /* Tablature Styles */
        .tablature-container {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            overflow-x: auto;
        }
        
        .tablature-svg {
            display: block;
            margin: 0 auto;
        }
        
        /* Note Highlighting Classes */
        .note-circle {
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .note-circle:hover {
            stroke: #3498db;
            stroke-width: 2;
        }
        
        .note-circle.kpic-highlight {
            fill: #ff4444 !important;
            stroke: #cc0000 !important;
            stroke-width: 2 !important;
        }
        
        .note-circle.kric-highlight {
            fill: #4444ff !important;
            stroke: #0000cc !important;
            stroke-width: 2 !important;
        }
        
        .note-circle.syllable-melismatic {
            fill: #6a1b9a !important;
            stroke: #4a148c !important;
            stroke-width: 2 !important;
        }
        
        .note-circle.grace-main-unit {
            fill: #2e7d32 !important;
            stroke: #1b5e20 !important;
            stroke-width: 2 !important;
        }
        
        .note-circle.syllable-repetition {
            fill: #f44336 !important;
            stroke: #d32f2f !important;
            stroke-width: 2 !important;
        }
        
        .note-circle.syllable-focus {
            fill: #9c27b0 !important;
            stroke: #7b1fa2 !important;
            stroke-width: 2 !important;
        }
        
        /* Tone highlighting classes */
        .note-circle.tone-sac { fill: #e91e63 !important; stroke: #ad1457 !important; stroke-width: 2 !important; }
        .note-circle.tone-huyen { fill: #3f51b5 !important; stroke: #283593 !important; stroke-width: 2 !important; }
        .note-circle.tone-hoi { fill: #ff9800 !important; stroke: #f57c00 !important; stroke-width: 2 !important; }
        .note-circle.tone-nga { fill: #4caf50 !important; stroke: #388e3c !important; stroke-width: 2 !important; }
        .note-circle.tone-nang { fill: #795548 !important; stroke: #5d4037 !important; stroke-width: 2 !important; }
        .note-circle.tone-ngang { fill: #607d8b !important; stroke: #455a64 !important; stroke-width: 2 !important; }
        
        /* Pattern Connection Lines */
        .pattern-connection-line {
            pointer-events: none;
            z-index: 1;
        }
        
        /* Lyrics Styles */
        .lyrics-section {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .lyrics-section h3 {
            margin: 0 0 15px 0;
            color: #2c3e50;
            display: flex;
            align-items: center;
        }
        
        .lyrics-container {
            line-height: 2;
            font-size: 16px;
        }
        
        .editable-syllable {
            padding: 2px 4px;
            margin: 1px;
            border-radius: 3px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .editable-syllable:hover {
            background: #e3f2fd;
        }
        
        .line-break {
            color: #bbb;
            cursor: pointer;
            font-size: 12px;
            margin: 0 2px;
            opacity: 0.3;
        }
        
        .line-break.active {
            opacity: 1;
        }
        
        .line-break.active::after {
            content: "\\A";
            white-space: pre;
        }
        
        /* Responsive Design */
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
            
            .patterns-row {
                flex-direction: column;
            }
        }
        """

    def _get_core_javascript(self) -> str:
        """Core JavaScript functionality"""
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
                const analysisMode = document.getElementById('analysisMode').value;
                const pitchPatterns = analysisData[`${analysisMode}_pitch_patterns`] || {};
                const maxN = Math.max(...Object.keys(pitchPatterns).map(n => parseInt(n)), 0);
                kpicMaxOption.textContent = `MAX (${maxN})`;
            }
            
            // Update KRIC-MAX label to show actual n value
            const kricSelect = document.getElementById('kricFilter');
            const kricMaxOption = kricSelect.querySelector('option[value="kric-max"]');
            if (kricMaxOption) {
                const analysisMode = document.getElementById('analysisMode').value;
                const rhythmPatterns = analysisData[`${analysisMode}_rhythm_patterns`] || {};
                const maxN = Math.max(...Object.keys(rhythmPatterns).map(n => parseInt(n)), 0);
                kricMaxOption.textContent = `MAX (${maxN})`;
            }
        }
        
        function updateMinCountDisplay() {
            const slider = document.getElementById('minCount');
            const display = document.getElementById('minCountValue');
            
            display.textContent = slider.value;
            
            slider.addEventListener('input', function() {
                display.textContent = slider.value;
            });
        }
        
        function updateYZoom(value) {
            currentYZoom = value;
            const zoomFactor = value / 100;
            
            document.getElementById('yZoomValue').textContent = value + '%';
            
            const svg = document.querySelector('.tablature-svg');
            if (svg) {
                const notes = svg.querySelectorAll('.note-circle');
                const lines = svg.querySelectorAll('.pattern-connection-line');
                
                notes.forEach(note => {
                    const baseY = parseFloat(note.getAttribute('data-base-y') || note.getAttribute('cy'));
                    const newY = baseY * zoomFactor;
                    note.setAttribute('cy', newY);
                });
                
                lines.forEach(line => {
                    const baseY1 = parseFloat(line.getAttribute('data-base-y1') || line.getAttribute('y1'));
                    const baseY2 = parseFloat(line.getAttribute('data-base-y2') || line.getAttribute('y2'));
                    line.setAttribute('y1', baseY1 * zoomFactor);
                    line.setAttribute('y2', baseY2 * zoomFactor);
                });
                
                // Update other Y-positioned elements
                const stringLines = svg.querySelectorAll('.string-line');
                const stringLabels = svg.querySelectorAll('.string-label');
                const resonanceBands = svg.querySelectorAll('.resonance-band');
                const noteLyrics = svg.querySelectorAll('.note-lyrics');
                
                stringLines.forEach(line => {
                    const baseY = parseFloat(line.getAttribute('data-base-y') || line.getAttribute('y1'));
                    if (baseY) {
                        line.setAttribute('y1', baseY * zoomFactor);
                        line.setAttribute('y2', baseY * zoomFactor);
                    }
                });
                
                stringLabels.forEach(label => {
                    const baseY = parseFloat(label.getAttribute('data-base-y') || label.getAttribute('y'));
                    if (baseY) {
                        label.setAttribute('y', baseY * zoomFactor);
                    }
                });
                
                resonanceBands.forEach(band => {
                    const baseY = parseFloat(band.getAttribute('data-base-y') || band.getAttribute('y'));
                    if (baseY) {
                        band.setAttribute('y', baseY * zoomFactor);
                    }
                });
                
                noteLyrics.forEach(lyrics => {
                    const baseY = parseFloat(lyrics.getAttribute('data-base-y') || lyrics.getAttribute('y'));
                    if (baseY) {
                        lyrics.setAttribute('y', baseY * zoomFactor);
                    }
                });
            }
        }
        
        function resetZoom() {
            updateYZoom(67);
            document.getElementById('yZoom').value = 67;
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
                    syllable.title = syllable.title.replace(/\\s*\\[.*?Pattern.*?\\]/g, '');
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
        """

    def _get_pattern_highlighting_javascript(self) -> str:
        """JavaScript for pattern highlighting with smart connections"""
        return """
        function updateKpicPatternOptions() {
            const analysisMode = document.getElementById('analysisMode').value;
            const filterSelect = document.getElementById('kpicFilter');
            const patternSelect = document.getElementById('kpicPattern');
            const patternGroup = document.getElementById('kpicPatternGroup');
            
            const selectedFilter = filterSelect.value;
            
            if (selectedFilter === 'none') {
                patternGroup.style.display = 'none';
                clearHighlighting();
                return;
            }
            
            patternGroup.style.display = 'block';
            patternSelect.innerHTML = '';
            
            const pitchPatterns = analysisData[`${analysisMode}_pitch_patterns`] || {};
            let nValue = parseInt(selectedFilter.replace('kpic-', ''));
            
            if (selectedFilter === 'kpic-max') {
                nValue = Math.max(...Object.keys(pitchPatterns).map(n => parseInt(n)), 2);
            }
            
            const patterns = pitchPatterns[nValue] || [];
            const minCount = parseInt(document.getElementById('minCount').value);
            
            patterns.forEach((pattern, index) => {
                if (pattern.instances.length >= minCount) {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = `${pattern.pattern.join('-')} (${pattern.instances.length}×)`;
                    patternSelect.appendChild(option);
                }
            });
        }
        
        function updateKricPatternOptions() {
            const analysisMode = document.getElementById('analysisMode').value;
            const filterSelect = document.getElementById('kricFilter');
            const patternSelect = document.getElementById('kricPattern');
            const patternGroup = document.getElementById('kricPatternGroup');
            
            const selectedFilter = filterSelect.value;
            
            if (selectedFilter === 'none') {
                patternGroup.style.display = 'none';
                clearHighlighting();
                return;
            }
            
            patternGroup.style.display = 'block';
            patternSelect.innerHTML = '';
            
            const rhythmPatterns = analysisData[`${analysisMode}_rhythm_patterns`] || {};
            let nValue = parseInt(selectedFilter.replace('kric-', ''));
            
            if (selectedFilter === 'kric-max') {
                nValue = Math.max(...Object.keys(rhythmPatterns).map(n => parseInt(n)), 2);
            }
            
            const patterns = rhythmPatterns[nValue] || [];
            const minCount = parseInt(document.getElementById('minCount').value);
            
            patterns.forEach((pattern, index) => {
                if (pattern.instances.length >= minCount) {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = `${pattern.pattern.join('-')} (${pattern.instances.length}×)`;
                    patternSelect.appendChild(option);
                }
            });
        }
        
        function highlightKpicPattern() {
            clearHighlighting();
            
            const analysisMode = document.getElementById('analysisMode').value;
            const filterSelect = document.getElementById('kpicFilter');
            const patternSelect = document.getElementById('kpicPattern');
            
            const selectedFilter = filterSelect.value;
            const selectedPatterns = Array.from(patternSelect.selectedOptions).map(option => parseInt(option.value));
            
            if (selectedFilter === 'none' || selectedPatterns.length === 0) return;
            
            const pitchPatterns = analysisData[`${analysisMode}_pitch_patterns`] || {};
            let nValue = parseInt(selectedFilter.replace('kpic-', ''));
            
            if (selectedFilter === 'kpic-max') {
                nValue = Math.max(...Object.keys(pitchPatterns).map(n => parseInt(n)), 2);
            }
            
            const patterns = pitchPatterns[nValue] || [];
            
            selectedPatterns.forEach((patternIndex, colorIndex) => {
                if (patternIndex < patterns.length) {
                    const pattern = patterns[patternIndex];
                    const color = patternColors[colorIndex % patternColors.length];
                    
                    pattern.instances.forEach((instance, instIndex) => {
                        const startPos = instance.start_position;
                        const patternPositions = instance.positions;
                        
                        // Highlight notes
                        patternPositions.forEach(pos => {
                            const noteElement = document.getElementById(`note-${pos}`);
                            if (noteElement) {
                                noteElement.classList.add('kpic-highlight');
                                noteElement.setAttribute('data-pattern-type', 'kpic');
                                noteElement.setAttribute('data-pattern-info', 
                                    `KPIC Pattern: ${pattern.pattern.join('-')} | Instance ${instIndex + 1}/${pattern.instances.length}`);
                            }
                        });
                        
                        // Draw smart connections
                        drawSmartConnections(patternPositions, color, 3, `kpic-${patternIndex}-${startPos}`, 'pattern');
                    });
                }
            });
        }
        
        function highlightKricPattern() {
            clearHighlighting();
            
            const analysisMode = document.getElementById('analysisMode').value;
            const filterSelect = document.getElementById('kricFilter');
            const patternSelect = document.getElementById('kricPattern');
            
            const selectedFilter = filterSelect.value;
            const selectedPatterns = Array.from(patternSelect.selectedOptions).map(option => parseInt(option.value));
            
            if (selectedFilter === 'none' || selectedPatterns.length === 0) return;
            
            const rhythmPatterns = analysisData[`${analysisMode}_rhythm_patterns`] || {};
            let nValue = parseInt(selectedFilter.replace('kric-', ''));
            
            if (selectedFilter === 'kric-max') {
                nValue = Math.max(...Object.keys(rhythmPatterns).map(n => parseInt(n)), 2);
            }
            
            const patterns = rhythmPatterns[nValue] || [];
            
            selectedPatterns.forEach((patternIndex, colorIndex) => {
                if (patternIndex < patterns.length) {
                    const pattern = patterns[patternIndex];
                    const color = patternColors[colorIndex % patternColors.length];
                    
                    pattern.instances.forEach((instance, instIndex) => {
                        const startPos = instance.start_position;
                        const patternPositions = instance.positions;
                        
                        // Highlight notes
                        patternPositions.forEach(pos => {
                            const noteElement = document.getElementById(`note-${pos}`);
                            if (noteElement) {
                                noteElement.classList.add('kric-highlight');
                                noteElement.setAttribute('data-pattern-type', 'kric');
                                noteElement.setAttribute('data-pattern-info', 
                                    `KRIC Pattern: ${pattern.pattern.join('-')} | Instance ${instIndex + 1}/${pattern.instances.length}`);
                            }
                        });
                        
                        // Draw smart connections
                        drawSmartConnections(patternPositions, color, 3, `kric-${patternIndex}-${startPos}`, 'pattern');
                    });
                }
            });
        }
        
        // Smart connection drawing function that replaces multiple connection functions
        function drawSmartConnections(positions, color, strokeWidth = 2, patternId = '', contextType = 'default') {
            const svg = document.querySelector('svg');
            if (!svg || positions.length < 2) return;
            
            // Sort positions to ensure proper connection order
            const sortedPositions = [...positions].sort((a, b) => a - b);
            
            // Helper function to create a connection line
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
            
            // Apply context-aware connection logic
            if (contextType === 'melisma') {
                // For melismas: Connect main notes only, skip grace notes for cleaner lines
                const mainNotePositions = sortedPositions.filter(pos => {
                    const note = document.getElementById(`note-${pos}`);
                    return note && note.getAttribute('data-is-grace') !== 'true';
                });
                
                for (let i = 0; i < mainNotePositions.length - 1; i++) {
                    createConnectionLine(mainNotePositions[i], mainNotePositions[i + 1], `melisma-${i}`);
                }
            } else if (contextType === 'grace-unit') {
                // For grace units: Connect grace→main cleanly
                for (let i = 0; i < sortedPositions.length; i++) {
                    const currentPos = sortedPositions[i];
                    const currentNote = document.getElementById(`note-${currentPos}`);
                    if (!currentNote) continue;
                    
                    const currentIsGrace = currentNote.getAttribute('data-is-grace') === 'true';
                    
                    if (currentIsGrace && i + 1 < sortedPositions.length) {
                        // Grace note: connect to immediately following note
                        const nextPos = sortedPositions[i + 1];
                        createConnectionLine(currentPos, nextPos, `grace-${i}`);
                    } else if (!currentIsGrace) {
                        // Main note: connect to next main note (skip intervening grace notes)
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
            } else {
                // Default pattern connections: Connect all consecutive notes
                for (let i = 0; i < sortedPositions.length - 1; i++) {
                    createConnectionLine(sortedPositions[i], sortedPositions[i + 1], `pattern-${i}`);
                }
            }
        }
        """

    def _get_syllable_analysis_javascript(self) -> str:
        """JavaScript for syllable analysis functionality"""
        return """
        function highlightSyllableAnalysis() {
            clearHighlighting();
            
            const analysisType = document.getElementById('syllableAnalysis').value;
            const specificGroup = document.getElementById('syllableSpecificGroup');
            
            if (analysisType === 'none') {
                specificGroup.style.display = 'none';
                return;
            } else if (analysisType === 'specific') {
                specificGroup.style.display = 'block';
                return; // highlightSpecificSyllable() will handle this case
            } else {
                specificGroup.style.display = 'none';
            }
            
            if (analysisType === 'grace-main') {
                drawSmartConnections(analysisData.grace_main_units, '#2e7d32', 2, 'grace-main-units', 'grace-unit');
                
                analysisData.grace_main_units.forEach(pos => {
                    const noteElement = document.getElementById(`note-${pos}`);
                    if (noteElement) {
                        noteElement.classList.add('grace-main-unit');
                        noteElement.setAttribute('data-syllable-info', 'Grace-Main Unit');
                    }
                });
            } else if (analysisType === 'melismatic') {
                if (analysisData.melismatic_analysis && analysisData.melismatic_analysis.melismatic_syllables) {
                    analysisData.melismatic_analysis.melismatic_syllables.forEach(syllable => {
                        const positions = analysisData.all_syllables[syllable].positions;
                        
                        drawSmartConnections(positions, '#6a1b9a', 2, `melisma-${syllable}`, 'melisma');
                        
                        positions.forEach(pos => {
                            const noteElement = document.getElementById(`note-${pos}`);
                            if (noteElement) {
                                noteElement.classList.add('syllable-melismatic');
                                noteElement.setAttribute('data-syllable-info', `Melismatic syllable: ${syllable}`);
                            }
                        });
                    });
                }
            } else if (analysisType === 'repetitions') {
                Object.entries(analysisData.repeated_syllables).forEach(([syllable, data]) => {
                    if (data.count > 1) {
                        drawSmartConnections(data.positions, '#f44336', 2, `repetition-${syllable}`, 'default');
                        
                        data.positions.forEach(pos => {
                            const noteElement = document.getElementById(`note-${pos}`);
                            if (noteElement) {
                                noteElement.classList.add('syllable-repetition');
                                noteElement.setAttribute('data-syllable-info', `Repeated syllable: ${syllable} (${data.count}×)`);
                            }
                        });
                    }
                });
            } else if (analysisType.startsWith('tone-')) {
                const tone = analysisType.replace('tone-', '');
                if (analysisData.tone_syllables && analysisData.tone_syllables[tone]) {
                    drawSmartConnections(analysisData.tone_syllables[tone], toneColors[tone], 2, `tone-${tone}`, 'default');
                    
                    analysisData.tone_syllables[tone].forEach(pos => {
                        const noteElement = document.getElementById(`note-${pos}`);
                        if (noteElement) {
                            noteElement.classList.add(`tone-${tone}`);
                            noteElement.setAttribute('data-syllable-info', `Vietnamese tone: ${tone}`);
                        }
                    });
                }
            }
        }
        
        function highlightSpecificSyllable() {
            clearHighlighting();
            
            const selectedSyllable = document.getElementById('specificSyllable').value;
            if (!selectedSyllable || !analysisData.all_syllables[selectedSyllable]) return;
            
            const positions = analysisData.all_syllables[selectedSyllable].positions;
            const syllableColors = ['#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#00bcd4'];
            const colorIndex = 0;  // Use first color for specific syllable highlighting
            
            drawSmartConnections(positions, syllableColors[colorIndex], 2, `syllable-${selectedSyllable}`, 'default');
            
            positions.forEach(pos => {
                const noteElement = document.getElementById(`note-${pos}`);
                if (noteElement) {
                    noteElement.classList.add('syllable-focus');
                    noteElement.setAttribute('data-syllable-info', `Syllable: ${selectedSyllable}`);
                }
            });
        }
        """

    def _get_ui_control_javascript(self) -> str:
        """JavaScript for UI controls and interactions"""
        return """
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
        """

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Create Improved Analytical Tablature with KPIC/KRIC Overlays')
    parser.add_argument('musicxml_file', help='Path to MusicXML file')
    parser.add_argument('--output', default='analytical_tablature_improved.html', help='Output HTML file')
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