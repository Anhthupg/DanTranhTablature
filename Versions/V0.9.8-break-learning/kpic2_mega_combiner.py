#!/usr/bin/env python3
"""
KPIC2 Mega Combiner - Combines transition visualizations into a 2-row layout
Top row: Matrix visualizations (Heatmap, Chord Matrix)
Bottom row: Timeline/Flow visualizations (Temporal Flow)
"""

import xml.etree.ElementTree as ET
from typing import List, Tuple, Dict
import sys
import os

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
    cell_size = 35
    margin = 60
    
    for display_i in range(n):
        i = n - 1 - display_i  # Reverse for bottom-left origin
        from_note, from_midi = unique_notes[i]
        y = y_offset + margin + display_i * cell_size
        
        # Row label
        svg_lines.append(f'<text x="{x_offset + margin - 5}" y="{y + cell_size/2 + 4}" '
                        f'text-anchor="end" font-size="11" font-weight="bold">{from_note}</text>')
        
        for j, (to_note, to_midi) in enumerate(unique_notes):
            x = x_offset + margin + j * cell_size
            prob = prob_matrix[i][j]
            count = matrix[i][j]
            
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
                    if percentage >= 10:
                        svg_lines.append(f'<text x="{x + cell_size/2}" y="{y + cell_size/2 - 3}" '
                                       f'text-anchor="middle" font-size="12" font-weight="bold" '
                                       f'fill="{text_color}">{percentage}%</text>')
                        svg_lines.append(f'<text x="{x + cell_size/2}" y="{y + cell_size/2 + 8}" '
                                       f'text-anchor="middle" font-size="8" fill="{text_color}">({count})</text>')
                    else:
                        svg_lines.append(f'<text x="{x + cell_size/2}" y="{y + cell_size/2 + 2}" '
                                       f'text-anchor="middle" font-size="10" font-weight="bold" '
                                       f'fill="{text_color}">{percentage}%</text>')
            else:
                svg_lines.append(f'<rect x="{x}" y="{y}" width="{cell_size}" height="{cell_size}" '
                               f'fill="white" stroke="#ddd" stroke-width="0.5"/>')
    
    # Column labels
    for j, (to_note, to_midi) in enumerate(unique_notes):
        x = x_offset + margin + j * cell_size
        svg_lines.append(f'<text x="{x + cell_size/2}" y="{y_offset + margin - 8}" text-anchor="middle" '
                        f'font-size="11" font-weight="bold">{to_note}</text>')

def draw_chord_matrix(svg_lines: List[str], notes: List[Tuple], x_offset: int, y_offset: int):
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
    cell_size = 35
    margin = 60
    
    for i, (from_note, from_midi) in enumerate(unique_notes):
        y = y_offset + margin + i * cell_size
        
        # Row label
        svg_lines.append(f'<text x="{x_offset + margin - 5}" y="{y + cell_size/2 + 4}" '
                        f'text-anchor="end" font-size="11" font-weight="bold">{from_note}</text>')
        
        for j, (to_note, to_midi) in enumerate(unique_notes):
            x = x_offset + margin + j * cell_size
            count = matrix[i][j]
            
            if count > 0:
                intensity = min(255, 100 + count * 30)
                color = f"rgb({255-intensity//2}, {255-intensity//2}, {255})"
                
                svg_lines.append(f'<rect x="{x}" y="{y}" width="{cell_size}" height="{cell_size}" '
                               f'fill="{color}" stroke="#333" stroke-width="0.5"/>')
                svg_lines.append(f'<text x="{x + cell_size/2}" y="{y + cell_size/2 - 3}" '
                               f'text-anchor="middle" font-size="14" font-weight="bold">{count}</text>')
                svg_lines.append(f'<text x="{x + cell_size/2}" y="{y + cell_size/2 + 8}" '
                               f'text-anchor="middle" font-size="8">{from_note}→{to_note}</text>')
            else:
                svg_lines.append(f'<rect x="{x}" y="{y}" width="{cell_size}" height="{cell_size}" '
                               f'fill="white" stroke="#ddd" stroke-width="0.5"/>')
    
    # Column labels
    for j, (to_note, to_midi) in enumerate(unique_notes):
        x = x_offset + margin + j * cell_size
        svg_lines.append(f'<text x="{x + cell_size/2}" y="{y_offset + margin - 8}" text-anchor="middle" '
                        f'font-size="11" font-weight="bold">{to_note}</text>')

