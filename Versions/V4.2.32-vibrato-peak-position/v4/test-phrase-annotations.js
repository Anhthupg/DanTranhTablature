// Test script for phrase annotations generation
const { generateWithPositions } = require('./generate-phrase-annotations-with-positions.js');
const { renderPhraseAnnotations } = require('./render-phrase-annotations.js');
const fs = require('fs');
const path = require('path');

// Test with "Bà rằng bà rí"
const songName = 'Bà rằng bà rí';
console.log(`\n========================================`);
console.log(`Testing Phrase Annotations Generator`);
console.log(`Song: ${songName}`);
console.log(`========================================\n`);

const result = generateWithPositions(songName);

if (result) {
    console.log(`\n✅ Generation successful!`);
    console.log(`   Phrases generated: ${result.phrases.length}`);
    console.log(`   SVG width: ${result.svgWidth}px`);

    console.log(`\n📊 Analysis Results:`);
    console.log(`   Exact refrains: ${result.analysis.exactRefrains.length}`);
    result.analysis.exactRefrains.forEach(refrain => {
        console.log(`     - "${refrain.text.substring(0, 30)}..." (${refrain.count}x)`);
    });

    console.log(`\n🎨 Sample Phrase Details:`);
    result.phrases.slice(0, 3).forEach((phrase, idx) => {
        console.log(`\n   Phrase ${phrase.id}:`);
        console.log(`     Text: "${phrase.text}"`);
        console.log(`     Position: X ${phrase.position.startX} → ${phrase.position.endX} (width: ${phrase.position.width}px)`);
        console.log(`     Parallelism: ${phrase.parallelismClass || 'none'}`);
        if (phrase.parallelismBadge) {
            console.log(`     Badge: ${phrase.parallelismBadge.text}`);
        }
        console.log(`     Dominant domain: ${phrase.dominantDomainClass}`);
        console.log(`     Semantic icons: ${phrase.semanticIcons.length}`);
        phrase.semanticIcons.forEach(icon => {
            console.log(`       ${icon.icon} ${icon.label}`);
        });
    });

    console.log(`\n📝 Generating HTML output...`);
    const svgContent = renderPhraseAnnotations(result);

    // Create standalone HTML file for testing
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Phrase Annotations Test - ${songName}</title>
    <style>
        body { margin: 20px; font-family: Arial, sans-serif; }
        h1 { color: #2C3E50; }
        .container { border: 1px solid #ccc; overflow-x: auto; background: white; }

        /* Copy styles from component */
        .phrase-box {
            fill: rgba(0, 128, 128, 0.08);
            stroke: #008080;
            stroke-width: 2;
            stroke-dasharray: 5,5;
            transition: fill 0.2s, stroke 0.2s;
            cursor: pointer;
        }
        .phrase-box:hover {
            fill: rgba(0, 128, 128, 0.15);
            stroke: #005959;
            stroke-width: 3;
        }
        .phrase-box.exact-refrain {
            fill: rgba(255, 215, 0, 0.15);
            stroke: #FFD700;
            stroke-dasharray: none;
            stroke-width: 3;
        }
        .phrase-box.domain-emotion { stroke: #E74C3C; }
        .phrase-box.domain-abstract { stroke: #9B59B6; }
        .phrase-box.domain-nature { stroke: #27AE60; }
        .phrase-box.domain-action { stroke: #3498DB; }
        .phrase-box.domain-characters { stroke: #F39C12; }
        .phrase-box.domain-vocatives { stroke: #E67E22; }

        .phrase-label {
            font-size: 14px;
            font-weight: bold;
            fill: #2C3E50;
            text-anchor: middle;
            pointer-events: none;
        }
        .parallelism-badge {
            font-size: 11px;
            font-weight: bold;
            text-anchor: middle;
            pointer-events: none;
        }
        .parallelism-badge.exact { fill: #B8860B; }
        .semantic-icon {
            font-size: 11px;
            text-anchor: middle;
            fill: #555;
            pointer-events: none;
        }
        .semantic-icon.emotion { fill: #E74C3C; }
        .semantic-icon.abstract { fill: #9B59B6; }
        .semantic-icon.nature { fill: #27AE60; }
        .semantic-icon.action { fill: #3498DB; }
        .semantic-icon.characters { fill: #F39C12; }
        .semantic-icon.vocatives { fill: #E67E22; }
        .function-label {
            font-size: 10px;
            font-style: italic;
            fill: #7F8C8D;
            text-anchor: middle;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <h1>🎼 Phrase Annotations Test</h1>
    <p><strong>Song:</strong> ${songName}</p>
    <p><strong>Phrases:</strong> ${result.phrases.length} | <strong>SVG Width:</strong> ${result.svgWidth}px</p>

    <div class="container">
        <svg width="${result.svgWidth}" height="400">
            ${svgContent}
        </svg>
    </div>

    <h2>Analysis Summary</h2>
    <ul>
        <li><strong>Exact Refrains:</strong> ${result.analysis.exactRefrains.length}</li>
        <li><strong>Structural Parallels:</strong> ${result.analysis.structuralParallels.length}</li>
        <li><strong>Semantic Groups:</strong> ${Object.keys(result.analysis.semanticParallels).length}</li>
    </ul>

    <h3>Exact Refrains Detected:</h3>
    <ul>
        ${result.analysis.exactRefrains.map(r =>
            `<li>"${r.text}" - ${r.count} occurrences (phrases: ${r.phraseIds.join(', ')})</li>`
        ).join('\n        ')}
    </ul>
</body>
</html>`;

    const outputPath = path.join(__dirname, 'test-phrase-annotations.html');
    fs.writeFileSync(outputPath, htmlContent, 'utf8');

    console.log(`\n✅ HTML test file created: ${outputPath}`);
    console.log(`\n📂 Open in browser to view annotated phrases`);

} else {
    console.error(`\n❌ Generation failed`);
}
