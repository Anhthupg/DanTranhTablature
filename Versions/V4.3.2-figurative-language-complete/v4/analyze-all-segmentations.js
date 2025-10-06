const fs = require('fs');
const path = require('path');

const SEGMENTATION_DIR = './data/lyrics-segmentations';

function assessPhraseQuality(phrase, phraseIndex, totalPhrases) {
    const issues = [];
    const syllables = phrase.syllableCount;

    // Check syllable count
    if (syllables < 3) {
        issues.push({ type: 'TOO_SHORT', severity: 'high', message: `Only ${syllables} syllables - likely fragment` });
    } else if (syllables > 15) {
        issues.push({ type: 'TOO_LONG', severity: 'high', message: `${syllables} syllables - too long for one breath` });
    } else if (syllables > 12) {
        issues.push({ type: 'LONG', severity: 'medium', message: `${syllables} syllables - consider splitting` });
    }

    // Check for parenthetical repetitions
    if (phrase.text.includes('(') && phrase.text.includes(')')) {
        issues.push({ type: 'PARENTHETICAL', severity: 'high', message: 'Contains parenthetical repetition - should integrate or remove' });
    }

    // Check if text starts with parenthesis (standalone fragment)
    if (phrase.text.trim().startsWith('(')) {
        issues.push({ type: 'FRAGMENT', severity: 'critical', message: 'Entire phrase is parenthetical - should be removed or integrated' });
    }

    // Check for incomplete words (ends with comma, no period)
    if (phrase.text.trim().endsWith(',') && phraseIndex < totalPhrases - 1) {
        // This is actually okay if it's not the last phrase
    }

    const quality = issues.length === 0 ? 'GOOD' :
                   issues.some(i => i.severity === 'critical') ? 'CRITICAL' :
                   issues.some(i => i.severity === 'high') ? 'POOR' : 'QUESTIONABLE';

    return { quality, issues, syllables };
}

function analyzeSong(songData) {
    const phrases = songData.phrases || [];
    const totalPhrases = phrases.length;

    const results = phrases.map((phrase, index) => {
        const assessment = assessPhraseQuality(phrase, index, totalPhrases);
        return {
            id: phrase.id,
            text: phrase.text,
            english: phrase.english,
            ...assessment
        };
    });

    const stats = {
        total: totalPhrases,
        good: results.filter(r => r.quality === 'GOOD').length,
        questionable: results.filter(r => r.quality === 'QUESTIONABLE').length,
        poor: results.filter(r => r.quality === 'POOR').length,
        critical: results.filter(r => r.quality === 'CRITICAL').length,
        avgSyllables: songData.statistics?.averagePhraseLength || 0,
        totalSyllables: songData.totalSyllables || 0
    };

    return { phrases: results, stats };
}

