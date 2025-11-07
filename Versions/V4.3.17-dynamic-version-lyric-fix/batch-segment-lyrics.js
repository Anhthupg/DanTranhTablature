/**
 * Automated Batch Lyrics Segmentation Workflow
 *
 * Processes songs in batches:
 * 1. Extract lyrics from MusicXML
 * 2. Generate LLM prompts for segmentation
 * 3. Save prompts for batch processing
 * 4. After segmentation: regenerate relationships + update MANIFEST
 */

const fs = require('fs');
const path = require('path');
const DataLoader = require('./utils/data-loader');
const { DOMParser } = require('xmldom');

const BATCH_SIZE = 7;
const loader = new DataLoader(__dirname);

/**
 * Scan all category folders for MusicXML files
 */
function scanMusicXMLRecursively(baseDir) {
  const results = [];
  const categories = [
    'vietnamese-skeletal', 'vietnamese-dantranh',
    'nonvietnamese-skeletal', 'nonvietnamese-dantranh',
    'exercises-skeletal', 'exercises-dantranh'
  ];

  categories.forEach(category => {
    const categoryPath = path.join(baseDir, category);
    if (fs.existsSync(categoryPath)) {
      const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.xml') || f.endsWith('.musicxml'));
      files.forEach(f => {
        const fullPath = path.join(categoryPath, f);
        results.push({ filename: f, fullPath, category });
      });
    }
  });

  return results;
}

/**
 * Extract lyrics from MusicXML file
 */
function extractLyrics(xmlPath) {
  try {
    const xmlContent = fs.readFileSync(xmlPath, 'utf8');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

    const lyrics = [];
    const lyricElements = xmlDoc.getElementsByTagName('lyric');

    for (let i = 0; i < lyricElements.length; i++) {
      const textElement = lyricElements[i].getElementsByTagName('text')[0];
      if (textElement) {
        const text = textElement.textContent.trim();
        if (text && text.length > 0) {
          lyrics.push(text);
        }
      }
    }

    return lyrics.join(' ');
  } catch (error) {
    console.error(`Error extracting lyrics from ${xmlPath}:`, error.message);
    return null;
  }
}

/**
 * Find songs missing segmentation
 */
function findMissingSongs() {
  const musicxmlFiles = scanMusicXMLRecursively('data/musicxml');
  const segmentations = fs.readdirSync('data/lyrics-segmentations')
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));

  const missing = [];

  musicxmlFiles.forEach(fileInfo => {
    const name = fileInfo.filename.replace('.musicxml.xml', '').replace('.musicxml', '').replace('.xml', '');
    const backendId = loader.toBackendId(name);

    if (backendId && !segmentations.includes(backendId)) {
      const displayName = loader.nameMappings.songs[backendId]?.displayName || name;
      const lyrics = extractLyrics(fileInfo.fullPath);

      if (lyrics && lyrics.length > 0) {
        missing.push({
          filename: fileInfo.filename,
          name,
          backendId,
          displayName,
          category: fileInfo.category,
          lyrics,
          fullPath: fileInfo.fullPath
        });
      }
    }
  });

  return missing;
}

/**
 * Generate LLM segmentation prompt for a song
 */
function generateSegmentationPrompt(song) {
  return `
# Lyrics Segmentation Task

**Song**: ${song.displayName}
**Category**: ${song.category}
**Lyrics**: ${song.lyrics}

Please segment these lyrics into natural phrases following Vietnamese linguistic patterns. Return a JSON object with this structure:

\`\`\`json
{
  "songTitle": "${song.displayName}",
  "segmentedBy": "Claude LLM",
  "phrases": [
    {
      "id": 1,
      "text": "phrase text here",
      "syllableCount": 4,
      "type": "verse",
      "linguisticType": "declarative",
      "english": "English translation"
    }
  ],
  "statistics": {
    "totalSyllables": 0,
    "totalPhrases": 0,
    "averagePhraseLength": 0
  }
}
\`\`\`

Focus on:
- Natural breath/pause points
- Grammatical completeness
- Musical phrasing alignment
- Question/answer/exclamatory patterns
`;
}

/**
 * Main batch processing workflow
 */
