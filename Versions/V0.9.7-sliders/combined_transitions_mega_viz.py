#!/usr/bin/env python3
"""
Combined Transitions Mega Visualization - All 6 transition visualizations in one SVG
Includes: Sankey Flow, Chord Matrix, Circular Diagram, Timeline, Constellation, and Heatmap
"""

import xml.etree.ElementTree as ET
from typing import List, Tuple, Dict, Set
import sys
import os
import math
import random

def parse_musicxml(file_path: str) -> Tuple[List[Tuple[str, int, int]], Dict]:
    """Parse MusicXML and extract note sequence with MIDI pitches and durations"""
    tree = ET.parse(file_path)
    root = tree.getroot()
    
    notes = []
    position = 0
    
    for note_elem in root.findall('.//note'):
        duration_elem = note_elem.find('duration')
        duration = int(duration_elem.text) if duration_elem is not None else 1
        
        if note_elem.find('rest') is not None:
            position += duration
            continue
            
        pitch_elem = note_elem.find('pitch')
        if pitch_elem is None:
            position += duration
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
            
        notes.append((note_name, midi_pitch, position))
        position += duration
    
    # Build transitions dictionary
    transitions = {}
    for i in range(len(notes) - 1):
        from_note = notes[i][0]
        to_note = notes[i + 1][0]
        key = (from_note, to_note)
        transitions[key] = transitions.get(key, 0) + 1
    
    return notes, transitions

def draw_sankey_flow(svg_lines: List[str], notes: List[Tuple], transitions: Dict, x_offset: int, y_offset: int):
    """Draw Sankey Flow Diagram at specified position"""
    
    # Get all unique notes that appear in transitions
    all_notes = set()
    
    for (from_note, to_note) in transitions.keys():
        # Find MIDI values for sorting
        from_midi = next((n[1] for n in notes if n[0] == from_note), 60)
        to_midi = next((n[1] for n in notes if n[0] == to_note), 60)
        all_notes.add((from_note, from_midi))
        all_notes.add((to_note, to_midi))
    
    # Sort by MIDI pitch
    unique_notes = sorted(list(all_notes), key=lambda x: x[1])
    
    # Calculate positions
    left_x = x_offset + 100
    right_x = x_offset + 500
    height = 400
    
    # Title
    svg_lines.append(f'<text x="{x_offset + 300}" y="{y_offset + 20}" text-anchor="middle" '
                    f'font-size="16" font-weight="bold">Sankey Flow Diagram</text>')
    
    # Position nodes - same notes on both sides
    left_positions = {}
    right_positions = {}
    
    if unique_notes:
        y_spacing = height / (len(unique_notes) + 1)
        for i, (note_name, midi) in enumerate(unique_notes):
            y = y_offset + 50 + (i + 1) * y_spacing
            left_positions[note_name] = (left_x, y)
            right_positions[note_name] = (right_x, y)
    
    # Draw flows
    for (from_note, to_note), count in transitions.items():
        if from_note in left_positions and to_note in right_positions:
            x1, y1 = left_positions[from_note]
            x2, y2 = right_positions[to_note]
            
            # Flow thickness
            thickness = 2 + count * 2
            opacity = 0.3 + min(0.5, count * 0.1)
            
            # Control points for smooth curve
            ctrl1_x = x1 + 100
            ctrl2_x = x2 - 100
            
            # Path with gradient
            path_id = f"flow_{from_note}_{to_note}".replace('#', 'sharp').replace('♭', 'flat')
            svg_lines.append(f'<path d="M {x1},{y1} C {ctrl1_x},{y1} {ctrl2_x},{y2} {x2},{y2}" '
                           f'stroke="url(#gradient_{path_id})" stroke-width="{thickness}" '
                           f'fill="none" opacity="{opacity}"/>')
            
            # Gradient definition
            svg_lines.append('<defs>')
            svg_lines.append(f'<linearGradient id="gradient_{path_id}" x1="0%" y1="0%" x2="100%" y2="0%">')
            svg_lines.append(f'<stop offset="0%" style="stop-color:blue;stop-opacity:1" />')
            svg_lines.append(f'<stop offset="100%" style="stop-color:green;stop-opacity:1" />')
            svg_lines.append('</linearGradient>')
            svg_lines.append('</defs>')
    
    # Draw nodes
    for note_name, (x, y) in left_positions.items():
        svg_lines.append(f'<rect x="{x-30}" y="{y-10}" width="60" height="20" '
                        f'fill="lightblue" stroke="black" stroke-width="1" rx="3"/>')
        svg_lines.append(f'<text x="{x}" y="{y+5}" text-anchor="middle" font-size="12">{note_name}</text>')
    
    for note_name, (x, y) in right_positions.items():
        svg_lines.append(f'<rect x="{x-30}" y="{y-10}" width="60" height="20" '
                        f'fill="lightgreen" stroke="black" stroke-width="1" rx="3"/>')
        svg_lines.append(f'<text x="{x}" y="{y+5}" text-anchor="middle" font-size="12">{note_name}</text>')
    
    # Labels
    svg_lines.append(f'<text x="{left_x}" y="{y_offset + 40}" text-anchor="middle" '
                    f'font-size="12" font-weight="bold">From</text>')
    svg_lines.append(f'<text x="{right_x}" y="{y_offset + 40}" text-anchor="middle" '
                    f'font-size="12" font-weight="bold">To</text>')

