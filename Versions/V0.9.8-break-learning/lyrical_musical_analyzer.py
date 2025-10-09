#!/usr/bin/env python3
"""
Lyrical-Musical Analysis System
Analyzes the relationship between lyrics and music: syllable-to-note mapping,
duration analysis, and linguistic grouping (syllables → words → phrases → sentences)
"""

from typing import Dict, List, Tuple, Optional, Set
import json
import re
from collections import defaultdict, Counter
from musicxml_to_dantranh import DanTranhConverter

class LyricalMusicalAnalyzer:
    def __init__(self):
        self.converter = DanTranhConverter()
        
        # Raw data
        self.notes = []
        self.processed_notes = []  # After slur-to-tie conversion
        
        # Lyrical analysis structures
        self.syllable_mappings = []  # [{syllable, notes, pitches, durations, total_duration}]
        self.word_mappings = []      # [{word, syllables, notes, total_duration}]
        self.phrase_mappings = []    # [{phrase, words, notes, total_duration}]
        
        # Linguistic patterns
        self.syllable_pitch_patterns = defaultdict(list)  # syllable -> [pitch_sequences]
        self.syllable_rhythm_patterns = defaultdict(list)  # syllable -> [rhythm_sequences]
        self.word_melodic_contours = defaultdict(list)     # word -> [contour_patterns]
        
        # Vietnamese tone mark patterns (dấu thanh)
        self.tone_marks = {
            'sắc': ['á', 'é', 'í', 'ó', 'ú', 'ý', 'ắ', 'ế', 'ố', 'ớ', 'ứ'],
            'huyền': ['à', 'è', 'ì', 'ò', 'ù', 'ỳ', 'ằ', 'ề', 'ồ', 'ờ', 'ừ'],
            'hỏi': ['ả', 'ẻ', 'ỉ', 'ỏ', 'ủ', 'ỷ', 'ẳ', 'ể', 'ổ', 'ở', 'ử'],
            'ngã': ['ã', 'ẽ', 'ĩ', 'õ', 'ũ', 'ỹ', 'ẵ', 'ễ', 'ỗ', 'ỡ', 'ữ'],
            'nặng': ['ạ', 'ẹ', 'ị', 'ọ', 'ụ', 'ỵ', 'ặ', 'ệ', 'ộ', 'ợ', 'ự'],
            'ngang': []  # No diacritic marks
        }
        
        # Multi-note syllable analysis
        self.multi_note_syllables = []  # Syllables with >1 note (melismas)
        self.single_note_syllables = []  # Syllables with exactly 1 note
        self.syllables_by_tone = defaultdict(list)  # tone_type -> [syllables]
        
    def _convert_slurs_to_ties_on_same_pitch(self, notes: List[Dict]) -> List[Dict]:
        """Same conversion as KPIC/KRIC analyzer"""
        converted_notes = []
        i = 0
        
        while i < len(notes):
            current_note = dict(notes[i])
            
            if current_note.get('slur') == 'start':
                slur_notes = [current_note]
                j = i + 1
                
                while j < len(notes) and j < i + 20:
                    next_note = notes[j]
                    
                    if next_note.get('is_grace'):
                        slur_notes.append(dict(next_note))
                        j += 1
                        continue
                    
                    slur_notes.append(dict(next_note))
                    
                    if next_note.get('slur') == 'stop':
                        break
                    j += 1
                
                main_notes = [n for n in slur_notes if not n.get('is_grace')]
                if main_notes:
                    first_pitch = main_notes[0]['note']
                    all_same_pitch = all(n['note'] == first_pitch for n in main_notes)
                    
                    if all_same_pitch and len(main_notes) > 1:
                        combined_note = dict(main_notes[0])
                        combined_duration = sum(n['duration'] for n in main_notes)
                        combined_note['duration'] = combined_duration
                        
                        for n in main_notes:
                            if n.get('lyric'):
                                combined_note['lyric'] = n['lyric']
                                break
                        
                        combined_note.pop('slur', None)
                        
                        grace_notes = [n for n in slur_notes if n.get('is_grace')]
                        converted_notes.extend(grace_notes)
                        converted_notes.append(combined_note)
                        
                        i = j + 1
                        continue
            
            if not current_note.get('is_grace') and i + 1 < len(notes):
                next_note = notes[i + 1]
                if (not next_note.get('is_grace') and 
                    next_note['note'] == current_note['note'] and
                    not next_note.get('lyric')):
                    
                    combined_note = dict(current_note)
                    combined_note['duration'] = current_note['duration'] + next_note['duration']
                    converted_notes.append(combined_note)
                    i += 2
                    continue
            
            converted_notes.append(current_note)
            i += 1
        
        return converted_notes
    
    def _detect_tone_mark(self, syllable: str) -> str:
        """
        Detect Vietnamese tone mark (dấu thanh) in a syllable
        
        Returns:
            'sắc', 'huyền', 'hỏi', 'ngã', 'nặng', or 'ngang'
        """
        syllable_lower = syllable.lower()
        
        for tone_type, tone_chars in self.tone_marks.items():
            if tone_type == 'ngang':
                continue  # Check this last
            for char in tone_chars:
                if char in syllable_lower:
                    return tone_type
        
        # If no tone mark found, it's ngang (flat tone)
        return 'ngang'
    
    def analyze_musicxml(self, file_path: str) -> Dict:
        """Analyze MusicXML file for lyrical-musical relationships"""
        print(f"Analyzing lyrical-musical relationships in {file_path}...")
        
        # Parse and process notes
        self.notes = self.converter.parse_musicxml(file_path)
        self.processed_notes = self._convert_slurs_to_ties_on_same_pitch(self.notes)
        
        # Build lyrical mappings
        self._build_syllable_mappings()
        self._build_word_mappings()
        self._build_phrase_mappings()
        
        # Analyze patterns
        self._analyze_syllable_patterns()
        self._analyze_word_contours()
        
        return {
            'total_notes': len(self.processed_notes),
            'notes_with_lyrics': sum(1 for n in self.processed_notes if n.get('lyric')),
            'syllable_count': len(self.syllable_mappings),
            'word_count': len(self.word_mappings),
            'phrase_count': len(self.phrase_mappings),
            'unique_syllables': len(set(s['syllable'] for s in self.syllable_mappings if s['syllable'])),
            'unique_words': len(set(w['word'] for w in self.word_mappings if w['word']))
        }
    
    def _build_syllable_mappings(self):
        """Map each syllable to its associated notes following Vietnamese singing rules"""
        self.syllable_mappings = []

        for i, note in enumerate(self.processed_notes):
            lyric = note.get('lyric', '').strip()
            if not lyric:
                continue

            # Collect all notes for this syllable following Vietnamese rules
            syllable_notes = []

            # Rule 1: Grace notes BEFORE this main note belong to THIS syllable
            j = i - 1
            grace_notes_for_this_syllable = []
            while j >= 0:
                prev_note = self.processed_notes[j]
                if prev_note.get('is_grace') and not prev_note.get('lyric'):
                    # Check if this grace note is already assigned to a previous syllable
                    already_assigned = False
                    for existing_mapping in self.syllable_mappings:
                        if any(n.get('note_id') == prev_note.get('note_id') for n in existing_mapping.get('notes', [])):
                            already_assigned = True
                            break

                    if not already_assigned:
                        grace_notes_for_this_syllable.insert(0, prev_note)
                    j -= 1
                else:
                    break  # Stop at main notes or notes with lyrics

            syllable_notes.extend(grace_notes_for_this_syllable)

            # Rule 2: Add the main note with lyric
            syllable_notes.append(note)

            # Rule 3: Melismatic notes AFTER this main note belong to THIS syllable
            # But STOP at grace notes (they belong to the next syllable)
            j = i + 1
            while j < len(self.processed_notes):
                next_note = self.processed_notes[j]

                # Stop if we hit a note with lyrics (new syllable)
                if next_note.get('lyric'):
                    break

                # Stop if we hit a grace note (belongs to future syllable)
                if next_note.get('is_grace'):
                    break

                # This is a melismatic note - add it to current syllable
                syllable_notes.append(next_note)
                j += 1
            
            # Extract musical information
            pitches = [n['note'] for n in syllable_notes]
            durations = [n['duration'] for n in syllable_notes]
            total_duration = sum(durations)
            
            # Classify note types
            main_notes = [n for n in syllable_notes if not n.get('is_grace')]
            grace_notes = [n for n in syllable_notes if n.get('is_grace')]
            
            # Detect tone mark
            tone_mark = self._detect_tone_mark(lyric)
            
            self.syllable_mappings.append({
                'syllable': lyric,
                'position': i,
                'notes': syllable_notes,
                'pitches': pitches,
                'durations': durations,
                'total_duration': total_duration,
                'note_count': len(syllable_notes),
                'main_note_count': len(main_notes),
                'grace_note_count': len(grace_notes),
                'pitch_range': self._calculate_pitch_range(pitches),
                'melodic_contour': self._calculate_melodic_contour(pitches),
                'is_melismatic': len(main_notes) > 1,  # Multi-note syllable
                'tone_mark': tone_mark
            })
            
            # Categorize syllables
            if len(main_notes) > 1:
                self.multi_note_syllables.append(lyric)
            else:
                self.single_note_syllables.append(lyric)
            
            # Group by tone mark
            self.syllables_by_tone[tone_mark].append(lyric)
    
    def _build_word_mappings(self):
        """Group syllables into words"""
        self.word_mappings = []
        
        if not self.syllable_mappings:
            return
        
        current_word = ""
        current_syllables = []
        
        for syllable_data in self.syllable_mappings:
            syllable = syllable_data['syllable']
            
            # Vietnamese/Asian language syllable detection
            # Each syllable is typically a separate word or part of compound
            if self._is_word_boundary(syllable, current_word):
                # Finish previous word
                if current_syllables:
                    self._finalize_word(current_word, current_syllables)
                    current_syllables = []
                
                current_word = syllable
            else:
                current_word += syllable if not current_word else f" {syllable}"
            
            current_syllables.append(syllable_data)
        
        # Finish last word
        if current_syllables:
            self._finalize_word(current_word, current_syllables)
    
    def _is_word_boundary(self, syllable: str, current_word: str) -> bool:
        """Determine if syllable starts a new word (language-specific logic)"""
        if not current_word:
            return True
        
        # Vietnamese-specific rules (can be extended for other languages)
        # For now, treat each syllable as potentially separate word
        # This can be refined based on linguistic rules
        
        # Check for punctuation that clearly separates words
        if any(punct in syllable for punct in [',', '.', '!', '?', ';', ':']):
            return True
        
        # For Vietnamese, many words are single syllables
        # More sophisticated word boundary detection could be added here
        return len(current_word.split()) >= 2  # Limit compound words
    
    def _finalize_word(self, word: str, syllables: List[Dict]):
        """Create word mapping from syllables"""
        all_notes = []
        total_duration = 0
        
        for syl in syllables:
            all_notes.extend(syl['notes'])
            total_duration += syl['total_duration']
        
        # Extract all pitches in sequence
        pitches = [note['note'] for syl in syllables for note in syl['notes']]
        
        self.word_mappings.append({
            'word': word.strip(),
            'syllables': syllables,
            'syllable_count': len(syllables),
            'notes': all_notes,
            'note_count': len(all_notes),
            'total_duration': total_duration,
            'pitches': pitches,
            'pitch_range': self._calculate_pitch_range(pitches),
            'melodic_contour': self._calculate_melodic_contour(pitches),
            'starts_at_position': syllables[0]['position'],
            'duration_per_syllable': [s['total_duration'] for s in syllables]
        })
    
    def _build_phrase_mappings(self):
        """Group words into phrases (separated by punctuation or pauses)"""
        self.phrase_mappings = []
        
        if not self.word_mappings:
            return
        
        current_phrase_words = []
        
        for word_data in self.word_mappings:
            word = word_data['word']
            
            # Check for phrase boundaries (punctuation)
            has_punctuation = any(punct in word for punct in [',', '.', '!', '?', ';'])
            
            current_phrase_words.append(word_data)
            
            if has_punctuation or len(current_phrase_words) >= 8:  # Max phrase length
                self._finalize_phrase(current_phrase_words)
                current_phrase_words = []
        
        # Finish last phrase
        if current_phrase_words:
            self._finalize_phrase(current_phrase_words)
    
    def _finalize_phrase(self, words: List[Dict]):
        """Create phrase mapping from words"""
        phrase_text = " ".join(w['word'] for w in words)
        all_notes = []
        total_duration = 0
        
        for word in words:
            all_notes.extend(word['notes'])
            total_duration += word['total_duration']
        
        pitches = [note['note'] for word in words for note in word['notes']]
        
        self.phrase_mappings.append({
            'phrase': phrase_text,
            'words': words,
            'word_count': len(words),
            'syllable_count': sum(w['syllable_count'] for w in words),
            'note_count': len(all_notes),
            'total_duration': total_duration,
            'pitches': pitches,
            'melodic_contour': self._calculate_melodic_contour(pitches),
            'pitch_range': self._calculate_pitch_range(pitches),
            'duration_per_word': [w['total_duration'] for w in words]
        })
    
    def _calculate_pitch_range(self, pitches: List[str]) -> Dict:
        """Calculate pitch range information"""
        if not pitches:
            return {'semitones': 0, 'lowest': None, 'highest': None}
        
        midi_values = [self.converter.note_to_midi_number(p) for p in pitches]
        lowest = min(midi_values)
        highest = max(midi_values)
        
        return {
            'semitones': highest - lowest,
            'lowest': pitches[midi_values.index(lowest)],
            'highest': pitches[midi_values.index(highest)]
        }
    
    def _calculate_melodic_contour(self, pitches: List[str]) -> List[str]:
        """Calculate melodic contour (up/down/same)"""
        if len(pitches) < 2:
            return []
        
        contour = []
        midi_values = [self.converter.note_to_midi_number(p) for p in pitches]
        
        for i in range(1, len(midi_values)):
            diff = midi_values[i] - midi_values[i-1]
            if diff > 0:
                contour.append('up')
            elif diff < 0:
                contour.append('down')
            else:
                contour.append('same')
        
        return contour
    
    def _analyze_syllable_patterns(self):
        """Analyze pitch and rhythm patterns for each syllable"""
        for syl in self.syllable_mappings:
            syllable = syl['syllable']
            if not syllable:
                continue
            
            # Store pitch patterns for this syllable
            self.syllable_pitch_patterns[syllable].append(syl['pitches'])
            
            # Store rhythm patterns
            self.syllable_rhythm_patterns[syllable].append(syl['durations'])
    
    def _analyze_word_contours(self):
        """Analyze melodic contours for words"""
        for word_data in self.word_mappings:
            word = word_data['word']
            if not word:
                continue
            
            self.word_melodic_contours[word].append(word_data['melodic_contour'])
    
    def get_syllable_analysis(self, syllable: str) -> Dict:
        """Get detailed analysis for a specific syllable"""
        occurrences = [s for s in self.syllable_mappings if s['syllable'] == syllable]
        
        if not occurrences:
            return {'error': f'Syllable "{syllable}" not found'}
        
        # Aggregate statistics
        total_occurrences = len(occurrences)
        pitch_patterns = [occ['pitches'] for occ in occurrences]
        duration_patterns = [occ['durations'] for occ in occurrences]
        total_durations = [occ['total_duration'] for occ in occurrences]
        note_counts = [occ['note_count'] for occ in occurrences]
        
        return {
            'syllable': syllable,
            'total_occurrences': total_occurrences,
            'pitch_patterns': pitch_patterns,
            'duration_patterns': duration_patterns,
            'total_durations': total_durations,
            'note_counts': note_counts,
            'avg_duration': sum(total_durations) / len(total_durations),
            'avg_notes_per_occurrence': sum(note_counts) / len(note_counts),
            'pitch_variety': len(set(tuple(p) for p in pitch_patterns)),
            'rhythm_variety': len(set(tuple(d) for d in duration_patterns)),
            'positions': [occ['position'] for occ in occurrences]
        }
    
    def get_word_analysis(self, word: str) -> Dict:
        """Get detailed analysis for a specific word"""
        occurrences = [w for w in self.word_mappings if w['word'] == word]
        
        if not occurrences:
            return {'error': f'Word "{word}" not found'}
        
        return {
            'word': word,
            'total_occurrences': len(occurrences),
            'syllable_counts': [w['syllable_count'] for w in occurrences],
            'total_durations': [w['total_duration'] for w in occurrences],
            'note_counts': [w['note_count'] for w in occurrences],
            'melodic_contours': [w['melodic_contour'] for w in occurrences],
            'pitch_ranges': [w['pitch_range'] for w in occurrences],
            'avg_duration': sum(w['total_duration'] for w in occurrences) / len(occurrences)
        }
    
    def find_lyrical_repetitions(self, level: str = 'syllable') -> List[Dict]:
        """Find repeated lyrics at syllable, word, or phrase level"""
        if level == 'syllable':
            counter = Counter(s['syllable'] for s in self.syllable_mappings if s['syllable'])
            data_source = self.syllable_mappings
            key_field = 'syllable'
        elif level == 'word':
            counter = Counter(w['word'] for w in self.word_mappings if w['word'])
            data_source = self.word_mappings
            key_field = 'word'
        elif level == 'phrase':
            counter = Counter(p['phrase'] for p in self.phrase_mappings if p['phrase'])
            data_source = self.phrase_mappings
            key_field = 'phrase'
        else:
            return []
        
        repetitions = []
        for text, count in counter.most_common():
            if count > 1:
                occurrences = [item for item in data_source if item[key_field] == text]
                repetitions.append({
                    'text': text,
                    'count': count,
                    'occurrences': occurrences,
                    'musical_variety': len(set(tuple(occ['pitches']) for occ in occurrences))
                })
        
        return repetitions
    
    def export_lyrical_analysis(self, output_file: str):
        """Export complete lyrical analysis to JSON"""
        analysis_data = {
            'syllable_mappings': self.syllable_mappings,
            'word_mappings': self.word_mappings,
            'phrase_mappings': self.phrase_mappings,
            'syllable_pitch_patterns': dict(self.syllable_pitch_patterns),
            'syllable_rhythm_patterns': dict(self.syllable_rhythm_patterns),
            'word_melodic_contours': dict(self.word_melodic_contours)
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(analysis_data, f, indent=2, ensure_ascii=False)
    
    def get_melismatic_analysis(self) -> Dict:
        """Get analysis of multi-note syllables (melismas)"""
        melismatic_syllables = {}
        syllabic_syllables = {}
        
        for mapping in self.syllable_mappings:
            syllable = mapping['syllable']
            if mapping['is_melismatic']:
                if syllable not in melismatic_syllables:
                    melismatic_syllables[syllable] = {
                        'occurrences': [],
                        'note_counts': [],
                        'total_durations': [],
                        'pitch_patterns': []
                    }
                melismatic_syllables[syllable]['occurrences'].append(mapping['position'])
                melismatic_syllables[syllable]['note_counts'].append(mapping['main_note_count'])
                melismatic_syllables[syllable]['total_durations'].append(mapping['total_duration'])
                melismatic_syllables[syllable]['pitch_patterns'].append(mapping['pitches'])
            else:
                if syllable not in syllabic_syllables:
                    syllabic_syllables[syllable] = {
                        'occurrences': [],
                        'pitches': [],
                        'durations': []
                    }
                syllabic_syllables[syllable]['occurrences'].append(mapping['position'])
                syllabic_syllables[syllable]['pitches'].append(mapping['pitches'][0] if mapping['pitches'] else None)
                syllabic_syllables[syllable]['durations'].append(mapping['total_duration'])
        
        return {
            'melismatic_syllables': melismatic_syllables,
            'syllabic_syllables': syllabic_syllables,
            'total_melismatic': len([m for m in self.syllable_mappings if m['is_melismatic']]),
            'total_syllabic': len([m for m in self.syllable_mappings if not m['is_melismatic']]),
            'unique_melismatic': list(set(self.multi_note_syllables)),
            'unique_syllabic': list(set(self.single_note_syllables))
        }
    
    def get_tone_mark_analysis(self) -> Dict:
        """Get analysis of Vietnamese tone marks (dấu thanh)"""
        tone_statistics = {}
        
        for tone_type in self.tone_marks.keys():
            syllables_with_tone = self.syllables_by_tone[tone_type]
            unique_syllables = list(set(syllables_with_tone))
            
            # Get pitch patterns for this tone
            pitch_patterns = []
            durations = []
            for mapping in self.syllable_mappings:
                if mapping['tone_mark'] == tone_type:
                    pitch_patterns.append(mapping['pitches'])
                    durations.append(mapping['total_duration'])
            
            tone_statistics[tone_type] = {
                'total_occurrences': len(syllables_with_tone),
                'unique_syllables': unique_syllables,
                'unique_count': len(unique_syllables),
                'pitch_patterns': pitch_patterns,
                'average_duration': sum(durations) / len(durations) if durations else 0,
                'syllable_list': syllables_with_tone
            }
        
        return {
            'tone_statistics': tone_statistics,
            'tone_distribution': {k: v['total_occurrences'] for k, v in tone_statistics.items()},
            'most_common_tone': max(tone_statistics.items(), key=lambda x: x[1]['total_occurrences'])[0] if tone_statistics else None
        }

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Lyrical-Musical Analysis System')
    parser.add_argument('musicxml_file', help='Path to MusicXML file')
    parser.add_argument('--export', help='Export analysis to JSON file')
    parser.add_argument('--syllable', help='Analyze specific syllable')
    parser.add_argument('--word', help='Analyze specific word')
    parser.add_argument('--repetitions', choices=['syllable', 'word', 'phrase'], 
                       help='Find repetitions at given level')
    
    args = parser.parse_args()
    
    analyzer = LyricalMusicalAnalyzer()
    
    # Analyze the file
    results = analyzer.analyze_musicxml(args.musicxml_file)
    print(f"\nLyrical-Musical Analysis Results:")
    print(f"  Total notes: {results['total_notes']}")
    print(f"  Notes with lyrics: {results['notes_with_lyrics']}")
    print(f"  Syllables: {results['syllable_count']} ({results['unique_syllables']} unique)")
    print(f"  Words: {results['word_count']} ({results['unique_words']} unique)")
    print(f"  Phrases: {results['phrase_count']}")
    
    # Export if requested
    if args.export:
        analyzer.export_lyrical_analysis(args.export)
        print(f"Analysis exported to {args.export}")
    
    # Specific syllable analysis
    if args.syllable:
        analysis = analyzer.get_syllable_analysis(args.syllable)
        if 'error' not in analysis:
            print(f"\nSyllable '{args.syllable}' Analysis:")
            print(f"  Occurrences: {analysis['total_occurrences']}")
            print(f"  Average duration: {analysis['avg_duration']:.2f}")
            print(f"  Average notes per occurrence: {analysis['avg_notes_per_occurrence']:.2f}")
            print(f"  Pitch varieties: {analysis['pitch_variety']}")
            print(f"  Rhythm varieties: {analysis['rhythm_variety']}")
            print(f"  Positions: {analysis['positions']}")
        else:
            print(f"  {analysis['error']}")
    
    # Specific word analysis
    if args.word:
        analysis = analyzer.get_word_analysis(args.word)
        if 'error' not in analysis:
            print(f"\nWord '{args.word}' Analysis:")
            print(f"  Occurrences: {analysis['total_occurrences']}")
            print(f"  Average duration: {analysis['avg_duration']:.2f}")
            print(f"  Syllable counts: {analysis['syllable_counts']}")
            print(f"  Note counts: {analysis['note_counts']}")
        else:
            print(f"  {analysis['error']}")
    
    # Find repetitions
    if args.repetitions:
        repetitions = analyzer.find_lyrical_repetitions(args.repetitions)
        print(f"\nRepeated {args.repetitions}s:")
        for rep in repetitions[:10]:  # Top 10
            print(f"  '{rep['text']}' - {rep['count']} times, {rep['musical_variety']} musical varieties")

if __name__ == "__main__":
    main()