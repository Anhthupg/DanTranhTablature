#!/usr/bin/env python3
"""
MusicXML to Đan Tranh Tablature Converter
Converts MusicXML files to Vietnamese 16/17-string zither tablature
"""

import xml.etree.ElementTree as ET
import argparse
import sys
from typing import Dict, List, Tuple, Optional
import re

class DanTranhConverter:
    def __init__(self):
        # Default pentatonic tuning C-D-E-G-A across 17 strings
        self.default_tuning = {
            1: "E3", 2: "G3", 3: "A3", 4: "C4", 5: "D4",
            6: "E4", 7: "G4", 8: "A4", 9: "C5", 10: "D5", 
            11: "E5", 12: "G5", 13: "A5", 14: "C6", 15: "D6",
            16: "E6", 17: "G6"
        }
        
        # Note to MIDI number mapping for pitch calculation
        self.note_to_midi = {
            "C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11
        }
        
        self.tablature_lines = []
        self.used_strings = set()
        
    def note_to_midi_number(self, note: str) -> float:
        """Convert note string (e.g., 'C4', 'F#5', 'C4+15') to MIDI number with cents"""
        # Parse note with optional cents adjustment (e.g., "C4+15" or "D5-30")
        cents_match = re.match(r'([A-G][#b]?\d+)([\+\-]\d+)?', note)
        if cents_match:
            base_note = cents_match.group(1)
            cents_str = cents_match.group(2)
            cents = float(cents_str) / 100 if cents_str else 0
        else:
            base_note = note
            cents = 0
        
        # Parse base note components
        match = re.match(r'([A-G])([#b]?)(\d+)', base_note)
        if not match:
            return 60.0  # Default to C4
            
        note_name, accidental, octave = match.groups()
        
        midi_num = self.note_to_midi[note_name]
        midi_num += 12 * int(octave)
        
        if accidental == '#':
            midi_num += 1
        elif accidental == 'b':
            midi_num -= 1
        
        # Add cents adjustment (1 semitone = 100 cents)
        return midi_num + cents
    
    def find_best_string(self, target_note: str) -> Tuple[int, str]:
        """Find the best string to play a note on"""
        target_midi = self.note_to_midi_number(target_note)
        
        best_string = 1
        best_technique = "open"
        min_distance = float('inf')
        
        for string_num, open_note in self.default_tuning.items():
            open_midi = self.note_to_midi_number(open_note)
            
            # Check if it's an open string
            if target_midi == open_midi:
                return string_num, "open"
            
            # Check if it can be bent from this string
            if target_midi > open_midi and target_midi - open_midi <= 4:  # Max 2 tone bend
                distance = target_midi - open_midi
                if distance < min_distance:
                    min_distance = distance
                    best_string = string_num
                    best_technique = f"bend+{distance}"
        
        return best_string, best_technique
    
    def parse_musicxml(self, file_path: str) -> List[Dict]:
        """Parse MusicXML file and extract notes"""
        try:
            tree = ET.parse(file_path)
            root = tree.getroot()
        except Exception as e:
            print(f"Error parsing MusicXML: {e}")
            return []
        
        notes = []
        
        # Handle both score-partwise and score-timewise
        if root.tag == 'score-partwise':
            for part in root.findall('.//part'):
                for measure in part.findall('measure'):
                    for note in measure.findall('note'):
                        note_data = self.parse_note_element(note)
                        if note_data:
                            notes.append(note_data)
        
        return notes
    
    def parse_note_element(self, note_elem) -> Optional[Dict]:
        """Parse individual note element"""
        # Skip rests
        if note_elem.find('rest') is not None:
            return None
        
        # Check for grace notes
        grace_elem = note_elem.find('grace')
        is_grace = grace_elem is not None
        grace_slash = False
        if is_grace and grace_elem.get('slash') == 'yes':
            grace_slash = True
        
        pitch_elem = note_elem.find('pitch')
        if pitch_elem is None:
            return None
        
        # Extract pitch information
        step = pitch_elem.find('step').text
        octave = pitch_elem.find('octave').text
        alter_elem = pitch_elem.find('alter')
        
        # Handle accidentals
        accidental = ""
        if alter_elem is not None:
            alter_value = int(alter_elem.text)
            if alter_value > 0:
                accidental = "#" * alter_value
            elif alter_value < 0:
                accidental = "b" * abs(alter_value)
        
        note_name = f"{step}{accidental}{octave}"
        
        # Extract duration
        duration_elem = note_elem.find('duration')
        if is_grace:
            # Grace notes often don't have duration element, use type instead
            type_elem = note_elem.find('type')
            if type_elem is not None:
                note_type = type_elem.text
                # Convert note type to duration units (assuming quarter = 1)
                duration_map = {
                    'whole': 4, 'half': 2, 'quarter': 1, 
                    'eighth': 0.5, '16th': 0.25, '32nd': 0.125
                }
                duration = duration_map.get(note_type, 0.25)  # Default to 16th note
            else:
                duration = 0.25  # Default grace note duration
        else:
            duration = int(duration_elem.text) if duration_elem is not None else 1
        
        # Extract lyrics
        lyric_text = ""
        lyric_elem = note_elem.find('lyric')
        if lyric_elem is not None:
            text_elem = lyric_elem.find('text')
            if text_elem is not None:
                lyric_text = text_elem.text or ""
        
        # Check for slurs
        slur_type = None
        notations = note_elem.find('notations')
        if notations is not None:
            slur = notations.find('slur')
            if slur is not None:
                slur_type = slur.get('type')  # 'start', 'stop', or 'continue'
        
        # Check for ties
        tie_type = None
        # First check <tie> elements (the musical tie)
        tie_elem = note_elem.find('tie')
        if tie_elem is not None:
            tie_type = tie_elem.get('type')  # 'start' or 'stop'
        # Also check <tied> in notations (visual representation)
        elif notations is not None:
            tied = notations.find('tied')
            if tied is not None:
                tie_type = tied.get('type')  # 'start' or 'stop'
        
        # Check for ornaments
        ornaments = []
        if notations is not None:
            if notations.find('.//trill-mark') is not None:
                ornaments.append('trill')
            if notations.find('.//mordent') is not None:
                ornaments.append('rung')
            if notations.find('.//slide') is not None:
                ornaments.append('gliss')
        
        return {
            'note': note_name,
            'duration': duration,
            'ornaments': ornaments,
            'lyric': lyric_text,
            'slur': slur_type,
            'tie': tie_type,
            'is_grace': is_grace,
            'grace_slash': grace_slash
        }
    
    def generate_tablature(self, notes: List[Dict]) -> str:
        """Generate tablature notation"""
        if not notes:
            return "No notes found in MusicXML file"
        
        # Find which strings are used
        string_usage = {}
        for note_data in notes:
            string_num, technique = self.find_best_string(note_data['note'])
            self.used_strings.add(string_num)
            if string_num not in string_usage:
                string_usage[string_num] = []
            string_usage[string_num].append({
                'note': note_data['note'],
                'technique': technique,
                'duration': note_data['duration'],
                'ornaments': note_data['ornaments']
            })
        
        # Generate tablature output
        output = []
        output.append("Đan Tranh Tablature")
        output.append("=" * 50)
        output.append(f"Tuning: Pentatonic (C-D-E-G-A)")
        output.append(f"Strings used: {sorted(self.used_strings)}")
        output.append("")
        
        # Show tuning for used strings only
        output.append("String Tuning:")
        for string_num in sorted(self.used_strings):
            output.append(f"String {string_num:2d}: {self.default_tuning[string_num]}")
        output.append("")
        
        # Generate tablature lines
        output.append("Tablature (lowest string on top):")
        output.append("")
        
        # Create tablature grid
        max_position = len(notes)
        
        for string_num in sorted(self.used_strings):
            line = f"String {string_num:2d} |"
            
            position = 0
            for note_data in notes:
                target_string, technique = self.find_best_string(note_data['note'])
                
                if target_string == string_num:
                    if technique == "open":
                        symbol = "O"
                    elif "bend" in technique:
                        bend_amount = technique.split('+')[1]
                        symbol = f"({bend_amount})"
                    else:
                        symbol = "X"
                    
                    # Add ornament symbols
                    if 'rung' in note_data['ornaments']:
                        symbol += "~"
                    if 'trill' in note_data['ornaments']:
                        symbol += "tr"
                    if 'gliss' in note_data['ornaments']:
                        symbol += "/"
                        
                    line += f"{symbol:>4}"
                else:
                    line += "----"
                
                position += 1
            
            line += " |"
            output.append(line)
        
        # Add position markers
        position_line = "Position  |"
        for i in range(len(notes)):
            position_line += f"{i+1:>4}"
        position_line += " |"
        output.append("")
        output.append(position_line)
        
        return "\n".join(output)
    
    def draw_single_note(self, svg: List[str], x_pos: float, y_pos: float, 
                        note_data: Dict, target_string: int, note_width: float, 
                        is_grace: bool = False):
        """Helper method to draw a single note (grace or main)"""
        # Determine note size and color
        note_radius = 6 if is_grace else 12
        note_fill_color = "#008080"  # Default teal
        note_stroke_color = "crimson"  # Default crimson
        note_stroke_width = 2
        
        # Special styling for grace notes
        if is_grace:
            grace_slash = note_data.get('grace_slash', False)
            if grace_slash:
                # Acciaccatura: yellow with orange border
                note_fill_color = "#FFD700"  # Gold/yellow
                note_stroke_color = "#FF8C00"  # Orange border
            else:
                # Appoggiatura: light green with dark green border
                note_fill_color = "#90EE90"  # Light green
                note_stroke_color = "#228B22"  # Dark green border
        
        # Draw note circle
        svg.append(f'<circle cx="{x_pos}" cy="{y_pos}" r="{note_radius}" '
                  f'fill="{note_fill_color}" stroke="{note_stroke_color}" '
                  f'stroke-width="{note_stroke_width}"/>')
        
        # Add string number inside circle
        svg.append(f'<text x="{x_pos}" y="{y_pos+4}" text-anchor="middle" class="string-number">{target_string}</text>')
        
        # Add slash for acciaccaturas
        if is_grace and note_data.get('grace_slash', False):
            # Draw diagonal slash through the grace note
            slash_offset = note_radius * 0.7
            svg.append(f'<line x1="{x_pos-slash_offset}" y1="{y_pos+slash_offset}" '
                      f'x2="{x_pos+slash_offset}" y2="{y_pos-slash_offset}" '
                      f'stroke="#8B0000" stroke-width="2"/>')
    
    def convert_to_svg(self, notes: List[Dict]) -> str:
        """Generate SVG tablature output"""
        # First, ensure we have the used strings data
        if not self.used_strings:
            # Populate used_strings by analyzing notes
            for note_data in notes:
                string_num, _ = self.find_best_string(note_data['note'])
                self.used_strings.add(string_num)
        
        # Fix fundamental issue: Convert slurs between identical notes to ties
        # This corrects the common MusicXML issue where ties are encoded as slurs
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
                                # This is a tie disguised as a slur! Convert it
                                # Mark first note as tie start
                                current_note['tie'] = 'start'
                                current_note['slur'] = None  # Remove slur marking
                                corrected_notes.append(current_note)
                                
                                # Mark intermediate notes as tie continuations (they'll be skipped)
                                for k in range(1, len(slur_notes) - 1):
                                    tie_note = dict(slur_notes[k])
                                    tie_note['tie'] = 'continue'
                                    tie_note['slur'] = None
                                    corrected_notes.append(tie_note)
                                
                                # Mark last note as tie stop
                                last_note = dict(slur_notes[-1])
                                last_note['tie'] = 'stop'
                                last_note['slur'] = None
                                corrected_notes.append(last_note)
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
        
        # Use the corrected notes for the rest of processing
        notes = corrected_notes
        
        # Calculate total duration for width
        total_duration = sum(note.get('duration', 1) for note in notes)
        svg_width = max(800, total_duration * 20 + 200)
        
        # Calculate height based on pitch range
        pitch_range = 0
        if self.used_strings:
            lowest_string = min(self.used_strings)
            highest_string = max(self.used_strings)
            lowest_midi = self.note_to_midi_number(self.default_tuning[lowest_string])
            highest_midi = self.note_to_midi_number(self.default_tuning[highest_string])
            pitch_range = highest_midi - lowest_midi
        
        svg_height = max(400, pitch_range * 8 + 250)
        
        svg = [
            f'<svg width="{svg_width}" height="{svg_height}" xmlns="http://www.w3.org/2000/svg">',
            '<defs>',
            # Add gradient for resonance band - matches note color and fades to transparent
            '<linearGradient id="resonanceBand" x1="0%" y1="0%" x2="100%" y2="0%">',
            '<stop offset="0%" style="stop-color:#008080;stop-opacity:1.0"/>',
            '<stop offset="25%" style="stop-color:#008080;stop-opacity:0.7"/>',
            '<stop offset="50%" style="stop-color:#008080;stop-opacity:0.4"/>',
            '<stop offset="75%" style="stop-color:#008080;stop-opacity:0.2"/>',
            '<stop offset="100%" style="stop-color:#008080;stop-opacity:0.0"/>',
            '</linearGradient>',
            # Gradient for muted/stopped notes
            '<linearGradient id="mutedGradient" x1="0%" y1="0%" x2="100%" y2="0%">',
            '<stop offset="0%" style="stop-color:#666;stop-opacity:0.3"/>',
            '<stop offset="100%" style="stop-color:#666;stop-opacity:0"/>',
            '</linearGradient>',
            '<style>',
            '.string-line { stroke: #008ECC; stroke-width: 2; }',
            '.string-label { font-family: Arial; font-size: 14px; fill: #008ECC; }',
            '.note-circle { fill: #008080; stroke: crimson; stroke-width: 2; }',
            '.muted-note { fill: #666; stroke: #333; stroke-width: 2; }',
            '.bend-line { stroke: red; stroke-width: 4; stroke-dasharray: 5,2; }',
            '.title { font-family: Arial; font-size: 24px; font-weight: bold; fill: purple; }',
            '.string-number { font-family: Arial; font-size: 12px; fill: white; font-weight: bold; }',
            '.resonance-band { fill: url(#resonanceBand); stroke: none; }',
            '.muted-tail { stroke: url(#mutedGradient); stroke-width: 4; fill: none; }',
            '.duration-text { font-family: Arial; font-size: 10px; fill: #666; }',
            '</style>',
            '</defs>',
            
            # Background
            f'<rect width="{svg_width}" height="{svg_height}" fill="floralwhite"/>',
            
            # Title
            '<text x="20" y="30" class="title">Đan Tranh Tablature</text>',
            '<text x="20" y="55" style="font-family: Arial; font-size: 14px; fill: #666;">Tuning: Pentatonic (C-D-E-G-A)</text>',
            
            # Slur Color Legend
            '<rect x="20" y="70" width="800" height="25" fill="#f0f8ff" stroke="#ccc" stroke-width="1" rx="5"/>',
            '<text x="30" y="85" style="font-family: Arial; font-size: 12px; font-weight: bold; fill: black;">SLUR COLORS:</text>',
            
            # Legend items with example circles
            '<circle cx="150" cy="82" r="8" fill="#FFD700" stroke="#0066FF" stroke-width="3"/>',
            '<text x="165" y="86" style="font-family: Arial; font-size: 11px; fill: black;">Start</text>',
            
            '<circle cx="220" cy="82" r="6" fill="#9966FF" stroke="#FF00FF" stroke-width="2"/>',
            '<text x="235" y="86" style="font-family: Arial; font-size: 11px; fill: black;">Middle</text>',
            
            '<circle cx="300" cy="82" r="8" fill="#FF6600" stroke="#FF0000" stroke-width="3"/>',
            '<text x="315" y="86" style="font-family: Arial; font-size: 11px; fill: black;">End</text>',
            
            '<circle cx="370" cy="82" r="8" fill="#008080" stroke="crimson" stroke-width="2"/>',
            '<text x="385" y="86" style="font-family: Arial; font-size: 11px; fill: black;">Normal</text>',
            
            '<circle cx="450" cy="82" r="8" fill="#004040" stroke="#00CCCC" stroke-width="3" stroke-dasharray="4,2"/>',
            '<text x="465" y="86" style="font-family: Arial; font-size: 11px; fill: black;">Tied</text>',
            
            '<circle cx="520" cy="82" r="8" fill="#FF1493" stroke="#8B0000" stroke-width="4"/>',
            '<text x="535" y="86" style="font-family: Arial; font-size: 11px; fill: black;">Ornament</text>',
            
            '<circle cx="600" cy="82" r="5" fill="#FFD700" stroke="#FF8C00" stroke-width="2"/>',
            '<line x1="597" y1="79" x2="603" y2="85" stroke="#8B0000" stroke-width="2"/>',
            '<text x="615" y="86" style="font-family: Arial; font-size: 11px; fill: black;">Grace</text>',
        ]
        
        # Draw strings and notes
        y_start = 120
        x_start = 120
        note_spacing = 40
        
        # Calculate string spacing based on semitone intervals
        string_positions = {}
        base_y = y_start
        semitone_height = 8  # pixels per semitone
        
        # Calculate vertical position based on pitch (proportional to semitones)
        sorted_strings = sorted(self.used_strings)
        for i, string_num in enumerate(sorted_strings):
            if i == 0:
                string_positions[string_num] = base_y
            else:
                prev_string = sorted_strings[i-1]
                prev_note = self.default_tuning[prev_string]
                curr_note = self.default_tuning[string_num]
                
                # Calculate semitone difference
                prev_midi = self.note_to_midi_number(prev_note)
                curr_midi = self.note_to_midi_number(curr_note)
                semitone_diff = curr_midi - prev_midi
                
                # Position proportional to semitone difference
                string_positions[string_num] = string_positions[prev_string] + (semitone_diff * semitone_height)
        
        # Draw all string lines and labels first
        for string_num in sorted(self.used_strings):
            y_pos = string_positions[string_num]
            
            # String line
            svg.append(f'<line x1="{x_start}" y1="{y_pos}" x2="{svg_width-50}" y2="{y_pos}" class="string-line"/>')
            
            # String label
            svg.append(f'<text x="20" y="{y_pos+5}" class="string-label">String {string_num}: {self.default_tuning[string_num]}</text>')
        
        # Track which strings are currently ringing
        ringing_strings = {}  # {string_num: (start_x, start_y)}
        in_slur = False  # Track if we're in a slur
        slur_start_pos = None  # Position where slur started
        slur_notes = []  # Collect notes in current slur
        
        # Calculate total duration for proportional spacing
        total_duration = sum(note.get('duration', 1) for note in notes)
        available_width = svg_width - x_start - 100
        duration_unit = available_width / total_duration if total_duration > 0 else 40
        
        # Get max_y for lyrics positioning
        max_y = max(string_positions.values()) if string_positions else y_start + 200
        
        # Draw notes on strings with proportional spacing based on duration
        current_x = x_start
        
        # Process tied notes - only draw the first note, accumulate durations
        processed_notes = []
        i = 0
        while i < len(notes):
            note_data = notes[i]
            tie_type = note_data.get('tie')
            
            if tie_type == 'start':
                # This is the start of a tie - accumulate duration from tied notes
                accumulated_duration = note_data.get('duration', 1)
                accumulated_note = dict(note_data)  # Copy the note data
                
                # Look ahead for tied continuation notes
                j = i + 1
                while j < len(notes):
                    next_note = notes[j]
                    next_tie = next_note.get('tie')
                    
                    # Check if this is the same note tied to the previous
                    if (next_tie == 'stop' and 
                        next_note.get('note') == note_data.get('note')):
                        # Accumulate duration and skip this note
                        accumulated_duration += next_note.get('duration', 1)
                        j += 1
                        break
                    elif (next_tie in ['start', 'stop'] and 
                          next_note.get('note') == note_data.get('note')):
                        # Continue accumulating for multiple ties
                        accumulated_duration += next_note.get('duration', 1)
                        j += 1
                        if next_tie == 'stop':
                            break
                    else:
                        break
                
                # Update the accumulated note with total duration
                accumulated_note['duration'] = accumulated_duration
                accumulated_note['is_tied'] = True
                processed_notes.append(accumulated_note)
                i = j  # Skip to next unprocessed note
            elif tie_type == 'stop' and i > 0:
                # This is a tied continuation - check if previous note was already processed
                prev_note = notes[i-1] if i > 0 else None
                if prev_note and prev_note.get('tie') != 'start':
                    # Standalone tie stop - shouldn't happen in well-formed XML, but handle gracefully
                    processed_notes.append(note_data)
                i += 1
            else:
                # Regular note or isolated tie
                processed_notes.append(note_data)
                i += 1
        
        for j, note_data in enumerate(processed_notes):
            target_string, technique = self.find_best_string(note_data['note'])
            
            if target_string in self.used_strings:
                # Use the pre-calculated y position for this string
                y_pos = string_positions[target_string]
                
                # Handle grace notes with minimal spacing
                is_grace = note_data.get('is_grace', False)
                if is_grace:
                    # Grace note: moderate spacing (50% of its written duration)
                    duration = note_data.get('duration', 1)
                    grace_spacing = duration * duration_unit * 0.5
                    x_pos = current_x
                    note_width = grace_spacing
                else:
                    # Regular note: full spacing
                    duration = note_data.get('duration', 1)
                    x_pos = current_x
                    note_width = duration * duration_unit
                
                # Handle slurs
                slur_type = note_data.get('slur')
                if slur_type == 'start':
                    in_slur = True
                    slur_start_pos = (x_pos, y_pos)
                    slur_notes = [(x_pos, y_pos, target_string, note_data['note'])]
                elif in_slur:
                    slur_notes.append((x_pos, y_pos, target_string, note_data['note']))
                    if slur_type == 'stop':
                        in_slur = False
                
                # Determine note size and color (smaller for notes within slur except first)
                note_radius = 12
                note_fill_color = "#008080"  # Default teal
                note_stroke_color = "crimson"  # Default crimson
                
                # Color scheme for slurs to make them highly visible
                if slur_type == 'start':
                    # First note of slur: Bright blue border, yellow fill for high visibility
                    note_fill_color = "#FFD700"  # Gold/yellow fill
                    note_stroke_color = "#0066FF"  # Bright blue border
                    note_stroke_width = 4  # Thicker border
                elif in_slur and slur_type == 'stop':
                    # Last note of slur: Red border, orange fill
                    note_fill_color = "#FF6600"  # Orange fill
                    note_stroke_color = "#FF0000"  # Red border
                    note_stroke_width = 4  # Thicker border
                elif in_slur and slur_type != 'start':
                    # Middle notes in slur: Purple fill, magenta border
                    note_fill_color = "#9966FF"  # Purple fill
                    note_stroke_color = "#FF00FF"  # Magenta border
                    note_stroke_width = 3  # Medium border
                    # Make subsequent notes in slur progressively smaller
                    note_radius = max(6, 12 - len(slur_notes) * 2)
                else:
                    note_stroke_width = 2  # Default border width
                
                # Special styling for tied notes (override slur colors if needed)
                if note_data.get('is_tied'):
                    # Tied notes get a distinct appearance: darker fill with dashed border
                    note_fill_color = "#004040"  # Darker teal for tied notes
                    note_stroke_color = "#00CCCC"  # Bright cyan border
                    note_stroke_width = 3
                    # We'll add stroke-dasharray in the SVG
                
                # Special styling for ornamented notes (highest priority - overrides ties and slurs)
                ornaments = note_data.get('ornaments', [])
                has_ornaments = any(orn in ornaments for orn in ['trill', 'rung', 'gliss', 'mute'])
                if has_ornaments:
                    # Ornamented notes get bright, distinctive colors
                    note_fill_color = "#FF1493"  # Deep pink fill
                    note_stroke_color = "#8B0000"  # Dark red border
                    note_stroke_width = 4  # Extra thick border
                
                # Special styling for grace notes (highest priority - overrides everything)
                if is_grace:
                    # Grace notes are smaller and have distinctive colors
                    note_radius = 6  # 50% size
                    grace_slash = note_data.get('grace_slash', False)
                    if grace_slash:
                        # Acciaccatura: yellow with orange border
                        note_fill_color = "#FFD700"  # Gold/yellow
                        note_stroke_color = "#FF8C00"  # Orange border
                    else:
                        # Appoggiatura: light green with dark green border
                        note_fill_color = "#90EE90"  # Light green
                        note_stroke_color = "#228B22"  # Dark green border
                    note_stroke_width = 2
                
                # Check if this is a rest or muted note (would stop the ringing)
                is_muted = 'mute' in note_data.get('ornaments', [])
                
                # Draw resonance band or bending visualization
                if not is_muted:
                    whole_note_duration = 80  # Standard whole note duration in pixels
                    band_height = 8  # Height of the resonance band
                    
                    if in_slur and slur_start_pos and slur_type != 'start':
                        # Advanced technique: Draw curved bending path
                        start_x, start_y = slur_start_pos
                        # Calculate the bend amount based on pitch difference
                        start_midi = self.note_to_midi_number(slur_notes[0][3])
                        current_midi = self.note_to_midi_number(note_data['note'])
                        bend_amount = abs(current_midi - start_midi)
                        
                        # Draw curved path showing the bend
                        control_x = (start_x + x_pos) / 2
                        control_y = min(start_y, y_pos) - bend_amount * 3
                        
                        svg.append(f'<path d="M {start_x},{start_y} Q {control_x},{control_y} {x_pos},{y_pos}" '
                                  f'fill="none" stroke="url(#resonanceBand)" stroke-width="{band_height}" '
                                  f'opacity="0.7"/>')
                        
                        # Add bend indicator text
                        if bend_amount > 0:
                            svg.append(f'<text x="{control_x}" y="{control_y-5}" text-anchor="middle" '
                                      f'style="font-size: 10px; fill: #FF6B35;">↗{bend_amount}st</text>')
                    else:
                        # Normal resonance band
                        svg.append(f'<rect x="{x_pos}" y="{y_pos - band_height/2}" '
                                  f'width="{whole_note_duration}" height="{band_height}" '
                                  f'class="resonance-band" rx="2"/>')
                
                # Update ringing string position
                ringing_strings[target_string] = (x_pos, y_pos)
                
                # Draw note circle (different size based on slur position)
                if is_muted:
                    svg.append(f'<circle cx="{x_pos}" cy="{y_pos}" r="15" class="muted-note"/>')
                    # Add large X for muted note
                    svg.append(f'<text x="{x_pos}" y="{y_pos-20}" text-anchor="middle" '
                              f'style="font-size:30px; font-weight:bold; fill:red;">✕</text>')
                    svg.append(f'<text x="{x_pos}" y="{y_pos-35}" text-anchor="middle" '
                              f'style="font-size:12px; fill:red;">MUTE</text>')
                    # Clear this string from ringing strings
                    if target_string in ringing_strings:
                        del ringing_strings[target_string]
                else:
                    # Draw note circle with appropriate size and dynamic colors for slurs/ties
                    if note_data.get('is_tied'):
                        # Tied notes get dashed border
                        svg.append(f'<circle cx="{x_pos}" cy="{y_pos}" r="{note_radius}" '
                                  f'fill="{note_fill_color}" stroke="{note_stroke_color}" '
                                  f'stroke-width="{note_stroke_width}" stroke-dasharray="4,2"/>')
                    else:
                        # Regular notes
                        svg.append(f'<circle cx="{x_pos}" cy="{y_pos}" r="{note_radius}" '
                                  f'fill="{note_fill_color}" stroke="{note_stroke_color}" '
                                  f'stroke-width="{note_stroke_width}"/>')
                    
                    # Add visual indicator for slurred notes (beginner option)
                    if in_slur and slur_type != 'start':
                        # Add a small "ghost" indicator showing this can be plucked or bent
                        svg.append(f'<text x="{x_pos+15}" y="{y_pos-5}" style="font-size: 10px; fill: #999;">'
                                  f'(bend or pluck)</text>')
                
                # Add string number inside circle
                svg.append(f'<text x="{x_pos}" y="{y_pos+4}" text-anchor="middle" class="string-number">{target_string}</text>')
                
                # Add slash for acciaccaturas
                if is_grace and note_data.get('grace_slash', False):
                    # Draw diagonal slash through the grace note
                    slash_offset = note_radius * 0.7  # Adjust slash length based on note size
                    svg.append(f'<line x1="{x_pos-slash_offset}" y1="{y_pos+slash_offset}" '
                              f'x2="{x_pos+slash_offset}" y2="{y_pos-slash_offset}" '
                              f'stroke="#8B0000" stroke-width="2"/>')
                
                # Show duration as the actual space to next note
                # Draw a horizontal line showing the duration visually
                svg.append(f'<line x1="{x_pos+15}" y1="{y_pos}" x2="{x_pos+note_width-5}" y2="{y_pos}" '
                          f'stroke="#FF6B35" stroke-width="3" opacity="0.5" stroke-dasharray="2,2"/>')
                # Duration annotation removed per user request
                
                # Add lyrics underneath the note (if present)
                if note_data.get('lyric'):
                    lyric_y = max_y + 60
                    svg.append(f'<text x="{x_pos}" y="{lyric_y}" text-anchor="middle" style="font-family: Arial; font-size: 12px; fill: #333;">{note_data["lyric"]}</text>')
                
                # Draw bend line if needed
                if "bend" in technique:
                    bend_amount = int(technique.split('+')[1])
                    bend_height = bend_amount * 15
                    svg.append(f'<line x1="{x_pos}" y1="{y_pos-12}" x2="{x_pos}" y2="{y_pos-12-bend_height}" class="bend-line"/>')
                    svg.append(f'<text x="{x_pos+15}" y="{y_pos-20}" style="font-size:12px; fill:red;">+{bend_amount}</text>')
                
                # Add ornament symbols
                if 'rung' in note_data['ornaments']:
                    svg.append(f'<text x="{x_pos+15}" y="{y_pos+5}" style="font-size:16px; fill:orange;">~</text>')
                if 'trill' in note_data['ornaments']:
                    svg.append(f'<text x="{x_pos+15}" y="{y_pos-10}" style="font-size:12px; fill:purple;">tr</text>')
                if 'gliss' in note_data['ornaments']:
                    svg.append(f'<text x="{x_pos+15}" y="{y_pos}" style="font-size:16px; fill:blue;">/</text>')
                if 'mute' in note_data['ornaments']:
                    svg.append(f'<text x="{x_pos-8}" y="{y_pos-15}" style="font-size:14px; fill:#666;">✕</text>')
                
                # Move to next position based on duration
                current_x += note_width
        
        # Add position markers at bottom (below lyrics)
        y_bottom = max_y + 100
        svg.append(f'<text x="20" y="{y_bottom}" style="font-family: Arial; font-size: 12px; fill: #666;">Position:</text>')
        for i in range(0, len(notes), 10):
            x_pos = x_start + i * note_spacing
            svg.append(f'<text x="{x_pos}" y="{y_bottom}" text-anchor="middle" style="font-family: Arial; font-size: 10px; fill: #666;">{i+1}</text>')
        
        svg.append('</svg>')
        return '\n'.join(svg)

