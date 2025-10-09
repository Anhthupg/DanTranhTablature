#!/usr/bin/env python3
"""
Chord Progression Matrix - Shows note transitions as a grid matrix
Each cell shows the transition count and actual note names
USES POST SLUR-TO-TIE CONVERSION DATA
"""

from typing import List, Tuple, Dict
import sys
import os

# Add KPIC2 directory to path to import the parser
kpic2_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'KPIC2-V1.0.0')
sys.path.insert(0, kpic2_path)
from musicxml_parser_with_conversion import MusicXMLParserWithConversion

def parse_musicxml(file_path: str) -> List[Tuple[str, int]]:
    """Parse MusicXML and extract note sequence WITH SLUR-TO-TIE CONVERSION"""
    parser = MusicXMLParserWithConversion(file_path)
    return parser.get_notes_for_pitch_analysis()

def create_chord_progression_matrix(notes: List[Tuple[str, int]], output_file: str):
    """Create a matrix visualization of chord progressions"""
    
    # Get unique notes sorted by MIDI pitch
    unique_notes = sorted(list(set(notes)), key=lambda x: x[1])
    note_to_index = {note: i for i, note in enumerate(unique_notes)}
    
    # Build transition matrix
    matrix = [[0] * len(unique_notes) for _ in range(len(unique_notes))]
    
    for i in range(len(notes) - 1):
        from_note = notes[i]
        to_note = notes[i + 1]
        from_idx = note_to_index[from_note]
        to_idx = note_to_index[to_note]
        matrix[from_idx][to_idx] += 1
    
    # Create SVG
    svg_lines = []
    svg_lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    
    cell_size = 60
    margin = 100
    width = len(unique_notes) * cell_size + margin * 2
    height = len(unique_notes) * cell_size + margin * 2
    
    svg_lines.append(f'<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">')
    svg_lines.append('<rect width="100%" height="100%" fill="white"/>')
    
    # Title
    svg_lines.append(f'<text x="{width/2}" y="30" text-anchor="middle" font-size="20" font-weight="bold">Chord Progression Matrix</text>')
    svg_lines.append(f'<text x="{width/2}" y="50" text-anchor="middle" font-size="14" fill="#666">Read horizontally: From → To</text>')
    
    # Draw grid and values
    for i, (from_note, from_midi) in enumerate(unique_notes):
        y = margin + i * cell_size
        
        # Row label (From notes) - on left
        svg_lines.append(f'<text x="{margin - 10}" y="{y + cell_size/2 + 5}" text-anchor="end" font-size="12" font-weight="bold">{from_note[0]}</text>')
        
        for j, (to_note, to_midi) in enumerate(unique_notes):
            x = margin + j * cell_size
            count = matrix[i][j]
            
            if count > 0:
                # Color intensity based on count
                intensity = min(255, 100 + count * 30)
                color = f"rgb({255-intensity//2}, {255-intensity//2}, {255})"
                
                # Cell background
                svg_lines.append(f'<rect x="{x}" y="{y}" width="{cell_size}" height="{cell_size}" fill="{color}" stroke="#333" stroke-width="1"/>')
                
                # Count
                svg_lines.append(f'<text x="{x + cell_size/2}" y="{y + cell_size/2 - 5}" text-anchor="middle" font-size="16" font-weight="bold">{count}</text>')
                
                # Note transition
                svg_lines.append(f'<text x="{x + cell_size/2}" y="{y + cell_size/2 + 10}" text-anchor="middle" font-size="10">{from_note[0]}→{to_note[0]}</text>')
            else:
                # Empty cell
                svg_lines.append(f'<rect x="{x}" y="{y}" width="{cell_size}" height="{cell_size}" fill="white" stroke="#ddd" stroke-width="1"/>')
    
    # Column labels (To notes) - on top
    for j, (to_note, to_midi) in enumerate(unique_notes):
        x = margin + j * cell_size
        svg_lines.append(f'<text x="{x + cell_size/2}" y="{margin - 10}" text-anchor="middle" font-size="12" font-weight="bold">{to_note[0]}</text>')
    
    # Legend
    legend_y = height - 40
    svg_lines.append(f'<text x="{margin}" y="{legend_y}" font-size="12" fill="#666">Cell shows: transition count and note pair (From→To)</text>')
    
    svg_lines.append('</svg>')
    
    # Write to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(svg_lines))
    
    print(f"Created chord progression matrix: {output_file}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 chord_progression_matrix.py <musicxml_file>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    if not os.path.exists(input_file):
        print(f"Error: File '{input_file}' not found")
        sys.exit(1)
    
    # Parse MusicXML
    notes = parse_musicxml(input_file)
    
    # Create output directory if needed
    os.makedirs("SVG_Output", exist_ok=True)
    
    # Generate visualization
    output_file = "SVG_Output/chord_progression_matrix.svg"
    create_chord_progression_matrix(notes, output_file)

if __name__ == "__main__":
    main()