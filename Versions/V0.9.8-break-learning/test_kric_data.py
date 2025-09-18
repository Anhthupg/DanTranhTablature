#!/usr/bin/env python3
"""Test KRIC pattern generation"""

from kpic_kric_analyzer import KPICKRICAnalyzer

analyzer = KPICKRICAnalyzer()
analyzer.analyze_musicxml("MusicXML/Bà rằng bà rí.musicxml")

# Test KRIC-3 patterns
for mode in ['full', 'main_melody']:
    print(f"\n🎵 KRIC-3 patterns in {mode} mode:")
    patterns = analyzer.query_rhythm_ngrams(n=3, min_count=2, analysis_mode=mode)
    for i, pattern in enumerate(patterns[:5]):
        print(f"  {i+1}. {pattern['ngram']} - {pattern['count']}× at positions {pattern['positions'][:3]}...")
        
print(f"\n📊 Total processed notes: {len(analyzer.processed_notes)}")
print(f"Rhythm n-grams available: {list(analyzer.rhythm_ngrams.keys())[:10]}...")