#!/usr/bin/env python3
"""
Circular Pitch Transition Diagram - Shows note transitions in a circular layout
Notes arranged in a circle with curved arrows showing transitions
"""

import xml.etree.ElementTree as ET
from typing import List, Tuple, Dict
import sys
import os
import math

def parse_musicxml(file_path: str) -> List[Tuple[str, int]]:
    """Parse MusicXML and extract note sequence with MIDI pitches"""
    tree = ET.parse(file_path)
    root = tree.getroot()
    
    notes = []
    
    for note_elem in root.findall('.//note'):
        if note_elem.find('rest') is not None:
            continue
            
        pitch_elem = note_elem.find('pitch')
        if pitch_elem is None:
            continue
            
        step = pitch_elem.find('step').text
        octave = int(pitch_elem.find('octave').text)
        
        alter_elem = pitch_elem.find('alter')
        alter = int(alter_elem.text) if alter_elem is not None else 0
        
        # Calculate MIDI pitch
        pitch_class = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}[step]
        midi_pitch = (octave + 1) * 12 + pitch_class + alter
        
        # Create note name
        note_name = f"{step}{octave}"
        if alter == 1:
            note_name = f"{step}♯{octave}"
        elif alter == -1:
            note_name = f"{step}♭{octave}"
            
        notes.append((note_name, midi_pitch))
    
    return notes

def create_circular_pitch_diagram(notes: List[Tuple[str, int]], output_file: str):
    """Create a circular visualization of pitch transitions"""
    
    # Get unique notes and build transition counts
    unique_notes = sorted(list(set(notes)), key=lambda x: x[1])
    transitions = {}
    
    for i in range(len(notes) - 1):
        from_note = notes[i][0]
        to_note = notes[i + 1][0]
        key = (from_note, to_note)
        transitions[key] = transitions.get(key, 0) + 1
    
    # Create SVG
    svg_lines = []
    svg_lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    
    width = 800
    height = 800
    center_x = width / 2
    center_y = height / 2
    radius = 280
    
    svg_lines.append(f'<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">')
    svg_lines.append('<rect width="100%" height="100%" fill="white"/>')
    
    # Title
    svg_lines.append(f'<text x="{center_x}" y="30" text-anchor="middle" font-size="20" font-weight="bold">Circular Pitch Transition Diagram</text>')
    svg_lines.append(f'<text x="{center_x}" y="50" text-anchor="middle" font-size="14" fill="#666">Arrow thickness shows transition frequency</text>')
    
    # Calculate positions for each note
    note_positions = {}
    angle_step = 2 * math.pi / len(unique_notes)
    
    for i, (note_name, midi) in enumerate(unique_notes):
        angle = -math.pi / 2 + i * angle_step  # Start from top
        x = center_x + radius * math.cos(angle)
        y = center_y + radius * math.sin(angle)
        note_positions[note_name] = (x, y, angle)
    
    # Draw transition arrows (curved paths)
    max_count = max(transitions.values()) if transitions else 1
    
    for (from_note, to_note), count in transitions.items():
        if from_note in note_positions and to_note in note_positions:
            from_x, from_y, from_angle = note_positions[from_note]
            to_x, to_y, to_angle = note_positions[to_note]
            
            # Line thickness based on count
            thickness = 0.5 + (count / max_count) * 4
            opacity = 0.3 + (count / max_count) * 0.7
            
            if from_note == to_note:
                # Self-loop
                loop_radius = 30
                svg_lines.append(f'<circle cx="{from_x}" cy="{from_y - loop_radius}" r="{loop_radius}" '
                               f'fill="none" stroke="blue" stroke-width="{thickness}" opacity="{opacity}"/>')
                # Add count label
                svg_lines.append(f'<text x="{from_x}" y="{from_y - loop_radius * 2 - 5}" text-anchor="middle" '
                               f'font-size="10" fill="#333">{count}</text>')
            else:
                # Curved arrow between different notes
                # Control point for quadratic Bezier curve
                ctrl_x = center_x + (radius * 0.6) * math.cos((from_angle + to_angle) / 2)
                ctrl_y = center_y + (radius * 0.6) * math.sin((from_angle + to_angle) / 2)
                
                # Draw curved path
                svg_lines.append(f'<path d="M {from_x},{from_y} Q {ctrl_x},{ctrl_y} {to_x},{to_y}" '
                               f'fill="none" stroke="blue" stroke-width="{thickness}" opacity="{opacity}" '
                               f'marker-end="url(#arrowhead{count})"/>')
                
                # Define arrowhead marker
                svg_lines.append(f'<defs><marker id="arrowhead{count}" markerWidth="10" markerHeight="10" '
                               f'refX="8" refY="3" orient="auto">'
                               f'<polygon points="0 0, 10 3, 0 6" fill="blue" opacity="{opacity}"/>'
                               f'</marker></defs>')
                
                # Add count label at midpoint
                mid_x = (from_x + to_x + ctrl_x * 2) / 4
                mid_y = (from_y + to_y + ctrl_y * 2) / 4
                svg_lines.append(f'<text x="{mid_x}" y="{mid_y}" text-anchor="middle" '
                               f'font-size="10" fill="#333">{count}</text>')
    
    # Draw note circles and labels
    for note_name, (x, y, angle) in note_positions.items():
        # Note circle
        svg_lines.append(f'<circle cx="{x}" cy="{y}" r="25" fill="lightblue" stroke="#333" stroke-width="2"/>')
        
        # Note name
        svg_lines.append(f'<text x="{x}" y="{y + 5}" text-anchor="middle" font-size="14" font-weight="bold">{note_name}</text>')
    
    # Legend
    legend_x = 50
    legend_y = height - 100
    svg_lines.append(f'<text x="{legend_x}" y="{legend_y}" font-size="12" font-weight="bold">Legend:</text>')
    svg_lines.append(f'<line x1="{legend_x}" y1="{legend_y + 15}" x2="{legend_x + 30}" y2="{legend_y + 15}" '
                    f'stroke="blue" stroke-width="1" opacity="0.5"/>')
    svg_lines.append(f'<text x="{legend_x + 40}" y="{legend_y + 20}" font-size="11">Few transitions</text>')
    svg_lines.append(f'<line x1="{legend_x}" y1="{legend_y + 35}" x2="{legend_x + 30}" y2="{legend_y + 35}" '
                    f'stroke="blue" stroke-width="4" opacity="1"/>')
    svg_lines.append(f'<text x="{legend_x + 40}" y="{legend_y + 40}" font-size="11">Many transitions</text>')
    
    svg_lines.append('</svg>')
    
    # Write to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(svg_lines))
    
    print(f"Created circular pitch transition diagram: {output_file}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 circular_pitch_transitions.py <musicxml_file>")
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
    output_file = "SVG_Output/circular_pitch_transitions.svg"
    create_circular_pitch_diagram(notes, output_file)

if __name__ == "__main__":
    main()