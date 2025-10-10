#!/usr/bin/env node
/**
 * Process Batch of 7 Songs Locally
 *
 * Workflow:
 * 1. Segment lyrics using Claude API
 * 2. Regenerate relationships for processed songs
 * 3. Update MANIFEST
 * 4. Report progress
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const API_KEY = process.env.ANTHROPIC_API_KEY;
const PROMPTS_DIR = './prompts';
const OUTPUT_DIR = './data/lyrics-segmentations';
const RELATIONSHIPS_DIR = './data/relationships';
const BATCH_SIZE = 7;
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests
const MODEL = 'claude-3-5-sonnet-20241022';

// Validate API key
if (!API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY environment variable not set');
    console.error('\nSet your API key:');
    console.error('  export ANTHROPIC_API_KEY=your_key_here');
    process.exit(1);
}

/**
 * Find unprocessed songs
 */
function findUnprocessedSongs() {
    const prompts = fs.readdirSync(PROMPTS_DIR).filter(f => f.endsWith('.txt'));
    const segmentations = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json'));

    const unprocessed = prompts.filter(prompt => {
        const songName = prompt.replace(/^\d+_/, '').replace('.txt', '');
        const jsonName = songName + '.json';
        return !segmentations.includes(jsonName);
    });

    return unprocessed;
}

/**
 * Call Claude API
 */
async function callClaudeAPI(prompt, songTitle) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            model: MODEL,
            max_tokens: 8192,
            temperature: 0.3,
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
                        let jsonContent = content;

                        // Remove markdown code blocks if present
                        if (content.includes('\`\`\`json')) {
                            jsonContent = content.split('\`\`\`json')[1].split('\`\`\`')[0].trim();
                        } else if (content.includes('\`\`\`')) {
                            jsonContent = content.split('\`\`\`')[1].split('\`\`\`')[0].trim();
                        }

                        const parsedJSON = JSON.parse(jsonContent);
                        resolve(parsedJSON);
                    } catch (err) {
                        reject(new Error(\`Failed to parse response for \${songTitle}: \${err.message}\`));
                    }
                } else {
                    reject(new Error(\`API request failed with status \${res.statusCode}: \${data}\`));
                }
            });
        });

        req.on('error', (err) => {
            reject(new Error(\`API request error: \${err.message}\`));
        });

        req.write(postData);
        req.end();
    });
}

/**
 * Process a single song
 */
async function processSong(promptFile, index, total) {
    const promptPath = path.join(PROMPTS_DIR, promptFile);
    const prompt = fs.readFileSync(promptPath, 'utf8');

    const songName = promptFile.replace(/^\d+_/, '').replace('.txt', '');

    console.log(\`\n[\${index}/\${total}] Processing: \${songName}\`);

    try {
        // Call Claude API
        const result = await callClaudeAPI(prompt, songName);

        // Validate result
        if (!result.songTitle || !result.phrases || !Array.isArray(result.phrases)) {
            throw new Error('Invalid segmentation result');
        }

        // Save result
        const outputPath = path.join(OUTPUT_DIR, \`\${songName}.json\`);
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

        console.log(\`  Success! Phrases: \${result.phrases.length}, Avg: \${result.statistics.averagePhraseLength}\`);

        return { success: true, songName, phraseCount: result.phrases.length };

    } catch (err) {
        console.log(\`  ERROR: \${err.message}\`);
        return { success: false, songName, error: err.message };
    }
}

/**
 * Regenerate relationships for processed songs
 */
async function regenerateRelationships(songNames) {
    console.log('\n=== Regenerating Relationships ===');

    for (const songName of songNames) {
        try {
            const cmd = \`node generate-v4-relationships.js "\${songName}"\`;
            console.log(\`  Generating relationships for: \${songName}\`);
            await execPromise(cmd);
            console.log(\`    Success\`);
        } catch (err) {
            console.error(\`    ERROR: \${err.message}\`);
        }
    }
}

/**
 * Update MANIFEST
 */
function updateManifest(processedSongs, results) {
    console.log('\n=== Updating MANIFEST ===');

    const manifestPath = path.join(PROMPTS_DIR, 'MANIFEST.json');
    let manifest = {};

    if (fs.existsSync(manifestPath)) {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    }

    if (!manifest.processed) {
        manifest.processed = [];
    }

    processedSongs.forEach((songName, i) => {
        const result = results[i];
        manifest.processed.push({
            songName,
            processedAt: new Date().toISOString(),
            success: result.success,
            phraseCount: result.phraseCount || 0,
            error: result.error || null
        });
    });

    manifest.totalProcessed = manifest.processed.length;
    manifest.lastUpdated = new Date().toISOString();

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(\`  MANIFEST updated: \${manifest.totalProcessed} songs processed\`);
}

/**
 * Main execution
 */
async function main() {
    console.log('='.repeat(70));
    console.log('Batch Processor - Process 7 Songs at a Time');
    console.log('='.repeat(70));
    console.log();

    // Find unprocessed songs
    const unprocessed = findUnprocessedSongs();

    if (unprocessed.length === 0) {
        console.log('All songs already processed!');
        process.exit(0);
    }

    const batch = unprocessed.slice(0, BATCH_SIZE);

    console.log(\`Found \${unprocessed.length} unprocessed songs\`);
    console.log(\`Processing batch of \${batch.length} songs\n\`);

    const results = [];
    const processedSongNames = [];

    // Process each song
    for (let i = 0; i < batch.length; i++) {
        const promptFile = batch[i];
        const result = await processSong(promptFile, i + 1, batch.length);

        results.push(result);
        if (result.success) {
            processedSongNames.push(result.songName);
        }

        // Rate limiting
        if (i < batch.length - 1) {
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
        }
    }

    // Regenerate relationships for successful songs
    if (processedSongNames.length > 0) {
        await regenerateRelationships(processedSongNames);
    }

    // Update MANIFEST
    updateManifest(processedSongNames, results);

    // Final report
    console.log('\n' + '='.repeat(70));
    console.log('BATCH COMPLETE');
    console.log('='.repeat(70));

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(\`Successful: \${successful}/\${batch.length}\`);
    console.log(\`Failed: \${failed}/\${batch.length}\`);
    console.log(\`\nRemaining: \${unprocessed.length - batch.length} songs\`);

    if (failed > 0) {
        console.log('\nFailed songs:');
        results.filter(r => !r.success).forEach(r => {
            console.log(\`  - \${r.songName}: \${r.error}\`);
        });
    }

    console.log('\nRun again to process next batch!');
}

main().catch(err => {
    console.error('\nFATAL ERROR:', err);
    process.exit(1);
});
