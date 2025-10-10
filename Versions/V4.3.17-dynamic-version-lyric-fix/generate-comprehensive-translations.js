/**
 * Generate Comprehensive Vietnamese-English Translation File
 * Extracts ALL unique words from lyrics and creates translation template
 */

const fs = require('fs');
const path = require('path');

class ComprehensiveTranslationGenerator {
    constructor() {
        this.lyricsDir = path.join(__dirname, 'data', 'lyrics-segmentations');
        this.outputPath = path.join(__dirname, 'data', 'comprehensive-dictionary.json');
    }

    extractAllWords() {
        const files = fs.readdirSync(this.lyricsDir).filter(f => f.endsWith('.json'));

        const allWords = new Set();
        const wordFrequency = {};
        const existingTranslations = {};

        files.forEach(file => {
            const lyricsData = JSON.parse(fs.readFileSync(path.join(this.lyricsDir, file), 'utf8'));

            lyricsData.phrases.forEach(phrase => {
                if (phrase.wordMapping) {
                    phrase.wordMapping.forEach(mapping => {
                        const vnWord = mapping.vn.trim();
                        if (!vnWord) return;

                        allWords.add(vnWord);
                        wordFrequency[vnWord] = (wordFrequency[vnWord] || 0) + 1;

                        // Collect existing translations
                        if (mapping.en && mapping.en.trim() && mapping.en.toLowerCase() !== vnWord.toLowerCase()) {
                            existingTranslations[vnWord] = mapping.en;
                        }
                    });
                }
            });
        });

        console.log(`\n📊 Extracted ${allWords.size} unique words`);
        console.log(`✅ ${Object.keys(existingTranslations).length} already have translations`);
        console.log(`⚠️  ${allWords.size - Object.keys(existingTranslations).length} need translation\n`);

        // Sort by frequency (most common first)
        const sortedWords = Array.from(allWords)
            .map(word => ({
                vietnamese: word,
                frequency: wordFrequency[word],
                english: existingTranslations[word] || ""
            }))
            .sort((a, b) => b.frequency - a.frequency);

        // Save comprehensive dictionary
        const dictionary = {};
        sortedWords.forEach(item => {
            dictionary[item.vietnamese] = item.english || item.vietnamese; // Fallback to Vietnamese if no translation
        });

        fs.writeFileSync(this.outputPath, JSON.stringify(dictionary, null, 2), 'utf8');

        console.log(`💾 Saved comprehensive dictionary to: ${this.outputPath}\n`);

        // Generate CSV for easy editing
        const csvPath = this.outputPath.replace('.json', '.csv');
        let csv = 'Vietnamese,English,Frequency,Status\n';
        sortedWords.forEach(item => {
            const status = item.english ? 'TRANSLATED' : 'NEEDS TRANSLATION';
            csv += `"${item.vietnamese}","${item.english}",${item.frequency},${status}\n`;
        });
        fs.writeFileSync(csvPath, csv, 'utf8');

        console.log(`📊 CSV export: ${csvPath}`);
        console.log(`   Open in Excel/Google Sheets to review and edit\n`);

        return sortedWords;
    }
}

if (require.main === module) {
    const generator = new ComprehensiveTranslationGenerator();
    generator.extractAllWords();
}

module.exports = ComprehensiveTranslationGenerator;
