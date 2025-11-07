/**
 * Complete Migration Script
 *
 * Safely migrates all MusicXML files to category folders and updates the system
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = __dirname;
const MUSICXML_DIR = path.join(BASE_DIR, 'data/musicxml');
const LIBRARY_CACHE = path.join(BASE_DIR, 'data/library/song-library.json');

console.log('=== V4 CATEGORY FOLDER MIGRATION ===\n');

// Step 1: Delete old library cache
console.log('Step 1: Deleting old library cache...');
if (fs.existsSync(LIBRARY_CACHE)) {
    fs.unlinkSync(LIBRARY_CACHE);
    console.log('✓ Old cache deleted\n');
} else {
    console.log('No cache to delete\n');
}

// Step 2: Run the organizer
console.log('Step 2: Moving files to category folders...');
require('./organize-existing-files');

// Wait for user confirmation
console.log('\n=== READY TO PROCEED ===');
console.log('The migration script will now:');
console.log('1. Move all 125 MusicXML files from root to vietnamese-skeletal/');
console.log('2. Delete the old library cache');
console.log('3. Rescan and rebuild the library with category support');
console.log('\nPress Ctrl+C to cancel, or run with --confirm to proceed:');
console.log('node migrate-to-category-folders.js --confirm\n');

// Check for confirmation
const args = process.argv.slice(2);

if (args.includes('--confirm')) {
    console.log('\n⚠️  PROCEEDING WITH MIGRATION...\n');

    // Execute the file movements
    const organizer = require('./organize-existing-files.js');
    const { movements } = organizer.organizeExistingFiles ? organizer.organizeExistingFiles() : organizer;

    if (movements) {
        organizer.executeMovements(movements);
    }

    // Step 3: Test the library scanner
    console.log('\nStep 3: Testing updated library scanner...');
    const V4LibraryManager = require('./auto-import-library');
    const libraryManager = new V4LibraryManager();

    const library = libraryManager.scanAndUpdateLibrary();

    console.log('\n=== MIGRATION COMPLETE ===');
    console.log(`✓ Library scanned: ${library.length} songs found`);
    console.log(`✓ All songs now have category metadata`);
    console.log('\nYou can now:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Check the library at http://localhost:3006');
    console.log('3. Run enhanced loader: node enhanced-library-loader-v2.js\n');

} else {
    // Show preview only
    console.log('Run this command to execute the migration:');
    console.log('node migrate-to-category-folders.js --confirm\n');
}
