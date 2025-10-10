/**
 * Language Detection System for MusicXML Files
 * Detects Vietnamese songs (including ethnic minorities) vs non-Vietnamese songs
 */

const fs = require('fs');
const path = require('path');
const { DOMParser } = require('xmldom');

class LanguageDetector {
    constructor() {
        this.vietnameseMarkers = {
            // Vietnamese tone markers (all 6 tones)
            toneMarkers: /[áàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵđ]/i,

            // Common Vietnamese words (including ethnic minority context)
            commonWords: [
                // General Vietnamese
                'bà', 'ông', 'tôi', 'là', 'của', 'cho', 'với', 'em', 'con', 'anh', 'chị',
                'lý', 'hò', 'ru', 'hát', 'quan', 'họ', 'chèo', 'chòi',

                // Vietnamese regions/places
                'bắc', 'nam', 'trung', 'huế', 'hà', 'sài', 'gòn', 'mekong', 'quảng',

                // Common Vietnamese verbs/adjectives
                'đi', 'về', 'làm', 'ơi', 'này', 'kia', 'chiều', 'đêm', 'ngày'
            ],

            // Vietnamese ethnic minorities (THESE ARE STILL VIETNAMESE)
            vietnameseEthnicMinorities: [
                'ede', 'êđê', 'jarai', 'jrai', 'bahnar', 'ba na',
                'hmong', 'mông', 'dao', 'tày', 'thái', 'nùng',
                'khmer', 'chăm', 'cơ ho', 'mnong', 'xơ đăng',
                'giáy', 'co tu', 'gié triêng', 'mạ', 'ra glai'
            ],

            // Non-Vietnamese indicators (songs from OTHER countries)
            // NOTE: Be very conservative here - only add if CONFIRMED non-Vietnamese
            // Many ethnic minority songs have unfamiliar words but ARE Vietnamese
            nonVietnameseIndicators: [
                // Currently EMPTY - user confirmed all songs are Vietnamese
                // (Bengu Adai and TI DOONG TI are ethnic minority Vietnamese, not Mongolian)
            ]
        };
    }

    /**
     * Detect if a song is Vietnamese or non-Vietnamese
     */
    detectLanguage(musicXMLPath) {
        try {
            const xmlContent = fs.readFileSync(musicXMLPath, 'utf8');
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

            // Extract title and lyrics
            const title = this.extractTitle(xmlDoc);
            const lyrics = this.extractLyrics(xmlDoc);
            const combinedText = (title + ' ' + lyrics).toLowerCase();

            // Run detection
            const result = this.analyze(combinedText, title);

            return {
                isVietnamese: result.isVietnamese,
                category: result.category,
                subcategory: result.subcategory,
                confidence: result.confidence,
                reason: result.reason,
                details: result.details,
                title: title
            };

        } catch (error) {
            console.error(`Error detecting language for ${musicXMLPath}:`, error.message);
            // Return default Vietnamese/ethnic for errors
            return {
                isVietnamese: true,
                category: 'vietnamese',
                subcategory: 'ethnic',
                confidence: 'low',
                reason: `Error during detection - defaulting to Vietnamese ethnic: ${error.message}`,
                details: {},
                title: path.basename(musicXMLPath)
            };
        }
    }

