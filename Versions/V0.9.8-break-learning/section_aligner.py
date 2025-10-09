#!/usr/bin/env python3
"""
Section Aligner for Đan Tranh Tablature
Creates aligned visualization where identical phrases stack on top of each other
"""

from pattern_detector import PatternDetector
from musicxml_to_dantranh import DanTranhConverter
import xml.etree.ElementTree as ET
from typing import List, Dict, Tuple
import colorsys

class SectionAligner:
    def __init__(self, musicxml_file: str):
        self.musicxml_file = musicxml_file
        self.detector = PatternDetector(musicxml_file)
        self.converter = DanTranhConverter()
        self.sections = []
        self.phrase_colors = {}
        
    def analyze_and_segment(self):
        """Analyze patterns and segment the piece into sections"""
        # Parse notes and find patterns
        self.detector.parse_musicxml()
        self.detector.extract_skeleton_melody()
        patterns = self.detector.find_exact_patterns(min_length=6)  # Focus on longer phrases
        
        # Sort patterns by position to process in order
        all_phrase_instances = []
        
        for i, pattern in enumerate(patterns):
            # Assign color to this phrase type
            color = self.generate_phrase_color(i)
            self.phrase_colors[f"phrase_{i}"] = color
            
            # Add original occurrence
            all_phrase_instances.append({
                'phrase_id': f"phrase_{i}",
                'start_pos': pattern['original_occurrence']['start_position'],
                'end_pos': pattern['original_occurrence']['end_position'],
                'start_measure': pattern['original_occurrence']['start_measure'],
                'end_measure': pattern['original_occurrence']['end_measure'],
                'notes': pattern['pattern_notes'],
                'length': pattern['length'],
                'color': color,
                'instance_num': 0  # Original is instance 0
            })
            
            # Add all matches
            for j, match in enumerate(pattern['matches']):
                all_phrase_instances.append({
                    'phrase_id': f"phrase_{i}",
                    'start_pos': match['start_position'],
                    'end_pos': match['end_position'],
                    'start_measure': match['start_measure'],
                    'end_measure': match['end_measure'],
                    'notes': pattern['pattern_notes'],
                    'length': pattern['length'],
                    'color': color,
                    'instance_num': j + 1
                })
        
        # Sort by position
        all_phrase_instances.sort(key=lambda x: x['start_pos'])
        
        # Segment the piece
        self.sections = self.create_sections(all_phrase_instances)
        
        return self.sections
    
    def generate_phrase_color(self, index: int) -> str:
        """Generate distinct colors for different phrase types"""
        # Use HSV color space to generate visually distinct colors
        hue = (index * 137.5) % 360  # Golden angle for good distribution
        saturation = 0.7
        value = 0.9
        
        rgb = colorsys.hsv_to_rgb(hue/360, saturation, value)
        return f"#{int(rgb[0]*255):02x}{int(rgb[1]*255):02x}{int(rgb[2]*255):02x}"
    
    def create_sections(self, phrase_instances: List[Dict]) -> List[Dict]:
        """Segment the piece into sections based on phrase boundaries"""
        sections = []
        current_pos = 0
        skeleton_notes = self.detector.skeleton_notes
        
        for phrase in phrase_instances:
            # Add any notes before this phrase as a transitional section
            if current_pos < phrase['start_pos']:
                transition_notes = skeleton_notes[current_pos:phrase['start_pos']]
                if transition_notes:
                    sections.append({
                        'type': 'transition',
                        'start_pos': current_pos,
                        'end_pos': phrase['start_pos'] - 1,
                        'start_measure': transition_notes[0]['measure'],
                        'end_measure': transition_notes[-1]['measure'],
                        'notes': [n['note'] for n in transition_notes],
                        'length': len(transition_notes),
                        'color': '#f0f0f0',  # Light gray for transitions
                        'phrase_id': None,
                        'instance_num': None
                    })
            
            # Add the phrase section
            phrase_notes = skeleton_notes[phrase['start_pos']:phrase['end_pos'] + 1]
            sections.append({
                'type': 'phrase',
                'start_pos': phrase['start_pos'],
                'end_pos': phrase['end_pos'],
                'start_measure': phrase['start_measure'],
                'end_measure': phrase['end_measure'],
                'notes': [n['note'] for n in phrase_notes],
                'length': phrase['length'],
                'color': phrase['color'],
                'phrase_id': phrase['phrase_id'],
                'instance_num': phrase['instance_num']
            })
            
            current_pos = phrase['end_pos'] + 1
        
        # Add any remaining notes as final transition
        if current_pos < len(skeleton_notes):
            transition_notes = skeleton_notes[current_pos:]
            sections.append({
                'type': 'transition',
                'start_pos': current_pos,
                'end_pos': len(skeleton_notes) - 1,
                'start_measure': transition_notes[0]['measure'],
                'end_measure': transition_notes[-1]['measure'],
                'notes': [n['note'] for n in transition_notes],
                'length': len(transition_notes),
                'color': '#f0f0f0',
                'phrase_id': None,
                'instance_num': None
            })
        
        return sections
    
    def create_aligned_visualization(self) -> str:
        """Create SVG with sections aligned and color-coded"""
        if not self.sections:
            self.analyze_and_segment()
        
        # Group sections by phrase_id for alignment
        phrase_groups = {}
        transitions = []
        
        for section in self.sections:
            if section['type'] == 'phrase':
                phrase_id = section['phrase_id']
                if phrase_id not in phrase_groups:
                    phrase_groups[phrase_id] = []
                phrase_groups[phrase_id].append(section)
            else:
                transitions.append(section)
        
        # Calculate layout dimensions
        max_instances = max(len(group) for group in phrase_groups.values()) if phrase_groups else 1
        section_height = 80
        instance_spacing = 100
        margin = 50
        
        svg_width = 1200
        svg_height = margin * 2 + len(phrase_groups) * (max_instances * instance_spacing + section_height)
        
        # Start SVG
        svg = [
            f'<svg width="{svg_width}" height="{svg_height}" xmlns="http://www.w3.org/2000/svg">',
            '<style>',
            '.section-bg { opacity: 0.2; }',
            '.section-border { fill: none; stroke-width: 2; }',
            '.section-label { font-family: Arial; font-size: 14px; font-weight: bold; }',
            '.note-text { font-family: Arial; font-size: 12px; }',
            '.measure-label { font-family: Arial; font-size: 10px; fill: #666; }',
            '</style>',
            f'<rect width="{svg_width}" height="{svg_height}" fill="white"/>',
            
            # Title
            '<text x="20" y="30" style="font-family: Arial; font-size: 24px; font-weight: bold; fill: purple;">',
            'Bà rằng bà rí - Sectional Analysis</text>',
            '<text x="20" y="50" style="font-family: Arial; font-size: 14px; fill: #666;">',
            'Identical phrases aligned and color-coded</text>',
        ]
        
        current_y = margin + 80
        
        # Draw phrase groups
        for phrase_idx, (phrase_id, instances) in enumerate(phrase_groups.items()):
            group_y = current_y
            
            # Group header
            svg.append(f'<text x="20" y="{group_y - 10}" class="section-label" fill="{instances[0]["color"]}">',)
            svg.append(f'{phrase_id.replace("_", " ").title()} ({len(instances)} instances)</text>')
            
            # Draw each instance
            for inst_idx, instance in enumerate(instances):
                y_pos = group_y + inst_idx * instance_spacing
                
                # Background rectangle with 20% opacity
                rect_width = min(800, len(instance['notes']) * 40 + 40)
                svg.append(f'<rect x="100" y="{y_pos - 15}" width="{rect_width}" height="{section_height - 10}" ')
                svg.append(f'fill="{instance["color"]}" class="section-bg"/>')
                
                # Border
                svg.append(f'<rect x="100" y="{y_pos - 15}" width="{rect_width}" height="{section_height - 10}" ')
                svg.append(f'stroke="{instance["color"]}" class="section-border"/>')
                
                # Instance label
                svg.append(f'<text x="20" y="{y_pos + 10}" class="note-text">Instance {instance["instance_num"] + 1}</text>')
                svg.append(f'<text x="20" y="{y_pos + 25}" class="measure-label">M{instance["start_measure"]}-{instance["end_measure"]}</text>')
                
                # Notes
                note_x = 120
                for note in instance['notes']:
                    svg.append(f'<text x="{note_x}" y="{y_pos + 10}" class="note-text">{note}</text>')
                    note_x += 40
            
            current_y += max_instances * instance_spacing + section_height + 40
        
        # Add transitions section
        if transitions:
            svg.append(f'<text x="20" y="{current_y}" class="section-label" fill="#999">Transitional Sections</text>')
            current_y += 30
            
            for i, transition in enumerate(transitions):
                y_pos = current_y + i * 60
                
                # Background rectangle
                rect_width = min(600, len(transition['notes']) * 30 + 40)
                svg.append(f'<rect x="100" y="{y_pos - 10}" width="{rect_width}" height="40" ')
                svg.append(f'fill="{transition["color"]}" opacity="0.3"/>')
                
                # Label
                svg.append(f'<text x="20" y="{y_pos + 10}" class="note-text">Transition {i + 1}</text>')
                svg.append(f'<text x="20" y="{y_pos + 25}" class="measure-label">M{transition["start_measure"]}-{transition["end_measure"]}</text>')
                
                # Notes
                note_x = 120
                for note in transition['notes'][:15]:  # Limit display
                    svg.append(f'<text x="{note_x}" y="{y_pos + 10}" class="note-text" fill="#666">{note}</text>')
                    note_x += 30
                
                if len(transition['notes']) > 15:
                    svg.append(f'<text x="{note_x}" y="{y_pos + 10}" class="note-text" fill="#666">...</text>')
        
        svg.append('</svg>')
        return '\n'.join(svg)
    
    def save_aligned_visualization(self, output_file: str = None):
        """Save the aligned visualization to SVG file"""
        if output_file is None:
            output_file = 'SVG_Output/sectional_analysis.svg'
        
        svg_content = self.create_aligned_visualization()
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(svg_content)
        
        print(f"✅ Sectional analysis saved to {output_file}")
        return output_file
    
    def print_section_summary(self):
        """Print summary of sections found"""
        if not self.sections:
            self.analyze_and_segment()
        
        print(f"\n🎵 SECTIONAL ANALYSIS SUMMARY")
        print(f"Total sections: {len(self.sections)}")
        print("=" * 60)
        
        phrase_counts = {}
        for section in self.sections:
            if section['type'] == 'phrase':
                phrase_id = section['phrase_id']
                phrase_counts[phrase_id] = phrase_counts.get(phrase_id, 0) + 1
        
        print(f"\n📊 Phrase Statistics:")
        for phrase_id, count in phrase_counts.items():
            color = self.phrase_colors.get(phrase_id, '#000000')
            print(f"   {phrase_id}: {count} instances (color: {color})")
        
        print(f"\n📝 Section Details:")
        for i, section in enumerate(self.sections, 1):
            if section['type'] == 'phrase':
                print(f"   {i}. {section['phrase_id']} instance {section['instance_num'] + 1} "
                      f"(M{section['start_measure']}-{section['end_measure']}, {section['length']} notes)")
            else:
                print(f"   {i}. Transition (M{section['start_measure']}-{section['end_measure']}, {section['length']} notes)")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Create sectional analysis of MusicXML')
    parser.add_argument('input_file', help='Input MusicXML file')
    parser.add_argument('-o', '--output', help='Output SVG file', default='SVG_Output/sectional_analysis.svg')
    
    args = parser.parse_args()
    
    # Create aligner and analyze
    aligner = SectionAligner(args.input_file)
    
    print(f"🎵 Creating sectional analysis for: {args.input_file}")
    
    # Analyze and create visualization
    aligner.analyze_and_segment()
    aligner.print_section_summary()
    aligner.save_aligned_visualization(args.output)

if __name__ == '__main__':
    main()