def draw_temporal_timeline(svg_lines: List[str], notes: List[Tuple], x_offset: int, y_offset: int):
    """Draw Temporal Flow Timeline at specified position"""
    
    # Get unique pitches
    unique_pitches = sorted(list(set([(n[0], n[1]) for n in notes])), key=lambda x: x[1])
    pitch_to_lane = {(pitch[0], pitch[1]): i for i, pitch in enumerate(unique_pitches)}
    
    # Title
    svg_lines.append(f'<text x="{x_offset + 400}" y="{y_offset + 20}" text-anchor="middle" '
                    f'font-size="16" font-weight="bold">Temporal Flow Timeline</text>')
    svg_lines.append(f'<text x="{x_offset + 400}" y="{y_offset + 40}" text-anchor="middle" '
                    f'font-size="12" fill="#666">Blue=same pitch, Green=step, Red=leap</text>')
    
    # Draw lanes
    lane_height = 25
    time_scale = 1.5
    margin_left = 80
    margin_top = 60
    max_time = max(n[2] for n in notes) if notes else 100
    timeline_width = min(max_time * time_scale, 700)
    
    for i, (note_name, midi) in enumerate(unique_pitches):
        y = y_offset + margin_top + i * lane_height
        
        # Lane background
        svg_lines.append(f'<rect x="{x_offset + margin_left}" y="{y}" width="{timeline_width}" '
                        f'height="{lane_height}" fill="#f8f8f8" stroke="#ddd" stroke-width="0.5"/>')
        
        # Lane label
        svg_lines.append(f'<text x="{x_offset + margin_left - 5}" y="{y + lane_height/2 + 4}" '
                        f'text-anchor="end" font-size="11" font-weight="bold">{note_name}</text>')
    
    # Draw notes and connections
    for i in range(min(len(notes), 100)):  # Limit for space
        note_name, midi, time_pos = notes[i]
        lane_idx = pitch_to_lane[(note_name, midi)]
        x = x_offset + margin_left + min(time_pos * time_scale, timeline_width - 10)
        y = y_offset + margin_top + lane_idx * lane_height + lane_height / 2
        
        # Note circle
        svg_lines.append(f'<circle cx="{x}" cy="{y}" r="5" fill="blue" opacity="0.8"/>')
        
        # Connection to next
        if i < len(notes) - 1 and i < 99:
            next_name, next_midi, next_time = notes[i + 1]
            if (next_name, next_midi) in pitch_to_lane:
                next_lane = pitch_to_lane[(next_name, next_midi)]
                next_x = x_offset + margin_left + min(next_time * time_scale, timeline_width - 10)
                next_y = y_offset + margin_top + next_lane * lane_height + lane_height / 2
                
                if lane_idx == next_lane:
                    color = "blue"
                    width = "2"
                elif abs(lane_idx - next_lane) == 1:
                    color = "green"
                    width = "2"
                else:
                    color = "red"
                    width = "2"
                
                if abs(lane_idx - next_lane) <= 1:
                    # Straight line for same/adjacent
                    svg_lines.append(f'<line x1="{x}" y1="{y}" x2="{next_x}" y2="{next_y}" '
                                   f'stroke="{color}" stroke-width="{width}" opacity="0.7"/>')
                else:
                    # Curved line for leaps
                    mid_x = (x + next_x) / 2
                    ctrl_y = min(y, next_y) - abs(lane_idx - next_lane) * 3
                    svg_lines.append(f'<path d="M {x},{y} Q {mid_x},{ctrl_y} {next_x},{next_y}" '
                                   f'fill="none" stroke="{color}" stroke-width="{width}" opacity="0.7"/>')
    
    # Time axis
    axis_y = y_offset + margin_top + len(unique_pitches) * lane_height + 20
    svg_lines.append(f'<line x1="{x_offset + margin_left}" y1="{axis_y}" '
                    f'x2="{x_offset + margin_left + timeline_width}" y2="{axis_y}" '
                    f'stroke="#333" stroke-width="1"/>')
    svg_lines.append(f'<text x="{x_offset + margin_left + timeline_width/2}" y="{axis_y + 20}" '
                    f'text-anchor="middle" font-size="12">Time →</text>')

