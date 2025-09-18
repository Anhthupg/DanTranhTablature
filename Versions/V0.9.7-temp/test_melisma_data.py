#!/usr/bin/env python3
"""Test if melismatic data is being generated correctly"""

from lyrical_musical_analyzer import LyricalMusicalAnalyzer

analyzer = LyricalMusicalAnalyzer()
analyzer.analyze_musicxml("MusicXML/Bà rằng bà rí.musicxml")

# Check melismatic analysis
melisma_data = analyzer.get_melismatic_analysis()
print("🎵 MELISMATIC ANALYSIS:")
print(f"Total melismatic syllables: {melisma_data['total_melismatic']}")
print(f"Total syllabic syllables: {melisma_data['total_syllabic']}")
print(f"Unique melismatic: {melisma_data['unique_melismatic']}")

# Check tone analysis
tone_data = analyzer.get_tone_mark_analysis()
print("\n🗣️ TONE MARK DISTRIBUTION:")
for tone, count in tone_data['tone_distribution'].items():
    print(f"  {tone}: {count} syllables")

# Check actual syllable mappings
print("\n📊 SYLLABLE MAPPINGS CHECK:")
for i, mapping in enumerate(analyzer.syllable_mappings[:10]):
    print(f"Syllable {i}: '{mapping['syllable']}' - main_notes: {mapping['main_note_count']}, grace_notes: {mapping['grace_note_count']}, melismatic: {mapping.get('is_melismatic', False)}, tone: {mapping.get('tone_mark', 'unknown')}")