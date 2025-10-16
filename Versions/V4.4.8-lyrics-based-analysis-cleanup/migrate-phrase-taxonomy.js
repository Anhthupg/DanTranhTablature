#!/usr/bin/env node

/**
 * Phrase Taxonomy Migration Script - V4.4.8
 *
 * Migrates phrase classification from single "phraseType" field to 3 independent hierarchies:
 * 1. structuralRole - Song structure (refrain, verse, bridge, etc.)
 * 2. linguisticType - Sentence type (question, answer, exclamatory, etc.)
 * 3. semanticCategory - Thematic content (nature, love, work, etc.)
 *
 * Usage:
 *   node migrate-phrase-taxonomy.js              # Migrate all songs
 *   node migrate-phrase-taxonomy.js rollback     # Restore from backup
 *   node migrate-phrase-taxonomy.js --sample     # Test with 5 songs only
 */

const fs = require('fs');
const path = require('path');

class PhraseTaxonomyMigrator {
    constructor() {
        this.relationshipsDir = path.join(__dirname, 'data/relationships');
        this.lyricsDir = path.join(__dirname, 'data/lyrics-segmentations');
        this.backupDir = path.join(__dirname, 'data/relationships-backup-v4.4.7');

        this.stats = {
            totalFiles: 0,
            successCount: 0,
            errorCount: 0,
            totalWords: 0,
            migratedWords: 0,
            hierarchyBreakdown: {
                structural: {},
                position: {},
                linguistic: {},
                semantic: {}
            }
        };
    }

    async migrate(sampleOnly = false, sampleSongs = null) {
        console.log('🔄 Starting Phrase Taxonomy Migration...\n');
        console.log('📋 Migration Plan:');
        console.log('   1. Backup existing data');
        console.log('   2. Parse current phraseType field');
        console.log('   3. Infer missing hierarchies');
        console.log('   4. Write new 4-field structure');
        console.log('   5. Validate results\n');

        // Step 1: Backup existing data
        await this.backupExistingData();

        // Step 2: Get files to migrate
        let files = fs.readdirSync(this.relationshipsDir)
            .filter(f => f.endsWith('-relationships.json'));

        if (sampleOnly) {
            const sampleFiles = sampleSongs || [
                'ba-rang-ba-ri-relationships.json',
                'ly-chieu-chieu-relationships.json',
                'ho-gia-gao-relationships.json',
                'hat-ru-con-relationships.json',
                'do-dua-relationships.json'
            ];
            files = files.filter(f => sampleFiles.includes(f));
            console.log(`🧪 SAMPLE MODE: Testing with ${files.length} songs\n`);
        }

        this.stats.totalFiles = files.length;
        console.log(`Found ${files.length} relationship files\n`);

        // Step 3: Migrate each file
        for (const file of files) {
            try {
                await this.migrateFile(file);
                this.stats.successCount++;
            } catch (error) {
                console.error(`❌ Error migrating ${file}:`, error.message);
                this.stats.errorCount++;
            }
        }

        // Step 4: Print summary
        this.printSummary();
    }

    async backupExistingData() {
        console.log('📦 Creating backup...');

        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }

        const files = fs.readdirSync(this.relationshipsDir)
            .filter(f => f.endsWith('-relationships.json'));

        for (const file of files) {
            const src = path.join(this.relationshipsDir, file);
            const dest = path.join(this.backupDir, file);
            fs.copyFileSync(src, dest);
        }

