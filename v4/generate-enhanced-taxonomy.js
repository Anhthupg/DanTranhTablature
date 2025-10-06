const fs = require('fs');
const path = require('path');
const TaxonomyMetadataParser = require('./taxonomy-metadata-parser');
const ProvinceInferenceEngine = require('./province-inference-engine');

class EnhancedTaxonomyGenerator {
  constructor() {
    this.parser = new TaxonomyMetadataParser();
    this.provinceInference = new ProvinceInferenceEngine();

    // Load Vietnam map data
    const mapData = JSON.parse(fs.readFileSync('vietnam-province-map.json', 'utf8'));
    this.provinceMapData = mapData.provinces;
    this.regionData = mapData.regions;

    this.taxonomy = {
      vietnameseFolkSongs: {
        metadata: {
          totalSongs: 0,
          totalPhrases: 0,
          totalWords: 0,
          totalGenres: 0,
          totalProvinces: 0,
          totalRegions: 0,
          lastUpdated: new Date().toISOString().split('T')[0]
        },

        // PRIMARY: By Province (with region grouping)
        byProvince: {},

        // SECONDARY: By Genre (with provincial breakdown)
        byGenre: {},

        // GROUPING: By Region (aggregated view)
        byRegion: {},

        // MAP DATA: Province coordinates for visual map
        provinceMap: {},

        crossReferences: {
          genresByProvince: {},
          provincesWithMultipleGenres: {},
          sharedCharacteristics: {},
          musicalFeatures: {}
        }
      }
    };
  }

  async generate() {
    const segmentationsDir = 'data/lyrics-segmentations';
    const musicXMLDir = 'data/musicxml';

    const files = fs.readdirSync(segmentationsDir).filter(f => f.endsWith('.json'));

    console.log(`Processing ${files.length} songs...\n`);

    for (const file of files) {
      const lyricsData = JSON.parse(fs.readFileSync(path.join(segmentationsDir, file), 'utf8'));

      // Find matching MusicXML file
      const baseName = file.replace('.json', '');
      const xmlPath = path.join(musicXMLDir, baseName + '.musicxml.xml');

      // Parse MusicXML metadata
      const musicXMLMetadata = await this.parser.parseMusicXML(xmlPath);

      // Extract and classify
      const songData = this.extractSongData(lyricsData, musicXMLMetadata, file);

      // Add to taxonomy
      this.addToTaxonomy(songData);

      console.log(`✓ Processed: ${songData.title}`);
    }

    // Calculate cross-references
    this.calculateCrossReferences();

    // Calculate totals
    this.calculateTotals();

    // Save taxonomy
    fs.writeFileSync('data/enhanced-taxonomy.json', JSON.stringify(this.taxonomy, null, 2));

    console.log('\n=== Taxonomy Generated ===');
    console.log(`Total Songs: ${this.taxonomy.vietnameseFolkSongs.metadata.totalSongs}`);
    console.log(`Total Provinces: ${Object.keys(this.taxonomy.vietnameseFolkSongs.byProvince).length}`);
    console.log(`Total Genres: ${Object.keys(this.taxonomy.vietnameseFolkSongs.byGenre).length}`);
    console.log(`Total Regions: ${Object.keys(this.taxonomy.vietnameseFolkSongs.byRegion).length}`);

    return this.taxonomy;
  }

  extractSongData(lyricsData, xmlMetadata, filename) {
    const title = lyricsData.songTitle;

    // Use parsed MusicXML metadata
    const subtitle = xmlMetadata?.subtitle || null;
    const genre = xmlMetadata?.genre || null;
    const region = xmlMetadata?.region || 'northern'; // default

    // Fallback classification from title if MusicXML didn't provide
    const titleClass = this.parser.classifySongFromTitle(title);
    const finalGenre = genre || titleClass.genre;

    // *** PROVINCE INFERENCE ***
    const provinceInference = this.provinceInference.inferProvince(filename, xmlMetadata, title);

    // Extract cultural themes from phrases
    const culturalThemes = this.extractCulturalThemes(lyricsData.phrases);

    return {
      filename,
      title,
      subtitle,
      metadata: {
        ...xmlMetadata,
        // Add province inference metadata
        province: provinceInference.province,
        provinceConfidence: provinceInference.confidence,
        provinceSource: provinceInference.source,
        provinceColor: provinceInference.color,
        provinceAlternatives: provinceInference.alternatives
      },
      classification: {
        region,
        genre: finalGenre
      },
      stats: {
        phraseCount: lyricsData.phrases.length,
        totalSyllables: lyricsData.totalSyllables,
        avgPhraseLength: (lyricsData.totalSyllables / lyricsData.phrases.length).toFixed(2),
        dominantPattern: lyricsData.patterns?.structure || 'unknown'
      },
      culturalThemes,
      lyricsData,
      provinceInference  // Include full inference details
    };
  }


