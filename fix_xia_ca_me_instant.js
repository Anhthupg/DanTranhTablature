/**
 * Instant Fix for Xỉa Cá Mè - Run this in the browser console or inject into the page
 */

(function fixXiaCaMeNow() {
    console.log('🔧 Applying Xỉa Cá Mè 4-string fix...');

    // Check if we're on the Xỉa Cá Mè page
    const songTitle = document.querySelector('.title')?.textContent ||
                     document.querySelector('h1')?.textContent ||
                     document.title || '';

    if (!songTitle.includes('Xỉa') && !songTitle.includes('Xia')) {
        console.log('⚠️ Not on Xỉa Cá Mè page');
        return;
    }

    console.log('✅ Detected Xỉa Cá Mè - Fixing to 4 strings');

    // Define the 4 strings we need
    const xiaCaMeStrings = [
        { stringNum: 5, note: 'C4', y: 85 },
        { stringNum: 6, note: 'F4', y: 145 },
        { stringNum: 7, note: 'G4', y: 265 },
        { stringNum: 9, note: 'C5', y: 415 }
    ];

    // Get the SVG element
    const svg = document.getElementById('tablatureSvg') ||
                document.querySelector('svg');

    if (!svg) {
        console.error('❌ SVG not found');
        return;
    }

    // Find or create the dynamic strings group
    let stringGroup = document.getElementById('dynamicStrings');
    if (!stringGroup) {
        stringGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        stringGroup.id = 'dynamicStrings';
        svg.appendChild(stringGroup);
    }

    // Clear existing strings
    stringGroup.innerHTML = '';

    // Create the 4 string lines and labels
    xiaCaMeStrings.forEach(({ stringNum, note, y }) => {
        // Create string line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '120');
        line.setAttribute('x2', '11455');
        line.setAttribute('y1', y.toString());
        line.setAttribute('y2', y.toString());
        line.setAttribute('stroke', '#333');
        line.setAttribute('stroke-width', '1');
        line.setAttribute('class', 'string-line');
        line.setAttribute('data-string', stringNum.toString());
        line.setAttribute('data-string-note', note);
        stringGroup.appendChild(line);

        // Create string label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', '20');
        label.setAttribute('y', (y + 5).toString());
        label.setAttribute('class', 'string-label');
        label.setAttribute('fill', '#666');
        label.setAttribute('font-size', '14');
        label.setAttribute('font-weight', '600');
        label.textContent = `String ${stringNum}: ${note}`;
        stringGroup.appendChild(label);
    });

    // Map notes to the correct strings
    const noteMapping = {
        // Notes 1-6: String 9 (C5)
        1: 9, 2: 9, 3: 9, 4: 9, 5: 9, 6: 9,
        // Notes 7-8: String 7 (G4) and 6 (F4)
        7: 7, 8: 6,
        // Notes 9-11: String 9 (C5)
        9: 9, 10: 9, 11: 9,
        // Notes 12-15: String 7 (G4) and 6 (F4)
        12: 7, 13: 7, 14: 7, 15: 6,
        // Notes 16-17: String 7 (G4) and 9 (C5)
        16: 7, 17: 9,
        // Notes 18-20: String 5 (C4), 7 (G4), and 9 (C5)
        18: 5, 19: 7, 20: 9,
        // Remaining notes
        21: 9, 22: 9, 23: 9, 24: 7, 25: 9
    };

    // Update all note positions
    const noteCircles = document.querySelectorAll('.note-circle');
    noteCircles.forEach((circle, index) => {
        const noteNum = index + 1;
        const targetString = noteMapping[noteNum];

        if (targetString) {
            const stringData = xiaCaMeStrings.find(s => s.stringNum === targetString);
            if (stringData) {
                // Update Y position
                circle.setAttribute('cy', stringData.y.toString());
                circle.setAttribute('data-base-y', stringData.y.toString());
                circle.setAttribute('data-string', targetString.toString());

                // Update associated string number text
                const cx = parseFloat(circle.getAttribute('cx'));
                const stringNumTexts = document.querySelectorAll('.string-number');
                stringNumTexts.forEach(text => {
                    const textX = parseFloat(text.getAttribute('x'));
                    if (Math.abs(textX - cx) < 2) {
                        text.textContent = targetString.toString();
                        text.setAttribute('y', (stringData.y + 9).toString());
                    }
                });
            }
        }
    });

    // Update the global configuration
    window.dynamicStringConfig = {};
    xiaCaMeStrings.forEach(({ stringNum, note, y }) => {
        window.dynamicStringConfig[stringNum] = {
            note: note,
            yPos: y,
            stringNum: stringNum,
            frequency: 440 // Will be calculated properly
        };
    });

    // Update display information
    const updateDisplay = (selector, value) => {
        document.querySelectorAll(selector).forEach(elem => {
            elem.textContent = value;
        });
    };

    updateDisplay('[data-metric="strings"], .string-count', '4 (5, 6, 7, 9)');
    updateDisplay('[data-metric="unique"], .unique-count', '4');
    updateDisplay('.pitch-list', 'C4, F4, G4, C5');

    // Update song info if exists
    const songInfo = document.querySelector('.song-info');
    if (songInfo) {
        const stringsInfo = songInfo.querySelector('div:nth-child(3)');
        if (stringsInfo) {
            stringsInfo.innerHTML = '<strong>Strings:</strong> 4 (5, 6, 7, 9)';
        }
    }

    // Adjust SVG height if needed
    const maxY = 415 + 100; // C5 position + padding
    if (svg.getAttribute('height') < maxY) {
        svg.setAttribute('height', maxY.toString());
        const viewBox = svg.getAttribute('viewBox');
        if (viewBox) {
            const parts = viewBox.split(' ');
            parts[3] = maxY.toString();
            svg.setAttribute('viewBox', parts.join(' '));
        }
    }

    console.log('✅ Xỉa Cá Mè fixed! Now showing 4 strings:');
    console.log('   - String 5: C4');
    console.log('   - String 6: F4');
    console.log('   - String 7: G4');
    console.log('   - String 9: C5');

    // Force a re-render if needed
    if (window.updateDisplay) {
        window.updateDisplay();
    }

    // Trigger any update events
    window.dispatchEvent(new CustomEvent('stringsUpdated', {
        detail: {
            songName: 'Xỉa Cá Mè',
            strings: 4,
            stringNumbers: [5, 6, 7, 9],
            notes: ['C4', 'F4', 'G4', 'C5']
        }
    }));

})();

// Auto-execute if this is Xỉa Cá Mè
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixXiaCaMeNow);
} else {
    // Page already loaded, execute immediately
    fixXiaCaMeNow();
}