def draw_chord_matrix(svg_lines: List[str], notes: List[Tuple], transitions: Dict, x_offset: int, y_offset: int):
    """Draw Chord Progression Matrix at specified position"""
    
    # Get unique notes
    unique_notes = sorted(list(set([(n[0], n[1]) for n in notes])), key=lambda x: x[1])
    note_to_index = {(note[0], note[1]): i for i, note in enumerate(unique_notes)}
    
    # Build matrix
    n = len(unique_notes)
    matrix = [[0] * n for _ in range(n)]
    
    for i in range(len(notes) - 1):
        from_note = (notes[i][0], notes[i][1])
        to_note = (notes[i + 1][0], notes[i + 1][1])
        if from_note in note_to_index and to_note in note_to_index:
            from_idx = note_to_index[from_note]
            to_idx = note_to_index[to_note]
            matrix[from_idx][to_idx] += 1
    
    # Title
    svg_lines.append(f'<text x="{x_offset + 200}" y="{y_offset + 20}" text-anchor="middle" '
                    f'font-size="16" font-weight="bold">Chord Progression Matrix</text>')
    
    # Draw matrix
    cell_size = 30
    margin = 50
    
    for i, (from_note, from_midi) in enumerate(unique_notes):
        y = y_offset + margin + i * cell_size
        
        # Row label
        svg_lines.append(f'<text x="{x_offset + margin - 5}" y="{y + cell_size/2 + 3}" '
                        f'text-anchor="end" font-size="10">{from_note}</text>')
        
        for j, (to_note, to_midi) in enumerate(unique_notes):
            x = x_offset + margin + j * cell_size
            count = matrix[i][j]
            
            if count > 0:
                intensity = min(255, 100 + count * 30)
                color = f"rgb({255-intensity//2}, {255-intensity//2}, {255})"
                
                svg_lines.append(f'<rect x="{x}" y="{y}" width="{cell_size}" height="{cell_size}" '
                               f'fill="{color}" stroke="#333" stroke-width="0.5"/>')
                svg_lines.append(f'<text x="{x + cell_size/2}" y="{y + cell_size/2 + 3}" '
                               f'text-anchor="middle" font-size="10">{count}</text>')
            else:
                svg_lines.append(f'<rect x="{x}" y="{y}" width="{cell_size}" height="{cell_size}" '
                               f'fill="white" stroke="#ddd" stroke-width="0.5"/>')
    
    # Column labels
    for j, (to_note, to_midi) in enumerate(unique_notes):
        x = x_offset + margin + j * cell_size
        svg_lines.append(f'<text x="{x + cell_size/2}" y="{y_offset + margin - 5}" '
                        f'text-anchor="middle" font-size="10">{to_note}</text>')