function main() {
  console.log('=== BATCH LYRICS SEGMENTATION WORKFLOW ===\n');

  // Step 1: Find missing songs
  const missingSongs = findMissingSongs();
  console.log(`Found ${missingSongs.length} songs needing segmentation\n`);

  if (missingSongs.length === 0) {
    console.log('✅ All songs have segmentation! Nothing to do.');
    return;
  }

  // Step 2: Show list
  console.log('Songs to process:');
  missingSongs.forEach((song, i) => {
    console.log(`  ${i + 1}. ${song.displayName} [${song.category}] - ${song.lyrics.split(' ').length} words`);
  });

  // Step 3: Create batches
  const batches = [];
  for (let i = 0; i < missingSongs.length; i += BATCH_SIZE) {
    batches.push(missingSongs.slice(i, i + BATCH_SIZE));
  }

  console.log(`\nCreated ${batches.length} batches (${BATCH_SIZE} songs per batch)\n`);

  // Step 4: Save prompts directory
  const promptsDir = path.join(__dirname, 'data/segmentation-prompts');
  if (!fs.existsSync(promptsDir)) {
    fs.mkdirSync(promptsDir, { recursive: true });
  }

  // Step 5: Generate prompt files for each batch
  batches.forEach((batch, batchIndex) => {
    const batchNum = batchIndex + 1;
    const promptFile = path.join(promptsDir, `batch-${batchNum}.txt`);
    const metadataFile = path.join(promptsDir, `batch-${batchNum}-metadata.json`);

    let promptContent = `=== BATCH ${batchNum} - LYRICS SEGMENTATION ===\n\n`;
    promptContent += `Songs in this batch: ${batch.length}\n\n`;

    batch.forEach((song, songIndex) => {
      promptContent += `\n${'='.repeat(80)}\n`;
      promptContent += `SONG ${songIndex + 1}/${batch.length}\n`;
      promptContent += `${'='.repeat(80)}\n\n`;
      promptContent += generateSegmentationPrompt(song);
    });

    promptContent += `\n\n${'='.repeat(80)}\n`;
    promptContent += `END OF BATCH ${batchNum}\n`;
    promptContent += `${'='.repeat(80)}\n\n`;
    promptContent += `After segmenting, save each song's JSON to:\n`;
    batch.forEach(song => {
      promptContent += `  data/lyrics-segmentations/${song.backendId}.json\n`;
    });

    fs.writeFileSync(promptFile, promptContent);

    // Save metadata for post-processing
    fs.writeFileSync(metadataFile, JSON.stringify(batch, null, 2));

    console.log(`✓ Batch ${batchNum}: ${batch.length} songs → ${promptFile}`);
  });

  // Step 6: Create instructions file
  const instructionsFile = path.join(promptsDir, 'INSTRUCTIONS.md');
  fs.writeFileSync(instructionsFile, `
# Batch Lyrics Segmentation Instructions

## Workflow

### Step 1: Process Each Batch (${batches.length} batches total)

For each batch file (batch-1.txt, batch-2.txt, etc.):

1. Open the batch prompt file
2. Copy the entire content
3. Paste into Claude (or your preferred LLM)
4. Claude will return JSON for each song
5. Save each JSON to the specified path

### Step 2: After Each Batch - Run Post-Processing

\`\`\`bash
# Regenerate relationships for processed songs
node batch-regenerate-relationships.js batch-1

# Update MANIFEST
node update-manifest.js
\`\`\`

### Step 3: Verify

\`\`\`bash
# Check what's left
node find-missing-segmentations.js
\`\`\`

### Step 4: Repeat

Process next batch and repeat Steps 2-3.

## Batches

${batches.map((batch, i) => `
### Batch ${i + 1} (${batch.length} songs)

Songs:
${batch.map((s, j) => `${j + 1}. ${s.displayName}`).join('\n')}

Prompt: \`data/segmentation-prompts/batch-${i + 1}.txt\`
`).join('\n')}

## Quick Commands

\`\`\`bash
# View batch prompt
cat data/segmentation-prompts/batch-1.txt

# After segmentation, regenerate relationships
node batch-regenerate-relationships.js batch-1

# Check progress
node find-missing-segmentations.js
\`\`\`
`);

  console.log(`\n✅ Prompts generated!\n`);
  console.log('Next steps:');
  console.log(`1. Read instructions: cat data/segmentation-prompts/INSTRUCTIONS.md`);
  console.log(`2. Process first batch: cat data/segmentation-prompts/batch-1.txt`);
  console.log(`3. Save segmentations to data/lyrics-segmentations/`);
  console.log(`4. Run: node batch-regenerate-relationships.js batch-1\n`);
}

// Run
main();
