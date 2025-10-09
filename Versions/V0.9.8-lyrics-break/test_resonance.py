#!/usr/bin/env python3
"""
Test script to demonstrate Đan Tranh resonance visualization
Creates a simple SVG showing all the features clearly
"""

def create_demo_svg():
    svg_content = '''<svg width="1200" height="600" xmlns="http://www.w3.org/2000/svg">
<defs>
    <!-- Bright gradient for resonance tail -->
    <linearGradient id="resonanceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#00FF00;stop-opacity:1.0"/>
        <stop offset="30%" style="stop-color:#00FF88;stop-opacity:0.8"/>
        <stop offset="70%" style="stop-color:#00FFCC;stop-opacity:0.4"/>
        <stop offset="100%" style="stop-color:#00FFFF;stop-opacity:0.1"/>
    </linearGradient>
</defs>

<!-- Title -->
<text x="50" y="30" style="font-family: Arial; font-size: 24px; font-weight: bold; fill: purple;">
    Đan Tranh Resonance & Duration Demo
</text>

<!-- Legend Box -->
<rect x="50" y="50" width="1100" height="80" fill="#f0f0f0" stroke="black" stroke-width="2"/>
<text x="70" y="75" style="font-size: 16px; font-weight: bold;">LEGEND:</text>
<text x="70" y="100" style="font-size: 14px;">🎵 Green Gradient Lines = String Resonance (ringing)</text>
<text x="400" y="100" style="font-size: 14px;">📊 Orange Bars = Note Duration</text>
<text x="700" y="100" style="font-size: 14px;">❌ Red X = Muted String</text>
<text x="950" y="100" style="font-size: 14px;">➡️ Arrow = Direction</text>

<!-- String lines -->
<line x1="100" y1="200" x2="1100" y2="200" stroke="#008ECC" stroke-width="2"/>
<text x="20" y="205" style="font-family: Arial; font-size: 14px; fill: #008ECC;">String 9: C5</text>

<line x1="100" y1="250" x2="1100" y2="250" stroke="#008ECC" stroke-width="2"/>
<text x="20" y="255" style="font-family: Arial; font-size: 14px; fill: #008ECC;">String 10: D5</text>

<line x1="100" y1="300" x2="1100" y2="300" stroke="#008ECC" stroke-width="2"/>
<text x="20" y="305" style="font-family: Arial; font-size: 14px; fill: #008ECC;">String 11: E5</text>

<!-- Example 1: Normal notes with resonance -->
<text x="150" y="170" style="font-size: 14px; font-weight: bold;">Normal Playing (String Rings):</text>

<!-- First note on string 9 -->
<circle cx="200" cy="200" r="12" fill="#008080" stroke="crimson" stroke-width="2"/>
<text x="200" y="204" text-anchor="middle" style="font-size: 12px; fill: white; font-weight: bold;">9</text>
<rect x="215" y="197" width="24" height="6" fill="#FF6B35" opacity="0.7" rx="3"/>
<text x="220" y="180" style="font-size: 14px; font-weight: bold; fill: #FF6B35;">♩=3</text>

<!-- Resonance tail showing string ringing -->
<line x1="212" y1="200" x2="288" y2="200" stroke="url(#resonanceGradient)" stroke-width="12" opacity="0.7"/>
<polygon points="280,195 288,200 280,205" fill="#00FF88" opacity="0.8"/>
<text x="230" y="190" style="font-size: 12px; fill: #00AA00;">← String still ringing</text>

<!-- Second note on same string -->
<circle cx="300" cy="200" r="12" fill="#008080" stroke="crimson" stroke-width="2"/>
<text x="300" y="204" text-anchor="middle" style="font-size: 12px; fill: white; font-weight: bold;">9</text>
<rect x="315" y="197" width="16" height="6" fill="#FF6B35" opacity="0.7" rx="3"/>
<text x="320" y="180" style="font-size: 14px; font-weight: bold; fill: #FF6B35;">♩=2</text>

<!-- More resonance -->
<line x1="312" y1="200" x2="388" y2="200" stroke="url(#resonanceGradient)" stroke-width="12" opacity="0.7"/>
<polygon points="380,195 388,200 380,205" fill="#00FF88" opacity="0.8"/>

<!-- Third note -->
<circle cx="400" cy="200" r="12" fill="#008080" stroke="crimson" stroke-width="2"/>
<text x="400" y="204" text-anchor="middle" style="font-size: 12px; fill: white; font-weight: bold;">9</text>
<rect x="415" y="197" width="40" height="6" fill="#FF6B35" opacity="0.7" rx="3"/>
<text x="420" y="180" style="font-size: 14px; font-weight: bold; fill: #FF6B35;">♩=5</text>

<!-- Example 2: Different strings -->
<text x="550" y="170" style="font-size: 14px; font-weight: bold;">Multiple Strings Playing:</text>

<!-- Note on string 10 -->
<circle cx="600" cy="250" r="12" fill="#008080" stroke="crimson" stroke-width="2"/>
<text x="600" y="254" text-anchor="middle" style="font-size: 12px; fill: white; font-weight: bold;">10</text>
<rect x="615" y="247" width="32" height="6" fill="#FF6B35" opacity="0.7" rx="3"/>
<text x="620" y="230" style="font-size: 14px; font-weight: bold; fill: #FF6B35;">♩=4</text>

<!-- Note on string 11 -->
<circle cx="700" cy="300" r="12" fill="#008080" stroke="crimson" stroke-width="2"/>
<text x="700" y="304" text-anchor="middle" style="font-size: 12px; fill: white; font-weight: bold;">11</text>
<rect x="715" y="297" width="16" height="6" fill="#FF6B35" opacity="0.7" rx="3"/>
<text x="720" y="280" style="font-size: 14px; font-weight: bold; fill: #FF6B35;">♩=2</text>

<!-- Resonance from string 10 continues -->
<line x1="612" y1="250" x2="788" y2="250" stroke="url(#resonanceGradient)" stroke-width="12" opacity="0.7"/>
<polygon points="780,245 788,250 780,255" fill="#00FF88" opacity="0.8"/>

<!-- Back to string 10 -->
<circle cx="800" cy="250" r="12" fill="#008080" stroke="crimson" stroke-width="2"/>
<text x="800" y="254" text-anchor="middle" style="font-size: 12px; fill: white; font-weight: bold;">10</text>
<rect x="815" y="247" width="24" height="6" fill="#FF6B35" opacity="0.7" rx="3"/>
<text x="820" y="230" style="font-size: 14px; font-weight: bold; fill: #FF6B35;">♩=3</text>

<!-- Example 3: Muted note -->
<text x="900" y="170" style="font-size: 14px; font-weight: bold;">Muted String (Stops Ringing):</text>

<!-- Muted note -->
<circle cx="950" cy="200" r="15" fill="#666" stroke="#333" stroke-width="2"/>
<text x="950" y="204" text-anchor="middle" style="font-size: 12px; fill: white; font-weight: bold;">9</text>
<text x="950" y="165" text-anchor="middle" style="font-size: 30px; font-weight: bold; fill: red;">✕</text>
<text x="950" y="150" text-anchor="middle" style="font-size: 12px; fill: red;">MUTE</text>
<rect x="965" y="197" width="16" height="6" fill="#FF6B35" opacity="0.7" rx="3"/>
<text x="970" y="180" style="font-size: 14px; font-weight: bold; fill: #FF6B35;">♩=2</text>

<!-- No resonance after muted note -->
<text x="1000" y="210" style="font-size: 12px; fill: red;">← No resonance after mute</text>

<!-- Summary Box -->
<rect x="50" y="400" width="1100" height="150" fill="#fffacd" stroke="black" stroke-width="2"/>
<text x="70" y="430" style="font-size: 18px; font-weight: bold;">How to Read This Tablature:</text>
<text x="70" y="460" style="font-size: 14px;">1. Numbers in circles = String number to play</text>
<text x="70" y="480" style="font-size: 14px;">2. Green gradient lines = String continues to ring (natural resonance)</text>
<text x="70" y="500" style="font-size: 14px;">3. Orange bars = Duration of note (longer bar = hold longer)</text>
<text x="70" y="520" style="font-size: 14px;">4. Red ✕ = Mute the string with your hand to stop resonance</text>

</svg>'''
    
    with open('SVG_Output/resonance_demo.svg', 'w') as f:
        f.write(svg_content)
    print("Created resonance_demo.svg with clear visual examples!")

if __name__ == '__main__':
    create_demo_svg()