#!/usr/bin/env python3
"""
Melodic Pattern Detection for Đan Tranh Tablature
Finds repeated musical phrases and motifs with structural variations
"""

import xml.etree.ElementTree as ET
from typing import List, Dict, Tuple, Optional
import re
from collections import defaultdict

class PatternDetector:
    def __init__(self, musicxml_file: str):
        self.musicxml_file = musicxml_file
        self.notes = []
        self.skeleton_notes = []
        
    def parse_musicxml(self) -> List[Dict]:
        """Parse MusicXML and extract notes (reusing existing logic)"""
        try:
            tree = ET.parse(self.musicxml_file)
            root = tree.getroot()
        except Exception as e:
            print(f"Error parsing MusicXML: {e}")
            return []
        
        notes = []
        note_position = 0
        
        # Handle both score-partwise and score-timewise
        if root.tag == 'score-partwise':
            for part in root.findall('.//part'):
                for measure_num, measure in enumerate(part.findall('measure'), 1):
                    for note in measure.findall('note'):
                        note_data = self.parse_note_element(note, measure_num, note_position)
                        if note_data:
                            notes.append(note_data)
                            note_position += 1
        
        self.notes = notes
        return notes
    
    def parse_note_element(self, note_elem, measure_num: int, position: int) -> Optional[Dict]:
        """Parse individual note element with position tracking"""
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
                duration_map = {
                    'whole': 4, 'half': 2, 'quarter': 1, 
                    'eighth': 0.5, '16th': 0.25, '32nd': 0.125
                }
                duration = duration_map.get(note_type, 0.25)
            else:
                duration = 0.25
        else:
            duration = int(duration_elem.text) if duration_elem is not None else 1
        
        return {
            'note': note_name,
            'duration': duration,
            'is_grace': is_grace,
            'grace_slash': grace_slash,
            'measure': measure_num,
            'position': position,
            'midi': self.note_to_midi_number(note_name)
        }
    
    def note_to_midi_number(self, note: str) -> float:
        """Convert note string to MIDI number"""
        # Parse note with optional cents adjustment
        cents_match = re.match(r'([A-G][#b]?\d+)([\+\-]\d+)?', note)
        if cents_match:
            base_note = cents_match.group(1)
            cents_str = cents_match.group(2)
            cents = float(cents_str) / 100 if cents_str else 0
        else:
            base_note = note
            cents = 0
        
        # Extract note components
        note_match = re.match(r'([A-G])([#b]*)(\d+)', base_note)
        if not note_match:
            return 60  # Default to middle C
        
        note_name, accidental, octave = note_match.groups()
        
        # Convert to MIDI number
        note_values = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
        midi_note = note_values[note_name]
        
        # Add accidentals
        midi_note += accidental.count('#') - accidental.count('b')
        
        # Add octave (middle C = C4 = MIDI 60)
        midi_note += (int(octave) - 4) * 12 + 60
        
        return midi_note + cents
    
    def extract_skeleton_melody(self) -> List[Dict]:
        """Extract main notes only (remove grace notes and ornaments)"""
        skeleton = []
        for note in self.notes:
            if not note.get('is_grace', False):
                # Main note - keep for pattern analysis
                skeleton.append({
                    'note': note['note'],
                    'midi': note['midi'],
                    'position': note['position'],
                    'measure': note['measure'],
                    'original_index': self.notes.index(note)
                })
        
        self.skeleton_notes = skeleton
        return skeleton
    
    def find_exact_patterns(self, min_length: int = 3, max_length: int = 8) -> List[Dict]:
        """Find exact repeated patterns in the skeleton melody"""
        patterns = []
        skeleton = self.skeleton_notes
        
        # Try different pattern lengths
        for length in range(min_length, min(max_length + 1, len(skeleton))):
            if length <= 10 or length % 2 == 0:  # Show all up to 10, then only even lengths
                print(f"Searching for patterns of length {length}...")
            
            # Extract all possible subsequences of this length
            for start_pos in range(len(skeleton) - length + 1):
                pattern = skeleton[start_pos:start_pos + length]
                pattern_pitches = [n['midi'] for n in pattern]
                
                # Look for exact matches elsewhere in the piece
                matches = []
                for compare_pos in range(start_pos + 1, len(skeleton) - length + 1):
                    compare_pattern = skeleton[compare_pos:compare_pos + length]
                    compare_pitches = [n['midi'] for n in compare_pattern]
                    
                    if pattern_pitches == compare_pitches:
                        matches.append({
                            'start_position': compare_pos,
                            'end_position': compare_pos + length - 1,
                            'start_measure': compare_pattern[0]['measure'],
                            'end_measure': compare_pattern[-1]['measure'],
                            'notes': compare_pattern
                        })
                
                # If we found matches, record this pattern
                if matches:
                    pattern_info = {
                        'length': length,
                        'pattern_pitches': pattern_pitches,
                        'pattern_notes': [n['note'] for n in pattern],
                        'original_occurrence': {
                            'start_position': start_pos,
                            'end_position': start_pos + length - 1,
                            'start_measure': pattern[0]['measure'],
                            'end_measure': pattern[-1]['measure'],
                            'notes': pattern
                        },
                        'matches': matches,
                        'total_occurrences': len(matches) + 1
                    }
                    patterns.append(pattern_info)
        
        # Remove overlapping patterns (keep ones with best score)
        unique_patterns = self.remove_overlapping_patterns(patterns)
        
        # Sort by a score that heavily prioritizes repetitions
        # Score = repetitions^2 * length (exponentially favor more repetitions)
        unique_patterns.sort(key=lambda x: (x['total_occurrences'] ** 2 * x['length']), reverse=True)
        
        return unique_patterns
    
    def remove_overlapping_patterns(self, patterns: List[Dict]) -> List[Dict]:
        """Remove patterns that overlap, keeping ones with better score"""
        # Sort by score (repetitions^2 * length) - heavily favor more repetitions
        sorted_patterns = sorted(patterns, 
                               key=lambda x: (x['total_occurrences'] ** 2 * x['length']), 
                               reverse=True)
        
        unique_patterns = []
        used_positions = set()
        
        for pattern in sorted_patterns:
            # Check if this pattern overlaps with already selected patterns
            pattern_positions = set(range(
                pattern['original_occurrence']['start_position'],
                pattern['original_occurrence']['end_position'] + 1
            ))
            
            # Also check match positions
            all_positions = pattern_positions.copy()
            for match in pattern['matches']:
                match_positions = set(range(match['start_position'], match['end_position'] + 1))
                all_positions.update(match_positions)
            
            # If no significant overlap, keep this pattern
            if len(all_positions.intersection(used_positions)) < pattern['length'] * 0.5:
                unique_patterns.append(pattern)
                used_positions.update(all_positions)
        
        return unique_patterns
    
    def print_pattern_analysis(self, patterns: List[Dict]):
        """Print detailed pattern analysis"""
        print(f"\n🎵 EXACT PATTERN ANALYSIS")
        print(f"Total skeleton notes: {len(self.skeleton_notes)}")
        print(f"Patterns found: {len(patterns)}")
        print("=" * 80)
        
        for i, pattern in enumerate(patterns, 1):
            print(f"\n📍 Pattern #{i} - Length: {pattern['length']} notes")
            print(f"   Occurrences: {pattern['total_occurrences']} times")
            print(f"   Notes: {' -> '.join(pattern['pattern_notes'])}")
            
            # Original occurrence
            orig = pattern['original_occurrence']
            print(f"   📌 Original: Measures {orig['start_measure']}-{orig['end_measure']} "
                  f"(positions {orig['start_position']}-{orig['end_position']})")
            
            # Matches
            for j, match in enumerate(pattern['matches'], 1):
                print(f"   🔄 Match {j}: Measures {match['start_measure']}-{match['end_measure']} "
                      f"(positions {match['start_position']}-{match['end_position']})")
        
        print(f"\n" + "=" * 80)

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Detect melodic patterns in MusicXML')
    parser.add_argument('input_file', help='Input MusicXML file')
    parser.add_argument('--min-length', type=int, default=3, help='Minimum pattern length')
    parser.add_argument('--max-length', type=int, default=8, help='Maximum pattern length')
    
    args = parser.parse_args()
    
    # Create detector and analyze
    detector = PatternDetector(args.input_file)
    
    print(f"🎵 Analyzing: {args.input_file}")
    
    # Parse MusicXML
    notes = detector.parse_musicxml()
    print(f"📝 Total notes parsed: {len(notes)}")
    
    # Extract skeleton melody
    skeleton = detector.extract_skeleton_melody()
    print(f"🎼 Skeleton notes (no grace notes): {len(skeleton)}")
    
    # Find exact patterns
    patterns = detector.find_exact_patterns(args.min_length, args.max_length)
    
    # Print analysis
    detector.print_pattern_analysis(patterns)

if __name__ == '__main__':
    main()