// V4 Batch Generator - Populate all 128 songs from V3 data
const fs = require('fs');
const path = require('path');
const V4CleanGenerator = require('./generators/v4-clean-generator');

class V4BatchGenerator {
    constructor() {
        this.generator = new V4CleanGenerator();
        this.v3DataPath = path.join(__dirname, '../v3/data/processed');
    }

    generateAllV4Pages() {
        console.log('🚀 V4 Batch Generation Starting...');

        if (!fs.existsSync(this.v3DataPath)) {
            console.error('❌ V3 data directory not found:', this.v3DataPath);
            return false;
        }

        // Get all V3 song directories
        const songDirs = fs.readdirSync(this.v3DataPath)
            .filter(dir => fs.statSync(path.join(this.v3DataPath, dir)).isDirectory());

        console.log(`📁 Found ${songDirs.length} V3 songs to convert to V4`);

        let successCount = 0;
        let errorCount = 0;

        songDirs.forEach((songDir, index) => {
            const songName = songDir.replace(/_/g, ' ');
            console.log(`⚙️ Processing ${songName} (${index + 1}/${songDirs.length})`);

            try {
                const success = this.generator.generateV4Page(songName);
                if (success) {
                    successCount++;
                } else {
                    errorCount++;
                    console.log(`⚠️ Failed: ${songName}`);
                }

                // Progress indicator every 10 songs
                if ((index + 1) % 10 === 0) {
                    console.log(`✅ Progress: ${index + 1}/${songDirs.length} songs processed`);
                }

            } catch (error) {
                errorCount++;
                console.error(`❌ Error processing ${songName}:`, error.message);
            }
        });

        console.log('\n🎉 V4 Batch Generation Complete!');
        console.log(`✅ Successfully processed: ${successCount} songs`);
        if (errorCount > 0) {
            console.log(`⚠️ Errors: ${errorCount} songs`);
        }

        console.log('\nV4 Features:');
        console.log('• Working move functionality (built-in)');
        console.log('• Full-width layout system');
        console.log('• Multiple tablature references');
        console.log('• Customizable analysis sections');
        console.log('• Clean template without emojis');

        return successCount > 0;
    }
}

// Run batch generation
if (require.main === module) {
    const batchGenerator = new V4BatchGenerator();
    const success = batchGenerator.generateAllV4Pages();

    if (success) {
        console.log('\n🚀 Start V4 server with: node server.js');
        console.log('🌐 Then visit: http://localhost:3004');
    } else {
        console.log('\n❌ V4 batch generation failed');
        process.exit(1);
    }
}

module.exports = V4BatchGenerator;