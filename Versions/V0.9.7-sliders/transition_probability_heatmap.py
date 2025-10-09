#!/usr/bin/env python3
"""
Transition Probability Heatmap - Shows probability of transitions between pitches
Color intensity represents likelihood of transition, with note names displayed
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

def create_transition_probability_heatmap(notes: List[Tuple[str, int]], output_file: str):
    """Create a heatmap showing transition probabilities"""
    
    # Get unique notes sorted by MIDI pitch (low to high)
    unique_notes = sorted(list(set(notes)), key=lambda x: x[1])
    note_to_index = {note: i for i, note in enumerate(unique_notes)}
    
    # Build transition count matrix
    n = len(unique_notes)
    matrix = [[0] * n for _ in range(n)]
    
    for i in range(len(notes) - 1):
        from_note = notes[i]
        to_note = notes[i + 1]
        from_idx = note_to_index[from_note]
        to_idx = note_to_index[to_note]
        matrix[from_idx][to_idx] += 1
    
    # Convert to probabilities
    prob_matrix = []
    for row in matrix:
        row_sum = sum(row)
        if row_sum > 0:
            prob_row = [count / row_sum for count in row]
        else:
            prob_row = [0] * n
        prob_matrix.append(prob_row)
    
    # Create SVG
    svg_lines = []
    svg_lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    
    cell_size = 50
    margin = 100
    width = n * cell_size + margin * 2
    height = n * cell_size + margin * 2 + 50
    
    svg_lines.append(f'<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">')
    svg_lines.append('<rect width="100%" height="100%" fill="white"/>')
    
    # Title
    svg_lines.append(f'<text x="{width/2}" y="30" text-anchor="middle" font-size="20" font-weight="bold">Transition Probability Heatmap</text>')
    svg_lines.append(f'<text x="{width/2}" y="50" text-anchor="middle" font-size="14" fill="#666">Darker = Higher probability | Read: From (left) → To (top)</text>')
    
    # IMPORTANT: Matrix orientation with low pitches at bottom-left
    # We need to reverse the row order for display
    for display_i in range(n):
        # Reverse the row index to put low pitches at bottom
        i = n - 1 - display_i
        from_note, from_midi = unique_notes[i]
        y = margin + display_i * cell_size
        
        # Row label (From notes) - on left
        svg_lines.append(f'<text x="{margin - 10}" y="{y + cell_size/2 + 5}" text-anchor="end" '
                        f'font-size="11" font-weight="bold">{from_note}</text>')
        
        for j, (to_note, to_midi) in enumerate(unique_notes):
            x = margin + j * cell_size
            prob = prob_matrix[i][j]
            count = matrix[i][j]
            
            # Color based on probability (0 = white, 1 = dark red)
            if prob > 0:
                # Red channel decreases with probability
                r = int(255 * (1 - prob * 0.7))
                # Green channel decreases more
                g = int(255 * (1 - prob * 0.9))
                # Blue channel decreases most
                b = int(255 * (1 - prob))
                color = f"rgb({r}, {g}, {b})"
                
                # Cell background
                svg_lines.append(f'<rect x="{x}" y="{y}" width="{cell_size}" height="{cell_size}" '
                               f'fill="{color}" stroke="#333" stroke-width="0.5"/>')
                
                # Probability percentage
                percentage = int(prob * 100)
                if percentage > 0:
                    text_color = "white" if prob > 0.5 else "black"
                    svg_lines.append(f'<text x="{x + cell_size/2}" y="{y + cell_size/2 - 5}" '
                                   f'text-anchor="middle" font-size="14" font-weight="bold" '
                                   f'fill="{text_color}">{percentage}%</text>')
                    
                    # Note names (smaller)
                    svg_lines.append(f'<text x="{x + cell_size/2}" y="{y + cell_size/2 + 8}" '
                                   f'text-anchor="middle" font-size="8" fill="{text_color}">'
                                   f'{from_note}→{to_note}</text>')
                    
                    # Count (tiny)
                    svg_lines.append(f'<text x="{x + cell_size/2}" y="{y + cell_size/2 + 18}" '
                                   f'text-anchor="middle" font-size="7" fill="{text_color}">'
                                   f'({count}×)</text>')
            else:
                # Empty cell
                svg_lines.append(f'<rect x="{x}" y="{y}" width="{cell_size}" height="{cell_size}" '
                               f'fill="white" stroke="#ddd" stroke-width="0.5"/>')
    
    # Column labels (To notes) - on top
    for j, (to_note, to_midi) in enumerate(unique_notes):
        x = margin + j * cell_size
        svg_lines.append(f'<text x="{x + cell_size/2}" y="{margin - 10}" text-anchor="middle" '
                        f'font-size="11" font-weight="bold">{to_note}</text>')
    
    # Axes labels
    svg_lines.append(f'<text x="{margin - 70}" y="{margin + n * cell_size / 2}" '
                    f'text-anchor="middle" font-size="12" font-weight="bold" '
                    f'transform="rotate(-90 {margin - 70} {margin + n * cell_size / 2})">From (current note)</text>')
    
    svg_lines.append(f'<text x="{margin + n * cell_size / 2}" y="{margin - 30}" '
                    f'text-anchor="middle" font-size="12" font-weight="bold">To (next note)</text>')
    
    # Color scale legend
    legend_x = width - 180
    legend_y = height - 80
    legend_width = 120
    legend_height = 20
    
    svg_lines.append(f'<text x="{legend_x}" y="{legend_y - 10}" font-size="12" font-weight="bold">Probability:</text>')
    
    # Gradient definition
    svg_lines.append('<defs>')
    svg_lines.append('<linearGradient id="probGradient" x1="0%" y1="0%" x2="100%" y2="0%">')
    svg_lines.append('<stop offset="0%" style="stop-color:rgb(255,255,255);stop-opacity:1" />')
    svg_lines.append('<stop offset="100%" style="stop-color:rgb(77,25,0);stop-opacity:1" />')
    svg_lines.append('</linearGradient>')
    svg_lines.append('</defs>')
    
    # Gradient bar
    svg_lines.append(f'<rect x="{legend_x}" y="{legend_y}" width="{legend_width}" height="{legend_height}" '
                    f'fill="url(#probGradient)" stroke="#333" stroke-width="1"/>')
    
    # Scale labels
    svg_lines.append(f'<text x="{legend_x}" y="{legend_y + legend_height + 15}" '
                    f'text-anchor="start" font-size="10">0%</text>')
    svg_lines.append(f'<text x="{legend_x + legend_width}" y="{legend_y + legend_height + 15}" '
                    f'text-anchor="end" font-size="10">100%</text>')
    
    # Note about orientation
    svg_lines.append(f'<text x="{width/2}" y="{height - 10}" text-anchor="middle" font-size="11" fill="#666">'
                    f'Low pitches at bottom-left corner, high pitches at top-right corner</text>')
    
    svg_lines.append('</svg>')
    
    # Write to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(svg_lines))
    
    print(f"Created transition probability heatmap: {output_file}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 transition_probability_heatmap.py <musicxml_file>")
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
    output_file = "SVG_Output/transition_probability_heatmap.svg"
    create_transition_probability_heatmap(notes, output_file)

if __name__ == "__main__":
    main()