#!/usr/bin/env python3
"""
Interactive Lyrical-Musical Data Explorer
Creates HTML visualization with dropdown filters and highlighting
"""

from typing import Dict, List, Tuple, Optional
import json
import os
from lyrical_musical_analyzer import LyricalMusicalAnalyzer
from musicxml_to_dantranh import DanTranhConverter

class LyricalVisualExplorer:
    def __init__(self):
        self.analyzer = LyricalMusicalAnalyzer()
        self.converter = DanTranhConverter()
        
    def create_interactive_visualization(self, musicxml_file: str, output_file: str = "lyrical_explorer.html"):
        """Create interactive HTML visualization"""
        
        # Analyze the file
        results = self.analyzer.analyze_musicxml(musicxml_file)
        
        # Generate HTML
        html_content = self._generate_html(musicxml_file)
        
        # Write to file
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"Interactive visualization created: {output_file}")
        return output_file
    
    def _generate_html(self, musicxml_file: str) -> str:
        """Generate complete HTML with JavaScript interactivity"""
        
        # Prepare data for JavaScript
        js_data = self._prepare_js_data()
        
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lyrical-Musical Explorer: {os.path.basename(musicxml_file)}</title>
    <style>
        {self._get_css_styles()}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🎵 Lyrical-Musical Explorer</h1>
            <h2>{os.path.basename(musicxml_file)}</h2>
        </header>
        
        <div class="controls">
            <div class="control-group">
                <label for="viewLevel">View Level:</label>
                <select id="viewLevel" onchange="changeViewLevel()">
                    <option value="syllable">Syllable Level</option>
                    <option value="word">Word Level</option>
                    <option value="phrase">Phrase Level</option>
                </select>
            </div>
            
            <div class="control-group">
                <label for="highlightFilter">Highlight:</label>
                <select id="highlightFilter" onchange="updateHighlighting()">
                    <option value="none">No highlighting</option>
                    <option value="repetitions">Repeated items</option>
                    <option value="duration">Duration (color intensity)</option>
                    <option value="pitch-range">Pitch range</option>
                    <option value="grace-notes">Grace notes</option>
                </select>
            </div>
            
            <div class="control-group">
                <label for="specificItem">Focus on specific item:</label>
                <select id="specificItem" onchange="focusOnItem()">
                    <option value="">-- Select item --</option>
                </select>
            </div>
            
            <div class="control-group">
                <label for="showStats">Show Statistics:</label>
                <input type="checkbox" id="showStats" onchange="toggleStats()" checked>
            </div>
        </div>
        
        <div class="main-content">
            <div class="tablature-view" id="tablatureView">
                <!-- Tablature will be generated here -->
            </div>
            
            <div class="statistics-panel" id="statsPanel">
                <h3>Statistics</h3>
                <div id="statsContent"></div>
            </div>
        </div>
        
        <div class="info-panel" id="infoPanel">
            <h3>Item Details</h3>
            <div id="infoContent">Click on any item to see details</div>
        </div>
    </div>
    
    <script>
        // Data from Python analysis
        const analysisData = {js_data};
        
        {self._get_javascript_code()}
    </script>
