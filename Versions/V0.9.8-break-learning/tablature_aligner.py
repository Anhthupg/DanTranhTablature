#!/usr/bin/env python3
"""
Tablature Aligner - Creates vertically aligned tablature with identical phrases stacked
Takes existing tablature and rearranges it to show formal structure
"""

from custom_pattern_detector import CustomPatternDetector
from musicxml_to_dantranh import DanTranhConverter
import xml.etree.ElementTree as ET
from typing import List, Dict, Tuple
import colorsys
import re

class TablatureAligner:
    def __init__(self, musicxml_file: str):
        self.musicxml_file = musicxml_file
        self.detector = CustomPatternDetector(musicxml_file)
        self.converter = DanTranhConverter()
        self.all_notes = []  # Include grace notes for tablature
        self.sections = []
        self.phrase_colors = {}
        
    def detect_instance_differences(self, phrase_groups: Dict) -> Dict:
        """Detect differences between instances within each phrase group"""
        difference_analysis = {}
        
        for phrase_id, instances in phrase_groups.items():
            if len(instances) <= 1:
                continue
                
            # Extract skeleton notes for alignment (main notes only, no grace notes)
            instance_skeletons = []
            for idx, instance in enumerate(instances):
                skeleton = []
                for note in instance['notes']:
                    if not note.get('is_grace', False):
                        skeleton.append(note['note'])
                instance_skeletons.append(skeleton)
            
            # Use the pattern detection positions to align properly
            # The pattern detector found these as matching, so we trust its alignment
            reference_skeleton = instance_skeletons[0]
            
            differences = {}
            for i, instance in enumerate(instances):
                instance_skeleton = instance_skeletons[i]
                full_instance_notes = instance['notes']
                
                # If this instance was detected as a pattern match, 
                # it means the skeleton notes align even if there are missing notes at the beginning
                
                # Check if instance starts later (missing initial notes)
                offset = 0
                
                # Compare the actual content to find alignment
                if i > 0:
                    # Check if the patterns align but one starts later
                    ref_full_notes = instances[0]['notes']
                    
                    # Try to find where this instance's pattern starts in the reference
                    # by comparing skeleton notes
                    if len(instance_skeleton) > 0 and len(reference_skeleton) > 0:
                        # Check if instance skeleton matches a subsequence of reference
                        for start_idx in range(len(reference_skeleton)):
                            if start_idx + len(instance_skeleton) <= len(reference_skeleton):
                                ref_subseq = reference_skeleton[start_idx:start_idx + len(instance_skeleton)]
                                if ref_subseq == instance_skeleton:
                                    # Found alignment - instance starts at start_idx in reference
                                    offset = start_idx
                                    break
                        
                        # Also check the reverse - if reference is shorter (instance has extra at beginning)
                        if offset == 0 and len(instance_skeleton) > len(reference_skeleton):
                            for start_idx in range(len(instance_skeleton)):
                                if start_idx + len(reference_skeleton) <= len(instance_skeleton):
                                    inst_subseq = instance_skeleton[start_idx:start_idx + len(reference_skeleton)]
                                    if inst_subseq == reference_skeleton:
                                        # Instance has extra notes at beginning
                                        offset = -start_idx
                                        break
                
                # Now compare with proper alignment
                note_differences = []
                ref_full_notes = instances[0]['notes']
                
                # Handle missing notes at the beginning
                if offset > 0:
                    # Find which actual notes are missing (not just skeleton)
                    # Count full notes up to the offset skeleton note
                    missing_count = 0
                    skeleton_count = 0
                    for j, ref_note in enumerate(ref_full_notes):
                        if not ref_note.get('is_grace', False):
                            if skeleton_count >= offset:
                                break
                            skeleton_count += 1
                        if skeleton_count <= offset:
                            note_differences.append({
                                'position': j,
                                'reference': ref_note['note'],
                                'instance': None,
                                'type': 'deletion'  # Missing note at beginning
                            })
                            missing_count += 1
                
                # Since skeletons match, compare full notes directly
                # The differences are in grace notes or other ornaments
                max_len = max(len(ref_full_notes), len(full_instance_notes))
                
                # Simple direct comparison since patterns were detected as matching
                for j in range(max_len):
                    ref_note = ref_full_notes[j]['note'] if j < len(ref_full_notes) else None
                    inst_note = full_instance_notes[j]['note'] if j < len(full_instance_notes) else None
                    
                    if ref_note != inst_note:
                        # Check if this is a grace note difference
                        ref_is_grace = ref_full_notes[j].get('is_grace', False) if j < len(ref_full_notes) else False
                        inst_is_grace = full_instance_notes[j].get('is_grace', False) if j < len(full_instance_notes) else False
                        
                        note_differences.append({
                            'position': j,
                            'reference': ref_note,
                            'instance': inst_note,
                            'type': 'grace_difference' if (ref_is_grace or inst_is_grace) else
                                   ('substitution' if ref_note and inst_note else 
                                    'insertion' if inst_note else 'deletion')
                        })
                
                differences[i] = {
                    'note_differences': note_differences,
                    'similarity': 1.0 - (len(note_differences) / max_len) if max_len > 0 else 1.0,
                    'is_exact_match': len(note_differences) == 0,
                    'alignment_offset': offset
                }
            
            difference_analysis[phrase_id] = differences
        
        return difference_analysis

    def analyze_structure(self):
        """Analyze the musical structure using pattern detection"""
        # Find user-specified patterns
        patterns = self.detector.analyze_patterns()
        
        # Get the converted notes from the detector (already has slur-to-tie conversion applied)
        self.all_notes = self.detector.all_notes
        
        # Map patterns to full note positions with grace notes
        self.sections = self.detector.map_to_full_notes(patterns)
        
        return self.sections
    
    def create_position_mapping(self) -> Dict[int, int]:
        """Map skeleton note positions to full note list positions"""
        mapping = {}
        skeleton_idx = 0
        
        for full_idx, note in enumerate(self.all_notes):
            if not note.get('is_grace', False):
                mapping[skeleton_idx] = full_idx
                skeleton_idx += 1
        
        return mapping
    
    def generate_phrase_color(self, index: int) -> str:
        """Generate distinct colors for different phrase types"""
        colors = [
            "#ff9999",  # Light red
            "#99ff99",  # Light green  
            "#9999ff",  # Light blue
            "#ffff99",  # Light yellow
            "#ff99ff",  # Light magenta
            "#99ffff",  # Light cyan
            "#ffcc99",  # Light orange
            "#cc99ff"   # Light purple
        ]
        return colors[index % len(colors)]
    
    def create_tablature_sections(self, patterns: List[Dict], skeleton_to_full: Dict[int, int]) -> List[Dict]:
        """Create sections based on detected patterns, mapped to full notes"""
        sections = []
        phrase_instances = []
        
        # Convert patterns to full note positions
        for i, pattern in enumerate(patterns):
            color = self.generate_phrase_color(i)
            self.phrase_colors[f"phrase_{i}"] = color
            
            # Original occurrence
            start_full = skeleton_to_full.get(pattern['original_occurrence']['start_position'])
            end_full = skeleton_to_full.get(pattern['original_occurrence']['end_position'])
            
            if start_full is not None and end_full is not None:
                # Check for grace notes before the first skeleton note
                actual_start = start_full
                while actual_start > 0 and self.all_notes[actual_start - 1].get('is_grace', False):
                    actual_start -= 1
                
                # Find the actual end position (including any grace notes after the last skeleton note)
                # Look for next skeleton note position to find boundary
                next_skeleton_pos = pattern['original_occurrence']['end_position'] + 1
                next_full = skeleton_to_full.get(next_skeleton_pos, len(self.all_notes))
                # Get all notes from start to just before next skeleton note
                actual_notes = self.all_notes[actual_start:next_full]
                phrase_instances.append({
                    'phrase_id': f"phrase_{i}",
                    'start_pos': actual_start,
                    'end_pos': end_full,
                    'length': pattern['length'],
                    'color': color,
                    'instance_num': 0,
                    'notes': actual_notes  # Use actual notes, not skeleton
                })
            
            # Matches
            for j, match in enumerate(pattern['matches']):
                start_full = skeleton_to_full.get(match['start_position'])
                end_full = skeleton_to_full.get(match['end_position'])
                
                if start_full is not None and end_full is not None:
                    # Check for grace notes before the first skeleton note
                    actual_start = start_full
                    while actual_start > 0 and self.all_notes[actual_start - 1].get('is_grace', False):
                        actual_start -= 1
                    
                    # Find the actual end position (including any grace notes after the last skeleton note)
                    # Look for next skeleton note position to find boundary
                    next_skeleton_pos = match['end_position'] + 1
                    next_full = skeleton_to_full.get(next_skeleton_pos, len(self.all_notes))
                    # Get all notes from start to just before next skeleton note
                    actual_notes = self.all_notes[actual_start:next_full]
                    phrase_instances.append({
                        'phrase_id': f"phrase_{i}",
                        'start_pos': actual_start,
                        'end_pos': end_full,
                        'length': pattern['length'],
                        'color': color,
                        'instance_num': j + 1,
                        'notes': actual_notes  # Use actual notes, not skeleton
                    })
        
        # Sort by position
        phrase_instances.sort(key=lambda x: x['start_pos'])
        
        # Create sections with transitions
        current_pos = 0
        
        for phrase in phrase_instances:
            # Add transition before this phrase
            if current_pos < phrase['start_pos']:
                transition_notes = self.all_notes[current_pos:phrase['start_pos']]
                sections.append({
                    'type': 'transition',
                    'start_pos': current_pos,
                    'end_pos': phrase['start_pos'] - 1,
                    'notes': transition_notes,
                    'color': '#f0f0f0',
                    'phrase_id': None,
                    'instance_num': None
                })
            
            # Add the phrase section
            phrase_notes = self.all_notes[phrase['start_pos']:phrase['end_pos'] + 1]
            sections.append({
                'type': 'phrase',
                'start_pos': phrase['start_pos'],
                'end_pos': phrase['end_pos'],
                'notes': phrase_notes,
                'color': phrase['color'],
                'phrase_id': phrase['phrase_id'],
                'instance_num': phrase['instance_num']
            })
            
            current_pos = phrase['end_pos'] + 1
        
        # Add final transition if needed
        if current_pos < len(self.all_notes):
            transition_notes = self.all_notes[current_pos:]
            sections.append({
                'type': 'transition',
                'start_pos': current_pos,
                'end_pos': len(self.all_notes) - 1,
                'notes': transition_notes,
                'color': '#f0f0f0',
                'phrase_id': None,
                'instance_num': None
            })
        
        return sections
    
    def create_aligned_tablature_svg(self) -> str:
        """Create aligned tablature SVG with identical phrases stacked vertically"""
        if not self.sections:
            self.analyze_structure()
        
        # Calculate global duration unit for consistency (like V0.1.0)
        all_durations = []
        for section in self.sections:
            for note in section['notes']:
                if isinstance(note, dict):
                    all_durations.append(note.get('duration', 1))
        
        if all_durations:
            # Use same logic as V0.1.0: consistent unit across entire piece
            # Set eighth note (0.5 duration) = 10 pixels, so duration_unit = 20
            self.global_duration_unit = 20  # pixels per duration unit (0.5 * 20 = 10 for eighth notes)
        else:
            self.global_duration_unit = 20
        
        # Group sections by phrase type for vertical alignment
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
        
        # Detect differences between instances
        self.difference_analysis = self.detect_instance_differences(phrase_groups)
        
        # Get strings used (reuse converter logic)
        self.converter.used_strings = set()
        for note in self.all_notes:
            if not note.get('is_grace', False):
                string_num, _ = self.converter.find_best_string(note['note'])
                self.converter.used_strings.add(string_num)
        
        # Calculate layout
        section_width = 800
        section_height = len(self.converter.used_strings) * 40 + 100
        instance_spacing = section_height + 50
        group_spacing = 100
        margin = 50
        
        total_groups = len(phrase_groups) + (1 if transitions else 0)
        max_instances = max(len(group) for group in phrase_groups.values()) if phrase_groups else 1
        
        svg_width = max(1800, section_width + margin * 2)  # Increase width for better readability
        svg_height = margin * 2 + total_groups * (max_instances * instance_spacing + group_spacing)
        
        # Start SVG
        svg = [
            f'<svg width="{svg_width}" height="{svg_height}" xmlns="http://www.w3.org/2000/svg">',
            '<defs>',
            # Reuse gradients from main converter
            '<linearGradient id="resonanceBand" x1="0%" y1="0%" x2="100%" y2="0%">',
            '<stop offset="0%" style="stop-color:#008080;stop-opacity:1.0"/>',
            '<stop offset="25%" style="stop-color:#008080;stop-opacity:0.7"/>',
            '<stop offset="50%" style="stop-color:#008080;stop-opacity:0.4"/>',
            '<stop offset="75%" style="stop-color:#008080;stop-opacity:0.2"/>',
            '<stop offset="100%" style="stop-color:#008080;stop-opacity:0.0"/>',
            '</linearGradient>',
            '<style>',
            '.string-line { stroke: #008ECC; stroke-width: 2; }',
            '.string-label { font-family: Arial; font-size: 12px; fill: #008ECC; }',
            '.title { font-family: Arial; font-size: 20px; font-weight: bold; fill: purple; }',
            '.string-number { font-family: Arial; font-size: 10px; fill: white; font-weight: bold; }',
            '.section-bg { opacity: 0.2; }',
            '.group-label { font-family: Arial; font-size: 16px; font-weight: bold; }',
            '.instance-label { font-family: Arial; font-size: 12px; fill: #666; }',
            '</style>',
            '</defs>',
            
            f'<rect width="{svg_width}" height="{svg_height}" fill="floralwhite"/>',
            
            # Title
            '<text x="20" y="30" class="title">Bà rằng bà rí - Aligned Tablature Analysis</text>',
            '<text x="20" y="50" style="font-family: Arial; font-size: 14px; fill: #666;">Identical phrases stacked vertically with difference highlighting</text>',
            
            # Difference Legend
            '<rect x="20" y="60" width="800" height="25" fill="#f8f8f8" stroke="#ccc" stroke-width="1" rx="5"/>',
            '<text x="30" y="75" style="font-family: Arial; font-size: 12px; font-weight: bold; fill: black;">DIFFERENCE COLORS:</text>',
            '<circle cx="180" cy="72" r="8" fill="#008080" stroke="crimson" stroke-width="2"/>',
            '<text x="195" y="76" style="font-family: Arial; font-size: 11px; fill: black;">Exact match</text>',
            '<circle cx="290" cy="72" r="8" fill="#FF6B35" stroke="#FF0000" stroke-width="4"/>',
            '<text x="305" y="76" style="font-family: Arial; font-size: 11px; fill: black;">Substitution</text>',
            '<circle cx="400" cy="72" r="8" fill="#32CD32" stroke="#228B22" stroke-width="4"/>',
            '<text x="415" y="76" style="font-family: Arial; font-size: 11px; fill: black;">Insertion</text>',
        ]
        
        current_y = margin + 110  # Adjust for legend
        
        # Draw phrase groups
        for group_idx, (phrase_id, instances) in enumerate(phrase_groups.items()):
            group_color = instances[0]['color']
            
            # Group header
            svg.append(f'<text x="20" y="{current_y - 10}" class="group-label" fill="{group_color}">')
            svg.append(f'{phrase_id.replace("_", " ").title()} - {len(instances)} instances</text>')
            
            # Calculate max grace note padding needed for alignment
            max_grace_padding = 0
            for instance in instances:
                # Count grace notes at the beginning
                grace_count = 0
                for note in instance['notes']:
                    if note.get('is_grace', False):
                        grace_count += 1
                    else:
                        break
                # Grace notes take 50% space
                grace_padding = grace_count * 10  # 0.5 * 20 = 10 pixels per grace note
                max_grace_padding = max(max_grace_padding, grace_padding)
            
            # Draw each instance as a mini tablature
            for inst_idx, instance in enumerate(instances):
                instance_y = current_y + inst_idx * instance_spacing
                
                # Calculate this instance's grace note padding
                instance_grace_count = 0
                for note in instance['notes']:
                    if note.get('is_grace', False):
                        instance_grace_count += 1
                    else:
                        break
                instance_grace_padding = instance_grace_count * 10
                
                # Calculate x-offset to align first main note
                x_offset = max_grace_padding - instance_grace_padding
                
                # Get difference info for this instance
                phrase_id = instance['phrase_id']
                instance_num = instance['instance_num']
                differences = self.difference_analysis.get(phrase_id, {}).get(instance_num, {'note_differences': [], 'is_exact_match': True})
                
                # Instance label with similarity info
                similarity = differences.get('similarity', 1.0)
                is_exact = differences.get('is_exact_match', True)
                
                if is_exact:
                    label_text = f'Instance {instance["instance_num"] + 1} (Exact match)'
                    label_color = '#666'
                else:
                    label_text = f'Instance {instance["instance_num"] + 1} ({similarity:.1%} similar)'
                    label_color = '#FF6B35'  # Orange for variations
                
                svg.append(f'<text x="20" y="{instance_y + 10}" class="instance-label" fill="{label_color}">{label_text}</text>')
                
                # Create full tablature section with x-offset for alignment
                full_svg, actual_width = self.create_full_tablature_section(instance['notes'], instance_y, group_color, self.global_duration_unit, differences, x_offset)
                
                # Draw single dynamic colored background with 20% opacity based on actual note durations
                dynamic_bg_width = max(200, actual_width + x_offset + 50)  # Include offset in width
                svg.append(f'<rect x="100" y="{instance_y - 20}" width="{dynamic_bg_width}" height="{section_height + 40}" ')
                svg.append(f'fill="{group_color}" opacity="0.2"/>')
                
                # Add the tablature SVG
                svg.extend(full_svg)
            
            current_y += max_instances * instance_spacing + group_spacing
        
        # Draw transitions section
        if transitions:
            svg.append(f'<text x="20" y="{current_y - 10}" class="group-label" fill="#999">Transitions</text>')
            
            for i, transition in enumerate(transitions):
                instance_y = current_y + i * (instance_spacing // 2)
                
                # Label
                svg.append(f'<text x="20" y="{instance_y + 10}" class="instance-label">Transition {i + 1}</text>')
                
                # Full tablature for transition
                full_svg, actual_width = self.create_full_tablature_section(transition['notes'], instance_y, '#f0f0f0', self.global_duration_unit)
                
                # Draw single dynamic background for transition
                dynamic_bg_width = max(150, actual_width + 30)
                svg.append(f'<rect x="100" y="{instance_y - 20}" width="{dynamic_bg_width}" height="{section_height + 40}" ')
                svg.append(f'fill="#f0f0f0" opacity="0.3"/>')
                
                svg.extend(full_svg)
        
        svg.append('</svg>')
        return '\n'.join(svg)
    
    def create_full_tablature_section(self, notes: List[Dict], y_offset: int, bg_color: str, global_duration_unit: int = 20, differences: Dict = None, x_offset: int = 0) -> Tuple[List[str], float]:
        """Create a full-fidelity tablature section maintaining all V0.1.0 visual elements"""
        section_svg = []
        
        # Notes already have slur-to-tie conversion applied
        corrected_notes = notes
        
        # Initialize differences if not provided
        if differences is None:
            differences = {'note_differences': [], 'is_exact_match': True}
        
        # Create mapping of note positions to differences
        diff_positions = {}
        for diff in differences.get('note_differences', []):
            diff_positions[diff['position']] = diff
        
        # Get alignment offset if any (for missing notes at beginning)
        alignment_offset = differences.get('alignment_offset', 0)
        
        # Use global duration scaling (consistent across all sections)
        
        # Calculate string positions using V0.1.0 semitone-based spacing
        string_positions = {}
        y_start = y_offset + 50  # Leave room for headers
        
        # Use same string positioning logic as V0.1.0
        lowest_string = min(self.converter.used_strings)
        highest_string = max(self.converter.used_strings)
        
        lowest_midi = self.converter.note_to_midi_number(self.converter.default_tuning[lowest_string])
        highest_midi = self.converter.note_to_midi_number(self.converter.default_tuning[highest_string])
        pitch_range = highest_midi - lowest_midi
        
        if pitch_range > 0:
            string_spacing_unit = min(24, max(16, 300 / len(self.converter.used_strings)))
            
            for string_num in sorted(self.converter.used_strings):
                string_midi = self.converter.note_to_midi_number(self.converter.default_tuning[string_num])
                relative_position = (string_midi - lowest_midi) / pitch_range
                # Reverse: lower strings (lower pitch) = higher y-coordinate (lower on screen)
                y_pos = y_start + relative_position * pitch_range * 8
                string_positions[string_num] = y_pos
        else:
            # Fallback to equal spacing - lower strings (lower pitch) at bottom
            sorted_strings_by_pitch = sorted(self.converter.used_strings, 
                                           key=lambda s: self.converter.note_to_midi_number(self.converter.default_tuning[s]))
            for i, string_num in enumerate(sorted_strings_by_pitch):
                string_positions[string_num] = y_start + i * 24
        
        # Calculate the rightmost position for each string to make lines dynamic
        string_rightmost = {}
        current_x_temp = 120
        
        # First pass: find the rightmost note position for each string
        for note_data in corrected_notes:
            target_string, _ = self.converter.find_best_string(note_data['note'])
            if target_string in self.converter.used_strings:
                is_grace = note_data.get('is_grace', False)
                if is_grace:
                    duration = note_data.get('duration', 1)
                    note_width = duration * global_duration_unit * 0.5
                else:
                    duration = note_data.get('duration', 1)
                    note_width = duration * global_duration_unit
                
                # Include resonance band in the rightmost calculation
                if is_grace:
                    resonance_extension = 40
                else:
                    resonance_extension = 80
                
                rightmost_pos = current_x_temp + resonance_extension
                string_rightmost[target_string] = max(string_rightmost.get(target_string, 120), rightmost_pos)
                current_x_temp += note_width
        
        # Draw string lines with dynamic length (V0.1.0 style) - ordered by pitch
        sorted_strings_by_pitch = sorted(self.converter.used_strings, 
                                       key=lambda s: self.converter.note_to_midi_number(self.converter.default_tuning[s]))
        for string_num in sorted_strings_by_pitch:
            y_pos = string_positions[string_num]
            
            # Dynamic string line - extends to rightmost note + some padding
            string_end = string_rightmost.get(string_num, 200) + 20  # Add padding
            section_svg.append(f'<line x1="120" y1="{y_pos}" x2="{string_end}" y2="{y_pos}" class="string-line"/>')
            
            # String label with tuning note
            tuning_note = self.converter.default_tuning.get(string_num, f"S{string_num}")
            section_svg.append(f'<text x="20" y="{y_pos + 5}" class="string-label">String {string_num}: {tuning_note}</text>')
        
        # Draw notes with full V0.1.0 fidelity
        current_x = 120 + x_offset  # Apply alignment offset
        # Use global duration unit for consistency across ALL sections
        duration_unit = global_duration_unit
        ringing_strings = {}  # Track resonance
        max_y = max(string_positions.values()) if string_positions else y_start + 200
        
        # Slur tracking
        in_slur = False
        slur_start_pos = None
        slur_notes = []
        
        # First, draw placeholders for any deleted notes at the beginning
        if alignment_offset > 0:
            for del_idx in range(alignment_offset):
                if del_idx in diff_positions:
                    diff_info = diff_positions[del_idx]
                    if diff_info['type'] == 'deletion' and diff_info['reference']:
                        # Draw a dashed circle placeholder for the missing note
                        # Try to determine which string the deleted note would have been on
                        try:
                            del_string, _ = self.converter.find_best_string(diff_info['reference'])
                            if del_string in string_positions:
                                del_y = string_positions[del_string]
                                # Draw deletion indicator
                                section_svg.append(f'<circle cx="{current_x}" cy="{del_y}" r="10" ')
                                section_svg.append(f'fill="none" stroke="#FF0000" stroke-width="2" stroke-dasharray="3,3" opacity="0.5"/>')
                                section_svg.append(f'<text x="{current_x}" y="{del_y - 15}" text-anchor="middle" ')
                                section_svg.append(f'style="font-size: 10px; fill: #FF0000;">Missing</text>')
                                # Add note value for reference
                                section_svg.append(f'<text x="{current_x}" y="{del_y + 25}" text-anchor="middle" ')
                                section_svg.append(f'style="font-size: 9px; fill: #999;">({diff_info["reference"]})</text>')
                                current_x += 20  # Move forward for the missing note space
                        except:
                            pass  # Skip if we can't determine the string
        
        for j, note_data in enumerate(corrected_notes):
            target_string, technique = self.converter.find_best_string(note_data['note'])
            
            if target_string in self.converter.used_strings:
                y_pos = string_positions[target_string]
                
                # Check if this note position has a difference (adjust for alignment offset)
                actual_position = j + alignment_offset
                has_difference = actual_position in diff_positions
                difference_info = diff_positions.get(actual_position, {})
                
                # Handle grace notes with V0.1.0 spacing (50% of duration)
                is_grace = note_data.get('is_grace', False)
                if is_grace:
                    duration = note_data.get('duration', 1)
                    grace_spacing = duration * duration_unit * 0.5
                    x_pos = current_x
                    note_width = grace_spacing
                else:
                    duration = note_data.get('duration', 1)
                    x_pos = current_x
                    note_width = duration * duration_unit
                
                # Handle slurs (V0.1.0 logic)
                slur_type = note_data.get('slur')
                if slur_type == 'start':
                    in_slur = True
                    slur_start_pos = (x_pos, y_pos)
                    slur_notes = [(x_pos, y_pos, target_string, note_data['note'])]
                elif in_slur:
                    slur_notes.append((x_pos, y_pos, target_string, note_data['note']))
                    if slur_type == 'stop':
                        in_slur = False
                
                # Determine note colors and size (V0.1.0 logic)
                note_radius = 12
                note_fill_color = "#008080"
                note_stroke_color = "crimson"
                note_stroke_width = 2
                
                # Highlight differences with special colors
                if has_difference:
                    diff_type = difference_info.get('type', 'substitution')
                    if diff_type == 'grace_difference':
                        # Grace note differences are less important - use subtle highlighting
                        note_stroke_color = "#FFA500"  # Orange border for grace differences
                        note_stroke_width = 3
                    elif diff_type == 'substitution':
                        note_fill_color = "#FF6B35"  # Orange for substitutions
                        note_stroke_color = "#FF0000"  # Red border
                        note_stroke_width = 4
                    elif diff_type == 'insertion':
                        note_fill_color = "#32CD32"  # Lime green for insertions
                        note_stroke_color = "#228B22"  # Dark green border
                        note_stroke_width = 4
                    # Deletions are handled differently (show empty space with indicator)
                
                # Slur colors
                if slur_type == 'start':
                    note_fill_color = "#FFD700"
                    note_stroke_color = "#0066FF"
                    note_stroke_width = 4
                elif in_slur and slur_type == 'stop':
                    note_fill_color = "#FF6600"
                    note_stroke_color = "#FF0000"
                    note_stroke_width = 4
                elif in_slur and slur_type != 'start':
                    note_fill_color = "#9966FF"
                    note_stroke_color = "#FF00FF"
                    note_stroke_width = 3
                    note_radius = max(6, 12 - len(slur_notes) * 2)
                
                
                # Ornament colors
                ornaments = note_data.get('ornaments', [])
                has_ornaments = any(orn in ornaments for orn in ['trill', 'rung', 'gliss', 'mute'])
                if has_ornaments:
                    note_fill_color = "#FF1493"
                    note_stroke_color = "#8B0000"
                    note_stroke_width = 4
                
                # Grace note colors (highest priority)
                if is_grace:
                    note_radius = 6
                    grace_slash = note_data.get('grace_slash', False)
                    if grace_slash:
                        note_fill_color = "#FFD700"
                        note_stroke_color = "#FF8C00"
                    else:
                        note_fill_color = "#90EE90"
                        note_stroke_color = "#228B22"
                    note_stroke_width = 2
                
                # Check if muted
                is_muted = 'mute' in note_data.get('ornaments', [])
                
                # Draw fixed-duration resonance band starting at center of current note head
                if not is_muted:
                    # Fixed resonance band duration based on note type
                    if is_grace:
                        # Grace notes: shorter resonance band (50% of regular notes)
                        resonance_width = 40  # 50% of 80 pixels
                    else:
                        # Regular notes: full resonance band
                        resonance_width = 80  # Fixed width for regular notes
                    
                    # Start resonance band at center of current note head, on the same string line
                    section_svg.append(f'<rect x="{x_pos}" y="{y_pos - 4}" width="{resonance_width}" height="8" ')
                    section_svg.append(f'fill="url(#resonanceBand)" stroke="none" rx="2"/>')
                    
                    # Update ringing strings with current note position
                    ringing_strings[target_string] = (x_pos, y_pos)
                    
                    # Slur bending visualization
                    if in_slur and slur_start_pos and slur_type != 'start':
                        start_x, start_y = slur_start_pos
                        start_midi = self.converter.note_to_midi_number(slur_notes[0][3])
                        current_midi = self.converter.note_to_midi_number(note_data['note'])
                        bend_amount = abs(current_midi - start_midi)
                        
                        if bend_amount > 0:
                            control_x = (start_x + x_pos) / 2
                            control_y = min(start_y, y_pos) - bend_amount * 3
                            
                            section_svg.append(f'<path d="M {start_x},{start_y} Q {control_x},{control_y} {x_pos},{y_pos}" ')
                            section_svg.append(f'fill="none" stroke="url(#resonanceBand)" stroke-width="8" opacity="0.7"/>')
                    
                    # Update ringing strings with current note position  
                    ringing_strings[target_string] = (x_pos, y_pos)
                
                # Draw note circle (V0.1.0 style)
                if is_muted:
                    section_svg.append(f'<circle cx="{x_pos}" cy="{y_pos}" r="15" fill="#666" stroke="#333" stroke-width="2"/>')
                    section_svg.append(f'<text x="{x_pos}" y="{y_pos-20}" text-anchor="middle" ')
                    section_svg.append(f'style="font-size:30px; font-weight:bold; fill:red;">✕</text>')
                    if target_string in ringing_strings:
                        del ringing_strings[target_string]
                else:
                    # Draw the note circle
                    section_svg.append(f'<circle cx="{x_pos}" cy="{y_pos}" r="{note_radius}" ')
                    section_svg.append(f'fill="{note_fill_color}" stroke="{note_stroke_color}" ')
                    section_svg.append(f'stroke-width="{note_stroke_width}"/>')
                    
                    # Slur indicator
                    if in_slur and slur_type != 'start':
                        section_svg.append(f'<text x="{x_pos+15}" y="{y_pos-5}" style="font-size: 10px; fill: #999;">')
                        section_svg.append(f'(bend or pluck)</text>')
                
                # String number
                section_svg.append(f'<text x="{x_pos}" y="{y_pos+4}" text-anchor="middle" class="string-number">{target_string}</text>')
                
                # Add lyrics underneath the note (if present)
                if note_data.get('lyric'):
                    lyric_y = max(string_positions.values()) + 30
                    section_svg.append(f'<text x="{x_pos}" y="{lyric_y}" text-anchor="middle" ')
                    section_svg.append(f'style="font-family: Arial; font-size: 12px; fill: #333;">{note_data["lyric"]}</text>')
                
                # Duration label on top of note (for checking)
                duration_value = note_data.get('duration', 1)
                section_svg.append(f'<text x="{x_pos}" y="{y_pos-20}" text-anchor="middle" ')
                section_svg.append(f'style="font-family: Arial; font-size: 10px; fill: #000; font-weight: bold;">{duration_value}</text>')
                
                # Grace note slash
                if is_grace and note_data.get('grace_slash', False):
                    slash_offset = note_radius * 0.7
                    section_svg.append(f'<line x1="{x_pos-slash_offset}" y1="{y_pos+slash_offset}" ')
                    section_svg.append(f'x2="{x_pos+slash_offset}" y2="{y_pos-slash_offset}" ')
                    section_svg.append(f'stroke="#8B0000" stroke-width="2"/>')
                
                # Duration line (V0.1.0 style)
                section_svg.append(f'<line x1="{x_pos+15}" y1="{y_pos}" x2="{x_pos+note_width-5}" y2="{y_pos}" ')
                section_svg.append(f'stroke="#FF6B35" stroke-width="3" opacity="0.5" stroke-dasharray="2,2"/>')
                
                # Lyrics (V0.1.0 style)
                if note_data.get('lyric'):
                    lyric_y = max_y + 60
                    section_svg.append(f'<text x="{x_pos}" y="{lyric_y}" text-anchor="middle" ')
                    section_svg.append(f'style="font-family: Arial; font-size: 12px; fill: #333;">{note_data["lyric"]}</text>')
                
                # Ornament symbols (V0.1.0 style)
                if 'rung' in note_data.get('ornaments', []):
                    section_svg.append(f'<text x="{x_pos+15}" y="{y_pos+5}" style="font-size:16px; fill:orange;">~</text>')
                if 'trill' in note_data.get('ornaments', []):
                    section_svg.append(f'<text x="{x_pos+15}" y="{y_pos-10}" style="font-size:12px; fill:purple;">tr</text>')
                if 'gliss' in note_data.get('ornaments', []):
                    section_svg.append(f'<text x="{x_pos+15}" y="{y_pos}" style="font-size:16px; fill:blue;">/</text>')
                
                # Move to next position
                current_x += note_width
        
        # No need for final resonance bands - they have fixed duration
        
        # Return both SVG elements and actual width used
        actual_width = current_x - (120 + x_offset)  # Subtract starting x position with offset
        return section_svg, actual_width
    
    def convert_slurs_to_ties(self, notes: List[Dict]) -> List[Dict]:
        """Convert slurs between identical notes to ties, and auto-tie consecutive identical notes without new lyrics"""
        corrected_notes = []
        i = 0
        while i < len(notes):
            current_note = dict(notes[i])  # Copy the note
            
            # Check if this note starts a slur
            if current_note.get('slur') == 'start':
                # Look ahead to find the end of this slur
                slur_notes = [current_note]
                j = i + 1
                
                while j < len(notes):
                    next_note = dict(notes[j])
                    slur_type = next_note.get('slur')
                    
                    if slur_type in ['start', 'stop', 'continue']:
                        slur_notes.append(next_note)
                        
                        if slur_type == 'stop':
                            # Check if all notes in this slur are identical
                            first_note_name = current_note['note']
                            all_identical = all(note['note'] == first_note_name for note in slur_notes)
                            
                            if all_identical and len(slur_notes) > 1:
                                # This is a tie! Combine all notes into ONE single note
                                combined_note = dict(current_note)
                                combined_note['slur'] = None
                                combined_note['tie'] = None  # Remove tie marking since we're combining
                                
                                # Sum up durations of all tied notes
                                total_duration = sum(note.get('duration', 1) for note in slur_notes)
                                combined_note['duration'] = total_duration
                                combined_note['combined_from_tie'] = True
                                
                                # Keep the lyric from the first note only
                                combined_note['lyric'] = current_note.get('lyric', '')
                                
                                # Add only the combined note
                                corrected_notes.append(combined_note)
                            else:
                                # Regular slur - keep all notes
                                for note in slur_notes:
                                    corrected_notes.append(note)
                            
                            i = j + 1  # Skip past processed notes
                            break
                        j += 1
                    else:
                        j += 1
                
                if j >= len(notes):  # Slur never ended
                    corrected_notes.append(current_note)
                    i += 1
            else:
                corrected_notes.append(current_note)
                i += 1
        
        return corrected_notes
    
    def save_aligned_tablature(self, output_file: str = None):
        """Save the aligned tablature to SVG file"""
        if output_file is None:
            output_file = 'SVG_Output/aligned_tablature.svg'
        
        svg_content = self.create_aligned_tablature_svg()
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(svg_content)
        
        print(f"✅ Aligned tablature saved to {output_file}")
        return output_file

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Create aligned tablature visualization')
    parser.add_argument('input_file', help='Input MusicXML file')
    parser.add_argument('-o', '--output', help='Output SVG file', default='SVG_Output/aligned_tablature.svg')
    
    args = parser.parse_args()
    
    # Create aligner
    aligner = TablatureAligner(args.input_file)
    
    print(f"🎵 Creating aligned tablature for: {args.input_file}")
    
    # Create aligned visualization
    aligner.save_aligned_tablature(args.output)

if __name__ == '__main__':
    main()