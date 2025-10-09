#!/usr/bin/env node
/**
 * Claude API Batch Processor for Lyrics Segmentation
 *
 * Processes all 120 songs through Claude API using the punctuation-aware
 * LLM segmentation approach.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=your_key node process-with-claude-api.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const API_KEY = process.env.ANTHROPIC_API_KEY;
const PROMPTS_DIR = './prompts';
const OUTPUT_DIR = './data/lyrics-segmentations';
const MANIFEST_FILE = path.join(PROMPTS_DIR, 'MANIFEST.json');
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests
const MODEL = 'claude-3-5-sonnet-20241022'; // Latest Sonnet model

// Validate API key
if (!API_KEY) {
    console.error('❌ ERROR: ANTHROPIC_API_KEY environment variable not set');
    console.error('\nUsage:');
    console.error('  export ANTHROPIC_API_KEY=your_key_here');
    console.error('  node process-with-claude-api.js');
    process.exit(1);
}

/**
 * Call Claude API
 */
async function callClaudeAPI(prompt, songTitle) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            model: MODEL,
            max_tokens: 8192,
            temperature: 0.3, // Lower temperature for more consistent formatting
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        const options = {
            hostname: 'api.anthropic.com',
            port: 443,
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                'anthropic-version': '2023-06-01',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const response = JSON.parse(data);
                        const content = response.content[0].text;

                        // Try to parse as JSON
                        // Claude might wrap JSON in markdown code blocks
                        let jsonContent = content;

                        // Remove markdown code blocks if present
                        if (content.includes('```json')) {
                            jsonContent = content.split('```json')[1].split('```')[0].trim();
                        } else if (content.includes('```')) {
                            jsonContent = content.split('```')[1].split('```')[0].trim();
                        }

                        const parsedJSON = JSON.parse(jsonContent);
                        resolve(parsedJSON);
                    } catch (err) {
                        reject(new Error(`Failed to parse response for ${songTitle}: ${err.message}\nResponse: ${data.substring(0, 500)}`));
                    }
                } else {
                    reject(new Error(`API request failed with status ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (err) => {
            reject(new Error(`API request error: ${err.message}`));
        });

        req.write(postData);
        req.end();
    });
}

/**
 * Validate segmentation result
 */
function validateSegmentation(data, expectedTitle, expectedSyllables) {
    const errors = [];

    if (!data.songTitle) errors.push('Missing songTitle');
    if (!data.phrases || !Array.isArray(data.phrases)) errors.push('Missing or invalid phrases array');
    if (!data.statistics) errors.push('Missing statistics');
    if (data.segmentedBy !== 'Claude LLM (punctuation-aware)') {
        errors.push(`Wrong segmentedBy: ${data.segmentedBy}`);
    }

    // Check phrase structure
    if (data.phrases) {
        data.phrases.forEach((phrase, i) => {
            if (!phrase.text) errors.push(`Phrase ${i+1}: missing text`);
            if (!phrase.syllableCount) errors.push(`Phrase ${i+1}: missing syllableCount`);
            if (!phrase.english) errors.push(`Phrase ${i+1}: missing english translation`);
            if (!phrase.wordMapping || !Array.isArray(phrase.wordMapping)) {
                errors.push(`Phrase ${i+1}: missing wordMapping`);
            }
        });
    }

    // Warn if syllable count doesn't match (not critical)
    if (data.totalSyllables !== expectedSyllables) {
        console.log(`  ⚠️  Syllable count mismatch: expected ${expectedSyllables}, got ${data.totalSyllables}`);
    }

    return errors;
}

/**
 * Process a single song
 */
async function processSong(promptFile, manifest, index) {
    const promptPath = path.join(PROMPTS_DIR, promptFile);
    const prompt = fs.readFileSync(promptPath, 'utf8');

    const songInfo = manifest.find(m => m.promptFile.includes(promptFile));
    const songTitle = songInfo.title;
    const originalFile = songInfo.originalFile;

    console.log(`\n[${index}/120] Processing: ${songTitle}`);
    console.log(`  Prompt file: ${promptFile}`);

    try {
        // Call Claude API
        const result = await callClaudeAPI(prompt, songTitle);

        // Validate result
        const errors = validateSegmentation(result, songTitle, result.totalSyllables);

        if (errors.length > 0) {
            console.log(`  ❌ Validation failed:`);
            errors.forEach(err => console.log(`     - ${err}`));
            return { success: false, error: errors.join('; '), songTitle };
        }

        // Save result
        const outputPath = path.join(OUTPUT_DIR, originalFile);
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

        console.log(`  ✅ Success! Phrases: ${result.phrases.length}, Avg: ${result.statistics.averagePhraseLength}`);

        // Update manifest
        songInfo.status = 'completed';
        songInfo.completedAt = new Date().toISOString();
        songInfo.phraseCount = result.phrases.length;

        return { success: true, songTitle, phraseCount: result.phrases.length };

    } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
        songInfo.status = 'failed';
        songInfo.error = err.message;
        return { success: false, error: err.message, songTitle };
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('='.repeat(70));
    console.log('Claude API Batch Processor - LLM-Based Lyrics Segmentation');
    console.log('='.repeat(70));
    console.log();
    console.log(`Model: ${MODEL}`);
    console.log(`Rate limit delay: ${RATE_LIMIT_DELAY}ms`);
    console.log();

    // Load manifest
    if (!fs.existsSync(MANIFEST_FILE)) {
        console.error('❌ ERROR: MANIFEST.json not found. Run batch-resegment-llm.js first.');
        process.exit(1);
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));

    // Get pending songs
    const pendingSongs = manifest.filter(m => m.status === 'pending');

    if (pendingSongs.length === 0) {
        console.log('✅ All songs already processed!');
        process.exit(0);
    }

    console.log(`Found ${pendingSongs.length} songs to process\n`);
    console.log('Starting in 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const results = {
        success: [],
        failed: []
    };

    // Process each song
    for (let i = 0; i < pendingSongs.length; i++) {
        const song = pendingSongs[i];
        const promptFile = path.basename(song.promptFile);

        const result = await processSong(promptFile, manifest, i + 1);

        if (result.success) {
            results.success.push(result.songTitle);
        } else {
            results.failed.push({ title: result.songTitle, error: result.error });
        }

        // Save manifest after each song
        fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));

        // Rate limiting
        if (i < pendingSongs.length - 1) {
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
        }
    }

    // Final report
    console.log('\n' + '='.repeat(70));
    console.log('BATCH PROCESSING COMPLETE');
    console.log('='.repeat(70));
    console.log(`✅ Successful: ${results.success.length}/${pendingSongs.length}`);
    console.log(`❌ Failed: ${results.failed.length}/${pendingSongs.length}`);

    if (results.failed.length > 0) {
        console.log('\nFailed songs:');
        results.failed.forEach(f => {
            console.log(`  - ${f.title}: ${f.error.substring(0, 100)}`);
        });
    }

    console.log('\n✅ Results saved to: ' + OUTPUT_DIR);
    console.log('✅ Manifest updated: ' + MANIFEST_FILE);

    // Run quality analysis
    console.log('\nRunning quality analysis...');
    require('./analyze-all-segmentations.js');
}

main().catch(err => {
    console.error('\n❌ FATAL ERROR:', err);
    process.exit(1);
});
