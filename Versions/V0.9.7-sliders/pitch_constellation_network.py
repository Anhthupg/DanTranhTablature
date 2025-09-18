#!/usr/bin/env python3
"""
Pitch Constellation Network - Shows notes as stars with connecting lines
Size of stars represents frequency, brightness shows pitch height
USES POST SLUR-TO-TIE CONVERSION DATA
"""

from typing import List, Tuple, Dict
import sys
import os
import math
import random

# Add KPIC2 directory to path to import the parser
kpic2_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'KPIC2-V1.0.0')
sys.path.insert(0, kpic2_path)
from musicxml_parser_with_conversion import MusicXMLParserWithConversion

def parse_musicxml(file_path: str) -> List[Tuple[str, int]]:
    """Parse MusicXML and extract note sequence WITH SLUR-TO-TIE CONVERSION"""
    parser = MusicXMLParserWithConversion(file_path)
    return parser.get_notes_for_pitch_analysis()

def create_pitch_constellation(notes: List[Tuple[str, int]], output_file: str):
    """Create a constellation network visualization"""
    
    # Count note frequencies and transitions
    note_counts = {}
    transitions = {}
    
    for i, (note_name, midi) in enumerate(notes):
        note_counts[note_name] = note_counts.get(note_name, 0) + 1
        
        if i < len(notes) - 1:
            next_note = notes[i + 1][0]
            key = (note_name, next_note)
            transitions[key] = transitions.get(key, 0) + 1
    
    # Get unique notes with their MIDI values
    unique_notes = {}
    for note_name, midi in notes:
        if note_name not in unique_notes:
            unique_notes[note_name] = midi
    
    # Create SVG
    svg_lines = []
    svg_lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    
    width = 900
    height = 700
    
    svg_lines.append(f'<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">')
    
    # Dark background for constellation effect
    svg_lines.append('<rect width="100%" height="100%" fill="#0a0a2e"/>')
    
    # Title
    svg_lines.append(f'<text x="{width/2}" y="30" text-anchor="middle" font-size="20" '
                    f'font-weight="bold" fill="white">Pitch Constellation Network</text>')
    svg_lines.append(f'<text x="{width/2}" y="50" text-anchor="middle" font-size="14" '
                    f'fill="#aaa">Star size = frequency, Brightness = pitch height, Lines = transitions</text>')
    
    # Position notes using force-directed layout simulation
    positions = {}
    random.seed(42)  # For reproducible layout
    
    # Initial positions based on pitch height and some randomness
    for note_name, midi in unique_notes.items():
        # X position: somewhat random but influenced by pitch class
        pitch_class = midi % 12
        x = 150 + (width - 300) * (pitch_class / 11) + random.uniform(-50, 50)
        
        # Y position: based on octave (inverted so high notes are up)
        octave = midi // 12
        y = height - 150 - (octave - 3) * 80 + random.uniform(-30, 30)
        
        positions[note_name] = (x, y)
    
    # Simple force-directed adjustment (simplified for clarity)
    for _ in range(20):  # iterations
        new_positions = {}
        for note1 in positions:
            fx, fy = 0, 0
            x1, y1 = positions[note1]
            
            for note2 in positions:
                if note1 != note2:
                    x2, y2 = positions[note2]
                    dx = x2 - x1
                    dy = y2 - y1
                    dist = max(math.sqrt(dx*dx + dy*dy), 1)
                    
                    # Repulsion
                    force = -500 / (dist * dist)
                    fx += force * dx / dist
                    fy += force * dy / dist
                    
                    # Attraction if connected
                    if (note1, note2) in transitions or (note2, note1) in transitions:
                        force = dist / 100
                        fx += force * dx / dist
                        fy += force * dy / dist
            
            # Apply forces with damping
            new_x = x1 + fx * 0.1
            new_y = y1 + fy * 0.1
            
            # Keep within bounds
            new_x = max(100, min(width - 100, new_x))
            new_y = max(100, min(height - 100, new_y))
            
            new_positions[note1] = (new_x, new_y)
        
        positions = new_positions
    
    # Draw transition lines (constellation connections)
    max_trans = max(transitions.values()) if transitions else 1
    
    for (from_note, to_note), count in transitions.items():
        if from_note in positions and to_note in positions:
            x1, y1 = positions[from_note]
            x2, y2 = positions[to_note]
            
            # Line properties based on transition count
            opacity = 0.2 + (count / max_trans) * 0.6
            width = 0.5 + (count / max_trans) * 2
            
            svg_lines.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
                           f'stroke="cyan" stroke-width="{width}" opacity="{opacity}"/>')
    
    # Draw note stars
    max_count = max(note_counts.values())
    
    for note_name, (x, y) in positions.items():
        count = note_counts[note_name]
        midi = unique_notes[note_name]
        
        # Star size based on frequency
        base_size = 5 + (count / max_count) * 20
        
        # Brightness based on pitch height
        brightness = 100 + (midi - 48) * 3  # Assuming MIDI 48 (C3) as reference
        brightness = max(50, min(255, brightness))
        
        # Draw star shape
        points = []
        for i in range(10):
            angle = (i * math.pi / 5) - math.pi / 2
            if i % 2 == 0:
                r = base_size
            else:
                r = base_size * 0.5
            px = x + r * math.cos(angle)
            py = y + r * math.sin(angle)
            points.append(f"{px},{py}")
        
        color = f"rgb({brightness}, {brightness}, {min(255, brightness + 50)})"
        svg_lines.append(f'<polygon points="{" ".join(points)}" fill="{color}" '
                        f'stroke="white" stroke-width="0.5" opacity="0.9"/>')
        
        # Glow effect
        svg_lines.append(f'<circle cx="{x}" cy="{y}" r="{base_size * 1.5}" '
                        f'fill="{color}" opacity="0.3"/>')
        
        # Note label
        svg_lines.append(f'<text x="{x}" y="{y - base_size - 5}" text-anchor="middle" '
                        f'font-size="11" fill="white" font-weight="bold">{note_name}</text>')
        
        # Frequency label
        svg_lines.append(f'<text x="{x}" y="{y + base_size + 15}" text-anchor="middle" '
                        f'font-size="9" fill="#aaa">{count}×</text>')
    
    # Legend
    legend_x = width - 150
    legend_y = height - 120
    
    svg_lines.append(f'<text x="{legend_x}" y="{legend_y}" font-size="12" '
                    f'font-weight="bold" fill="white">Legend:</text>')
    
    # Small star
    svg_lines.append(f'<polygon points="{legend_x},{legend_y + 20} {legend_x + 5},{legend_y + 18} '
                    f'{legend_x + 7},{legend_y + 23} {legend_x - 7},{legend_y + 23} '
                    f'{legend_x - 5},{legend_y + 18}" fill="lightblue"/>')
    svg_lines.append(f'<text x="{legend_x + 15}" y="{legend_y + 25}" font-size="10" '
                    f'fill="#aaa">Rare note</text>')
    
    # Large star
    svg_lines.append(f'<polygon points="{legend_x},{legend_y + 45} {legend_x + 10},{legend_y + 40} '
                    f'{legend_x + 12},{legend_y + 50} {legend_x - 12},{legend_y + 50} '
                    f'{legend_x - 10},{legend_y + 40}" fill="lightblue"/>')
    svg_lines.append(f'<text x="{legend_x + 15}" y="{legend_y + 50}" font-size="10" '
                    f'fill="#aaa">Frequent note</text>')
    
    # Connection line
    svg_lines.append(f'<line x1="{legend_x - 10}" y1="{legend_y + 70}" '
                    f'x2="{legend_x + 10}" y2="{legend_y + 70}" '
                    f'stroke="cyan" stroke-width="1" opacity="0.5"/>')
    svg_lines.append(f'<text x="{legend_x + 15}" y="{legend_y + 75}" font-size="10" '
                    f'fill="#aaa">Transition</text>')
    
    svg_lines.append('</svg>')
    
    # Write to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(svg_lines))
    
    print(f"Created pitch constellation network: {output_file}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 pitch_constellation_network.py <musicxml_file>")
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
    output_file = "SVG_Output/pitch_constellation_network.svg"
    create_pitch_constellation(notes, output_file)

if __name__ == "__main__":
    main()