  extractCulturalThemes(phrases) {
    const themes = new Set();
    const keywords = [];

    phrases.forEach(phrase => {
      if (phrase.culturalContext && phrase.culturalContext.facts) {
        phrase.culturalContext.facts.forEach(fact => {
          // Extract theme keywords
          if (fact.toLowerCase().includes('love') || fact.toLowerCase().includes('tình')) themes.add('love');
          if (fact.toLowerCase().includes('nature') || fact.toLowerCase().includes('thiên nhiên')) themes.add('nature');
          if (fact.toLowerCase().includes('work') || fact.toLowerCase().includes('lao động')) themes.add('work');
          if (fact.toLowerCase().includes('festival') || fact.toLowerCase().includes('lễ hội')) themes.add('festival');
        });
      }

      // Extract from lyrics
      const text = phrase.text.toLowerCase();
      if (text.includes('đò') || text.includes('sông') || text.includes('nước')) {
        keywords.push('water');
        themes.add('nature');
      }
    });

    return {
      themes: Array.from(themes),
      keywords: [...new Set(keywords)]
    };
  }

  addToTaxonomy(songData) {
    const { region, genre } = songData.classification;
    const province = songData.metadata.province || 'Unknown';

    // PRIMARY: Add to byProvince
    if (!this.taxonomy.vietnameseFolkSongs.byProvince[province]) {
      const provinceMapInfo = this.provinceMapData[province];

      this.taxonomy.vietnameseFolkSongs.byProvince[province] = {
        name: province,
        region: region,
        regionName: this.getRegionName(region),
        mapCoordinates: provinceMapInfo ? { lat: provinceMapInfo.lat, lng: provinceMapInfo.lng } : null,
        songCount: 0,
        phraseCount: 0,
        wordCount: 0,
        genres: {},
        culturalCharacteristics: []
      };
    }

    const provinceNode = this.taxonomy.vietnameseFolkSongs.byProvince[province];

    // Add genre within province
    if (!provinceNode.genres[genre]) {
      provinceNode.genres[genre] = {
        name: this.getGenreName(genre),
        songCount: 0,
        songs: []
      };
    }

    provinceNode.genres[genre].songs.push({
      title: songData.title,
      subtitle: songData.subtitle,
      filename: songData.filename,
      stats: songData.stats,
      themes: songData.culturalThemes.themes,
      provinceConfidence: songData.metadata.provinceConfidence,
      provinceSource: songData.metadata.provinceSource,
      provinceColor: songData.metadata.provinceColor
    });

    provinceNode.genres[genre].songCount++;
    provinceNode.songCount++;
    provinceNode.phraseCount += songData.stats.phraseCount;
    provinceNode.wordCount += parseInt(songData.stats.totalSyllables);

    // SECONDARY: Add to byGenre with provincial breakdown
    if (!this.taxonomy.vietnameseFolkSongs.byGenre[genre]) {
      this.taxonomy.vietnameseFolkSongs.byGenre[genre] = {
        name: this.getGenreName(genre),
        totalSongs: 0,
        provinces: {},
        characteristics: []
      };
    }

    const genreNode = this.taxonomy.vietnameseFolkSongs.byGenre[genre];

    if (!genreNode.provinces[province]) {
      genreNode.provinces[province] = {
        region: region,
        regionName: this.getRegionName(region),
        songCount: 0,
        songs: [],
        characteristics: ''
      };
    }

    genreNode.provinces[province].songs.push({
      title: songData.title,
      filename: songData.filename,
      stats: songData.stats
    });

    genreNode.provinces[province].songCount++;
    genreNode.totalSongs++;

    // GROUPING: Add to byRegion (aggregated view)
    if (!this.taxonomy.vietnameseFolkSongs.byRegion[region]) {
      const regionInfo = this.regionData[region];

      this.taxonomy.vietnameseFolkSongs.byRegion[region] = {
        name: this.getRegionName(region),
        nameVi: regionInfo?.nameVi || '',
        color: regionInfo?.color || '#999',
        description: regionInfo?.description || '',
        songCount: 0,
        phraseCount: 0,
        wordCount: 0,
        provinces: new Set(),
        genres: {},
        musicalCharacteristics: []
      };
    }

    const regionNode = this.taxonomy.vietnameseFolkSongs.byRegion[region];

    regionNode.provinces.add(province);
    regionNode.songCount++;
    regionNode.phraseCount += songData.stats.phraseCount;
    regionNode.wordCount += parseInt(songData.stats.totalSyllables);

    if (!regionNode.genres[genre]) {
      regionNode.genres[genre] = {
        name: this.getGenreName(genre),
        songCount: 0
      };
    }

    regionNode.genres[genre].songCount++;

    // MAP DATA: Populate provinceMap for visual representation
    if (!this.taxonomy.vietnameseFolkSongs.provinceMap[province]) {
      const provinceMapInfo = this.provinceMapData[province];
      const regionInfo = this.regionData[region];

      this.taxonomy.vietnameseFolkSongs.provinceMap[province] = {
        coordinates: provinceMapInfo ? { lat: provinceMapInfo.lat, lng: provinceMapInfo.lng } : null,
        region: region,
        regionName: this.getRegionName(region),
        color: regionInfo?.color || '#999',
        songCount: 0,
        genres: new Set(),
        radius: 0  // Will be calculated later based on song count
      };
    }

    const mapNode = this.taxonomy.vietnameseFolkSongs.provinceMap[province];
    mapNode.songCount++;
    mapNode.genres.add(genre);
    mapNode.radius = Math.min(30, 10 + (mapNode.songCount * 2));  // Scale radius by song count (10-30px)
  }

