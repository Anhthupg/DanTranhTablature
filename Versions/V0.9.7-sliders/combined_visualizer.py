#!/usr/bin/env python3
"""
Combined Visualizer for Đan Tranh Tablature
Shows V0.1.0 basic tablature on top and aligned phrases below in order
"""

from musicxml_to_dantranh import DanTranhConverter
from tablature_aligner import TablatureAligner
import xml.etree.ElementTree as ET
from typing import List, Dict, Tuple

class CombinedVisualizer:
    def __init__(self, musicxml_file: str):
        self.musicxml_file = musicxml_file
        self.converter = DanTranhConverter()
        self.aligner = TablatureAligner(musicxml_file)
        
    def create_combined_visualization(self) -> str:
        """Create SVG with V0.1.0 on top and aligned phrases below"""
        
        # Parse and convert using V0.1.0 converter
        notes = self.converter.parse_musicxml(self.musicxml_file)
        
        # Apply slur-to-tie conversion
        notes = self.convert_slurs_to_ties(notes)
        
        # Get aligned sections with phrase detection
        self.aligner.analyze_structure()
        
        # Get strings used
        self.converter.used_strings = set()
        for note in notes:
            if not note.get('is_grace', False):
                string_num, _ = self.converter.find_best_string(note['note'])
                self.converter.used_strings.add(string_num)
        
        # Calculate dimensions based on actual content
        total_duration = 0
        for note in notes:
            if note.get('is_grace', False):
                total_duration += note.get('duration', 1) * 0.5
            else:
                total_duration += note.get('duration', 1)
        
        duration_unit = 20
        svg_width = max(2400, int(total_duration * duration_unit) + 200)  # Dynamic width
        svg_height = 600  # Two tablatures + spacing
        
        # Start combined SVG
        combined_svg = [
            f'<svg width="{svg_width}" height="{svg_height}" xmlns="http://www.w3.org/2000/svg">',
            '<defs>',
            # Copy gradient definitions
            '<linearGradient id="resonanceBand" x1="0%" y1="0%" x2="100%" y2="0%">',
            '<stop offset="0%" style="stop-color:#008080;stop-opacity:1.0"/>',
            '<stop offset="25%" style="stop-color:#008080;stop-opacity:0.7"/>',
            '<stop offset="50%" style="stop-color:#008080;stop-opacity:0.4"/>',
            '<stop offset="75%" style="stop-color:#008080;stop-opacity:0.2"/>',
            '<stop offset="100%" style="stop-color:#008080;stop-opacity:0.0"/>',
            '</linearGradient>',
            '<style>',
            '.string-line { stroke: #008ECC; stroke-width: 2; }',
            '.string-label { font-family: Arial; font-size: 12px; fill: #008ECC; }',
            '.title { font-family: Arial; font-size: 20px; font-weight: bold; fill: purple; }',
            '.subtitle { font-family: Arial; font-size: 16px; font-weight: bold; }',
            '.string-number { font-family: Arial; font-size: 10px; fill: white; font-weight: bold; }',
            '</style>',
            '</defs>',
            
            # Background
            f'<rect width="{svg_width}" height="{svg_height}" fill="floralwhite"/>',
            
            # Title
            '<text x="20" y="30" class="title">Đan Tranh Tablature - Comparison View</text>',
            '<text x="20" y="50" style="font-family: Arial; font-size: 14px; fill: #666;">V0.1.0 (top) vs Aligned Phrases in Order (bottom)</text>',
            
            # V0.1.0 section label
            '<text x="20" y="90" class="subtitle" fill="black">V0.1.0 - Basic (Complete Piece):</text>',
        ]
        
        # Draw V0.1.0 complete tablature
        v010_y_start = 110
        string_positions_v010 = self.calculate_string_positions(v010_y_start)
        
        # Draw string lines for V0.1.0
        for string_num in sorted(self.converter.used_strings, 
                                 key=lambda s: self.converter.note_to_midi_number(self.converter.default_tuning[s])):
            y_pos = string_positions_v010[string_num]
            combined_svg.append(f'<line x1="120" y1="{y_pos}" x2="{svg_width - 50}" y2="{y_pos}" class="string-line"/>')
            tuning_note = self.converter.default_tuning.get(string_num, f"S{string_num}")
            combined_svg.append(f'<text x="20" y="{y_pos + 5}" class="string-label">String {string_num}: {tuning_note}</text>')
        
        # Draw all notes for V0.1.0
        current_x = 120
        for note_data in notes:
            target_string, _ = self.converter.find_best_string(note_data['note'])
            
            if target_string in self.converter.used_strings:
                y_pos = string_positions_v010[target_string]
                
                # Note sizing based on type
                is_grace = note_data.get('is_grace', False)
                if is_grace:
                    note_radius = 6
                    note_width = note_data.get('duration', 1) * duration_unit * 0.5
                else:
                    note_radius = 12
                    note_width = note_data.get('duration', 1) * duration_unit
                
                # Draw resonance band
                if not note_data.get('is_muted'):
                    if is_grace:
                        resonance_width = 40
                    else:
                        resonance_width = 80
                    combined_svg.append(f'<rect x="{current_x}" y="{y_pos - 4}" width="{resonance_width}" height="8" ')
                    combined_svg.append(f'fill="url(#resonanceBand)" stroke="none" rx="2"/>')
                
                # Draw note circle
                note_fill = "#008080"
                note_stroke = "crimson"
                
                # Special colors for different note types
                if note_data.get('slur') == 'start':
                    note_fill = "#FFD700"
                    note_stroke = "#0066FF"
                elif is_grace:
                    if note_data.get('grace_slash', False):
                        note_fill = "#FFD700"
                        note_stroke = "#FF8C00"
                    else:
                        note_fill = "#90EE90"
                        note_stroke = "#228B22"
                
                combined_svg.append(f'<circle cx="{current_x}" cy="{y_pos}" r="{note_radius}" ')
                combined_svg.append(f'fill="{note_fill}" stroke="{note_stroke}" stroke-width="2"/>')
                
                # String number
                combined_svg.append(f'<text x="{current_x}" y="{y_pos + 4}" text-anchor="middle" ')
                combined_svg.append(f'class="string-number">{target_string}</text>')
                
                # Add lyrics underneath the note (if present)
                if note_data.get('lyric'):
                    lyric_y = max(string_positions_v010.values()) + 30
                    combined_svg.append(f'<text x="{current_x}" y="{lyric_y}" text-anchor="middle" ')
                    combined_svg.append(f'style="font-family: Arial; font-size: 12px; fill: #333;">{note_data["lyric"]}</text>')
                
                # Duration label (for debugging)
                combined_svg.append(f'<text x="{current_x}" y="{y_pos - 20}" text-anchor="middle" ')
                combined_svg.append(f'style="font-size: 10px; fill: #000; font-weight: bold;">{note_data.get("duration", 1)}</text>')
                
                # Move to next position
                current_x += note_width
        
        # Calculate V0.1.0 height
        v010_height = max(string_positions_v010.values()) - min(string_positions_v010.values()) + 50
        
        # Aligned phrases section
        aligned_y_start = v010_y_start + v010_height + 80  # V0.1.0 start + height + spacing
        
        combined_svg.append(f'<text x="20" y="{aligned_y_start - 10}" class="subtitle" fill="black">Aligned Phrases (Complete Piece with Color-Coding):</text>')
        
        # Draw string lines for aligned section
        string_positions = self.calculate_string_positions(aligned_y_start)
        
        for string_num in sorted(self.converter.used_strings, 
                                 key=lambda s: self.converter.note_to_midi_number(self.converter.default_tuning[s])):
            y_pos = string_positions[string_num]
            combined_svg.append(f'<line x1="120" y1="{y_pos}" x2="{svg_width - 50}" y2="{y_pos}" class="string-line"/>')
            tuning_note = self.converter.default_tuning.get(string_num, f"S{string_num}")
            combined_svg.append(f'<text x="20" y="{y_pos + 5}" class="string-label">String {string_num}: {tuning_note}</text>')
        
        # Draw complete piece with phrase coloring
        current_x = 120
        
        # Create section mapping by position
        section_map = {}
        for section in self.aligner.sections:
            for pos in range(section['start_pos'], section['end_pos'] + 1):
                section_map[pos] = section
        
        # Draw phrase backgrounds and notes together
        current_x = 120
        drawn_sections = set()  # Track which sections we've drawn backgrounds for
        
        for i, note_data in enumerate(notes):
            # Check if this note starts a new section we haven't drawn yet
            if i in section_map:
                section = section_map[i]
                section_key = (section['start_pos'], section['end_pos'])
                
                if section_key not in drawn_sections and section['type'] == 'phrase':
                    drawn_sections.add(section_key)
                    
                    # Calculate section width properly
                    section_start_x = current_x
                    section_width = 0
                    for note in section['notes']:
                        if note.get('is_grace', False):
                            section_width += note.get('duration', 1) * duration_unit * 0.5
                        else:
                            section_width += note.get('duration', 1) * duration_unit
                    
                    # Draw colored background
                    combined_svg.append(f'<rect x="{section_start_x - 5}" y="{min(string_positions.values()) - 20}" ')
                    combined_svg.append(f'width="{section_width + 10}" height="{max(string_positions.values()) - min(string_positions.values()) + 40}" ')
                    combined_svg.append(f'fill="{section["color"]}" opacity="0.2"/>')
                    
                    # Add phrase label
                    combined_svg.append(f'<text x="{section_start_x + section_width/2}" y="{min(string_positions.values()) - 25}" ')
                    combined_svg.append(f'text-anchor="middle" style="font-size: 10px; fill: {section["color"]}; font-weight: bold;">')
                    combined_svg.append(f'{section["phrase_id"]} #{section["instance_num"] + 1}</text>')
            
            # Draw the note
            target_string, _ = self.converter.find_best_string(note_data['note'])
            
            if target_string in self.converter.used_strings:
                y_pos = string_positions[target_string]
                
                # Note sizing based on type
                is_grace = note_data.get('is_grace', False)
                if is_grace:
                    note_radius = 6
                    note_width = note_data.get('duration', 1) * duration_unit * 0.5
                else:
                    note_radius = 12
                    note_width = note_data.get('duration', 1) * duration_unit
                
                # Draw resonance band
                if not note_data.get('is_muted'):
                    if is_grace:
                        resonance_width = 40
                    else:
                        resonance_width = 80
                    combined_svg.append(f'<rect x="{current_x}" y="{y_pos - 4}" width="{resonance_width}" height="8" ')
                    combined_svg.append(f'fill="url(#resonanceBand)" stroke="none" rx="2"/>')
                
                # Draw note circle
                note_fill = "#008080"
                note_stroke = "crimson"
                
                # Special colors for different note types
                if note_data.get('slur') == 'start':
                    note_fill = "#FFD700"
                    note_stroke = "#0066FF"
                elif is_grace:
                    if note_data.get('grace_slash', False):
                        note_fill = "#FFD700"
                        note_stroke = "#FF8C00"
                    else:
                        note_fill = "#90EE90"
                        note_stroke = "#228B22"
                
                combined_svg.append(f'<circle cx="{current_x}" cy="{y_pos}" r="{note_radius}" ')
                combined_svg.append(f'fill="{note_fill}" stroke="{note_stroke}" stroke-width="2"/>')
                
                # String number
                combined_svg.append(f'<text x="{current_x}" y="{y_pos + 4}" text-anchor="middle" ')
                combined_svg.append(f'class="string-number">{target_string}</text>')
                
                # Add lyrics underneath the note (if present)
                if note_data.get('lyric'):
                    lyric_y = max(string_positions.values()) + 30
                    combined_svg.append(f'<text x="{current_x}" y="{lyric_y}" text-anchor="middle" ')
                    combined_svg.append(f'style="font-family: Arial; font-size: 12px; fill: #333;">{note_data["lyric"]}</text>')
                
                # Move to next position
                current_x += note_width
        
        combined_svg.append('</svg>')
        
        return '\n'.join(combined_svg)
    
    def convert_slurs_to_ties(self, notes: List[Dict]) -> List[Dict]:
        """Convert slurs between identical notes to ties (V0.1.0 logic)"""
        corrected_notes = []
        i = 0
        while i < len(notes):
            current_note = dict(notes[i])  # Copy the note
            
            # Check if this note starts a slur
            if current_note.get('slur') == 'start':
                # Look ahead to find the end of this slur
                slur_notes = [current_note]
                j = i + 1
                
                while j < len(notes):
                    next_note = dict(notes[j])
                    slur_type = next_note.get('slur')
                    
                    if slur_type in ['start', 'stop', 'continue']:
                        slur_notes.append(next_note)
                        
                        if slur_type == 'stop':
                            # Check if all notes in this slur are identical
                            first_note_name = current_note['note']
                            all_identical = all(note['note'] == first_note_name for note in slur_notes)
                            
                            if all_identical and len(slur_notes) > 1:
                                # This is a tie! Combine all notes into ONE single note
                                combined_note = dict(current_note)
                                combined_note['slur'] = None
                                combined_note['tie'] = None  # Remove tie marking since we're combining
                                
                                # Sum up durations of all tied notes
                                total_duration = sum(note.get('duration', 1) for note in slur_notes)
                                combined_note['duration'] = total_duration
                                combined_note['combined_from_tie'] = True
                                
                                # Keep the lyric from the first note only
                                combined_note['lyric'] = current_note.get('lyric', '')
                                
                                # Add only the combined note
                                corrected_notes.append(combined_note)
                            else:
                                # This is a real slur between different notes
                                corrected_notes.extend(slur_notes)
                            
                            i = j + 1  # Skip to next unprocessed note
                            break
                        j += 1
                    else:
                        # Not part of the slur
                        break
                else:
                    # Slur never ended (malformed), treat as regular note
                    corrected_notes.append(current_note)
                    i += 1
            else:
                # Regular note or tie
                corrected_notes.append(current_note)
                i += 1
        
        return corrected_notes
    
    def calculate_string_positions(self, y_start: float) -> Dict[int, float]:
        """Calculate string positions with lower strings at bottom"""
        string_positions = {}
        
        lowest_string = min(self.converter.used_strings)
        highest_string = max(self.converter.used_strings)
        
        lowest_midi = self.converter.note_to_midi_number(self.converter.default_tuning[lowest_string])
        highest_midi = self.converter.note_to_midi_number(self.converter.default_tuning[highest_string])
        pitch_range = highest_midi - lowest_midi
        
        if pitch_range > 0:
            for string_num in sorted(self.converter.used_strings):
                string_midi = self.converter.note_to_midi_number(self.converter.default_tuning[string_num])
                relative_position = (string_midi - lowest_midi) / pitch_range
                # Lower strings (lower pitch) = higher y-coordinate (bottom)
                y_pos = y_start + relative_position * pitch_range * 8
                string_positions[string_num] = y_pos
        else:
            sorted_strings = sorted(self.converter.used_strings,
                                  key=lambda s: self.converter.note_to_midi_number(self.converter.default_tuning[s]))
            for i, string_num in enumerate(sorted_strings):
                string_positions[string_num] = y_start + i * 24
        
        return string_positions

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Create combined visualization of MusicXML')
    parser.add_argument('input_file', help='Input MusicXML file')
    parser.add_argument('-o', '--output', help='Output SVG file', default='SVG_Output/combined_view.svg')
    
    args = parser.parse_args()
    
    # Create visualizer
    visualizer = CombinedVisualizer(args.input_file)
    
    print(f"🎵 Creating combined visualization for: {args.input_file}")
    
    # Generate combined SVG
    svg_content = visualizer.create_combined_visualization()
    
    # Save to file
    with open(args.output, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    
    print(f"✅ Combined visualization saved to {args.output}")

if __name__ == '__main__':
    main()