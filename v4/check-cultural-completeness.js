const fs = require('fs');
const path = require('path');

const segmentsDir = 'data/lyrics-segmentations';
const files = fs.readdirSync(segmentsDir).filter(f => f.endsWith('.json'));

console.log('Checking cultural context completeness for', files.length, 'songs\n');

let complete = 0;
let incomplete = [];
let totalPhrases = 0;
let completeContexts = 0;

files.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(segmentsDir, file), 'utf8'));
    const songName = file.replace('.json', '');

    if (!data.phrases || data.phrases.length === 0) {
        incomplete.push({ song: songName, issue: 'No phrases' });
        return;
    }

    let hasIncomplete = false;

    data.phrases.forEach((phrase, idx) => {
        totalPhrases++;

        if (!phrase.culturalContext) {
            hasIncomplete = true;
        } else {
            const ctx = phrase.culturalContext;
            const hasDesc = ctx.description && ctx.description.trim().length > 0;
            const hasFacts = ctx.facts && ctx.facts.length > 0;
            const hasMusic = ctx.musicalContext && ctx.musicalContext.trim().length > 0;

            if (hasDesc && hasFacts && hasMusic) {
                completeContexts++;
            } else {
                hasIncomplete = true;
            }
        }
    });

    if (hasIncomplete) {
        incomplete.push({ song: songName });
    } else {
        complete++;
    }
});

console.log('✓ Complete songs:', complete);
console.log('✗ Incomplete songs:', incomplete.length);
console.log('Total phrases checked:', totalPhrases);
console.log('Complete cultural contexts:', completeContexts);
console.log('Coverage:', Math.round(completeContexts / totalPhrases * 100) + '%');

if (incomplete.length > 0) {
    console.log('\nIncomplete songs (first 20):');
    incomplete.slice(0, 20).forEach(item => {
        console.log('  -', item.song, item.issue || '');
    });
}