def main():
    parser = argparse.ArgumentParser(description='Convert MusicXML to Đan Tranh tablature')
    parser.add_argument('input_file', help='Input MusicXML file')
    parser.add_argument('-o', '--output', help='Output file (default: input_name.txt)')
    parser.add_argument('--svg', action='store_true', help='Generate SVG output')
    
    args = parser.parse_args()
    
    converter = DanTranhConverter()
    
    # Parse input file
    print(f"Parsing {args.input_file}...")
    notes = converter.parse_musicxml(args.input_file)
    
    if not notes:
        print("No notes found in the MusicXML file")
        return
    
    print(f"Found {len(notes)} notes")
    
    # Generate output
    if args.svg:
        output_content = converter.convert_to_svg(notes)
        output_ext = '.svg'
        output_dir = 'SVG_Output'
    else:
        output_content = converter.generate_tablature(notes)
        output_ext = '.txt'
        output_dir = 'Text_Output'
    
    # Create output directory if it doesn't exist
    import os
    os.makedirs(output_dir, exist_ok=True)
    
    # Determine output filename
    if args.output:
        output_file = os.path.join(output_dir, args.output)
    else:
        input_basename = os.path.basename(args.input_file).rsplit('.', 1)[0]
        output_file = os.path.join(output_dir, input_basename + '_dantranh' + output_ext)
    
    # Write output
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(output_content)
    
    print(f"Tablature saved to {output_file}")

if __name__ == '__main__':
    main()