        console.log(`✓ Backed up ${files.length} files to ${this.backupDir}\n`);
    }

    async migrateFile(filename) {
        const filePath = path.join(this.relationshipsDir, filename);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const songName = data.metadata.songName;
        console.log(`\n📄 Processing: ${songName}`);

        // Load lyrics segmentation for phrase texts
        const lyricsFile = this.findLyricsFile(songName);
        let lyricsData = null;

        if (lyricsFile) {
            lyricsData = JSON.parse(fs.readFileSync(path.join(this.lyricsDir, lyricsFile), 'utf8'));
            console.log(`   Found lyrics: ${lyricsFile}`);
        } else {
            console.log(`   ⚠️  No lyrics file found`);
        }

        // Get phrase count
        const phraseIds = [...new Set(data.wordToNoteMap.map(w => w.phraseId))];
        const totalPhrases = phraseIds.length;

        this.stats.totalWords += data.wordToNoteMap.length;

        // Migrate each word mapping
        data.wordToNoteMap = data.wordToNoteMap.map((word) => {
            // Get phrase text from lyrics file
            const phraseText = lyricsData?.phrases.find(p => p.id === word.phraseId)?.text || '';

            // If no phrase text, build from syllables in same phrase
            let contextText = phraseText;
            if (!contextText) {
                const phraseSyllables = data.wordToNoteMap
                    .filter(w => w.phraseId === word.phraseId)
                    .map(w => w.syllable)
                    .join(' ');
                contextText = phraseSyllables;
            }

            // Parse and infer hierarchies
            const parsed = this.parseCurrentPhraseType(word.phraseType);
            const inferred = this.inferMissingHierarchies(
                { ...word, text: contextText },
                phraseIds.indexOf(word.phraseId),
                totalPhrases,
                lyricsData?.phrases || []
            );

            // Track statistics
            this.stats.hierarchyBreakdown.structural[inferred.structural] =
                (this.stats.hierarchyBreakdown.structural[inferred.structural] || 0) + 1;
            this.stats.hierarchyBreakdown.position[inferred.position] =
                (this.stats.hierarchyBreakdown.position[inferred.position] || 0) + 1;
            this.stats.hierarchyBreakdown.linguistic[inferred.linguistic] =
                (this.stats.hierarchyBreakdown.linguistic[inferred.linguistic] || 0) + 1;
            this.stats.hierarchyBreakdown.semantic[inferred.semantic] =
                (this.stats.hierarchyBreakdown.semantic[inferred.semantic] || 0) + 1;

            this.stats.migratedWords++;

            // Remove old phraseType
            delete word.phraseType;

            // Add new hierarchical fields
            return {
                ...word,
                structuralRole: inferred.structural,
                structuralPosition: inferred.position,
                linguisticType: inferred.linguistic,
                semanticCategory: inferred.semantic
            };
        });

        // Update metadata
        data.metadata.taxonomyVersion = '4.4.8';
        data.metadata.migrationDate = new Date().toISOString();

        // Save migrated file
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        console.log(`   ✅ Migrated ${data.wordToNoteMap.length} word mappings (${totalPhrases} phrases)`);
    }

    findLyricsFile(songName) {
        const files = fs.readdirSync(this.lyricsDir);

        // Normalize: lowercase, replace spaces with hyphens, remove accents for matching
        const normalized = songName.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[đĐ]/g, 'd') // Replace đ
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, ''); // Remove special chars

        // Try exact match first
        let match = files.find(f => {
            const fileNorm = f.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[đĐ]/g, 'd')
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');
            return fileNorm === `${normalized}.json`;
        });

        if (match) return match;

        // Try partial match
        match = files.find(f => {
            const fileNorm = f.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[đĐ]/g, 'd')
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');
            return fileNorm.includes(normalized) || normalized.includes(fileNorm.replace('.json', ''));
        });

        return match;
    }

    parseCurrentPhraseType(phraseType) {
        const patterns = {
            // Composite patterns (structural + position)
            'refrain_opening': { structural: 'refrain', position: 'opening' },
            'refrain_closing': { structural: 'refrain', position: 'closing' },
            'verse_opening': { structural: 'verse', position: 'opening' },
            'verse_middle': { structural: 'verse', position: 'middle' },
            'verse_closing': { structural: 'verse', position: 'closing' },
            'question_opening': { structural: 'verse', position: 'opening', linguistic: 'question' },
            'answer_middle': { structural: 'verse', position: 'middle', linguistic: 'answer' },

            // Pure structural
            'refrain': { structural: 'refrain', position: null },
            'verse': { structural: 'verse', position: null },
            'bridge': { structural: 'bridge', position: null },
            'interlude': { structural: 'interlude', position: null },

            // Pure positional
            'closing': { structural: null, position: 'closing' },
            'opening': { structural: null, position: 'opening' },
            'middle': { structural: null, position: 'middle' },

            // Pure linguistic
            'question': { linguistic: 'question' },
            'answer': { linguistic: 'answer' },
            'exclamatory': { linguistic: 'exclamatory' },
            'narrative': { linguistic: 'narrative' },
            'imperative': { linguistic: 'imperative' },
            'vocative': { linguistic: 'vocative' },
            'dialogue': { linguistic: 'dialogue' }
        };

        return patterns[phraseType] || { structural: null, position: null, linguistic: null };
    }

    inferMissingHierarchies(phrase, phraseIndex, totalPhrases, allPhrases) {
        const result = this.parseCurrentPhraseType(phrase.phraseType);

        // Infer structural position if missing
        if (!result.position) {
            if (phraseIndex === 0) {
                result.position = 'opening';
            } else if (phraseIndex === totalPhrases - 1) {
                result.position = 'closing';
            } else {
                result.position = 'middle';
            }
        }

        // Infer structural role if missing
        if (!result.structural) {
            const phraseText = phrase.text;
            if (phraseText && allPhrases.length > 0) {
                // Check if phrase repeats (refrain detection)
                const repetitions = allPhrases.filter(p => p.text === phraseText).length;
                result.structural = (repetitions >= 2) ? 'refrain' : 'verse';
            } else {
                result.structural = 'verse'; // Default
            }
        }

        // Infer linguistic type if missing
        if (!result.linguistic) {
            result.linguistic = this.detectLinguisticType(phrase.text);
        }

        // Always infer semantic category
        result.semantic = this.detectSemanticCategory(phrase.text);

        return result;
    }

    detectLinguisticType(text) {
        if (!text) return 'narrative';

        const lower = text.toLowerCase();

        // Exclamatory markers (interjections)
        if (/^(ới|ơi|í|ì|ĩ|à|ạ|ồ|hỡi|chao|úi|ôi|a|ô|hì|hừ|ê)\b/i.test(lower)) {
            return 'exclamatory';
        }

        // Question markers
        if (/\b(ai|gì|đâu|sao|thế nào|như thế nào|bao giờ|nào|chi|mấy|bao nhiêu)\b/i.test(lower) || lower.includes('?')) {
            return 'question';
        }

        // Imperative markers (commands)
        if (/^(hãy|đừng|chớ|mau|nhanh|đi|về|hát|làm|nên)\b/i.test(lower)) {
            return 'imperative';
        }

        // Vocative markers (addressing someone)
        if (/\b(bà|ông|anh|chị|em|cô|chú|bác|cậu|dì|thím)\b/i.test(lower) && lower.split(/\s+/).length <= 3) {
            return 'vocative';
        }

        // Default: narrative/declarative
        return 'narrative';
    }

    detectSemanticCategory(text) {
        if (!text) return 'abstract';

        const lower = text.toLowerCase();

        // Category keywords
        const categories = {
            nature: ['núi', 'sông', 'biển', 'trời', 'mây', 'gió', 'mưa', 'nắng', 'hoa', 'cây', 'lá', 'chim', 'sóng', 'rừng', 'đồi', 'suối', 'bờ', 'cỏ'],
            love: ['yêu', 'thương', 'tình', 'nhớ', 'mến', 'gần', 'xa', 'lòng', 'duyên', 'nợ', 'ân', 'tình'],
            work: ['cày', 'bừa', 'gặt', 'gieo', 'làm', 'ruộng', 'đồng', 'nông', 'thuyền', 'chèo', 'kéo', 'lưới', 'hái', 'thu', 'nghề'],
            emotional: ['vui', 'buồn', 'sướng', 'khổ', 'cười', 'khóc', 'mừng', 'lo', 'thương', 'nhớ', 'hờn', 'giận'],
            social: ['quan họ', 'hội', 'làng', 'xóm', 'bạn', 'người', 'dân', 'nhà', 'chợ', 'đường', 'hàng'],
            festival: ['tết', 'lễ', 'hội', 'mừng', 'rước', 'múa', 'hát', 'vui'],
            spiritual: ['phật', 'trời', 'thần', 'linh', 'cúng', 'lễ', 'kinh', 'thiền']
        };

        // Check each category
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(w => lower.includes(w))) {
                return category;
            }
        }

        // Vocative pattern (just names/pronouns, no other content)
        if (/^(bà|ông|anh|chị|em)\s+\w+[,\s]*$/i.test(lower)) {
            return 'vocative';
        }

        return 'abstract';
    }

    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('✅ MIGRATION COMPLETE');
        console.log('='.repeat(60));
        console.log(`\n📊 Statistics:`);
        console.log(`   Files processed: ${this.stats.totalFiles}`);
        console.log(`   ✓ Success: ${this.stats.successCount}`);
        console.log(`   ✗ Errors: ${this.stats.errorCount}`);
        console.log(`   Total words: ${this.stats.totalWords}`);
        console.log(`   Migrated words: ${this.stats.migratedWords}`);

        console.log(`\n🏗️  Structural Roles:`);
        Object.entries(this.stats.hierarchyBreakdown.structural)
            .sort((a, b) => b[1] - a[1])
            .forEach(([key, count]) => {
                const percent = ((count / this.stats.migratedWords) * 100).toFixed(1);
                console.log(`   ${key.padEnd(15)} ${count.toString().padStart(6)} (${percent}%)`);
            });

        console.log(`\n📍 Structural Positions:`);
        Object.entries(this.stats.hierarchyBreakdown.position)
            .sort((a, b) => b[1] - a[1])
            .forEach(([key, count]) => {
                const percent = ((count / this.stats.migratedWords) * 100).toFixed(1);
                console.log(`   ${key.padEnd(15)} ${count.toString().padStart(6)} (${percent}%)`);
            });

        console.log(`\n🗣️  Linguistic Types:`);
        Object.entries(this.stats.hierarchyBreakdown.linguistic)
            .sort((a, b) => b[1] - a[1])
            .forEach(([key, count]) => {
                const percent = ((count / this.stats.migratedWords) * 100).toFixed(1);
                console.log(`   ${key.padEnd(15)} ${count.toString().padStart(6)} (${percent}%)`);
            });

        console.log(`\n🎨 Semantic Categories:`);
        Object.entries(this.stats.hierarchyBreakdown.semantic)
            .sort((a, b) => b[1] - a[1])
            .forEach(([key, count]) => {
                const percent = ((count / this.stats.migratedWords) * 100).toFixed(1);
                console.log(`   ${key.padEnd(15)} ${count.toString().padStart(6)} (${percent}%)`);
            });

        console.log(`\n💾 Backup location: ${this.backupDir}`);
        console.log(`\n🔄 To rollback: node migrate-phrase-taxonomy.js rollback`);
        console.log('');
    }

    async rollback() {
        console.log('⏮️  Rolling back migration...\n');

        if (!fs.existsSync(this.backupDir)) {
            console.error('❌ No backup found at ' + this.backupDir);
            return;
        }

        const files = fs.readdirSync(this.backupDir);
        console.log(`Found ${files.length} backup files\n`);

        for (const file of files) {
            const src = path.join(this.backupDir, file);
            const dest = path.join(this.relationshipsDir, file);
            fs.copyFileSync(src, dest);
            console.log(`✓ Restored ${file}`);
        }

        console.log(`\n✅ Rolled back ${files.length} files`);
        console.log(`   Original files restored to ${this.relationshipsDir}`);
    }
}

// ============================================================================
// CLI Interface
// ============================================================================

async function main() {
    const migrator = new PhraseTaxonomyMigrator();

    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'rollback') {
        await migrator.rollback();
    } else if (command === '--sample') {
        await migrator.migrate(true);
    } else if (command === '--help' || command === '-h') {
        console.log('Phrase Taxonomy Migration Script - V4.4.8');
        console.log('');
        console.log('Usage:');
        console.log('  node migrate-phrase-taxonomy.js              Migrate all songs');
        console.log('  node migrate-phrase-taxonomy.js --sample     Test with 5 songs');
        console.log('  node migrate-phrase-taxonomy.js rollback     Restore from backup');
        console.log('  node migrate-phrase-taxonomy.js --help       Show this help');
        console.log('');
    } else {
        await migrator.migrate(false);
    }
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
