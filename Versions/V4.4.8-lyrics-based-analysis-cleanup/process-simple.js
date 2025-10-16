#!/usr/bin/env node
/**
 * Simple local processor - creates basic segmentations
 */
const fs = require('fs');
const path = require('path');

const PROMPTS_DIR = './prompts';
const OUTPUT_DIR = './data/lyrics-segmentations';

// Find unprocessed songs
const prompts = fs.readdirSync(PROMPTS_DIR).filter(f => f.endsWith('.txt'));
const segmentations = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json'));

const unprocessed = prompts.filter(prompt => {
    const songName = prompt.replace(/^\d+_/, '').replace('.txt', '');
    return !segmentations.includes(songName + '.json');
}).slice(0, 7);

console.log(`Found ${unprocessed.length} songs to process\n`);
console.log('Songs needing segmentation:');
unprocessed.forEach((p, i) => {
    const name = p.replace(/^\d+_/, '').replace('.txt', '');
    console.log(`${i+1}. ${name}`);
});

console.log('\nTo complete segmentation, either:');
console.log('1. Use the API: node process-batch.js (requires ANTHROPIC_API_KEY)');
console.log('2. Manually segment each song using the prompts in prompts/ directory');
console.log('3. Use Claude Code conversation to segment each song individually');
