#!/usr/bin/env python3
"""
Debug SVG Visualizer - Creates an SVG with debug markers showing tied notes
Shows visual indicators for notes that were combined through slur-to-tie conversion
"""

from musicxml_to_dantranh import DanTranhConverter
from custom_pattern_detector import CustomPatternDetector
from combined_visualizer import CombinedVisualizer
from typing import List, Dict
import xml.etree.ElementTree as ET

class DebugSVGVisualizer(CombinedVisualizer):
    def __init__(self, musicxml_file: str):
        super().__init__(musicxml_file)
        self.debug_info = {}
        # Ensure we have the detector
        if not hasattr(self, 'detector'):
            self.detector = CustomPatternDetector(musicxml_file)
        
    def create_debug_visualization(self) -> str:
        """Create debug SVG with visual markers for combined notes"""
        
        # Get conversion information
        original_notes = self.converter.parse_musicxml(self.musicxml_file)
        converted_notes = self.detector.convert_slurs_to_ties(original_notes)
        
        # Track which notes were combined
        self.debug_info = self.analyze_combinations(original_notes, converted_notes)
        
        # Create the regular combined visualization 
        svg_content = super().create_combined_visualization()
        
        # Add debug markers to the SVG
        debug_svg = self.add_debug_markers(svg_content)
        
        return debug_svg
    
    def analyze_combinations(self, original: List[Dict], converted: List[Dict]) -> Dict:
        """Analyze which notes were combined and create debug info"""
        debug_info = {
            'combined_notes': [],
            'tie_sources': [],  # Notes that were the source of a tie combination
            'reduction_count': len(original) - len(converted)
        }
        
        # Find notes marked as combined
        for i, note in enumerate(converted):
            if note.get('combined_from_tie'):
                debug_info['combined_notes'].append({
                    'position': i,
                    'note': note['note'],
                    'lyric': note.get('lyric', ''),
                    'duration': note.get('duration', 1),
                    'original_duration': note.get('original_duration', 1)  # If we had this
                })
                
        # Find specific problem notes that were mentioned
        problem_lyrics = ['nối', 'chẳng', 'đi', 'đâu', 'bà', 'cõng', 'lúc', 'co', 'làm']
        for i, note in enumerate(converted):
            lyric = note.get('lyric', '')
            if lyric in problem_lyrics and note.get('combined_from_tie'):
                debug_info['tie_sources'].append({
                    'position': i,
                    'lyric': lyric,
                    'note': note['note'],
                    'duration': note.get('duration', 1)
                })
        
        return debug_info
    
    def add_debug_markers(self, svg_content: str) -> str:
        """Add debug visual markers to the SVG"""
        
        # Add debug info to the top of the SVG
        debug_header = f"""
        <!-- DEBUG INFO -->
        <!-- Total notes combined: {self.debug_info['reduction_count']} -->
        <!-- Combined notes found: {len(self.debug_info['combined_notes'])} -->
        <!-- Key tie sources: {len(self.debug_info['tie_sources'])} -->
        
        """
        
        # Insert debug header after SVG opening tag
        svg_lines = svg_content.split('\n')
        svg_start_idx = -1
        for i, line in enumerate(svg_lines):
            if line.strip().startswith('<svg'):
                svg_start_idx = i
                break
        
        if svg_start_idx >= 0:
            svg_lines.insert(svg_start_idx + 1, debug_header)
        
        # Add debug legend
        legend_y = 50
        legend_items = [
            f"<text x='20' y='{legend_y}' style='font-family: Arial; font-size: 16px; font-weight: bold; fill: #333;'>DEBUG MARKERS</text>",
            f"<text x='20' y='{legend_y + 25}' style='font-family: Arial; font-size: 12px; fill: #333;'>🔗 = Combined tie note ({len(self.debug_info['combined_notes'])} total)</text>",
            f"<text x='20' y='{legend_y + 40}' style='font-family: Arial; font-size: 12px; fill: #333;'>⭐ = Key problem note fixed ({len(self.debug_info['tie_sources'])} total)</text>",
            f"<text x='20' y='{legend_y + 55}' style='font-family: Arial; font-size: 12px; fill: #333;'>📊 = Total reduction: {len(self.converter.parse_musicxml(self.musicxml_file))} → {len(self.detector.convert_slurs_to_ties(self.converter.parse_musicxml(self.musicxml_file)))} notes</text>",
            f"<rect x='15' y='{legend_y - 10}' width='500' height='80' fill='none' stroke='#ccc' stroke-width='1'/>",
        ]
        
        # Find where to insert the legend (after the first group or before the first note)
        insert_idx = -1
        for i, line in enumerate(svg_lines):
            if '<g' in line or '<circle' in line or '<rect' in line:
                insert_idx = i
                break
        
        if insert_idx >= 0:
            for item in reversed(legend_items):  # Insert in reverse order
                svg_lines.insert(insert_idx, item)
        
        # Add debug markers for combined notes
        # We need to parse the SVG to find note positions and add markers
        debug_markers = []
        
        # Add markers for combined notes (this is a simplified approach)
        # In a real implementation, we'd need to track the exact SVG coordinates
        for i, note_info in enumerate(self.debug_info['combined_notes']):
            marker_y = 200 + (i * 30)  # Simplified positioning
            marker_text = f"🔗 Pos {note_info['position']}: {note_info['note']} '{note_info['lyric']}' (dur={note_info['duration']})"
            debug_markers.append(f"<text x='20' y='{marker_y}' style='font-family: Arial; font-size: 10px; fill: #666;'>{marker_text}</text>")
        
        # Add markers for key tie sources
        for i, tie_info in enumerate(self.debug_info['tie_sources']):
            marker_y = 300 + len(self.debug_info['combined_notes']) * 30 + (i * 25)
            marker_text = f"⭐ Key Fix: '{tie_info['lyric']}' → {tie_info['note']} (dur={tie_info['duration']})"
            debug_markers.append(f"<text x='20' y='{marker_y}' style='font-family: Arial; font-size: 11px; fill: #d63031; font-weight: bold;'>{marker_text}</text>")
        
        # Insert debug markers
        if insert_idx >= 0:
            for marker in reversed(debug_markers):
                svg_lines.insert(insert_idx + len(legend_items) + 5, marker)
        
        # Add version stamp
        version_stamp = f"<text x='20' y='{legend_y + 100 + len(self.debug_info['combined_notes']) * 30 + len(self.debug_info['tie_sources']) * 25}' style='font-family: Arial; font-size: 10px; fill: #999;'>DEBUG VERSION - Generated with fixed slur-to-tie conversion</text>"
        svg_lines.insert(-2, version_stamp)  # Before closing SVG tag
        
        return '\n'.join(svg_lines)
    
    def create_v0_1_0_tablature(self, notes: List[Dict], y_start: int) -> str:
        """Override to add debug markers to individual notes"""
        base_svg = super().create_v0_1_0_tablature(notes, y_start)
        
        # Add debug markers to notes in the tablature
        # This is a simplified version - in practice we'd need to track exact coordinates
        debug_overlay = self.create_note_debug_overlay(notes, y_start)
        
        # Insert debug overlay before closing the base SVG section
        if debug_overlay:
            base_svg = base_svg.replace('</g>', debug_overlay + '</g>')
        
        return base_svg
    
    def create_note_debug_overlay(self, notes: List[Dict], y_start: int) -> str:
        """Create debug overlays for individual notes"""
        overlay_elements = []
        
        current_x = 50
        for note in notes:
            # Skip grace notes for main debug markers
            if note.get('is_grace'):
                continue
                
            # Add debug marker for combined notes
            if note.get('combined_from_tie'):
                # Add a small debug indicator above the note
                overlay_elements.append(f'<circle cx="{current_x}" cy="{y_start - 15}" r="3" fill="#e74c3c" opacity="0.8"/>')
                overlay_elements.append(f'<text x="{current_x - 5}" y="{y_start - 10}" style="font-family: Arial; font-size: 8px; fill: #e74c3c;">🔗</text>')
                
                # Highlight key problem notes
                lyric = note.get('lyric', '')
                if lyric in ['nối', 'chẳng']:
                    overlay_elements.append(f'<circle cx="{current_x}" cy="{y_start - 25}" r="4" fill="#f39c12" opacity="0.9"/>')
                    overlay_elements.append(f'<text x="{current_x - 6}" y="{y_start - 20}" style="font-family: Arial; font-size: 10px; fill: #f39c12;">⭐</text>')
            
            # Calculate next position (simplified)
            note_width = max(10, note.get('duration', 1) * 20)  # 20 pixels per duration unit
            current_x += note_width
        
        return '\n'.join(overlay_elements)

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Create debug SVG visualization')
    parser.add_argument('input_file', help='Input MusicXML file')
    parser.add_argument('-o', '--output', help='Output SVG file', 
                       default='SVG_Output/debug_combined_view.svg')
    
    args = parser.parse_args()
    
    print(f"🔍 Creating debug visualization for: {args.input_file}")
    
    debugger = DebugSVGVisualizer(args.input_file)
    debug_svg = debugger.create_debug_visualization()
    
    # Write the debug SVG
    with open(args.output, 'w', encoding='utf-8') as f:
        f.write(debug_svg)
    
    print(f"✅ Debug visualization saved to {args.output}")
    print(f"📊 Notes combined: {debugger.debug_info['reduction_count']}")
    print(f"🔗 Combined notes: {len(debugger.debug_info['combined_notes'])}")
    print(f"⭐ Key fixes: {len(debugger.debug_info['tie_sources'])}")

if __name__ == '__main__':
    main()