    /**
     * Analyze text for Vietnamese characteristics
     */
    analyze(text, title) {
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const totalWords = words.length;

        if (totalWords === 0) {
            return {
                isVietnamese: true, // Default to Vietnamese if no lyrics
                confidence: 'low',
                reason: 'No lyrics found - assuming Vietnamese',
                details: {}
            };
        }

        // Count markers
        let toneMarkerCount = 0;
        let vietnameseWordCount = 0;
        let nonVietnameseIndicatorCount = 0;
        let ethnicMinorityCount = 0;

        words.forEach(word => {
            // Check tone markers
            if (this.vietnameseMarkers.toneMarkers.test(word)) {
                toneMarkerCount++;
            }

            // Check common Vietnamese words
            if (this.vietnameseMarkers.commonWords.includes(word)) {
                vietnameseWordCount++;
            }

            // Check Vietnamese ethnic minorities (COUNT AS VIETNAMESE!)
            if (this.vietnameseMarkers.vietnameseEthnicMinorities.some(minority =>
                word.includes(minority) || title.toLowerCase().includes(minority))) {
                ethnicMinorityCount++;
                vietnameseWordCount++; // Also count as Vietnamese word
            }

            // Check non-Vietnamese indicators
            if (this.vietnameseMarkers.nonVietnameseIndicators.some(indicator =>
                word.includes(indicator) || title.toLowerCase().includes(indicator))) {
                nonVietnameseIndicatorCount++;
            }
        });

        // Calculate percentages
        const tonePercentage = (toneMarkerCount / totalWords) * 100;
        const vietnameseWordPercentage = (vietnameseWordCount / totalWords) * 100;

        // Decision logic
        const details = {
            totalWords,
            toneMarkerCount,
            tonePercentage: tonePercentage.toFixed(1) + '%',
            vietnameseWordCount,
            vietnameseWordPercentage: vietnameseWordPercentage.toFixed(1) + '%',
            ethnicMinorityCount,
            nonVietnameseIndicatorCount
        };

        // Strong non-Vietnamese indicators (e.g., "Bengu Adai", "TI DOONG TI")
        if (nonVietnameseIndicatorCount > 0) {
            return {
                isVietnamese: false,
                category: 'non-vietnamese',
                subcategory: null,
                confidence: 'high',
                reason: `Non-Vietnamese indicators found in title/lyrics`,
                details
            };
        }

        // Ethnic minority detected?
        const isEthnicMinority = ethnicMinorityCount > 0;

        // Vietnamese if significant tone markers OR common words
        const isVietnamese = tonePercentage > 20 || vietnameseWordPercentage > 15;

        let confidence = 'medium';
        let reason = '';
        let category = '';
        let subcategory = null;

        if (isVietnamese) {
            category = 'vietnamese';

            // Determine subcategory
            if (isEthnicMinority) {
                subcategory = 'ethnic';
                confidence = 'high';
                reason = `Vietnamese ethnic minority detected (${ethnicMinorityCount} markers)`;
            } else if (tonePercentage > 40 || vietnameseWordPercentage > 30) {
                subcategory = 'kinh';
                confidence = 'high';
                reason = `Kinh Vietnamese: ${tonePercentage.toFixed(1)}% tone markers, ${vietnameseWordPercentage.toFixed(1)}% Vietnamese words`;
            } else {
                subcategory = 'kinh';
                reason = `Vietnamese (Kinh): ${tonePercentage.toFixed(1)}% tone markers, ${vietnameseWordPercentage.toFixed(1)}% Vietnamese words`;
            }
        } else {
            // Low markers - assume ethnic minority (uncertain case)
            category = 'vietnamese';
            subcategory = 'ethnic';

            if (tonePercentage < 5 && vietnameseWordPercentage < 5) {
                confidence = 'low';
                reason = `Uncertain - assuming Vietnamese ethnic minority (low Vietnamese markers: ${tonePercentage.toFixed(1)}% tones)`;
            } else {
                confidence = 'low';
                reason = `Uncertain - assuming Vietnamese ethnic minority: ${tonePercentage.toFixed(1)}% tone markers`;
            }
        }

        return {
            isVietnamese,
            category,
            subcategory,
            confidence,
            reason,
            details
        };
    }

    /**
     * Extract title from MusicXML
     */
    extractTitle(xmlDoc) {
        const titleElement = xmlDoc.getElementsByTagName('work-title')[0] ||
                           xmlDoc.getElementsByTagName('movement-title')[0];
        return titleElement ? titleElement.textContent.trim() : '';
    }

    /**
     * Extract all lyrics from MusicXML
     */
    extractLyrics(xmlDoc) {
        const lyrics = [];
        const lyricElements = xmlDoc.getElementsByTagName('lyric');

        for (let i = 0; i < lyricElements.length; i++) {
            const textElement = lyricElements[i].getElementsByTagName('text')[0];
            if (textElement) {
                lyrics.push(textElement.textContent.trim());
            }
        }

        return lyrics.join(' ');
    }

