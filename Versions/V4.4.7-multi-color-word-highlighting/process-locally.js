#!/usr/bin/env node
/**
 * Local Processing Script - Uses Claude Code's current session
 * Reads prompts and creates placeholder files for manual processing
 */

const fs = require('fs');
const path = require('path');

const PROMPTS_DIR = './prompts';
const OUTPUT_DIR = './data/lyrics-segmentations';
const MANIFEST_FILE = path.join(PROMPTS_DIR, 'MANIFEST.json');

function main() {
    console.log('Processing songs locally...\n');

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
    const pending = manifest.filter(m => m.status === 'pending');

    console.log(`Found ${pending.length} songs to process`);
    console.log('\nPrompt files ready at:');

    pending.forEach((song, i) => {
        console.log(`${i+1}. ${song.title} -> ${song.promptFile}`);
    });

    console.log('\n\nReady for manual processing in Claude Code conversation!');
}

main();
