#!/usr/bin/env python3
"""
Debug Tie Conversion Visualizer
Shows exactly what the slur-to-tie conversion is doing
"""

from musicxml_to_dantranh import DanTranhConverter
from custom_pattern_detector import CustomPatternDetector
from typing import List, Dict

class DebugTieVisualizer:
    def __init__(self, musicxml_file: str):
        self.musicxml_file = musicxml_file
        self.converter = DanTranhConverter()
        self.detector = CustomPatternDetector(musicxml_file)
        
    def create_debug_visualization(self):
        """Create debug visualization showing tie conversion process"""
        
        print("=== DEBUG TIE CONVERSION VISUALIZATION ===\n")
        
        # Get original notes
        original_notes = self.converter.parse_musicxml(self.musicxml_file)
        print(f"ORIGINAL NOTES: {len(original_notes)} total")
        
        # Apply conversion
        converted_notes = self.detector.convert_slurs_to_ties(original_notes)
        print(f"CONVERTED NOTES: {len(converted_notes)} total")
        print(f"REDUCTION: {len(original_notes) - len(converted_notes)} notes combined\n")
        
        # Show detailed comparison
        self.show_detailed_comparison(original_notes, converted_notes)
        
        # Show specific problem areas
        self.show_problem_areas(original_notes, converted_notes)
        
    def show_detailed_comparison(self, original: List[Dict], converted: List[Dict]):
        """Show side-by-side comparison of original vs converted notes"""
        print("=== DETAILED COMPARISON ===")
        print("Format: [Index] Note Lyric (Duration) [Slur/Tie info]\n")
        
        print("BEFORE CONVERSION:")
        for i, note in enumerate(original[:50]):  # First 50 notes
            slur_info = f"slur={note.get('slur', 'None')}" if note.get('slur') else ""
            tie_info = f"tie={note.get('tie', 'None')}" if note.get('tie') else ""
            grace_info = "(grace)" if note.get('is_grace') else ""
            
            info = " ".join([x for x in [slur_info, tie_info, grace_info] if x])
            print(f"[{i:2d}] {note['note']} '{note.get('lyric', '')}' ({note.get('duration', 1)}) {info}")
        
        print(f"\n... (showing first 50 of {len(original)} notes)")
        
        print("\nAFTER CONVERSION:")
        for i, note in enumerate(converted[:50]):  # First 50 notes  
            combined_info = "(COMBINED)" if note.get('combined_from_tie') else ""
            grace_info = "(grace)" if note.get('is_grace') else ""
            
            info = " ".join([x for x in [combined_info, grace_info] if x])
            print(f"[{i:2d}] {note['note']} '{note.get('lyric', '')}' ({note.get('duration', 1)}) {info}")
            
        print(f"\n... (showing first 50 of {len(converted)} notes)")
        
    def show_problem_areas(self, original: List[Dict], converted: List[Dict]):
        """Show specific areas mentioned as problems"""
        print("\n=== PROBLEM AREA ANALYSIS ===")
        
        problem_lyrics = ['nối', 'chẳng', 'đi', 'đâu', 'bà', 'cõng', 'lúc', 'co', 'làm']
        
        print("BEFORE CONVERSION - Problem areas:")
        for i, note in enumerate(original):
            lyric = note.get('lyric', '')
            if lyric in problem_lyrics:
                # Show this note and 2 neighbors
                print(f"\nFOUND '{lyric}' at position {i}:")
                for offset in [-1, 0, 1]:
                    if 0 <= i + offset < len(original):
                        n = original[i + offset]
                        marker = " >>> " if offset == 0 else "     "
                        slur_info = f"slur={n.get('slur', 'None')}" if n.get('slur') else ""
                        print(f"{marker}[{i + offset:2d}] {n['note']} '{n.get('lyric', '')}' ({n.get('duration', 1)}) {slur_info}")
        
        print("\nAFTER CONVERSION - Same lyrics:")
        converted_positions = {}
        for i, note in enumerate(converted):
            lyric = note.get('lyric', '')
            if lyric:
                converted_positions[lyric] = i
                
        for lyric in problem_lyrics:
            if lyric in converted_positions:
                i = converted_positions[lyric]
                note = converted[i]
                combined_info = " (COMBINED)" if note.get('combined_from_tie') else ""
                print(f"'{lyric}' at pos {i}: {note['note']} dur={note.get('duration', 1)}{combined_info}")
            else:
                print(f"'{lyric}' - NOT FOUND (was combined away)")
                
        # Check for empty lyric notes (these might be the combined targets)
        print(f"\nEMPTY LYRIC NOTES after conversion (potential combination targets):")
        empty_count = 0
        for i, note in enumerate(converted):
            if not note.get('lyric', '') and not note.get('is_grace', False):
                empty_count += 1
                if empty_count <= 10:  # Show first 10
                    print(f"[{i:2d}] {note['note']} '' ({note.get('duration', 1)})")
        print(f"... total empty lyric non-grace notes: {empty_count}")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Debug tie conversion process')
    parser.add_argument('input_file', help='Input MusicXML file')
    
    args = parser.parse_args()
    
    debugger = DebugTieVisualizer(args.input_file)
    debugger.create_debug_visualization()

if __name__ == '__main__':
    main()