def draw_circular_diagram(svg_lines: List[str], notes: List[Tuple], transitions: Dict, x_offset: int, y_offset: int):
    """Draw Circular Pitch Transition Diagram at specified position"""
    
    # Get unique notes
    unique_notes = sorted(list(set([(n[0], n[1]) for n in notes])), key=lambda x: x[1])
    
    # Title
    center_x = x_offset + 200
    center_y = y_offset + 220
    radius = 150
    
    svg_lines.append(f'<text x="{center_x}" y="{y_offset + 20}" text-anchor="middle" '
                    f'font-size="16" font-weight="bold">Circular Pitch Transitions</text>')
    
    # Calculate positions
    note_positions = {}
    angle_step = 2 * math.pi / len(unique_notes)
    
    for i, (note_name, midi) in enumerate(unique_notes):
        angle = -math.pi / 2 + i * angle_step
        x = center_x + radius * math.cos(angle)
        y = center_y + radius * math.sin(angle)
        note_positions[note_name] = (x, y)
    
    # Draw transitions
    max_count = max(transitions.values()) if transitions else 1
    
    for (from_note, to_note), count in transitions.items():
        if from_note in note_positions and to_note in note_positions:
            x1, y1 = note_positions[from_note]
            x2, y2 = note_positions[to_note]
            
            thickness = 0.5 + (count / max_count) * 3
            opacity = 0.3 + (count / max_count) * 0.7
            
            if from_note == to_note:
                # Self-loop
                svg_lines.append(f'<circle cx="{x1}" cy="{y1 - 20}" r="15" '
                               f'fill="none" stroke="blue" stroke-width="{thickness}" opacity="{opacity}"/>')
            else:
                # Curved path
                ctrl_x = center_x
                ctrl_y = center_y
                svg_lines.append(f'<path d="M {x1},{y1} Q {ctrl_x},{ctrl_y} {x2},{y2}" '
                               f'fill="none" stroke="blue" stroke-width="{thickness}" opacity="{opacity}"/>')
    
    # Draw nodes
    for note_name, (x, y) in note_positions.items():
        svg_lines.append(f'<circle cx="{x}" cy="{y}" r="15" fill="lightblue" stroke="black" stroke-width="1"/>')
        svg_lines.append(f'<text x="{x}" y="{y + 4}" text-anchor="middle" font-size="10">{note_name}</text>')

def draw_temporal_timeline(svg_lines: List[str], notes: List[Tuple], x_offset: int, y_offset: int):
    """Draw Temporal Flow Timeline at specified position"""
    
    # Get unique pitches
    unique_pitches = sorted(list(set([(n[0], n[1]) for n in notes])), key=lambda x: x[1])
    pitch_to_lane = {(pitch[0], pitch[1]): i for i, pitch in enumerate(unique_pitches)}
    
    # Title
    svg_lines.append(f'<text x="{x_offset + 300}" y="{y_offset + 20}" text-anchor="middle" '
                    f'font-size="16" font-weight="bold">Temporal Flow Timeline</text>')
    
    # Draw lanes
    lane_height = 25
    time_scale = 1
    margin_left = 60
    margin_top = 40
    
    for i, (note_name, midi) in enumerate(unique_pitches):
        y = y_offset + margin_top + i * lane_height
        
        # Lane background
        svg_lines.append(f'<rect x="{x_offset + margin_left}" y="{y}" width="500" height="{lane_height}" '
                        f'fill="#f8f8f8" stroke="#ddd" stroke-width="0.5"/>')
        
        # Lane label
        svg_lines.append(f'<text x="{x_offset + margin_left - 5}" y="{y + lane_height/2 + 3}" '
                        f'text-anchor="end" font-size="10">{note_name}</text>')
    
    # Draw notes and connections
    for i in range(min(len(notes), 50)):  # Limit to first 50 notes for space
        note_name, midi, time_pos = notes[i]
        lane_idx = pitch_to_lane[(note_name, midi)]
        x = x_offset + margin_left + time_pos * time_scale
        y = y_offset + margin_top + lane_idx * lane_height + lane_height / 2
        
        # Note circle
        svg_lines.append(f'<circle cx="{x}" cy="{y}" r="4" fill="blue" opacity="0.8"/>')
        
        # Connection to next
        if i < len(notes) - 1 and i < 49:
            next_name, next_midi, next_time = notes[i + 1]
            next_lane = pitch_to_lane[(next_name, next_midi)]
            next_x = x_offset + margin_left + next_time * time_scale
            next_y = y_offset + margin_top + next_lane * lane_height + lane_height / 2
            
            if lane_idx == next_lane:
                color = "blue"
            elif abs(lane_idx - next_lane) == 1:
                color = "green"
            else:
                color = "red"
            
            svg_lines.append(f'<line x1="{x}" y1="{y}" x2="{next_x}" y2="{next_y}" '
                           f'stroke="{color}" stroke-width="1" opacity="0.6"/>')

