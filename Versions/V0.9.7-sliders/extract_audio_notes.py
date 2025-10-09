#!/usr/bin/env python3
"""Extract audio note data from analytical tablature"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from analytical_tablature_visualizer import AnalyticalTablatureVisualizer

def main():
    viz = AnalyticalTablatureVisualizer()
    viz.create_analytical_tablature("MusicXML/Bà rằng bà rí.musicxml", "temp_analysis.html")

    # Get the processed notes
    notes = viz.processed_notes

    print(f"// Post-slur-to-tie conversion: {len(notes)} notes")
    print("const noteSequence = [")

    for i, note in enumerate(notes):
        if i % 10 == 0 and i > 0:
            print()
        if i % 10 == 0:
            print("    ", end="")
        print(f"'{note['pitch']}'", end="")
        if i < len(notes) - 1:
            print(", ", end="")
    print("\n];")

    print("\nconst noteDurations = [")
    for i, note in enumerate(notes):
        if i % 10 == 0 and i > 0:
            print()
        if i % 10 == 0:
            print("    ", end="")
        quarter_duration = note['duration'] / 4.0
        print(f"{quarter_duration:.2f}", end="")
        if i < len(notes) - 1:
            print(", ", end="")
    print("\n];")

if __name__ == "__main__":
    main()