    /**
     * Scan all MusicXML files and categorize them
     */
    scanAllFiles(musicXMLDir) {
        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║   Language Detection - Scanning All MusicXML Files       ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        if (!fs.existsSync(musicXMLDir)) {
            console.error(`Directory not found: ${musicXMLDir}`);
            return;
        }

        const files = fs.readdirSync(musicXMLDir)
            .filter(file => file.toLowerCase().endsWith('.xml') || file.toLowerCase().endsWith('.musicxml'));

        const results = {
            vietnamese: {
                kinh: [],
                ethnic: []
            },
            nonVietnamese: [],
            uncertain: []
        };

        files.forEach((file, index) => {
            const filePath = path.join(musicXMLDir, file);
            const detection = this.detectLanguage(filePath);

            if (detection) {
                console.log(`[${index + 1}/${files.length}] ${file}`);
                console.log(`  → ${detection.category.toUpperCase()} - ${detection.subcategory || ''} (${detection.confidence} confidence)`);
                console.log(`  → ${detection.reason}`);

                if (detection.category === 'vietnamese') {
                    if (detection.subcategory === 'kinh') {
                        results.vietnamese.kinh.push({ file, detection });
                    } else if (detection.subcategory === 'ethnic') {
                        results.vietnamese.ethnic.push({ file, detection });
                    }
                } else {
                    results.nonVietnamese.push({ file, detection });
                }

                if (detection.confidence === 'low' || detection.confidence === 'medium') {
                    results.uncertain.push({ file, detection });
                }

                console.log('');
            }
        });

        const totalVietnamese = results.vietnamese.kinh.length + results.vietnamese.ethnic.length;

        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log(`║   Vietnamese (Kinh): ${results.vietnamese.kinh.length.toString().padEnd(37)} ║`);
        console.log(`║   Vietnamese (Ethnic Minorities): ${results.vietnamese.ethnic.length.toString().padEnd(21)} ║`);
        console.log(`║   Total Vietnamese: ${totalVietnamese.toString().padEnd(37)} ║`);
        console.log(`║   Non-Vietnamese: ${results.nonVietnamese.length.toString().padEnd(39)} ║`);
        console.log(`║   Uncertain (need review): ${results.uncertain.length.toString().padEnd(30)} ║`);
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        // Save results
        const reportPath = path.join(path.dirname(musicXMLDir), 'language-detection-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
        console.log(`Report saved: ${reportPath}\n`);

        return results;
    }

    /**
     * Organize files into separate folders
     * Structure:
     *   vietnamese/kinh/
     *   vietnamese/ethnic/
     *   non-vietnamese/
     */
    organizeFolders(musicXMLDir, results) {
        const kinhDir = path.join(musicXMLDir, 'vietnamese', 'kinh');
        const ethnicDir = path.join(musicXMLDir, 'vietnamese', 'ethnic');
        const nonVietnameseDir = path.join(musicXMLDir, 'non-vietnamese');

        // Create folders
        [kinhDir, ethnicDir, nonVietnameseDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║   Organizing Files into Folders                          ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        // Move files
        let movedKinh = 0;
        let movedEthnic = 0;
        let movedNonVN = 0;

        // Move Kinh songs
        results.vietnamese.kinh.forEach(({ file }) => {
            const src = path.join(musicXMLDir, file);
            const dest = path.join(kinhDir, file);
            if (fs.existsSync(src)) {
                fs.renameSync(src, dest);
                movedKinh++;
            }
        });

        // Move ethnic minority songs
        results.vietnamese.ethnic.forEach(({ file }) => {
            const src = path.join(musicXMLDir, file);
            const dest = path.join(ethnicDir, file);
            if (fs.existsSync(src)) {
                fs.renameSync(src, dest);
                movedEthnic++;
            }
        });

        // Move non-Vietnamese songs
        results.nonVietnamese.forEach(({ file }) => {
            const src = path.join(musicXMLDir, file);
            const dest = path.join(nonVietnameseDir, file);
            if (fs.existsSync(src)) {
                fs.renameSync(src, dest);
                movedNonVN++;
            }
        });

        console.log(`✓ Moved ${movedKinh} Kinh Vietnamese songs to: ${kinhDir}`);
        console.log(`✓ Moved ${movedEthnic} ethnic minority songs to: ${ethnicDir}`);
        console.log(`✓ Moved ${movedNonVN} non-Vietnamese songs to: ${nonVietnameseDir}\n`);
        console.log(`Total: ${movedKinh + movedEthnic + movedNonVN} files organized\n`);
    }
}

// Export for use in other files
module.exports = LanguageDetector;

// Auto-run if executed directly
if (require.main === module) {
    const detector = new LanguageDetector();
    const musicXMLDir = path.join(__dirname, 'data', 'musicxml');

    // Scan all files
    const results = detector.scanAllFiles(musicXMLDir);

    // Ask user for confirmation before organizing
    console.log('════════════════════════════════════════════════════════════');
    console.log('Review the results above.');
    console.log('Run with --organize flag to move files into folders:');
    console.log('  node language-detector.js --organize');
    console.log('════════════════════════════════════════════════════════════\n');

    if (process.argv.includes('--organize')) {
        detector.organizeFolders(musicXMLDir, results);
        console.log('✓ Organization complete!\n');
    }
}