def draw_constellation(svg_lines: List[str], notes: List[Tuple], transitions: Dict, x_offset: int, y_offset: int):
    """Draw Pitch Constellation Network at specified position"""
    
    # Count frequencies
    note_counts = {}
    for note_name, midi, _ in notes:
        note_counts[note_name] = note_counts.get(note_name, 0) + 1
    
    # Title
    svg_lines.append(f'<text x="{x_offset + 200}" y="{y_offset + 20}" text-anchor="middle" '
                    f'font-size="16" font-weight="bold" fill="white">Pitch Constellation</text>')
    
    # Dark background
    svg_lines.append(f'<rect x="{x_offset}" y="{y_offset + 30}" width="400" height="370" fill="#0a0a2e"/>')
    
    # Position notes
    unique_notes = list(set([(n[0], n[1]) for n in notes]))
    positions = {}
    random.seed(42)
    
    for note_name, midi in unique_notes:
        x = x_offset + 50 + random.uniform(0, 300)
        y = y_offset + 80 + random.uniform(0, 270)
        positions[note_name] = (x, y)
    
    # Draw connections
    for (from_note, to_note), count in transitions.items():
        if from_note in positions and to_note in positions:
            x1, y1 = positions[from_note]
            x2, y2 = positions[to_note]
            opacity = 0.2 + min(0.5, count * 0.1)
            
            svg_lines.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
                           f'stroke="cyan" stroke-width="0.5" opacity="{opacity}"/>')
    
    # Draw stars
    max_count = max(note_counts.values())
    
    for note_name, (x, y) in positions.items():
        count = note_counts[note_name]
        size = 3 + (count / max_count) * 10
        
        # Star shape
        points = []
        for i in range(10):
            angle = (i * math.pi / 5) - math.pi / 2
            r = size if i % 2 == 0 else size * 0.5
            px = x + r * math.cos(angle)
            py = y + r * math.sin(angle)
            points.append(f"{px},{py}")
        
        svg_lines.append(f'<polygon points="{" ".join(points)}" fill="lightblue" '
                        f'stroke="white" stroke-width="0.5" opacity="0.9"/>')
        
        # Label
        svg_lines.append(f'<text x="{x}" y="{y - size - 3}" text-anchor="middle" '
                        f'font-size="8" fill="white">{note_name}</text>')