function generateMarkdownReport(allResults) {
    let md = `# Complete Lyrics Segmentation Analysis\n\n`;
    md += `**Generated:** ${new Date().toISOString()}\n`;
    md += `**Total Songs Analyzed:** ${allResults.length}\n\n`;

    // Summary statistics
    md += `## Overall Statistics\n\n`;
    const totalPhrases = allResults.reduce((sum, r) => sum + r.stats.total, 0);
    const totalGood = allResults.reduce((sum, r) => sum + r.stats.good, 0);
    const totalQuestionable = allResults.reduce((sum, r) => sum + r.stats.questionable, 0);
    const totalPoor = allResults.reduce((sum, r) => sum + r.stats.poor, 0);
    const totalCritical = allResults.reduce((sum, r) => sum + r.stats.critical, 0);

    md += `- **Total Phrases:** ${totalPhrases}\n`;
    md += `- **Good Breaks:** ${totalGood} (${(totalGood/totalPhrases*100).toFixed(1)}%)\n`;
    md += `- **Questionable:** ${totalQuestionable} (${(totalQuestionable/totalPhrases*100).toFixed(1)}%)\n`;
    md += `- **Poor:** ${totalPoor} (${(totalPoor/totalPhrases*100).toFixed(1)}%)\n`;
    md += `- **Critical Issues:** ${totalCritical} (${(totalCritical/totalPhrases*100).toFixed(1)}%)\n\n`;

    // Songs with most issues
    md += `## Songs Requiring Immediate Attention\n\n`;
    const songsWithIssues = allResults
        .filter(r => r.stats.poor + r.stats.critical > 0)
        .sort((a, b) => (b.stats.poor + b.stats.critical) - (a.stats.poor + a.stats.critical))
        .slice(0, 20);

    md += `| Song | Total Phrases | Critical | Poor | Questionable | Good |\n`;
    md += `|------|---------------|----------|------|--------------|------|\n`;
    songsWithIssues.forEach(r => {
        md += `| ${r.title} | ${r.stats.total} | ${r.stats.critical} | ${r.stats.poor} | ${r.stats.questionable} | ${r.stats.good} |\n`;
    });

    md += `\n---\n\n`;

    // Detailed per-song analysis
    md += `## Detailed Song Analysis\n\n`;

    allResults.forEach(result => {
        md += `### ${result.title}\n\n`;
        const avgSyl = parseFloat(result.stats.avgSyllables) || 0;
        md += `**Statistics:** ${result.stats.total} phrases, ${result.stats.totalSyllables} syllables total, ${avgSyl.toFixed(2)} avg\n\n`;
        md += `**Quality:** ✅ ${result.stats.good} Good | ⚠️ ${result.stats.questionable} Questionable | ❌ ${result.stats.poor} Poor | 🚨 ${result.stats.critical} Critical\n\n`;

        if (result.stats.poor + result.stats.critical > 0) {
            md += `| # | Vietnamese | English | Syllables | Quality | Issues |\n`;
            md += `|---|-----------|---------|-----------|---------|--------|\n`;

            result.phrases.forEach(phrase => {
                const qualityIcon = phrase.quality === 'GOOD' ? '✅' :
                                  phrase.quality === 'QUESTIONABLE' ? '⚠️' :
                                  phrase.quality === 'POOR' ? '❌' : '🚨';

                const issuesText = phrase.issues.length > 0
                    ? phrase.issues.map(i => i.message).join('; ')
                    : '-';

                // Truncate long text
                const vnText = phrase.text.length > 50 ? phrase.text.substring(0, 47) + '...' : phrase.text;
                const enText = phrase.english.length > 50 ? phrase.english.substring(0, 47) + '...' : phrase.english;

                md += `| ${phrase.id} | ${vnText} | ${enText} | ${phrase.syllables} | ${qualityIcon} ${phrase.quality} | ${issuesText} |\n`;
            });

            md += `\n`;
        } else {
            md += `✅ All phrase breaks appear good!\n\n`;
        }

        md += `---\n\n`;
    });

    return md;
}

// Main execution
async function main() {
    console.log('Analyzing all lyrics segmentations...\n');

    const files = fs.readdirSync(SEGMENTATION_DIR)
        .filter(f => f.endsWith('.json'));

    console.log(`Found ${files.length} segmentation files\n`);

    const allResults = [];

    for (const file of files) {
        const filePath = path.join(SEGMENTATION_DIR, file);
        const songData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const analysis = analyzeSong(songData);

        allResults.push({
            title: songData.songTitle,
            filename: file,
            ...analysis
        });

        console.log(`✓ ${songData.songTitle}: ${analysis.stats.good}/${analysis.stats.total} good phrases`);
    }

    console.log(`\n\nGenerating markdown report...\n`);

    const markdown = generateMarkdownReport(allResults);
    const outputPath = './COMPLETE-SEGMENTATION-ANALYSIS.md';
    fs.writeFileSync(outputPath, markdown);

    console.log(`✅ Report generated: ${outputPath}\n`);

    // Also generate JSON for programmatic access
    const jsonPath = './segmentation-analysis.json';
    fs.writeFileSync(jsonPath, JSON.stringify(allResults, null, 2));
    console.log(`✅ JSON data saved: ${jsonPath}\n`);

    // Summary
    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    const totalSongs = allResults.length;
    const songsWithIssues = allResults.filter(r => r.stats.poor + r.stats.critical > 0).length;
    const songsPerfect = allResults.filter(r => r.stats.poor + r.stats.critical === 0).length;

    console.log(`Total Songs: ${totalSongs}`);
    console.log(`Perfect Segmentation: ${songsPerfect} (${(songsPerfect/totalSongs*100).toFixed(1)}%)`);
    console.log(`Need Improvement: ${songsWithIssues} (${(songsWithIssues/totalSongs*100).toFixed(1)}%)`);
    console.log('='.repeat(60));
}

main().catch(console.error);