def create_kpic2_mega2_visualization(input_file: str, output_file: str):
    """Create KPIC2 mega2 visualization by copying from existing mega and adding new charts"""
    
    # First, copy the existing mega visualization content
    existing_mega_path = "KPIC2-V1.0.0/Test_Results/kpic2_mega_Bà rằng bà rí.svg"
    
    if os.path.exists(existing_mega_path):
        # Read existing mega file
        with open(existing_mega_path, 'r', encoding='utf-8') as f:
            existing_content = f.read()
        
        # Parse MusicXML for our additional charts
        notes, transitions = parse_musicxml(input_file)
        
        # Create new mega2 with extended canvas
        svg_lines = []
        svg_lines.append('<?xml version="1.0" encoding="UTF-8"?>')
        
        # Even larger canvas to fit everything
        width = 3000
        height = 2800  # Extended height for additional content
        
        svg_lines.append(f'<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">')
        
        # Extract the defs section from existing file
        defs_start = existing_content.find('<defs>')
        defs_end = existing_content.find('</defs>') + 7
        if defs_start != -1 and defs_end != -1:
            svg_lines.append(existing_content[defs_start:defs_end])
        
        # Background
        svg_lines.append(f'<rect x="0" y="0" width="{width}" height="{height}" fill="#fafafa"/>')
        
        # Updated main title
        svg_lines.append('<text x="1500" y="35" class="title" text-anchor="middle">')
        svg_lines.append('KPIC2-V1.0.0: Complete Pitch Analysis Suite (MEGA2)')
        svg_lines.append('</text>')
        
        file_name = os.path.basename(input_file).replace('.musicxml', '')
        svg_lines.append('<text x="1500" y="60" class="subtitle" text-anchor="middle" fill="#666">')
        svg_lines.append(f'{file_name} | Enhanced 10-Panel Comprehensive Analysis')
        svg_lines.append('</text>')
        
        # Extract all the visualization panels from existing file
        # Skip the SVG header and main title, get the content
        content_start = existing_content.find('<g transform="translate(30,90)">')
        content_end = existing_content.find('</svg>')
        
        if content_start != -1 and content_end != -1:
            existing_panels = existing_content[content_start:content_end].strip()
            svg_lines.append(existing_panels)
        
        # Add our additional visualizations below the existing content
        # These will be positioned at y=2200 and below
        
        # Additional Row 1: Enhanced Matrix visualizations
        svg_lines.append('<g transform="translate(50,2200)">')
        draw_probability_heatmap(svg_lines, notes, 0, 0)
        svg_lines.append('</g>')
        
        svg_lines.append('<g transform="translate(750,2200)">')  
        draw_chord_matrix(svg_lines, notes, 0, 0)
        svg_lines.append('</g>')
        
        # Additional Row 2: Timeline visualization
        svg_lines.append('<g transform="translate(1450,2200)">')
        draw_temporal_timeline(svg_lines, notes, 0, 0)
        svg_lines.append('</g>')
        
        # Updated footer
        svg_lines.append(f'<text x="{width/2}" y="{height - 15}" class="label" text-anchor="middle" fill="#666">')
        svg_lines.append('Generated with Đan Tranh KPIC2-V1.0.0 Enhanced Analysis Suite')
        svg_lines.append('</text>')
        
        svg_lines.append('</svg>')
        
        # Write to file
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(svg_lines))
        
        print(f"Created KPIC2 mega2 enhanced visualization: {output_file}")
        
    else:
        print(f"Error: Could not find existing mega file at {existing_mega_path}")
        print("Creating basic mega2 with available visualizations...")
        
        # Fallback: create basic version
        notes, transitions = parse_musicxml(input_file)
        
        svg_lines = []
        svg_lines.append('<?xml version="1.0" encoding="UTF-8"?>')
        
        width = 1600
        height = 1000
        
        svg_lines.append(f'<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">')
        svg_lines.append('<rect width="100%" height="100%" fill="white"/>')
        
        # Basic title
        svg_lines.append(f'<text x="{width/2}" y="30" text-anchor="middle" font-size="22" font-weight="bold">')
        svg_lines.append('KPIC2-V1.0.0: Basic Pitch Transition Analysis')
        svg_lines.append('</text>')
        
        file_name = os.path.basename(input_file).replace('.musicxml', '')
        svg_lines.append(f'<text x="{width/2}" y="55" text-anchor="middle" font-size="16" fill="#666">')
        svg_lines.append(f'File: {file_name}')
        svg_lines.append('</text>')
        
        # Basic visualizations
        draw_probability_heatmap(svg_lines, notes, 50, 80)
        draw_chord_matrix(svg_lines, notes, 750, 80)
        draw_temporal_timeline(svg_lines, notes, 50, 500)
        
        svg_lines.append('</svg>')
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(svg_lines))
        
        print(f"Created KPIC2 mega2 basic visualization: {output_file}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 kpic2_mega_combiner.py <musicxml_file>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    if not os.path.exists(input_file):
        print(f"Error: File '{input_file}' not found")
        sys.exit(1)
    
    # Create KPIC2 directory if needed
    os.makedirs("KPIC2-V1.0.0", exist_ok=True)
    
    # Generate KPIC2 mega2 visualization
    base_name = os.path.basename(input_file).replace('.musicxml', '')
    output_file = f"KPIC2-V1.0.0/kpic2_mega2_{base_name}.svg"
    create_kpic2_mega2_visualization(input_file, output_file)

if __name__ == "__main__":
    main()