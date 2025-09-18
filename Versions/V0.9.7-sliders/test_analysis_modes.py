#!/usr/bin/env python3
"""
Test script to demonstrate the differences between analysis modes
Shows KPIC patterns and ornamentation statistics
"""

from kpic_kric_analyzer import KPICKRICAnalyzer

def test_analysis_modes(musicxml_file: str):
    """Test all three analysis modes and show differences"""
    
    analyzer = KPICKRICAnalyzer()
    analyzer.analyze_musicxml(musicxml_file)
    
    print(f"🎼 Analysis of: {musicxml_file}")
    print(f"📊 Total notes after slur-to-tie conversion: {len(analyzer.processed_notes)}")
    
    # Test different analysis modes for KPIC-3
    modes = ['full', 'main_melody', 'grace_units']
    
    print("\n" + "="*80)
    print("🎵 KPIC-3 ANALYSIS COMPARISON")
    print("="*80)
    
    for mode in modes:
        print(f"\n📈 {mode.upper().replace('_', ' ')} MODE:")
        print("-" * 50)
        
        results = analyzer.query_pitch_ngrams(n=3, min_count=2, analysis_mode=mode)
        
        if results:
            print(f"Found {len(results)} patterns with 2+ repetitions:")
            for i, result in enumerate(results[:5]):  # Top 5
                pattern_str = ' → '.join(str(p) for p in result['ngram'])
                print(f"  {i+1}. {pattern_str} ({result['count']}×)")
        else:
            print("  No patterns found with 2+ repetitions")
    
    # Show ornamentation statistics
    print("\n" + "="*80)
    print("🎭 ORNAMENTATION STATISTICS")
    print("="*80)
    
    stats = analyzer.get_ornamentation_statistics()
    
    print(f"\n📊 SUMMARY:")
    print(f"  • Total main notes: {stats['total_main_notes']}")
    print(f"  • Total grace notes: {stats['total_grace_notes']}")
    print(f"  • Grace clusters: {stats['total_grace_clusters']}")
    
    print(f"\n🎼 PITCH ORNAMENTATION (Top 10 by ornamentation rate):")
    pitch_stats = stats['pitch_ornamentation']
    sorted_pitches = sorted(pitch_stats.items(), 
                           key=lambda x: x[1]['ornamentation_rate'], 
                           reverse=True)
    
    for pitch, data in sorted_pitches[:10]:
        rate = data['ornamentation_rate']
        ornamented = data['ornamented_occurrences']
        total = data['total_occurrences']
        grace_types = ', '.join(data['grace_types']) if data['grace_types'] else 'None'
        print(f"  • {pitch}: {rate:.1f}% ({ornamented}/{total}) - Grace types: {grace_types}")
    
    print(f"\n🗣️ SYLLABLE ORNAMENTATION (Top 10 by ornamentation rate):")
    syllable_stats = stats['syllable_ornamentation']
    sorted_syllables = sorted(syllable_stats.items(), 
                             key=lambda x: x[1]['ornamentation_rate'], 
                             reverse=True)
    
    for syllable, data in sorted_syllables[:10]:
        rate = data['ornamentation_rate']
        ornamented = data['ornamented_occurrences']
        total = data['total_occurrences']
        pitches = ', '.join(data['associated_pitches']) if data['associated_pitches'] else 'None'
        print(f"  • '{syllable}': {rate:.1f}% ({ornamented}/{total}) - Associated pitches: {pitches}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python3 test_analysis_modes.py <musicxml_file>")
        sys.exit(1)
    
    test_analysis_modes(sys.argv[1])