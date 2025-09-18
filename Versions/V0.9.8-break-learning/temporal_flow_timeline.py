#!/usr/bin/env python3
"""
Temporal Flow Timeline - Shows pitch transitions over time as flowing ribbons
Each pitch has its own horizontal lane with connections showing transitions
USES POST SLUR-TO-TIE CONVERSION DATA
"""

from typing import List, Tuple, Dict
import sys
import os

# Add KPIC2 directory to path to import the parser
kpic2_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'KPIC2-V1.0.0')
sys.path.insert(0, kpic2_path)
from musicxml_parser_with_conversion import MusicXMLParserWithConversion

def parse_musicxml(file_path: str) -> List[Tuple[str, int, int]]:
    """Parse MusicXML and extract note sequence WITH SLUR-TO-TIE CONVERSION"""
    parser = MusicXMLParserWithConversion(file_path)
    notes_with_timing = parser.get_notes_with_timing()
    
    # Convert to expected format (note_name, midi_pitch, position)
    result = []
    for note_name, midi_pitch, position, is_grace in notes_with_timing:
        if not is_grace:  # Skip grace notes for main timeline
            result.append((note_name, midi_pitch, position))
    
    return result

def create_temporal_flow_timeline(notes: List[Tuple[str, int, int]], output_file: str):
    """Create a temporal flow timeline visualization"""
    
    if not notes:
        return
    
    # Get unique pitches sorted
    unique_pitches = sorted(list(set([(n[0], n[1]) for n in notes])), key=lambda x: x[1])
    pitch_to_lane = {pitch: i for i, pitch in enumerate(unique_pitches)}
    
    # Create SVG
    svg_lines = []
    svg_lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    
    # Calculate dimensions
    time_scale = 2  # pixels per time unit
    lane_height = 40
    margin_top = 80
    margin_left = 100
    margin_right = 50
    margin_bottom = 100
    
    max_time = max(n[2] for n in notes) + 100
    width = margin_left + max_time * time_scale + margin_right
    height = margin_top + len(unique_pitches) * lane_height + margin_bottom
    
    svg_lines.append(f'<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">')
    svg_lines.append('<rect width="100%" height="100%" fill="white"/>')
    
    # Title
    svg_lines.append(f'<text x="{width/2}" y="30" text-anchor="middle" font-size="20" font-weight="bold">Temporal Flow Timeline</text>')
    svg_lines.append(f'<text x="{width/2}" y="50" text-anchor="middle" font-size="14" fill="#666">Pitch transitions flowing through time →</text>')
    
    # Draw lanes
    for i, (note_name, midi) in enumerate(unique_pitches):
        y = margin_top + i * lane_height
        
        # Lane background
        svg_lines.append(f'<rect x="{margin_left}" y="{y}" width="{max_time * time_scale}" '
                        f'height="{lane_height}" fill="#f8f8f8" stroke="#ddd" stroke-width="1"/>')
        
        # Lane label
        svg_lines.append(f'<text x="{margin_left - 10}" y="{y + lane_height/2 + 5}" '
                        f'text-anchor="end" font-size="12" font-weight="bold">{note_name}</text>')
    
    # Draw note occurrences and transitions
    for i in range(len(notes)):
        note_name, midi, time_pos = notes[i]
        lane_idx = pitch_to_lane[(note_name, midi)]
        x = margin_left + time_pos * time_scale
        y = margin_top + lane_idx * lane_height + lane_height / 2
        
        # Draw note circle
        svg_lines.append(f'<circle cx="{x}" cy="{y}" r="8" fill="blue" opacity="0.8"/>')
        
        # Draw transition to next note
        if i < len(notes) - 1:
            next_name, next_midi, next_time = notes[i + 1]
            next_lane = pitch_to_lane[(next_name, next_midi)]
            next_x = margin_left + next_time * time_scale
            next_y = margin_top + next_lane * lane_height + lane_height / 2
            
            # Different styles for different transition types
            if lane_idx == next_lane:
                # Same pitch - straight line
                svg_lines.append(f'<line x1="{x}" y1="{y}" x2="{next_x}" y2="{next_y}" '
                               f'stroke="blue" stroke-width="2" opacity="0.6"/>')
            elif abs(lane_idx - next_lane) == 1:
                # Adjacent pitch - gentle curve
                mid_x = (x + next_x) / 2
                svg_lines.append(f'<path d="M {x},{y} Q {mid_x},{(y + next_y)/2} {next_x},{next_y}" '
                               f'fill="none" stroke="green" stroke-width="2" opacity="0.6"/>')
            else:
                # Large jump - pronounced curve
                mid_x = (x + next_x) / 2
                ctrl_y = min(y, next_y) - abs(lane_idx - next_lane) * 5
                svg_lines.append(f'<path d="M {x},{y} Q {mid_x},{ctrl_y} {next_x},{next_y}" '
                               f'fill="none" stroke="red" stroke-width="2" opacity="0.6"/>')
            
            # Add transition label for large jumps
            if abs(lane_idx - next_lane) > 2:
                mid_x = (x + next_x) / 2
                mid_y = (y + next_y) / 2
                svg_lines.append(f'<text x="{mid_x}" y="{mid_y - 5}" text-anchor="middle" '
                               f'font-size="10" fill="#666">{note_name}→{next_name}</text>')
    
    # Time axis
    axis_y = height - margin_bottom + 30
    svg_lines.append(f'<line x1="{margin_left}" y1="{axis_y}" x2="{margin_left + max_time * time_scale}" '
                    f'y2="{axis_y}" stroke="#333" stroke-width="2"/>')
    svg_lines.append(f'<text x="{width/2}" y="{axis_y + 30}" text-anchor="middle" '
                    f'font-size="12" font-weight="bold">Time →</text>')
    
    # Time markers
    for t in range(0, max_time + 1, 50):
        x = margin_left + t * time_scale
        svg_lines.append(f'<line x1="{x}" y1="{axis_y - 5}" x2="{x}" y2="{axis_y + 5}" '
                        f'stroke="#333" stroke-width="1"/>')
        svg_lines.append(f'<text x="{x}" y="{axis_y + 20}" text-anchor="middle" '
                        f'font-size="10">{t}</text>')
    
    # Legend
    legend_x = width - 200
    legend_y = margin_top
    svg_lines.append(f'<text x="{legend_x}" y="{legend_y}" font-size="12" font-weight="bold">Transition Types:</text>')
    
    svg_lines.append(f'<line x1="{legend_x}" y1="{legend_y + 20}" x2="{legend_x + 30}" '
                    f'y2="{legend_y + 20}" stroke="blue" stroke-width="2"/>')
    svg_lines.append(f'<text x="{legend_x + 35}" y="{legend_y + 25}" font-size="11">Same pitch</text>')
    
    svg_lines.append(f'<path d="M {legend_x},{legend_y + 40} Q {legend_x + 15},{legend_y + 35} '
                    f'{legend_x + 30},{legend_y + 40}" fill="none" stroke="green" stroke-width="2"/>')
    svg_lines.append(f'<text x="{legend_x + 35}" y="{legend_y + 45}" font-size="11">Step (adjacent)</text>')
    
    svg_lines.append(f'<path d="M {legend_x},{legend_y + 60} Q {legend_x + 15},{legend_y + 50} '
                    f'{legend_x + 30},{legend_y + 60}" fill="none" stroke="red" stroke-width="2"/>')
    svg_lines.append(f'<text x="{legend_x + 35}" y="{legend_y + 65}" font-size="11">Leap (jump)</text>')
    
    svg_lines.append('</svg>')
    
    # Write to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(svg_lines))
    
    print(f"Created temporal flow timeline: {output_file}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 temporal_flow_timeline.py <musicxml_file>")
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
    output_file = "SVG_Output/temporal_flow_timeline.svg"
    create_temporal_flow_timeline(notes, output_file)

if __name__ == "__main__":
    main()