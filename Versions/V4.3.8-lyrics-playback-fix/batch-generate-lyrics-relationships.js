/**
 * Batch Generate Lyrics Segmentations and Relationships
 *
 * This script:
 * 1. Scans all MusicXML files in data/musicxml/
 * 2. For each song with lyrics:
 *    a. Generates LLM phrase segmentation (requires manual LLM call)
 *    b. Generates word-to-note relationships (automated)
 * 3. Updates server to show Lyrics + Phrases sections for all songs
 *
 * Note: LLM segmentation requires manual processing due to copyright considerations.
 * This script provides the framework.
 */

const fs = require('fs');
const path = require('path');
const V4RelationshipsGenerator = require('./generate-v4-relationships');

class BatchProcessor {
    constructor() {
        this.musicxmlDir = path.join(__dirname, 'data', 'musicxml');
        this.lyricsDir = path.join(__dirname, 'data', 'lyrics-segmentations');
        this.relationshipsDir = path.join(__dirname, 'data', 'relationships');

        this.relGenerator = new V4RelationshipsGenerator();

        // Ensure directories exist
        [this.lyricsDir, this.relationshipsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * Scan all MusicXML files and check which have lyrics
     */
    scanLibrary() {
        const files = fs.readdirSync(this.musicxmlDir).filter(f => f.endsWith('.musicxml.xml'));

        console.log(`\n📊 Scanning ${files.length} MusicXML files...\n`);

        const songsWithLyrics = [];
        const songsWithoutLyrics = [];
        const alreadyProcessed = [];

        files.forEach(file => {
            const songName = file.replace('.musicxml.xml', '');
            const xmlPath = path.join(this.musicxmlDir, file);
            const xmlContent = fs.readFileSync(xmlPath, 'utf-8');

            // Check if has lyrics
            const hasLyrics = xmlContent.includes('<lyric') && xmlContent.includes('<text>');

            // Check if already has segmentation
            const segmentationPath = path.join(this.lyricsDir, `${songName}.json`);
            const hasSegmentation = fs.existsSync(segmentationPath);

            // Check if already has relationships
            const relationshipsPath = path.join(this.relationshipsDir, `${songName}-relationships.json`);
            const hasRelationships = fs.existsSync(relationshipsPath);

            if (hasSegmentation && hasRelationships) {
                alreadyProcessed.push(songName);
            } else if (hasLyrics) {
                songsWithLyrics.push(songName);
            } else {
                songsWithoutLyrics.push(songName);
            }
        });

        console.log(`✅ Already processed: ${alreadyProcessed.length} songs`);
        console.log(`📝 Have lyrics (need processing): ${songsWithLyrics.length} songs`);
        console.log(`❌ No lyrics: ${songsWithoutLyrics.length} songs`);
        console.log('');

        return { songsWithLyrics, songsWithoutLyrics, alreadyProcessed };
    }

    /**
     * Generate relationships for a single song (automated)
     */
    async generateRelationships(songName) {
        try {
            console.log(`  📊 Generating relationships for: ${songName}`);
            await this.relGenerator.generateRelationships(songName);
            return true;
        } catch (error) {
            console.error(`  ❌ Error generating relationships for ${songName}:`, error.message);
            return false;
        }
    }

    /**
     * Batch generate relationships for all songs that have lyrics segmentations
     */
    async batchGenerateRelationships() {
        const segmentationFiles = fs.readdirSync(this.lyricsDir).filter(f => f.endsWith('.json'));

        console.log(`\n🔄 Generating relationships for ${segmentationFiles.length} segmented songs...\n`);

        let success = 0;
        let failed = 0;

        for (const file of segmentationFiles) {
            const songName = file.replace('.json', '');
            const relationshipsPath = path.join(this.relationshipsDir, `${songName}-relationships.json`);

            // Skip if already exists
            if (fs.existsSync(relationshipsPath)) {
                console.log(`  ⏭️  Skipping ${songName} (already exists)`);
                continue;
            }

            const result = await this.generateRelationships(songName);
            if (result) {
                success++;
            } else {
                failed++;
            }
        }

        console.log(`\n✅ Generated ${success} relationships successfully`);
        if (failed > 0) console.log(`❌ Failed: ${failed}`);
    }

    /**
     * Generate summary report
     */
    generateReport() {
        const scan = this.scanLibrary();

        console.log(`\n📋 SUMMARY REPORT\n`);
        console.log(`Total Songs: ${scan.songsWithLyrics.length + scan.songsWithoutLyrics.length + scan.alreadyProcessed.length}`);
        console.log(`Ready for Use: ${scan.alreadyProcessed.length} (have lyrics + relationships)`);
        console.log(`Need LLM Segmentation: ${scan.songsWithLyrics.length} (have lyrics, need phrases)`);
        console.log(`No Lyrics: ${scan.songsWithoutLyrics.length} (instrumental or missing lyrics)`);

        if (scan.alreadyProcessed.length > 0) {
            console.log(`\n✅ Songs ready for Lyrics + Phrases sections:`);
            scan.alreadyProcessed.forEach((name, i) => {
                if (i < 10) console.log(`   ${i + 1}. ${name}`);
            });
            if (scan.alreadyProcessed.length > 10) {
                console.log(`   ... and ${scan.alreadyProcessed.length - 10} more`);
            }
        }

        console.log(`\n📝 Next Steps:`);
        console.log(`   1. For songs with lyrics, create LLM segmentations in data/lyrics-segmentations/`);
        console.log(`   2. Run: node batch-generate-lyrics-relationships.js --relationships`);
        console.log(`   3. Refresh browser - Lyrics + Phrases sections will appear automatically`);
    }
}

// CLI Interface
const processor = new BatchProcessor();

const args = process.argv.slice(2);

if (args.includes('--scan')) {
    processor.scanLibrary();
} else if (args.includes('--relationships')) {
    processor.batchGenerateRelationships();
} else if (args.includes('--report')) {
    processor.generateReport();
} else {
    console.log(`
📖 Batch Lyrics & Relationships Generator

Usage:
  node batch-generate-lyrics-relationships.js --scan
      Scan library and show which songs have lyrics

  node batch-generate-lyrics-relationships.js --report
      Generate detailed report of processing status

  node batch-generate-lyrics-relationships.js --relationships
      Generate relationships for all songs that have lyrics segmentations

Process:
  1. Run --report to see current status
  2. Create LLM segmentations for songs with lyrics (manual process)
  3. Run --relationships to generate word-to-note mappings
  4. Done! Lyrics + Phrases sections will appear automatically

Example: "Bà rằng bà rí" is already fully processed with:
  ✅ data/lyrics-segmentations/Bà rằng bà rí.json
  ✅ data/relationships/Bà rằng bà rí-relationships.json
    `);
}

module.exports = BatchProcessor;
