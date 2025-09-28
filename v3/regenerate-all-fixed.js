#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all folders in data/processed
const processedDir = path.join(__dirname, 'data/processed');
const folders = fs.readdirSync(processedDir).filter(folder => {
    const folderPath = path.join(processedDir, folder);
    return fs.statSync(folderPath).isDirectory();
});

console.log(`🔄 Regenerating ${folders.length} songs with bent notes fix...`);

let processed = 0;
let errors = 0;

for (const folder of folders) {
    try {
        console.log(`⚙️  Processing ${folder} (${processed + 1}/${folders.length})`);

        // Use the exact folder name as it appears in the file system
        execSync(`node generate-dual-panel-viewer.js "${folder}"`, {
            stdio: 'pipe',
            timeout: 30000
        });

        processed++;

        // Show progress every 10 songs
        if (processed % 10 === 0) {
            console.log(`✅ Progress: ${processed}/${folders.length} songs completed`);
        }

    } catch (error) {
        console.error(`❌ Error processing ${folder}: ${error.message}`);
        errors++;
    }
}

console.log(`\n🎉 Batch regeneration complete!`);
console.log(`✅ Successfully processed: ${processed} songs`);
if (errors > 0) {
    console.log(`❌ Errors: ${errors} songs`);
}
console.log(`\nAll songs now have:`);
console.log(`- Two separate bent notes buttons (one per panel)`);
console.log(`- Independent bent notes highlighting for each panel`);
console.log(`- No global bent notes button`);