  calculateCrossReferences() {
    const byGenre = this.taxonomy.vietnameseFolkSongs.byGenre;
    const byProvince = this.taxonomy.vietnameseFolkSongs.byProvince;
    const crossRefs = this.taxonomy.vietnameseFolkSongs.crossReferences;

    // Genres appearing in multiple provinces
    Object.keys(byGenre).forEach(genreKey => {
      const provinces = Object.keys(byGenre[genreKey].provinces);
      if (provinces.length > 1) {
        crossRefs.genresByProvince[genreKey] = provinces;
      }
    });

    // Provinces with multiple genres
    Object.keys(byProvince).forEach(provinceKey => {
      const genres = Object.keys(byProvince[provinceKey].genres);
      if (genres.length > 1) {
        crossRefs.provincesWithMultipleGenres[provinceKey] = genres;
      }
    });

    // Convert Sets to arrays for JSON serialization
    Object.values(this.taxonomy.vietnameseFolkSongs.byRegion).forEach(region => {
      region.provinces = Array.from(region.provinces);
    });

    Object.values(this.taxonomy.vietnameseFolkSongs.provinceMap).forEach(province => {
      province.genres = Array.from(province.genres);
    });
  }

  calculateTotals() {
    const metadata = this.taxonomy.vietnameseFolkSongs.metadata;

    let totalSongs = 0;
    let totalPhrases = 0;
    let totalWords = 0;

    Object.values(this.taxonomy.vietnameseFolkSongs.byProvince).forEach(province => {
      totalSongs += province.songCount;
      totalPhrases += province.phraseCount;
      totalWords += province.wordCount;
    });

    metadata.totalSongs = totalSongs;
    metadata.totalPhrases = totalPhrases;
    metadata.totalWords = totalWords;
    metadata.totalGenres = Object.keys(this.taxonomy.vietnameseFolkSongs.byGenre).length;
    metadata.totalProvinces = Object.keys(this.taxonomy.vietnameseFolkSongs.byProvince).length;
    metadata.totalRegions = Object.keys(this.taxonomy.vietnameseFolkSongs.byRegion).length;
  }

  getRegionName(key) {
    const names = {
      'northern': 'Northern Vietnam',
      'central': 'Central Vietnam',
      'southern': 'Southern Vietnam',
      'highland': 'Highland/Ethnic Minorities'
    };
    return names[key] || key;
  }

  getGenreName(key) {
    const names = {
      'ly': 'Lý',
      'quan_ho': 'Quan Họ',
      'hat_ru': 'Hát Ru (Lullaby)',
      'ho': 'Hò (Work Song)',
      'trong_quan': 'Trống Quân',
      've': 'Vè',
      'vi': 'Ví',
      'hat_gheo': 'Hát Ghẹo',
      'folk_song': 'Folk Song',
      'other': 'Other'
    };
    return names[key] || key;
  }
}

// Run generator
const generator = new EnhancedTaxonomyGenerator();
generator.generate().then(() => {
  console.log('\n✓ Enhanced taxonomy saved to data/enhanced-taxonomy.json');
});
