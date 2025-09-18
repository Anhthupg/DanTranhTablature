#!/usr/bin/env python3
"""Extract post-conversion note data for audio playback"""

from musicxml_to_dantranh import DanTranhConverter

def get_audio_data(musicxml_file):
    """Get post-slur-to-tie conversion note sequence and durations"""
    converter = DanTranhConverter()
    converter.parse_musicxml(musicxml_file)

    # Get converted notes
    converted_notes = converter.convert_slurs_to_ties_on_same_pitch()

    print(f"Post-conversion: {len(converted_notes)} notes")

    # Generate JavaScript arrays
    print("\n// Correct post-conversion noteSequence:")
    print("const noteSequence = [")
    for i, note in enumerate(converted_notes):
        if i % 10 == 0 and i > 0:
            print()
        if i % 10 == 0:
            print("    ", end="")
        print(f"'{note.pitch}'", end="")
        if i < len(converted_notes) - 1:
            print(", ", end="")
    print("\n];")

    print("\n// Correct noteDurations (in quarter note units):")
    print("const noteDurations = [")
    for i, note in enumerate(converted_notes):
        if i % 10 == 0 and i > 0:
            print()
        if i % 10 == 0:
            print("    ", end="")
        # Convert from MusicXML duration to quarter note units
        quarter_duration = note.duration / 4.0
        print(f"{quarter_duration:.2f}", end="")
        if i < len(converted_notes) - 1:
            print(", ", end="")
    print("\n];")

if __name__ == "__main__":
    get_audio_data("MusicXML/Bà rằng bà rí.musicxml")