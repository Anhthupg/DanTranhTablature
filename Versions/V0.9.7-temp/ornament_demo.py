#!/usr/bin/env python3
"""
Demonstration of how ornaments are currently drawn in Đan Tranh tablature
Shows all ornament types with their colors and symbols
"""

def create_ornament_demo():
    svg_content = '''<svg width="1000" height="400" xmlns="http://www.w3.org/2000/svg">
<style>
.string-line { stroke: #008ECC; stroke-width: 2; }
.string-label { font-family: Arial; font-size: 14px; fill: #008ECC; }
.title { font-family: Arial; font-size: 24px; font-weight: bold; fill: purple; }
.string-number { font-family: Arial; font-size: 12px; fill: white; font-weight: bold; }
</style>

<rect width="1000" height="400" fill="floralwhite"/>

<!-- Title -->
<text x="20" y="30" class="title">Đan Tranh Ornament Types Demo</text>
<text x="20" y="55" style="font-family: Arial; font-size: 14px; fill: #666;">Current ornament implementation</text>

<!-- Legend -->
<rect x="20" y="70" width="950" height="25" fill="#f0f8ff" stroke="#ccc" stroke-width="1" rx="5"/>
<text x="30" y="85" style="font-family: Arial; font-size: 12px; font-weight: bold; fill: black;">ORNAMENT COLORS & SYMBOLS:</text>

<!-- String lines -->
<line x1="100" y1="130" x2="900" y2="130" class="string-line"/>
<text x="20" y="135" class="string-label">String 9: C5</text>

<line x1="100" y1="170" x2="900" y2="170" class="string-line"/>
<text x="20" y="175" class="string-label">String 10: D5</text>

<!-- Normal note (for comparison) -->
<text x="150" y="110" style="font-size: 14px; font-weight: bold;">Normal Note:</text>
<circle cx="200" cy="130" r="12" fill="#008080" stroke="crimson" stroke-width="2"/>
<text x="200" y="134" text-anchor="middle" class="string-number">9</text>

<!-- Trill ornament -->
<text x="270" y="110" style="font-size: 14px; font-weight: bold;">Trill:</text>
<circle cx="320" cy="130" r="12" fill="#FF1493" stroke="#8B0000" stroke-width="4"/>
<text x="320" y="134" text-anchor="middle" class="string-number">9</text>
<text x="335" y="120" style="font-size:12px; fill:purple;">tr</text>

<!-- Rung/Mordent ornament -->
<text x="390" y="110" style="font-size: 14px; font-weight: bold;">Rung (Mordent):</text>
<circle cx="470" cy="130" r="12" fill="#FF1493" stroke="#8B0000" stroke-width="4"/>
<text x="470" y="134" text-anchor="middle" class="string-number">9</text>
<text x="485" y="135" style="font-size:16px; fill:orange;">~</text>

<!-- Glissando ornament -->
<text x="550" y="110" style="font-size: 14px; font-weight: bold;">Glissando:</text>
<circle cx="620" cy="130" r="12" fill="#FF1493" stroke="#8B0000" stroke-width="4"/>
<text x="620" y="134" text-anchor="middle" class="string-number">9</text>
<text x="635" y="130" style="font-size:16px; fill:blue;">/</text>

<!-- Muted note -->
<text x="700" y="110" style="font-size: 14px; font-weight: bold;">Muted:</text>
<circle cx="750" cy="130" r="15" fill="#666" stroke="#333" stroke-width="2"/>
<text x="750" y="134" text-anchor="middle" class="string-number">9</text>
<text x="742" y="115" style="font-size:14px; fill:#666;">✕</text>

<!-- Explanation -->
<rect x="20" y="220" width="950" height="150" fill="#fffacd" stroke="black" stroke-width="2"/>
<text x="40" y="250" style="font-size: 18px; font-weight: bold;">How Ornaments are Currently Drawn:</text>
<text x="40" y="280" style="font-size: 14px;">1. Note Circle: Deep pink fill (#FF1493) with dark red border (#8B0000, 4px thick)</text>
<text x="40" y="300" style="font-size: 14px;">2. Ornament Symbols:</text>
<text x="60" y="320" style="font-size: 14px;">   • Trill: Purple "tr" text above-right of note</text>
<text x="60" y="340" style="font-size: 14px;">   • Rung/Mordent: Orange "~" symbol to the right</text>
<text x="60" y="360" style="font-size: 14px;">   • Glissando: Blue "/" symbol to the right</text>

</svg>'''
    
    with open('SVG_Output/ornament_demo.svg', 'w') as f:
        f.write(svg_content)
    print("Created ornament_demo.svg showing current ornament implementation!")

if __name__ == '__main__':
    create_ornament_demo()