#!/usr/bin/env python3
"""Test what data is being prepared for visualization"""

from analytical_tablature_visualizer import AnalyticalTablatureVisualizer
import json

visualizer = AnalyticalTablatureVisualizer()

# Run analyses
visualizer.kpic_analyzer.analyze_musicxml("MusicXML/Bà rằng bà rí.musicxml")
visualizer.lyrical_analyzer.analyze_musicxml("MusicXML/Bà rằng bà rí.musicxml")

visualizer.processed_notes = visualizer.kpic_analyzer.processed_notes
visualizer.pitch_ngrams = visualizer.kpic_analyzer.pitch_ngrams
visualizer.rhythm_ngrams = visualizer.kpic_analyzer.rhythm_ngrams
visualizer.syllable_mappings = visualizer.lyrical_analyzer.syllable_mappings

# Prepare data
data_json = visualizer._prepare_analysis_data()
data = json.loads(data_json)

print("📊 DATA STRUCTURE CHECK:")
print(f"KPIC patterns modes: {list(data['kpic_patterns'].keys())[:5]}")
print(f"KRIC patterns modes: {list(data['kric_patterns'].keys())[:5]}")

# Check KRIC-3 in full mode
if 'full' in data['kric_patterns'] and 'kric-3' in data['kric_patterns']['full']:
    kric3 = data['kric_patterns']['full']['kric-3']
    print(f"\nKRIC-3 patterns in full mode: {len(kric3)} patterns")
    if kric3:
        print(f"First pattern: {kric3[0]}")

# Check melismatic data
print(f"\nMelismatic syllables: {data.get('melismatic_syllables', {})}")
print(f"Tone syllables keys: {list(data.get('tone_syllables', {}).keys())}")

# Check tone distribution
if 'tone_syllables' in data:
    for tone, positions in data['tone_syllables'].items():
        if positions:
            print(f"  {tone}: {len(positions)} positions")