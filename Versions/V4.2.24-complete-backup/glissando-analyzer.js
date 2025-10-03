/**
 * Glissando Candidate Analyzer
 *
 * Analyzes Vietnamese Dan Tranh songs to identify optimal glissando placement
 * based on relative note duration and pitch context.
 */

const fs = require('fs');
const path = require('path');

class GlissandoAnalyzer {
    constructor(songData) {
        this.songData = songData;
        this.notes = songData.notes.filter(n => !n.isGrace); // Main notes only
        this.allNotes = songData.notes; // Including grace notes

        // Map pitches to string numbers (standard 17-string dan tranh)
        this.stringMap = {
            'E3': 1, 'G3': 2, 'A3': 3, 'C4': 4, 'D4': 5, 'E4': 6,
            'G4': 7, 'A4': 8, 'C5': 9, 'D5': 10, 'E5': 11, 'G5': 12,
            'A5': 13, 'C6': 14, 'D6': 15, 'E6': 16, 'G6': 17
        };

        // Add string numbers to all notes
        this.notes.forEach(note => {
            note.stringNumber = this.stringMap[note.pitch] || 0;
        });
    }

    /**
     * Calculate duration statistics for the song
     */
    getDurationStatistics() {
        const durations = this.notes.map(n => n.duration);

        // Calculate mode (most common duration)
        const durationCounts = {};
        durations.forEach(d => {
            durationCounts[d] = (durationCounts[d] || 0) + 1;
        });

        const mode = Object.entries(durationCounts)
            .sort((a, b) => b[1] - a[1])[0][0];

        // Calculate mean
        const mean = durations.reduce((a, b) => a + b, 0) / durations.length;

        // Calculate percentile 80
        const sorted = [...durations].sort((a, b) => a - b);
        const percentile80 = sorted[Math.floor(sorted.length * 0.8)];

        return {
            mode: parseFloat(mode),
            mean,
            percentile80,
            durations: durationCounts
        };
    }

    /**
     * Find glissando candidates - only notes significantly longer than mode
     * Returns notes where duration >= 1.5 beats AND longer than most common duration
     */
    findGlissandoCandidates() {
        const stats = this.getDurationStatistics();
        const threshold = Math.max(1.5, stats.mode * 1.5); // At least 1.5 beats or 1.5x mode
        const candidates = [];

        this.notes.forEach((note, i) => {
            // Skip grace notes
            if (note.isGrace) return;

            // Only include notes that are significantly long
            if (note.duration >= threshold) {
                // Check if note has a following note (required for glissando)
                const hasFollowingNote = i < this.notes.length - 1;

                if (hasFollowingNote) {
                    candidates.push({
                        noteIndex: note.index,
                        note: note.pitch,
                        stringNumber: note.stringNumber,
                        duration: note.duration,
                        lyric: note.lyric || ''
                    });
                }
            }
        });

        // Sort by duration (longest first)
        candidates.sort((a, b) => b.duration - a.duration);

        console.log(`Found ${candidates.length} glissando candidates (threshold: ${threshold} beats)`);
        return candidates;
    }

    /**
     * Generate analysis report
     */
    generateReport() {
        const stats = this.getDurationStatistics();
        const candidates = this.findGlissandoCandidates();
        const totalCandidates = candidates.length;

        const report = {
            song: this.songData.metadata.title,
            totalNotes: this.notes.length,
            durationStatistics: {
                mostCommon: stats.mode,
                average: stats.mean.toFixed(2),
                longThreshold: stats.mode * 2,
                distribution: stats.durations
            },
            glissandoCandidates: candidates,
            summary: `Found ${totalCandidates} potential glissando locations in "${this.songData.metadata.title}"`
        };

        return report;
    }

    /**
     * Pretty print report
     */
    printReport() {
        const report = this.generateReport();
        const candidates = report.glissandoCandidates;
        const total = candidates.length;

        console.log('\n='.repeat(80));
        console.log(`GLISSANDO ANALYSIS: ${report.song}`);
        console.log('='.repeat(80));

        console.log('\nDURATION STATISTICS:');
        console.log(`  Total main notes: ${report.totalNotes}`);
        console.log(`  Most common duration: ${report.durationStatistics.mostCommon}`);
        console.log(`  Average duration: ${report.durationStatistics.average}`);

        console.log('\nDURATION DISTRIBUTION:');
        Object.entries(report.durationStatistics.distribution)
            .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
            .forEach(([dur, count]) => {
                const bar = '#'.repeat(Math.floor(count / 5));
                console.log(`  ${dur.padStart(4)}: ${count.toString().padStart(3)} ${bar}`);
            });

        console.log(`\nGLISSANDO CANDIDATES: ${total} notes (sorted by duration - longest first)`);
        console.log(`  (All main notes sorted by duration for glissando potential)`);
        console.log('='.repeat(80));

        if (total > 0) {
            console.log(`\nTOP CANDIDATES (sorted longest to shortest):`);
            candidates.slice(0, 20).forEach((candidate, i) => {
                const rank = i < 3 ? '⭐' : i < 10 ? '○' : '·';
                console.log(`${rank} ${i + 1}. Note #${candidate.noteIndex}: ${candidate.note} - "${candidate.lyric}" (${candidate.duration} beats)`);
            });

            if (total > 20) {
                console.log(`\n... and ${total - 20} more candidates (use JSON output for full list)`);
            }
        } else {
            console.log('\nNo suitable glissando locations found.');
            console.log('This song may not have long notes.');
        }

        console.log('\n' + '='.repeat(80));
        console.log('');
    }
}

/**
 * Analyze a song file
 */
function analyzeSong(songFilename) {
    const processedDir = path.join(__dirname, 'data', 'processed');
    const songPath = path.join(processedDir, songFilename);

    if (!fs.existsSync(songPath)) {
        console.error(`Error: Song file not found: ${songPath}`);
        console.log('\nAvailable songs:');
        fs.readdirSync(processedDir)
            .filter(f => f.endsWith('.json'))
            .slice(0, 10)
            .forEach(f => console.log(`  - ${f}`));
        return;
    }

    const songData = JSON.parse(fs.readFileSync(songPath, 'utf8'));
    const analyzer = new GlissandoAnalyzer(songData);
    analyzer.printReport();

    return analyzer.generateReport();
}

// Command line interface
if (require.main === module) {
    const songFile = process.argv[2];

    if (!songFile) {
        console.log('Usage: node glissando-analyzer.js <song-file.json>');
        console.log('\nExample: node glissando-analyzer.js b_r.json');
        console.log('\nAvailable songs in v4/data/processed/:');

        const processedDir = path.join(__dirname, 'data', 'processed');
        fs.readdirSync(processedDir)
            .filter(f => f.endsWith('.json'))
            .slice(0, 15)
            .forEach(f => console.log(`  - ${f}`));

        process.exit(1);
    }

    analyzeSong(songFile);
}

module.exports = { GlissandoAnalyzer, analyzeSong };
