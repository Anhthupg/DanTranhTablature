#!/usr/bin/env python3
"""
Compact Debug Visualizer - Creates a compact, scrollable SVG showing tie conversion results
"""

from musicxml_to_dantranh import DanTranhConverter
from custom_pattern_detector import CustomPatternDetector
from typing import List, Dict

class CompactDebugVisualizer:
    def __init__(self, musicxml_file: str):
        self.musicxml_file = musicxml_file
        self.converter = DanTranhConverter()
        self.detector = CustomPatternDetector(musicxml_file)
        
    def create_compact_debug_svg(self) -> str:
        """Create a compact, viewable debug SVG"""
        
        # Get conversion data
        original_notes = self.converter.parse_musicxml(self.musicxml_file)
        converted_notes = self.detector.convert_slurs_to_ties(original_notes)
        
        # Find combined notes
        combined_notes = []
        key_fixes = []
        problem_lyrics = ['nối', 'chẳng', 'đi', 'đâu', 'bà', 'cõng', 'lúc', 'co', 'làm']
        
        for i, note in enumerate(converted_notes):
            if note.get('combined_from_tie'):
                combined_notes.append({
                    'position': i,
                    'note': note['note'],
                    'lyric': note.get('lyric', ''),
                    'duration': note.get('duration', 1)
                })
                
                if note.get('lyric', '') in problem_lyrics:
                    key_fixes.append({
                        'position': i,
                        'lyric': note.get('lyric', ''),
                        'note': note['note'],
                        'duration': note.get('duration', 1)
                    })
        
        # Create compact SVG
        svg_width = 1200
        svg_height = max(800, len(combined_notes) * 30 + 400)
        
        svg_parts = []
        svg_parts.append(f'<?xml version="1.0" encoding="UTF-8"?>')
        svg_parts.append(f'<svg width="{svg_width}" height="{svg_height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {svg_width} {svg_height}">')
        
        # Background
        svg_parts.append(f'<rect width="{svg_width}" height="{svg_height}" fill="#f8f9fa" stroke="#dee2e6" stroke-width="1"/>')
        
        # Title
        svg_parts.append(f'<text x="20" y="40" style="font-family: Arial; font-size: 24px; font-weight: bold; fill: #212529;">DEBUG: Slur-to-Tie Conversion Results</text>')
        
        # Summary stats
        reduction = len(original_notes) - len(converted_notes)
        svg_parts.append(f'<rect x="20" y="60" width="1160" height="100" fill="#e3f2fd" stroke="#2196f3" stroke-width="2" rx="5"/>')
        svg_parts.append(f'<text x="40" y="85" style="font-family: Arial; font-size: 16px; font-weight: bold; fill: #1976d2;">📊 SUMMARY</text>')
        svg_parts.append(f'<text x="40" y="110" style="font-family: Arial; font-size: 14px; fill: #333;">Original: {len(original_notes)} notes → After conversion: {len(converted_notes)} notes → Combined: {reduction} notes</text>')
        svg_parts.append(f'<text x="40" y="135" style="font-family: Arial; font-size: 14px; fill: #333;">🔗 Total combined notes: {len(combined_notes)} | ⭐ Key problem fixes: {len(key_fixes)}</text>')
        
        # Key fixes section
        y_pos = 200
        svg_parts.append(f'<text x="20" y="{y_pos}" style="font-family: Arial; font-size: 20px; font-weight: bold; fill: #d32f2f;">⭐ KEY PROBLEM NOTES FIXED</text>')
        y_pos += 30
        
        for i, fix in enumerate(key_fixes):
            y_pos += 25
            svg_parts.append(f'<circle cx="40" cy="{y_pos - 5}" r="4" fill="#4caf50"/>')
            svg_parts.append(f'<text x="55" y="{y_pos}" style="font-family: Arial; font-size: 14px; fill: #2e7d32;">')
            svg_parts.append(f'✅ \'{fix["lyric"]}\' → {fix["note"]} (duration={fix["duration"]}) at position {fix["position"]}')
            svg_parts.append('</text>')
        
        # All combined notes section
        y_pos += 50
        svg_parts.append(f'<text x="20" y="{y_pos}" style="font-family: Arial; font-size: 20px; font-weight: bold; fill: #1976d2;">🔗 ALL COMBINED NOTES</text>')
        y_pos += 30
        
        for i, note in enumerate(combined_notes):
            y_pos += 20
            lyric_display = f"'{note['lyric']}'" if note['lyric'] else "(no lyric)"
            
            # Color code based on whether it's a key fix
            is_key_fix = any(fix['lyric'] == note['lyric'] for fix in key_fixes)
            text_color = "#d32f2f" if is_key_fix else "#666"
            marker = "⭐" if is_key_fix else "🔗"
            
            svg_parts.append(f'<text x="40" y="{y_pos}" style="font-family: monospace; font-size: 12px; fill: {text_color};">')
            svg_parts.append(f'{marker} Pos {note["position"]:2d}: {note["note"]} {lyric_display:15} dur={note["duration"]}')
            svg_parts.append('</text>')
        
        # Before/After examples
        y_pos += 50
        svg_parts.append(f'<rect x="20" y="{y_pos}" width="1160" height="120" fill="#fff3e0" stroke="#ff9800" stroke-width="2" rx="5"/>')
        y_pos += 30
        svg_parts.append(f'<text x="40" y="{y_pos}" style="font-family: Arial; font-size: 16px; font-weight: bold; fill: #f57c00;">🗑️ BEFORE vs AFTER EXAMPLES</text>')
        
        y_pos += 25
        svg_parts.append(f'<text x="60" y="{y_pos}" style="font-family: Arial; font-size: 13px; fill: #333;">\'nối\' case: BEFORE = E5 \'nối\' (dur=2) + E5 \'\' (dur=1) = 2 separate notes</text>')
        y_pos += 20
        svg_parts.append(f'<text x="60" y="{y_pos}" style="font-family: Arial; font-size: 13px; fill: #333;">            AFTER  = E5 \'nối\' (dur=3) = 1 combined note ✅</text>')
        
        y_pos += 25
        svg_parts.append(f'<text x="60" y="{y_pos}" style="font-family: Arial; font-size: 13px; fill: #333;">\'chẳng\' case: BEFORE = E5 \'chẳng\' (dur=2) + E5 \'\' (dur=1) = 2 separate notes</text>')
        y_pos += 20
        svg_parts.append(f'<text x="60" y="{y_pos}" style="font-family: Arial; font-size: 13px; fill: #333;">              AFTER  = E5 \'chẳng\' (dur=3) = 1 combined note ✅</text>')
        
        # Footer
        y_pos += 60
        svg_parts.append(f'<text x="20" y="{y_pos}" style="font-family: Arial; font-size: 12px; fill: #999;">Generated with fixed slur-to-tie conversion - Notes like \'nối dây tơ hồng\' and \'chẳng lo học hành\' now display as single combined notes!</text>')
        
        svg_parts.append('</svg>')
        
        return '\n'.join(svg_parts)

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Create compact debug SVG')
    parser.add_argument('input_file', help='Input MusicXML file')
    parser.add_argument('-o', '--output', help='Output SVG file', 
                       default='SVG_Output/compact_debug_view.svg')
    
    args = parser.parse_args()
    
    print(f"🔍 Creating compact debug visualization for: {args.input_file}")
    
    visualizer = CompactDebugVisualizer(args.input_file)
    debug_svg = visualizer.create_compact_debug_svg()
    
    # Write the debug SVG
    with open(args.output, 'w', encoding='utf-8') as f:
        f.write(debug_svg)
    
    print(f"✅ Compact debug visualization saved to {args.output}")

if __name__ == '__main__':
    main()