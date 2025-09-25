// COPY AND PASTE THIS INTO THE BROWSER CONSOLE ON THE XỈA CÁ MÈ PAGE

// Call the existing function to regenerate strings
if (typeof generateAndDisplayDynamicStrings === 'function') {
    console.log('🔧 Regenerating strings...');
    generateAndDisplayDynamicStrings();
    console.log('✅ Strings regenerated!');
} else {
    console.log('⚠️ Function not found, applying manual fix...');

    // Manual fix
    const svg = document.querySelector('svg');
    let stringGroup = svg.querySelector('#dynamicStrings');
    if (!stringGroup) {
        stringGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        stringGroup.id = 'dynamicStrings';
        svg.appendChild(stringGroup);
    }

    stringGroup.innerHTML = '';

    // Add 4 strings
    const strings = [
        {num: 5, note: 'C4', y: 85},
        {num: 6, note: 'F4', y: 145},
        {num: 7, note: 'G4', y: 265},
        {num: 9, note: 'C5', y: 415}
    ];

    strings.forEach(s => {
        // Line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '120');
        line.setAttribute('x2', '11455');
        line.setAttribute('y1', s.y);
        line.setAttribute('y2', s.y);
        line.setAttribute('stroke', '#333');
        line.setAttribute('class', 'string-line');
        stringGroup.appendChild(line);

        // Label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '20');
        text.setAttribute('y', s.y + 5);
        text.setAttribute('fill', '#666');
        text.setAttribute('font-size', '14');
        text.textContent = `String ${s.num}: ${s.note}`;
        stringGroup.appendChild(text);
    });

    console.log('✅ Added 4 strings manually');
}

// Update display
document.querySelectorAll('[data-metric="strings"], .string-count').forEach(e => {
    e.textContent = '4 (5, 6, 7, 9)';
});

document.querySelectorAll('[data-metric="unique"]').forEach(e => {
    e.textContent = '4';
});

console.log('🎵 Xỉa Cá Mè fixed: Now showing 4 strings (C4, F4, G4, C5)');