</body>
</html>"""
    
    def _prepare_js_data(self) -> str:
        """Prepare analysis data for JavaScript"""
        
        # Create simplified data structure for JavaScript
        data = {
            'syllables': [],
            'words': [],
            'phrases': [],
            'notes': [],
            'statistics': {
                'total_notes': len(self.analyzer.processed_notes),
                'notes_with_lyrics': sum(1 for n in self.analyzer.processed_notes if n.get('lyric')),
                'syllable_count': len(self.analyzer.syllable_mappings),
                'word_count': len(self.analyzer.word_mappings),
                'phrase_count': len(self.analyzer.phrase_mappings)
            }
        }
        
        # Add syllable data
        for i, syl in enumerate(self.analyzer.syllable_mappings):
            data['syllables'].append({
                'id': i,
                'text': syl['syllable'],
                'position': syl['position'],
                'pitches': syl['pitches'],
                'durations': syl['durations'],
                'total_duration': syl['total_duration'],
                'note_count': syl['note_count'],
                'grace_note_count': syl['grace_note_count'],
                'pitch_range': syl['pitch_range'],
                'melodic_contour': syl['melodic_contour']
            })
        
        # Add word data
        for i, word in enumerate(self.analyzer.word_mappings):
            data['words'].append({
                'id': i,
                'text': word['word'],
                'syllable_count': word['syllable_count'],
                'total_duration': word['total_duration'],
                'note_count': word['note_count'],
                'pitch_range': word['pitch_range'],
                'starts_at_position': word['starts_at_position'],
                'syllable_positions': [s['position'] for s in word['syllables']]
            })
        
        # Add phrase data
        for i, phrase in enumerate(self.analyzer.phrase_mappings):
            data['phrases'].append({
                'id': i,
                'text': phrase['phrase'],
                'word_count': phrase['word_count'],
                'total_duration': phrase['total_duration'],
                'note_count': phrase['note_count'],
                'pitch_range': phrase['pitch_range']
            })
        
        # Add note data with tablature information
        for i, note in enumerate(self.analyzer.processed_notes):
            string_num, technique = self.converter.find_best_string(note['note'])
            data['notes'].append({
                'id': i,
                'note': note['note'],
                'duration': note['duration'],
                'lyric': note.get('lyric', ''),
                'is_grace': note.get('is_grace', False),
                'string': string_num,
                'technique': technique,
                'midi_pitch': self.converter.note_to_midi_number(note['note'])
            })
        
        return json.dumps(data, ensure_ascii=False)
    
    def _get_css_styles(self) -> str:
        """CSS styles for the visualization"""
        return """
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }
        
        header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        header h2 {
            font-size: 1.3em;
            font-weight: normal;
            opacity: 0.9;
        }
        
        .controls {
            background: white;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
        }
        
        .control-group {
            display: flex;
            flex-direction: column;
            min-width: 200px;
        }
        
        .control-group label {
            font-weight: 600;
            margin-bottom: 5px;
            color: #555;
        }
        
        select, input {
            padding: 8px 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        
        select:focus, input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .main-content {
            display: grid;
            grid-template-columns: 1fr 300px;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .tablature-view {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            min-height: 500px;
            overflow-x: auto;
        }
        
        .statistics-panel {
            background: white;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            height: fit-content;
        }
        
        .statistics-panel h3 {
            color: #667eea;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        
        .info-panel {
            background: white;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            grid-column: 1 / -1;
        }
        
        .info-panel h3 {
            color: #667eea;
            margin-bottom: 15px;
        }
        
        /* Tablature visualization */
        .tablature-container {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .string-line {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        
        .string-label {
            width: 60px;
            font-weight: bold;
            color: #667eea;
            flex-shrink: 0;
        }
        
        .string-notes {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            flex-grow: 1;
        }
        
        .note-item {
            position: relative;
            padding: 5px 8px;
            background: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s;
            min-width: 40px;
            text-align: center;
        }
        
        .note-item:hover {
            background: #e9ecef;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .note-item.grace {
            font-size: 11px;
            background: #fff3cd;
            border-color: #ffeaa7;
        }
        
        .note-item .lyric {
            font-size: 10px;
            color: #666;
            display: block;
            margin-top: 2px;
        }
        
        .note-item .duration {
            font-size: 9px;
            color: #999;
            position: absolute;
            top: -8px;
            right: -5px;
            background: white;
            padding: 1px 3px;
            border-radius: 3px;
            border: 1px solid #ddd;
        }
        
        /* Highlighting styles */
        .highlight-repetition { background: #ffeb3b !important; border-color: #fbc02d !important; }
        .highlight-duration-low { background: #e8f5e8 !important; }
        .highlight-duration-medium { background: #a8d8a8 !important; }
        .highlight-duration-high { background: #4caf50 !important; color: white; }
        .highlight-pitch-range-small { background: #e3f2fd !important; }
        .highlight-pitch-range-medium { background: #2196f3 !important; color: white; }
        .highlight-pitch-range-large { background: #0d47a1 !important; color: white; }
        .highlight-grace { background: #fff3e0 !important; border-color: #ff9800 !important; }
        .highlight-focus { background: #f50057 !important; color: white !important; }
        
        .stat-item {
            margin-bottom: 10px;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 5px;
            border-left: 4px solid #667eea;
        }
        
        .stat-label {
            font-weight: 600;
            color: #555;
        }
        
        .stat-value {
            font-size: 1.1em;
            color: #333;
            margin-top: 2px;
        }
        
        @media (max-width: 768px) {
            .main-content {
                grid-template-columns: 1fr;
            }
            
            .controls {
                flex-direction: column;
            }
            
            .control-group {
                min-width: auto;
            }
        }
        """
    
    def _get_javascript_code(self) -> str:
        """JavaScript code for interactivity"""
        return """
        let currentViewLevel = 'syllable';
        let currentHighlight = 'none';
        let currentFocusItem = null;
        
        // Initialize the visualization
        document.addEventListener('DOMContentLoaded', function() {
            renderTablature();
            updateStatistics();
            populateItemDropdown();
        });
        
        function changeViewLevel() {
            currentViewLevel = document.getElementById('viewLevel').value;
            renderTablature();
            populateItemDropdown();
            updateStatistics();
        }
        
        function updateHighlighting() {
            currentHighlight = document.getElementById('highlightFilter').value;
            renderTablature();
        }
        
        function focusOnItem() {
            const itemSelect = document.getElementById('specificItem');
            currentFocusItem = itemSelect.value;
            renderTablature();
        }
        
        function toggleStats() {
            const statsPanel = document.getElementById('statsPanel');
            const checkbox = document.getElementById('showStats');
            statsPanel.style.display = checkbox.checked ? 'block' : 'none';
        }
        
        function renderTablature() {
            const container = document.getElementById('tablatureView');
            
            // Group notes by string
            const stringGroups = {};
            analysisData.notes.forEach((note, index) => {
                if (!stringGroups[note.string]) {
                    stringGroups[note.string] = [];
                }
                stringGroups[note.string].push({...note, originalIndex: index});
            });
            
            // Create tablature visualization
            let html = '<div class="tablature-container">';
            
            // Sort strings by number
            const sortedStrings = Object.keys(stringGroups).sort((a, b) => parseInt(a) - parseInt(b));
            
            sortedStrings.forEach(stringNum => {
                const notes = stringGroups[stringNum];
                
                html += `<div class="string-line">`;
                html += `<div class="string-label">String ${stringNum}</div>`;
                html += `<div class="string-notes">`;
                
                notes.forEach(note => {
                    const highlightClass = getHighlightClass(note);
                    const graceClass = note.is_grace ? ' grace' : '';
                    
                    html += `<div class="note-item${graceClass}${highlightClass}" 
                                  onclick="showNoteDetails(${note.originalIndex})"
                                  data-note-index="${note.originalIndex}">`;
                    html += `<div class="note-name">${note.note}</div>`;
                    if (note.lyric) {
                        html += `<div class="lyric">${note.lyric}</div>`;
                    }
                    html += `<div class="duration">${note.duration}</div>`;
                    html += `</div>`;
                });
                
                html += `</div></div>`;
            });
            
            html += '</div>';
            container.innerHTML = html;
        }
        
        function getHighlightClass(note) {
            let classes = '';
            
            if (currentHighlight === 'repetitions') {
                const repetitionCount = getRepetitionCount(note);
                if (repetitionCount > 1) {
                    classes += ' highlight-repetition';
                }
            } else if (currentHighlight === 'duration') {
                if (note.duration <= 1) classes += ' highlight-duration-low';
                else if (note.duration <= 2) classes += ' highlight-duration-medium';
                else classes += ' highlight-duration-high';
            } else if (currentHighlight === 'grace-notes') {
                if (note.is_grace) classes += ' highlight-grace';
            }
            
            // Focus highlighting
            if (currentFocusItem && isPartOfFocusItem(note)) {
                classes += ' highlight-focus';
            }
            
            return classes;
        }
        
        function getRepetitionCount(note) {
            if (currentViewLevel === 'syllable' && note.lyric) {
                return analysisData.syllables.filter(s => s.text === note.lyric).length;
            }
            return 1;
        }
        
        function isPartOfFocusItem(note) {
            if (!currentFocusItem) return false;
            
            if (currentViewLevel === 'syllable') {
                return note.lyric === currentFocusItem;
            }
            // Add logic for word and phrase levels
            return false;
        }
        
        function populateItemDropdown() {
            const select = document.getElementById('specificItem');
            select.innerHTML = '<option value="">-- Select item --</option>';
            
            let items = [];
            if (currentViewLevel === 'syllable') {
                items = [...new Set(analysisData.syllables.map(s => s.text))].filter(Boolean);
            } else if (currentViewLevel === 'word') {
                items = [...new Set(analysisData.words.map(w => w.text))].filter(Boolean);
            } else if (currentViewLevel === 'phrase') {
                items = [...new Set(analysisData.phrases.map(p => p.text))].filter(Boolean);
            }
            
            items.sort().forEach(item => {
                const option = document.createElement('option');
                option.value = item;
                option.textContent = item;
                select.appendChild(option);
            });
        }
        
        function showNoteDetails(noteIndex) {
            const note = analysisData.notes[noteIndex];
            const infoContent = document.getElementById('infoContent');
            
            let html = `<h4>Note ${noteIndex + 1}: ${note.note}</h4>`;
            html += `<div class="stat-item">`;
            html += `<div class="stat-label">Duration:</div>`;
            html += `<div class="stat-value">${note.duration} units</div>`;
            html += `</div>`;
            
            if (note.lyric) {
                html += `<div class="stat-item">`;
                html += `<div class="stat-label">Lyric:</div>`;
                html += `<div class="stat-value">${note.lyric}</div>`;
                html += `</div>`;
                
                // Find syllable data
                const syllableData = analysisData.syllables.find(s => 
                    s.text === note.lyric && s.position <= noteIndex
                );
                
                if (syllableData) {
                    html += `<div class="stat-item">`;
                    html += `<div class="stat-label">Syllable Analysis:</div>`;
                    html += `<div class="stat-value">`;
                    html += `Notes: ${syllableData.note_count}, `;
                    html += `Total Duration: ${syllableData.total_duration}, `;
                    html += `Grace Notes: ${syllableData.grace_note_count}`;
                    html += `</div>`;
                    html += `</div>`;
                }
            }
            
            html += `<div class="stat-item">`;
            html += `<div class="stat-label">String Position:</div>`;
            html += `<div class="stat-value">String ${note.string} (${note.technique})</div>`;
            html += `</div>`;
            
            html += `<div class="stat-item">`;
            html += `<div class="stat-label">MIDI Pitch:</div>`;
            html += `<div class="stat-value">${note.midi_pitch}</div>`;
            html += `</div>`;
            
            if (note.is_grace) {
                html += `<div class="stat-item">`;
                html += `<div class="stat-label">Note Type:</div>`;
                html += `<div class="stat-value">Grace Note</div>`;
                html += `</div>`;
            }
            
            infoContent.innerHTML = html;
        }
        
        function updateStatistics() {
            const statsContent = document.getElementById('statsContent');
            const stats = analysisData.statistics;
            
            let html = '';
            html += `<div class="stat-item">`;
            html += `<div class="stat-label">Total Notes:</div>`;
            html += `<div class="stat-value">${stats.total_notes}</div>`;
            html += `</div>`;
            
            html += `<div class="stat-item">`;
            html += `<div class="stat-label">Notes with Lyrics:</div>`;
            html += `<div class="stat-value">${stats.notes_with_lyrics}</div>`;
            html += `</div>`;
            
            html += `<div class="stat-item">`;
            html += `<div class="stat-label">Syllables:</div>`;
            html += `<div class="stat-value">${stats.syllable_count}</div>`;
            html += `</div>`;
            
            html += `<div class="stat-item">`;
            html += `<div class="stat-label">Words:</div>`;
            html += `<div class="stat-value">${stats.word_count}</div>`;
            html += `</div>`;
            
            html += `<div class="stat-item">`;
            html += `<div class="stat-label">Phrases:</div>`;
            html += `<div class="stat-value">${stats.phrase_count}</div>`;
            html += `</div>`;
            
            // Add repetition statistics
            if (currentViewLevel === 'syllable') {
                const repetitions = {};
                analysisData.syllables.forEach(s => {
                    if (s.text) {
                        repetitions[s.text] = (repetitions[s.text] || 0) + 1;
                    }
                });
                
                const repeatedItems = Object.entries(repetitions)
                    .filter(([text, count]) => count > 1)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);
                
                if (repeatedItems.length > 0) {
                    html += `<div class="stat-item">`;
                    html += `<div class="stat-label">Most Repeated Syllables:</div>`;
                    html += `<div class="stat-value">`;
                    repeatedItems.forEach(([text, count]) => {
                        html += `${text} (${count}×)<br>`;
                    });
                    html += `</div>`;
                    html += `</div>`;
                }
            }
            
            statsContent.innerHTML = html;
        }
        """

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Create Interactive Lyrical-Musical Visualization')
    parser.add_argument('musicxml_file', help='Path to MusicXML file')
    parser.add_argument('--output', default='lyrical_explorer.html', help='Output HTML file')
    parser.add_argument('--open', action='store_true', help='Open in browser after creation')
    
    args = parser.parse_args()
    
    explorer = LyricalVisualExplorer()
    output_file = explorer.create_interactive_visualization(args.musicxml_file, args.output)
    
    if args.open:
        import webbrowser
        webbrowser.open(f'file://{os.path.abspath(output_file)}')

if __name__ == "__main__":
    main()