def draw_probability_heatmap(svg_lines: List[str], notes: List[Tuple], x_offset: int, y_offset: int):
    """Draw Transition Probability Heatmap at specified position"""
    
    # Get unique notes
    unique_notes = sorted(list(set([(n[0], n[1]) for n in notes])), key=lambda x: x[1])
    note_to_index = {(note[0], note[1]): i for i, note in enumerate(unique_notes)}
    
    # Build probability matrix
    n = len(unique_notes)
    matrix = [[0] * n for _ in range(n)]
    
    for i in range(len(notes) - 1):
        from_note = (notes[i][0], notes[i][1])
        to_note = (notes[i + 1][0], notes[i + 1][1])
        if from_note in note_to_index and to_note in note_to_index:
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
    
    # Title
    svg_lines.append(f'<text x="{x_offset + 200}" y="{y_offset + 20}" text-anchor="middle" '
                    f'font-size="16" font-weight="bold">Transition Probability Heatmap</text>')
    
    # Draw heatmap
    cell_size = 30
    margin = 50
    
    for display_i in range(n):
        i = n - 1 - display_i  # Reverse for bottom-left origin
        from_note, from_midi = unique_notes[i]
        y = y_offset + margin + display_i * cell_size
        
        # Row label
        svg_lines.append(f'<text x="{x_offset + margin - 5}" y="{y + cell_size/2 + 3}" '
                        f'text-anchor="end" font-size="10">{from_note}</text>')
        
        for j, (to_note, to_midi) in enumerate(unique_notes):
            x = x_offset + margin + j * cell_size
            prob = prob_matrix[i][j]
            
            if prob > 0:
                r = int(255 * (1 - prob * 0.7))
                g = int(255 * (1 - prob * 0.9))
                b = int(255 * (1 - prob))
                color = f"rgb({r}, {g}, {b})"
                
                svg_lines.append(f'<rect x="{x}" y="{y}" width="{cell_size}" height="{cell_size}" '
                               f'fill="{color}" stroke="#333" stroke-width="0.5"/>')
                
                percentage = int(prob * 100)
                if percentage > 0:
                    text_color = "white" if prob > 0.5 else "black"
                    svg_lines.append(f'<text x="{x + cell_size/2}" y="{y + cell_size/2 + 3}" '
                                   f'text-anchor="middle" font-size="9" fill="{text_color}">{percentage}%</text>')
            else:
                svg_lines.append(f'<rect x="{x}" y="{y}" width="{cell_size}" height="{cell_size}" '
                               f'fill="white" stroke="#ddd" stroke-width="0.5"/>')
    
    # Column labels
    for j, (to_note, to_midi) in enumerate(unique_notes):
        x = x_offset + margin + j * cell_size
        svg_lines.append(f'<text x="{x + cell_size/2}" y="{y_offset + margin - 5}" '
                        f'text-anchor="middle" font-size="10">{to_note}</text>')

def create_mega_visualization(input_file: str, output_file: str):
    """Create the mega combined visualization"""
    
    # Parse MusicXML
    notes, transitions = parse_musicxml(input_file)
    
    # Create SVG
    svg_lines = []
    svg_lines.append('<?xml version="1.0" encoding="UTF-8"?>')
    
    # Large canvas to fit all visualizations
    width = 1800
    height = 1600
    
    svg_lines.append(f'<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">')
    svg_lines.append('<rect width="100%" height="100%" fill="white"/>')
    
    # Main title
    svg_lines.append(f'<text x="{width/2}" y="30" text-anchor="middle" font-size="24" font-weight="bold">')
    svg_lines.append('Complete Pitch Transition Analysis - 6 Visualization Methods')
    svg_lines.append('</text>')
    
    file_name = os.path.basename(input_file)
    svg_lines.append(f'<text x="{width/2}" y="55" text-anchor="middle" font-size="16" fill="#666">')
    svg_lines.append(f'File: {file_name}')
    svg_lines.append('</text>')
    
    # Layout: 3x2 grid
    # Row 1: Sankey Flow, Chord Matrix, Circular Diagram
    # Row 2: Temporal Timeline, Constellation, Probability Heatmap
    
    # Row 1
    draw_sankey_flow(svg_lines, notes, transitions, 50, 80)
    draw_chord_matrix(svg_lines, notes, transitions, 650, 80)
    draw_circular_diagram(svg_lines, notes, transitions, 1200, 80)
    
    # Row 2
    draw_temporal_timeline(svg_lines, notes, 50, 600)
    draw_constellation(svg_lines, notes, transitions, 650, 600)
    draw_probability_heatmap(svg_lines, notes, 1200, 600)
    
    # Footer
    svg_lines.append(f'<text x="{width/2}" y="{height - 20}" text-anchor="middle" font-size="12" fill="#666">')
    svg_lines.append('Generated with Đan Tranh Tablature Converter - Transition Analysis Suite')
    svg_lines.append('</text>')
    
    svg_lines.append('</svg>')
    
    # Write to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(svg_lines))
    
    print(f"Created mega visualization: {output_file}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 combined_transitions_mega_viz.py <musicxml_file>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    if not os.path.exists(input_file):
        print(f"Error: File '{input_file}' not found")
        sys.exit(1)
    
    # Create output directory if needed
    os.makedirs("SVG_Output", exist_ok=True)
    
    # Generate mega visualization
    output_file = "SVG_Output/mega_transitions_visualization.svg"
    create_mega_visualization(input_file, output_file)

if __name__ == "__main__":
    main()