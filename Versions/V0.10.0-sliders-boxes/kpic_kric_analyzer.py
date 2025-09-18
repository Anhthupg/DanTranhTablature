#!/usr/bin/env python3
"""
KPIC (Key Pitch in Context) and KRIC (Key Rhythm in Context) Analyzer
Inspired by Keywords in Context from linguistics - analyzes musical n-grams
"""

from typing import Dict, List, Tuple, Optional, Set
import json
from collections import defaultdict, Counter
from musicxml_to_dantranh import DanTranhConverter

class KPICKRICAnalyzer:
    def __init__(self):
        self.converter = DanTranhConverter()
        
        # Pre-computed n-gram storage
        self.pitch_ngrams = {}  # {n: {ngram_tuple: {count, positions, main/grace_info}}}
        self.rhythm_ngrams = {}  # {n: {ngram_tuple: {count, positions, main/grace_info}}}
        
        # Raw note data for analysis
        self.notes = []
        self.processed_notes = []  # After slur-to-tie conversion
        
    def _convert_slurs_to_ties_on_same_pitch(self, notes: List[Dict]) -> List[Dict]:
        """
        Convert slurs between identical pitches to ties and combine them
        This is the CRITICAL conversion for accurate analysis
        """
        converted_notes = []
        i = 0
        
        while i < len(notes):
            current_note = dict(notes[i])  # Copy the note
            
            # Check if this note starts a slur
            if current_note.get('slur') == 'start':
                # Collect all notes in this slur
                slur_notes = [current_note]
                j = i + 1
                
                while j < len(notes) and j < i + 20:  # Safety limit
                    next_note = notes[j]
                    
                    # Include grace notes that come before the slur end
                    if next_note.get('is_grace'):
                        slur_notes.append(dict(next_note))
                        j += 1
                        continue
                    
                    slur_notes.append(dict(next_note))
                    
                    if next_note.get('slur') == 'stop':
                        break
                    j += 1
                
                # Check if all non-grace notes have the same pitch
                main_notes = [n for n in slur_notes if not n.get('is_grace')]
                if main_notes:
                    first_pitch = main_notes[0]['note']
                    all_same_pitch = all(n['note'] == first_pitch for n in main_notes)
                    
                    if all_same_pitch and len(main_notes) > 1:
                        # Combine into single note with combined duration
                        combined_note = dict(main_notes[0])
                        combined_duration = sum(n['duration'] for n in main_notes)
                        combined_note['duration'] = combined_duration
                        
                        # Keep first lyric if any
                        for n in main_notes:
                            if n.get('lyric'):
                                combined_note['lyric'] = n['lyric']
                                break
                        
                        # Remove slur markings
                        combined_note.pop('slur', None)
                        
                        # Add any grace notes that were part of this
                        grace_notes = [n for n in slur_notes if n.get('is_grace')]
                        converted_notes.extend(grace_notes)
                        converted_notes.append(combined_note)
                        
                        # Skip all the combined notes
                        i = j + 1
                        continue
            
            # Also check for consecutive same-pitch notes without explicit slur
            # (This handles implicit ties)
            if not current_note.get('is_grace') and i + 1 < len(notes):
                next_note = notes[i + 1]
                if (not next_note.get('is_grace') and 
                    next_note['note'] == current_note['note'] and
                    not next_note.get('lyric')):  # No new lyric means continuation
                    
                    # Combine them
                    combined_note = dict(current_note)
                    combined_note['duration'] = current_note['duration'] + next_note['duration']
                    converted_notes.append(combined_note)
                    i += 2
                    continue
            
            # Normal case - just add the note
            converted_notes.append(current_note)
            i += 1
        
        return converted_notes

    def analyze_musicxml(self, file_path: str, max_n: int = None) -> Dict:
        """
        Pre-compute all n-grams up to max_n for both pitch and rhythm
        
        Args:
            file_path: Path to MusicXML file
            max_n: Maximum n-gram size to compute (None = full song length)
            
        Returns:
            Analysis results summary
        """
        print(f"Analyzing {file_path}...")
        
        # Parse and process notes
        self.notes = self.converter.parse_musicxml(file_path)
        self.processed_notes = self._convert_slurs_to_ties_on_same_pitch(self.notes)
        
        # Extract pitch and rhythm sequences
        pitch_sequence = self._extract_pitch_sequence()
        rhythm_sequence = self._extract_rhythm_sequence()
        
        # Default to full song length if not specified
        if max_n is None:
            max_n = len(self.processed_notes)
            print(f"Computing n-grams up to full song length: {max_n}")
        else:
            print(f"Computing n-grams up to n={max_n}")
        
        # Pre-compute all n-grams
        self._compute_pitch_ngrams(pitch_sequence, max_n)
        self._compute_rhythm_ngrams(rhythm_sequence, max_n)
        
        return {
            'total_notes': len(self.processed_notes),
            'pitch_ngrams_computed': sum(len(ngrams) for ngrams in self.pitch_ngrams.values()),
            'rhythm_ngrams_computed': sum(len(ngrams) for ngrams in self.rhythm_ngrams.values()),
            'max_n': max_n,
            'song_length': len(self.processed_notes)
        }
    
    def _extract_pitch_sequence(self) -> List[Tuple[str, float, str]]:
        """
        Extract pitch sequence with MIDI values and note type
        Returns: [(note_name, midi_value, note_type), ...]
        note_type: 'main' or 'grace'
        """
        sequence = []
        for note in self.processed_notes:
            midi_value = self.converter.note_to_midi_number(note['note'])
            note_type = 'grace' if note.get('is_grace', False) else 'main'
            sequence.append((note['note'], midi_value, note_type))
        return sequence
    
    def _extract_rhythm_sequence(self) -> List[Tuple[float, str]]:
        """
        Extract rhythm sequence with duration and note type
        Grace notes preserve their actual durations (no artificial scaling)
        Returns: [(duration, note_type), ...]
        """
        sequence = []
        for note in self.processed_notes:
            note_type = 'grace' if note.get('is_grace', False) else 'main'
            # Use actual duration - no artificial scaling for grace notes
            actual_duration = note['duration']
            sequence.append((actual_duration, note_type))
        return sequence
    
    def _compute_pitch_ngrams(self, pitch_sequence: List[Tuple], max_n: int):
        """Pre-compute all pitch n-grams from 1 to max_n"""
        for n in range(1, max_n + 1):
            self.pitch_ngrams[n] = {}
            
            for i in range(len(pitch_sequence) - n + 1):
                ngram = tuple(pitch_sequence[i:i+n])
                
                # Create key using just note names for grouping
                key = tuple(item[0] for item in ngram)
                
                if key not in self.pitch_ngrams[n]:
                    self.pitch_ngrams[n][key] = {
                        'count': 0,
                        'positions': [],
                        'midi_values': tuple(item[1] for item in ngram),
                        'note_types': tuple(item[2] for item in ngram),
                        'has_grace': any(item[2] == 'grace' for item in ngram),
                        'all_main': all(item[2] == 'main' for item in ngram)
                    }
                
                self.pitch_ngrams[n][key]['count'] += 1
                self.pitch_ngrams[n][key]['positions'].append(i)
    
    def _compute_rhythm_ngrams(self, rhythm_sequence: List[Tuple], max_n: int):
        """Pre-compute all rhythm n-grams from 1 to max_n"""
        for n in range(1, max_n + 1):
            self.rhythm_ngrams[n] = {}
            
            for i in range(len(rhythm_sequence) - n + 1):
                ngram = tuple(rhythm_sequence[i:i+n])
                
                # Create key using just durations for grouping
                key = tuple(item[0] for item in ngram)
                
                if key not in self.rhythm_ngrams[n]:
                    self.rhythm_ngrams[n][key] = {
                        'count': 0,
                        'positions': [],
                        'note_types': tuple(item[1] for item in ngram),
                        'has_grace': any(item[1] == 'grace' for item in ngram),
                        'all_main': all(item[1] == 'main' for item in ngram)
                    }
                
                self.rhythm_ngrams[n][key]['count'] += 1
                self.rhythm_ngrams[n][key]['positions'].append(i)
    
    def query_pitch_ngrams(self, n: int = 1, min_count: int = 1, 
                          main_only: bool = False, has_grace: bool = None,
                          analysis_mode: str = 'full') -> List[Dict]:
        """
        Query pitch n-grams with musical analysis modes
        
        Args:
            n: n-gram size (1, 2, 3, etc.)
            min_count: minimum occurrence count  
            main_only: if True, only return n-grams with all main notes
            has_grace: if True, only n-grams with grace notes; if False, no grace notes
            analysis_mode: 'full' (all notes), 'main_melody' (main notes only), 
                          'grace_units' (grace+main grouped as single units)
            
        Note: Grace notes are ornamental attachments to main notes.
        analysis_mode respects this musical relationship.
        
        Returns:
            List of matching n-grams sorted by frequency
        """
        if n not in self.pitch_ngrams:
            return []
        
        if analysis_mode == 'main_melody':
            # Analyze only main melody (grace notes excluded)
            main_melody = self.get_melodic_backbone(include_grace_context=False)
            return self._analyze_backbone_ngrams(main_melody, n, min_count, 'pitch')
            
        elif analysis_mode == 'grace_units':
            # Analyze grace+main units as single elements
            grace_units = self.get_melodic_backbone(include_grace_context=True)
            return self._analyze_backbone_ngrams(grace_units, n, min_count, 'pitch')
        
        else:  # analysis_mode == 'full'
            # Original full analysis using pre-computed n-grams
            results = []
            for ngram, data in self.pitch_ngrams[n].items():
                if data['count'] < min_count:
                    continue
                if main_only and not data['all_main']:
                    continue
                if has_grace is not None and data['has_grace'] != has_grace:
                    continue
                
                results.append({
                    'ngram': ngram,
                    'count': data['count'],
                    'positions': data['positions'],
                    'midi_values': data['midi_values'],
                    'note_types': data['note_types'],
                    'has_grace': data['has_grace']
                })
            
            return sorted(results, key=lambda x: x['count'], reverse=True)
    
    def query_rhythm_ngrams(self, n: int = 1, min_count: int = 1,
                           main_only: bool = False, has_grace: bool = None,
                           analysis_mode: str = 'full') -> List[Dict]:
        """
        Query rhythm n-grams with musical analysis modes
        
        Args:
            n: n-gram size (1, 2, 3, etc.)
            min_count: minimum occurrence count
            main_only: if True, only return n-grams with all main notes
            has_grace: if True, only n-grams with grace notes; if False, no grace notes
            analysis_mode: 'full' (all notes), 'main_melody' (main notes only), 
                          'grace_units' (grace+main grouped as single units)
            
        Note: Grace notes are ornamental attachments to main notes.
        analysis_mode respects this musical relationship.
        
        Returns:
            List of matching n-grams sorted by frequency
        """
        if analysis_mode == 'main_melody':
            # Analyze only main melody (grace notes excluded)
            main_melody = self.get_melodic_backbone(include_grace_context=False)
            return self._analyze_backbone_ngrams(main_melody, n, min_count, 'rhythm')
            
        elif analysis_mode == 'grace_units':
            # Analyze grace+main units as single elements
            grace_units = self.get_melodic_backbone(include_grace_context=True)
            return self._analyze_backbone_ngrams(grace_units, n, min_count, 'rhythm')
        
        else:  # analysis_mode == 'full'
            # Original full analysis using pre-computed n-grams
            if n not in self.rhythm_ngrams:
                return []
            
            results = []
            for ngram, data in self.rhythm_ngrams[n].items():
                if data['count'] < min_count:
                    continue
                if main_only and not data['all_main']:
                    continue
                if has_grace is not None and data['has_grace'] != has_grace:
                    continue
                
                results.append({
                    'ngram': ngram,
                    'count': data['count'],
                    'positions': data['positions'],
                    'note_types': data['note_types'],
                    'has_grace': data['has_grace']
                })
            
            return sorted(results, key=lambda x: x['count'], reverse=True)
    
    def get_ornamentation_statistics(self) -> Dict:
        """
        Generate statistics about which pitches and syllables receive grace note ornamentation
        
        Returns:
            Dictionary with ornamentation statistics by pitch and syllable
        """
        grace_clusters = self.analyze_grace_note_clusters()
        
        # Statistics by pitch
        pitch_stats = {}
        syllable_stats = {}
        
        for cluster in grace_clusters:
            if cluster['main_note']:
                main_pitch = cluster['main_note']['note']
                main_syllable = cluster['main_note'].get('lyric', '')
                
                # Count by pitch
                if main_pitch not in pitch_stats:
                    pitch_stats[main_pitch] = {
                        'total_occurrences': 0,
                        'ornamented_occurrences': 0,
                        'grace_note_count': 0,
                        'grace_types': []
                    }
                
                pitch_stats[main_pitch]['ornamented_occurrences'] += 1
                pitch_stats[main_pitch]['grace_note_count'] += len(cluster['grace_notes'])
                
                # Record grace note types
                for grace in cluster['grace_notes']:
                    grace_pitch = grace['note']
                    if grace_pitch not in pitch_stats[main_pitch]['grace_types']:
                        pitch_stats[main_pitch]['grace_types'].append(grace_pitch)
                
                # Count by syllable 
                if main_syllable:
                    if main_syllable not in syllable_stats:
                        syllable_stats[main_syllable] = {
                            'total_occurrences': 0,
                            'ornamented_occurrences': 0,
                            'grace_note_count': 0,
                            'associated_pitches': []
                        }
                    
                    syllable_stats[main_syllable]['ornamented_occurrences'] += 1
                    syllable_stats[main_syllable]['grace_note_count'] += len(cluster['grace_notes'])
                    
                    if main_pitch not in syllable_stats[main_syllable]['associated_pitches']:
                        syllable_stats[main_syllable]['associated_pitches'].append(main_pitch)
        
        # Count total occurrences for each pitch and syllable
        for note in self.processed_notes:
            if not note.get('is_grace'):
                pitch = note['note']
                syllable = note.get('lyric', '')
                
                if pitch in pitch_stats:
                    pitch_stats[pitch]['total_occurrences'] += 1
                else:
                    pitch_stats[pitch] = {
                        'total_occurrences': 1,
                        'ornamented_occurrences': 0,
                        'grace_note_count': 0,
                        'grace_types': []
                    }
                
                if syllable and syllable in syllable_stats:
                    syllable_stats[syllable]['total_occurrences'] += 1
                elif syllable:
                    syllable_stats[syllable] = {
                        'total_occurrences': 1,
                        'ornamented_occurrences': 0,
                        'grace_note_count': 0,
                        'associated_pitches': [pitch] if pitch not in syllable_stats.get(syllable, {}).get('associated_pitches', []) else syllable_stats[syllable]['associated_pitches']
                    }
        
        # Calculate ornamentation percentages
        for pitch, stats in pitch_stats.items():
            if stats['total_occurrences'] > 0:
                stats['ornamentation_rate'] = (stats['ornamented_occurrences'] / stats['total_occurrences']) * 100
            else:
                stats['ornamentation_rate'] = 0
        
        for syllable, stats in syllable_stats.items():
            if stats['total_occurrences'] > 0:
                stats['ornamentation_rate'] = (stats['ornamented_occurrences'] / stats['total_occurrences']) * 100
            else:
                stats['ornamentation_rate'] = 0
        
        return {
            'pitch_ornamentation': pitch_stats,
            'syllable_ornamentation': syllable_stats,
            'total_grace_clusters': len(grace_clusters),
            'total_main_notes': len([n for n in self.processed_notes if not n.get('is_grace')]),
            'total_grace_notes': len([n for n in self.processed_notes if n.get('is_grace')])
        }
    
    def analyze_grace_note_clusters(self) -> List[Dict]:
        """
        Analyze grace notes in context of their main notes
        Groups grace notes with their associated main notes for contextual analysis
        
        Returns:
            List of grace clusters with main note context
        """
        clusters = []
        i = 0
        
        while i < len(self.processed_notes):
            note = self.processed_notes[i]
            
            if note.get('is_grace'):
                # Start a grace cluster
                cluster = {
                    'grace_notes': [note],
                    'main_note': None,
                    'position': i,
                    'cluster_duration': note['duration']
                }
                
                # Collect consecutive grace notes
                j = i + 1
                while j < len(self.processed_notes) and self.processed_notes[j].get('is_grace'):
                    cluster['grace_notes'].append(self.processed_notes[j])
                    cluster['cluster_duration'] += self.processed_notes[j]['duration']
                    j += 1
                
                # Find the associated main note
                if j < len(self.processed_notes):
                    cluster['main_note'] = self.processed_notes[j]
                    cluster['total_duration'] = cluster['cluster_duration'] + self.processed_notes[j]['duration']
                
                clusters.append(cluster)
                i = j + 1
            else:
                i += 1
        
        return clusters
    
    def get_melodic_backbone(self, include_grace_context: bool = True) -> List[Dict]:
        """
        Extract the main melodic line with optional grace note context
        
        Args:
            include_grace_context: if True, includes grace clusters with their main notes
            
        Returns:
            Simplified melodic sequence focusing on structural notes
        """
        if include_grace_context:
            backbone = []
            grace_clusters = self.analyze_grace_note_clusters()
            cluster_positions = {c['position'] for c in grace_clusters}
            
            i = 0
            while i < len(self.processed_notes):
                note = self.processed_notes[i]
                
                if i in cluster_positions:
                    # Find the cluster starting at this position
                    cluster = next(c for c in grace_clusters if c['position'] == i)
                    backbone.append({
                        'type': 'grace_cluster',
                        'grace_notes': cluster['grace_notes'],
                        'main_note': cluster['main_note'],
                        'total_duration': cluster['total_duration'],
                        'position': i
                    })
                    # Skip to after the cluster
                    i = cluster['position'] + len(cluster['grace_notes'])
                    if cluster['main_note']:
                        i += 1
                elif not note.get('is_grace'):
                    backbone.append({
                        'type': 'main_note',
                        'note': note,
                        'position': i
                    })
                    i += 1
                else:
                    i += 1
            
            return backbone
        else:
            # Return only main notes
            return [{'type': 'main_note', 'note': note, 'position': i} 
                   for i, note in enumerate(self.processed_notes) 
                   if not note.get('is_grace')]
    
    def _analyze_backbone_ngrams(self, backbone_sequence: List[Dict], n: int, min_count: int, analysis_type: str) -> List[Dict]:
        """
        Analyze n-grams from backbone sequence (main melody or grace units)
        
        Args:
            backbone_sequence: Output from get_melodic_backbone()
            n: n-gram size
            min_count: minimum occurrence count
            analysis_type: 'pitch' or 'rhythm'
        
        Returns:
            List of n-grams with counts and positions
        """
        if len(backbone_sequence) < n:
            return []
        
        # Extract sequence for analysis AND track original positions
        sequence = []
        original_positions = []  # Map backbone index to original note position(s)
        
        if analysis_type == 'pitch':
            for item in backbone_sequence:
                if item['type'] == 'main_note':
                    sequence.append(item['note']['note'])
                    original_positions.append([item['position']])  # Single position
                elif item['type'] == 'grace_cluster':
                    # Create compound representation: "grace_pitches+main_pitch"
                    grace_pitches = [g['note'] for g in item['grace_notes']]
                    main_pitch = item['main_note']['note'] if item['main_note'] else 'None'
                    compound = f"({'+'.join(grace_pitches)}→{main_pitch})"
                    sequence.append(compound)
                    # Include all positions in the cluster
                    positions = list(range(item['position'], 
                                          item['position'] + len(item['grace_notes']) + 
                                          (1 if item['main_note'] else 0)))
                    original_positions.append(positions)
        
        elif analysis_type == 'rhythm':
            for item in backbone_sequence:
                if item['type'] == 'main_note':
                    sequence.append(item['note']['duration'])
                    original_positions.append([item['position']])
                elif item['type'] == 'grace_cluster':
                    # Create compound representation: total_duration
                    sequence.append(item['total_duration'])
                    positions = list(range(item['position'], 
                                          item['position'] + len(item['grace_notes']) + 
                                          (1 if item['main_note'] else 0)))
                    original_positions.append(positions)
        
        # Generate n-grams with proper position tracking
        ngram_counts = {}
        ngram_positions = {}
        
        for i in range(len(sequence) - n + 1):
            ngram = tuple(sequence[i:i+n])
            
            if ngram not in ngram_counts:
                ngram_counts[ngram] = 0
                ngram_positions[ngram] = []
            
            ngram_counts[ngram] += 1
            # Store the first original position of this n-gram occurrence
            ngram_positions[ngram].append(original_positions[i][0])
        
        # Filter and format results
        results = []
        for ngram, count in ngram_counts.items():
            if count >= min_count:
                results.append({
                    'ngram': ngram,
                    'count': count,
                    'positions': ngram_positions[ngram],
                    'analysis_mode': 'main_melody' if backbone_sequence and backbone_sequence[0]['type'] == 'main_note' else 'grace_units'
                })
        
        return sorted(results, key=lambda x: x['count'], reverse=True)
    
    def find_pattern_variations(self, base_pattern: Tuple, 
                              pattern_type: str = 'pitch', 
                              similarity_threshold: float = 0.8) -> List[Dict]:
        """
        Find variations of a base pattern (for future variation recognition)
        
        Args:
            base_pattern: Tuple representing the base pattern
            pattern_type: 'pitch' or 'rhythm'
            similarity_threshold: Minimum similarity ratio (0.0 to 1.0)
            
        Returns:
            List of similar patterns with similarity scores
        """
        # Placeholder for future implementation
        # This will implement substitution, insertion, deletion detection
        variations = []
        n = len(base_pattern)
        
        ngrams_dict = self.pitch_ngrams if pattern_type == 'pitch' else self.rhythm_ngrams
        
        if n in ngrams_dict:
            for ngram, data in ngrams_dict[n].items():
                if ngram == base_pattern:
                    continue
                
                # Simple Jaccard similarity as placeholder
                set1 = set(base_pattern)
                set2 = set(ngram)
                similarity = len(set1.intersection(set2)) / len(set1.union(set2))
                
                if similarity >= similarity_threshold:
                    variations.append({
                        'pattern': ngram,
                        'similarity': similarity,
                        'count': data['count'],
                        'positions': data['positions']
                    })
        
        return sorted(variations, key=lambda x: x['similarity'], reverse=True)
    
    def find_repeated_sections(self, min_length: int = 4, min_count: int = 2, 
                              max_length: int = None) -> List[Dict]:
        """
        Find patterns of significant length that repeat multiple times
        Useful for identifying song sections with variations
        
        Args:
            min_length: Minimum pattern length to consider
            min_count: Minimum number of repetitions required
            max_length: Maximum pattern length (None = no limit)
        """
        repeated_sections = []
        
        if max_length is None:
            max_length = len(self.processed_notes) // 2
        
        # Look for pitch patterns
        for n in range(min_length, min(max_length + 1, len(self.processed_notes) // 2 + 1)):
            if n not in self.pitch_ngrams:
                continue
                
            for ngram, data in self.pitch_ngrams[n].items():
                if data['count'] >= min_count:
                    repeated_sections.append({
                        'type': 'pitch',
                        'length': n,
                        'pattern': ngram,
                        'count': data['count'],
                        'positions': data['positions'],
                        'has_grace': data['has_grace'],
                        'score': data['count'] * n  # Favor longer patterns
                    })
        
        # Sort by score (count * length) to find most significant patterns
        repeated_sections.sort(key=lambda x: -x['score'])
        return repeated_sections
    
    def find_section_variations(self, base_pattern: Tuple, tolerance: int = 2) -> List[Dict]:
        """
        Find variations of a base pattern (substitutions, insertions, deletions)
        
        Args:
            base_pattern: The base pattern to find variations of
            tolerance: Maximum number of differences allowed
        """
        variations = []
        base_length = len(base_pattern)
        
        # Look in similar-length n-grams (±tolerance)
        for n in range(max(1, base_length - tolerance), 
                      min(len(self.processed_notes), base_length + tolerance) + 1):
            if n not in self.pitch_ngrams:
                continue
                
            for ngram, data in self.pitch_ngrams[n].items():
                if ngram == base_pattern:
                    continue
                
                # Calculate edit distance (simplified)
                differences = self._calculate_pattern_differences(base_pattern, ngram)
                
                if differences <= tolerance:
                    variations.append({
                        'pattern': ngram,
                        'length': n,
                        'count': data['count'],
                        'positions': data['positions'],
                        'differences': differences,
                        'similarity': 1 - (differences / max(len(base_pattern), len(ngram)))
                    })
        
        return sorted(variations, key=lambda x: -x['similarity'])
    
    def _calculate_pattern_differences(self, pattern1: Tuple, pattern2: Tuple) -> int:
        """
        Simple edit distance calculation between two patterns
        """
        if len(pattern1) == len(pattern2):
            # Same length - count substitutions
            return sum(1 for a, b in zip(pattern1, pattern2) if a != b)
        else:
            # Different lengths - simplified: length difference + mismatches
            min_len = min(len(pattern1), len(pattern2))
            mismatches = sum(1 for i in range(min_len) if pattern1[i] != pattern2[i])
            length_diff = abs(len(pattern1) - len(pattern2))
            return mismatches + length_diff
    
    def export_analysis(self, output_file: str):
        """Export complete analysis to JSON file"""
        analysis_data = {
            'metadata': {
                'total_notes': len(self.processed_notes),
                'pitch_ngram_sizes': list(self.pitch_ngrams.keys()),
                'rhythm_ngram_sizes': list(self.rhythm_ngrams.keys())
            },
            'pitch_ngrams': self.pitch_ngrams,
            'rhythm_ngrams': self.rhythm_ngrams
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(analysis_data, f, indent=2, ensure_ascii=False)
    
    def import_analysis(self, input_file: str):
        """Import analysis from JSON file"""
        with open(input_file, 'r', encoding='utf-8') as f:
            analysis_data = json.load(f)
        
        self.pitch_ngrams = analysis_data.get('pitch_ngrams', {})
        self.rhythm_ngrams = analysis_data.get('rhythm_ngrams', {})
        
        # Convert string keys back to integers
        for ngram_type in [self.pitch_ngrams, self.rhythm_ngrams]:
            new_dict = {}
            for k, v in ngram_type.items():
                new_dict[int(k)] = v
            ngram_type.clear()
            ngram_type.update(new_dict)

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='KPIC/KRIC Musical N-gram Analyzer')
    parser.add_argument('musicxml_file', help='Path to MusicXML file')
    parser.add_argument('--max-n', type=int, default=None, help='Maximum n-gram size (default: full song)')
    parser.add_argument('--export', help='Export analysis to JSON file')
    parser.add_argument('--query-pitch', type=int, help='Query pitch n-grams of size N')
    parser.add_argument('--query-rhythm', type=int, help='Query rhythm n-grams of size N')
    parser.add_argument('--min-count', type=int, default=2, help='Minimum occurrence count')
    parser.add_argument('--main-only', action='store_true', help='Only main notes (no grace)')
    parser.add_argument('--grace-only', action='store_true', help='Only patterns with grace notes')
    parser.add_argument('--find-sections', action='store_true', help='Find repeated sections')
    parser.add_argument('--min-section-length', type=int, default=8, help='Minimum section length')
    parser.add_argument('--section-variations', help='Find variations of given pattern (comma-separated notes)')
    
    args = parser.parse_args()
    
    analyzer = KPICKRICAnalyzer()
    
    # Analyze the file
    results = analyzer.analyze_musicxml(args.musicxml_file, args.max_n)
    print(f"\nAnalysis complete:")
    print(f"  Total notes: {results['total_notes']}")
    print(f"  Pitch n-grams: {results['pitch_ngrams_computed']}")
    print(f"  Rhythm n-grams: {results['rhythm_ngrams_computed']}")
    
    # Export if requested
    if args.export:
        analyzer.export_analysis(args.export)
        print(f"Analysis exported to {args.export}")
    
    # Query examples
    if args.query_pitch:
        filter_desc = []
        if args.main_only: filter_desc.append("main only")
        if args.grace_only: filter_desc.append("with grace notes")
        filter_str = f" ({', '.join(filter_desc)})" if filter_desc else ""
        
        print(f"\nTop pitch {args.query_pitch}-grams{filter_str}:")
        results = analyzer.query_pitch_ngrams(
            n=args.query_pitch, 
            min_count=args.min_count,
            main_only=args.main_only,
            has_grace=True if args.grace_only else None
        )
        for i, result in enumerate(results[:10]):  # Top 10
            grace_marker = " [G]" if result['has_grace'] else ""
            print(f"{i+1:2d}. {result['ngram']} (count: {result['count']}){grace_marker}")
    
    if args.query_rhythm:
        filter_desc = []
        if args.main_only: filter_desc.append("main only")
        if args.grace_only: filter_desc.append("with grace notes")
        filter_str = f" ({', '.join(filter_desc)})" if filter_desc else ""
        
        print(f"\nTop rhythm {args.query_rhythm}-grams{filter_str}:")
        results = analyzer.query_rhythm_ngrams(
            n=args.query_rhythm,
            min_count=args.min_count,
            main_only=args.main_only,
            has_grace=True if args.grace_only else None
        )
        for i, result in enumerate(results[:10]):  # Top 10
            grace_marker = " [G]" if result['has_grace'] else ""
            print(f"{i+1:2d}. {result['ngram']} (count: {result['count']}){grace_marker}")
    
    # Find repeated sections
    if args.find_sections:
        print(f"\nRepeated sections (min length: {args.min_section_length}):")
        sections = analyzer.find_repeated_sections(
            min_length=args.min_section_length,
            min_count=args.min_count
        )
        for i, section in enumerate(sections[:10]):  # Top 10
            pattern_preview = ' → '.join(section['pattern'][:5])
            if len(section['pattern']) > 5:
                pattern_preview += " ..."
            print(f"{i+1:2d}. Length {section['length']}, Count {section['count']}, Score {section['score']}")
            print(f"     Pattern: {pattern_preview}")
            print(f"     Positions: {section['positions']}")
    
    # Find pattern variations
    if args.section_variations:
        base_pattern = tuple(args.section_variations.split(','))
        print(f"\nVariations of pattern: {base_pattern}")
        variations = analyzer.find_section_variations(base_pattern)
        for i, var in enumerate(variations[:5]):  # Top 5
            pattern_preview = ' → '.join(var['pattern'][:5])
            if len(var['pattern']) > 5:
                pattern_preview += " ..."
            print(f"{i+1:2d}. Similarity {var['similarity']:.2f}, Differences {var['differences']}")
            print(f"     Pattern: {pattern_preview}")
            print(f"     Count: {var['count']}, Positions: {var['positions']}")

if __name__ == "__main__":
    main()