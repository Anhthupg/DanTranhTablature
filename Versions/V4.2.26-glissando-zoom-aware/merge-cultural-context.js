/**
 * Merge Cultural Context from LLM Responses into Lyrics Files
 */

const fs = require('fs');
const path = require('path');

class CulturalContextMerger {
    constructor() {
        this.lyricsDir = path.join(__dirname, 'data', 'lyrics-segmentations');
        this.contextDir = path.join(__dirname, 'data', 'cultural-context-outputs');
    }

    mergeAll() {
        const contextFiles = fs.readdirSync(this.contextDir).filter(f => f.endsWith('-context.json'));

        console.log(`Merging ${contextFiles.length} cultural context files...`);

        contextFiles.forEach(file => {
            const songName = file.replace('-context.json', '');
            const contextPath = path.join(this.contextDir, file);
            const lyricsPath = path.join(this.lyricsDir, songName + '.json');

            if (!fs.existsSync(lyricsPath)) {
                console.log(`⚠️  Lyrics file not found: ${songName}`);
                return;
            }

            // Load both files
            const contextData = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
            const lyricsData = JSON.parse(fs.readFileSync(lyricsPath, 'utf8'));

            // Merge cultural context into each phrase
            contextData.forEach(item => {
                const phrase = lyricsData.phrases.find(p => p.id === item.phraseId);
                if (phrase) {
                    phrase.culturalContext = item.culturalContext;
                }
            });

            // Save updated lyrics file
            fs.writeFileSync(lyricsPath, JSON.stringify(lyricsData, null, 2), 'utf8');
            console.log(`✅ Merged: ${songName}`);
        });

        console.log(`\nMerge complete!`);
    }
}

const merger = new CulturalContextMerger();
merger.mergeAll();
