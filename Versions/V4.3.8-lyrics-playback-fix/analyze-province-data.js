/**
 * Province Data Analysis Script
 *
 * Generates a comprehensive report showing:
 * - BLACK: Explicitly provided provinces
 * - BLUE: Inferred provinces (with confidence levels)
 * - RED: Unknown provinces (need manual research)
 */

const fs = require('fs');
const path = require('path');
const ProvinceInferenceEngine = require('./province-inference-engine');
const TaxonomyMetadataParser = require('./taxonomy-metadata-parser');

async function analyzeAllSongs() {
  const engine = new ProvinceInferenceEngine();
  const parser = new TaxonomyMetadataParser();

  const segmentationsDir = 'data/lyrics-segmentations';
  const musicXMLDir = 'data/musicxml';

  const files = fs.readdirSync(segmentationsDir).filter(f => f.endsWith('.json'));

  console.log(`\n${'='.repeat(80)}`);
  console.log('PROVINCE DATA QUALITY ANALYSIS');
  console.log(`${'='.repeat(80)}\n`);
  console.log(`Analyzing ${files.length} songs...\n`);

  const songsData = [];

  for (const file of files) {
    const lyricsData = JSON.parse(fs.readFileSync(path.join(segmentationsDir, file), 'utf8'));
    const baseName = file.replace('.json', '');
    const xmlPath = path.join(musicXMLDir, baseName + '.musicxml.xml');

    const musicXMLData = await parser.parseMusicXML(xmlPath);

    songsData.push({
      filename: file,
      title: lyricsData.songTitle,
      musicXMLData
    });
  }

  // Generate comprehensive report
  const report = engine.generateReport(songsData);

  // Display summary statistics
  console.log('=== SUMMARY STATISTICS ===\n');
  console.log(`Total Songs: ${report.totalSongs}\n`);

  console.log('By Confidence Level:');
  console.log(`  🖤 EXPLICIT (BLACK):  ${report.byConfidence.explicit.toString().padStart(3)} songs  (${((report.byConfidence.explicit / report.totalSongs) * 100).toFixed(1)}%)`);
  console.log(`  💙 HIGH (BLUE):       ${report.byConfidence.high.toString().padStart(3)} songs  (${((report.byConfidence.high / report.totalSongs) * 100).toFixed(1)}%)`);
  console.log(`  💙 MEDIUM (BLUE):     ${report.byConfidence.medium.toString().padStart(3)} songs  (${((report.byConfidence.medium / report.totalSongs) * 100).toFixed(1)}%)`);
  console.log(`  💙 LOW (BLUE):        ${report.byConfidence.low.toString().padStart(3)} songs  (${((report.byConfidence.low / report.totalSongs) * 100).toFixed(1)}%)`);
  console.log(`  ❤️  UNKNOWN (RED):    ${report.byConfidence.unknown.toString().padStart(3)} songs  (${((report.byConfidence.unknown / report.totalSongs) * 100).toFixed(1)}%)\n`);

  console.log('By Source:');
  console.log(`  MusicXML:   ${report.bySource.musicxml.toString().padStart(3)} songs`);
  console.log(`  Filename:   ${report.bySource.filename.toString().padStart(3)} songs`);
  console.log(`  Region:     ${report.bySource.region.toString().padStart(3)} songs`);
  console.log(`  Genre:      ${report.bySource.genre.toString().padStart(3)} songs`);
  console.log(`  LLM:        ${report.bySource.llm.toString().padStart(3)} songs`);
  console.log(`  None:       ${report.bySource.none.toString().padStart(3)} songs\n`);

  // Display detailed song list
  console.log(`\n${'='.repeat(80)}`);
  console.log('DETAILED SONG ANALYSIS');
  console.log(`${'='.repeat(80)}\n`);

  // Group by confidence
  const grouped = {
    explicit: [],
    high: [],
    medium: [],
    low: [],
    unknown: []
  };

  report.songs.forEach(song => {
    grouped[song.confidence].push(song);
  });

  // Display each group
  if (grouped.explicit.length > 0) {
    console.log(`\n🖤 EXPLICIT (BLACK) - ${grouped.explicit.length} songs\n`);
    grouped.explicit.forEach(song => {
      console.log(`  ✓ ${song.title}`);
      console.log(`    Province: ${song.province}`);
      console.log(`    Details: ${song.details[0]}\n`);
    });
  }

  if (grouped.high.length > 0) {
    console.log(`\n💙 HIGH CONFIDENCE (BLUE) - ${grouped.high.length} songs\n`);
    grouped.high.forEach(song => {
      console.log(`  ✓ ${song.title}`);
      console.log(`    Province: ${song.province}`);
      console.log(`    Details: ${song.details.find(d => d.startsWith('✓'))}\n`);
    });
  }

  if (grouped.medium.length > 0) {
    console.log(`\n💙 MEDIUM CONFIDENCE (BLUE) - ${grouped.medium.length} songs\n`);
    grouped.medium.forEach(song => {
      console.log(`  ⚠ ${song.title}`);
      console.log(`    Best Guess: ${song.province}`);
      console.log(`    Alternatives: ${song.alternatives.join(', ')}`);
      song.details.forEach(d => console.log(`    ${d}`));
      console.log('');
    });
  }

  if (grouped.low.length > 0) {
    console.log(`\n💙 LOW CONFIDENCE (BLUE) - ${grouped.low.length} songs\n`);
    grouped.low.forEach(song => {
      console.log(`  ⚠ ${song.title}`);
      console.log(`    Best Guess: ${song.province}`);
      console.log(`    Alternatives: ${song.alternatives.join(', ')}`);
      song.details.forEach(d => console.log(`    ${d}`));
      console.log('');
    });
  }

  if (grouped.unknown.length > 0) {
    console.log(`\n❤️  UNKNOWN (RED) - ${grouped.unknown.length} songs - NEEDS MANUAL RESEARCH\n`);
    grouped.unknown.forEach(song => {
      console.log(`  ✗ ${song.title}`);
      console.log(`    Filename: ${song.filename}`);
      song.details.forEach(d => console.log(`    ${d}`));
      console.log('');
    });
  }

  // Save report to JSON
  const reportPath = 'data/province-inference-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Report saved to: ${reportPath}`);
  console.log(`${'='.repeat(80)}\n`);

  return report;
}

// Run analysis
analyzeAllSongs().then(() => {
  console.log('✓ Analysis complete');
});
