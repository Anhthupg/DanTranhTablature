/**
 * Province Inference Engine
 *
 * Multi-strategy province detection with confidence tracking:
 * - BLACK: Explicit data from MusicXML
 * - BLUE: Inferred from filenames, regions, or LLM
 * - RED: Unknown (needs manual research)
 */

const fs = require('fs');
const path = require('path');
const LLMProvinceInference = require('./llm-province-inference');

class ProvinceInferenceEngine {
  constructor() {
    // Load province map
    const mapData = JSON.parse(fs.readFileSync('vietnam-province-map.json', 'utf8'));
    this.provinceMapData = mapData.provinces;

    // Initialize LLM inference
    this.llmInference = new LLMProvinceInference();

    // Province name variations (Vietnamese diacritics)
    this.provinceVariations = this.buildProvinceVariations();

    // Historical region to modern province mappings
    this.historicalRegions = {
      'bình trị thiên': ['Quảng Bình', 'Quảng Trị', 'Thừa Thiên-Huế'],
      'nam kỳ': ['An Giang', 'Đồng Tháp', 'Vĩnh Long', 'Cần Thơ', 'Bến Tre', 'Tiền Giang'],
      'bắc kỳ': ['Hà Nội', 'Hải Phòng', 'Bắc Ninh', 'Phú Thọ', 'Vĩnh Phúc'],
      'trung kỳ': ['Nghệ An', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị', 'Thừa Thiên-Huế', 'Quảng Nam', 'Bình Định']
    };

    // Genre to typical province mappings (for weak inference)
    this.genreProvinces = {
      'quan_ho': ['Bắc Ninh', 'Vĩnh Phúc'],
      'ca_tru': ['Hà Nội', 'Bắc Ninh'],
      'hat_gheo': ['Phú Thọ'],
      'hat_xam': ['Hà Nội', 'Bắc Ninh']
    };
  }

  /**
   * Build all variations of province names for matching
   */
  buildProvinceVariations() {
    const variations = {};

    Object.keys(this.provinceMapData).forEach(province => {
      const lower = province.toLowerCase();
      const normalized = this.removeVietnameseDiacritics(lower);
      const withoutAccents = this.simplifyVietnamese(lower);

      variations[lower] = province;
      variations[normalized] = province;
      variations[withoutAccents] = province;

      // Short forms: "Quảng Bình" -> "quảng bình", "q. bình", "QB"
      const parts = province.split(' ');
      if (parts.length === 2) {
        const short1 = `${parts[0].toLowerCase().charAt(0)}. ${parts[1].toLowerCase()}`;
        const short2 = parts.map(p => p.charAt(0).toUpperCase()).join('');
        variations[short1] = province;
        variations[short2] = province;
      }
    });

    return variations;
  }

  /**
   * Main inference method - tries all strategies in priority order
   */
  inferProvince(filename, musicXMLData, songTitle) {
    const result = {
      province: null,
      confidence: 'unknown',  // 'explicit', 'high', 'medium', 'low', 'unknown'
      source: null,           // 'musicxml', 'filename', 'region', 'genre', 'llm', 'unknown'
      color: 'red',           // 'black' (explicit), 'blue' (inferred), 'red' (unknown)
      details: [],            // Array of inference attempts
      alternatives: []        // Possible provinces if confidence is low
    };

    // Strategy 1: Explicit MusicXML province
    const xmlProvince = this.extractFromMusicXML(musicXMLData);
    if (xmlProvince.found) {
      result.province = xmlProvince.province;
      result.confidence = 'explicit';
      result.source = 'musicxml';
      result.color = 'black';
      result.details.push(`✓ Found in MusicXML: "${xmlProvince.rawText}" → ${xmlProvince.province}`);
      return result;
    }
    result.details.push(`✗ No explicit province in MusicXML`);

    // Strategy 2: Filename parsing (parentheses)
    const filenameProvince = this.extractFromFilename(filename);
    if (filenameProvince.found) {
      result.province = filenameProvince.province;
      result.confidence = 'high';
      result.source = 'filename';
      result.color = 'blue';
      result.details.push(`✓ Found in filename: "${filenameProvince.rawText}" → ${filenameProvince.province}`);
      return result;
    }
    result.details.push(`✗ No province in filename`);

    // Strategy 3: Historical region mapping
    const regionProvince = this.extractFromHistoricalRegion(musicXMLData);
    if (regionProvince.found) {
      result.province = regionProvince.bestGuess;
      result.confidence = 'medium';
      result.source = 'region';
      result.color = 'blue';
      result.alternatives = regionProvince.alternatives;
      result.details.push(`⚠ Historical region: "${regionProvince.rawText}" → ${regionProvince.alternatives.join(' OR ')}`);
      result.details.push(`  → Best guess: ${regionProvince.bestGuess}`);
      return result;
    }
    result.details.push(`✗ No historical region mapping`);

    // Strategy 4: Genre-based weak inference
    const genreProvince = this.extractFromGenre(musicXMLData, songTitle);
    if (genreProvince.found) {
      result.province = genreProvince.bestGuess;
      result.confidence = 'low';
      result.source = 'genre';
      result.color = 'blue';
      result.alternatives = genreProvince.alternatives;
      result.details.push(`⚠ Genre inference: "${genreProvince.genre}" → ${genreProvince.alternatives.join(' OR ')}`);
      result.details.push(`  → Best guess: ${genreProvince.bestGuess}`);
      return result;
    }
    result.details.push(`✗ No genre-based inference possible`);

    // Strategy 5: LLM-based inference
    const llmProvince = this.extractFromLLM(songTitle, musicXMLData);
    if (llmProvince.found) {
      result.province = llmProvince.province;
      result.confidence = llmProvince.confidence >= 0.7 ? 'medium' : 'low';
      result.source = 'llm';
      result.color = 'blue';
      result.alternatives = llmProvince.alternatives || [];
      result.details.push(`⚠ LLM inference: "${llmProvince.reason}" → ${llmProvince.province} (confidence: ${(llmProvince.confidence * 100).toFixed(0)}%)`);
      if (llmProvince.alternatives && llmProvince.alternatives.length > 0) {
        result.details.push(`  → Alternatives: ${llmProvince.alternatives.join(', ')}`);
      }
      return result;
    }
    result.details.push(`✗ LLM inference failed`);

    // All strategies failed
    result.province = 'Unknown';
    result.confidence = 'unknown';
    result.source = 'none';
    result.color = 'red';
    result.details.push(`✗ All inference strategies failed`);

    return result;
  }

  /**
   * Strategy 1: Extract from MusicXML composer field
   */
  extractFromMusicXML(musicXMLData) {
    const result = { found: false, province: null, rawText: null };

    if (!musicXMLData || !musicXMLData.composer) {
      return result;
    }

    const composer = musicXMLData.composer.toLowerCase();

    // Check all province variations
    for (const [variant, canonicalName] of Object.entries(this.provinceVariations)) {
      if (composer.includes(variant)) {
        result.found = true;
        result.province = canonicalName;
        result.rawText = musicXMLData.composer;
        return result;
      }
    }

    return result;
  }

  /**
   * Strategy 2: Extract from filename (parentheses)
   */
  extractFromFilename(filename) {
    const result = { found: false, province: null, rawText: null };

    // Match content in parentheses: "song name (province).json"
    const match = filename.match(/\(([^)]+)\)/);
    if (!match) return result;

    const textInParens = match[1].toLowerCase();
    result.rawText = match[1];

    // Check all province variations
    for (const [variant, canonicalName] of Object.entries(this.provinceVariations)) {
      if (textInParens.includes(variant) || variant.includes(textInParens)) {
        result.found = true;
        result.province = canonicalName;
        return result;
      }
    }

    return result;
  }

  /**
   * Strategy 3: Map historical regions to provinces
   */
  extractFromHistoricalRegion(musicXMLData) {
    const result = { found: false, alternatives: [], bestGuess: null, rawText: null };

    if (!musicXMLData || !musicXMLData.composer) {
      return result;
    }

    const composer = musicXMLData.composer.toLowerCase();

    for (const [historicalName, provinces] of Object.entries(this.historicalRegions)) {
      if (composer.includes(historicalName)) {
        result.found = true;
        result.alternatives = provinces;
        result.bestGuess = provinces[0]; // First one as default
        result.rawText = musicXMLData.composer;
        return result;
      }
    }

    return result;
  }

  /**
   * Strategy 4: Weak inference from genre
   */
  extractFromGenre(musicXMLData, songTitle) {
    const result = { found: false, alternatives: [], bestGuess: null, genre: null };

    // Detect genre from title or MusicXML
    const titleLower = songTitle.toLowerCase();

    for (const [genreKey, provinces] of Object.entries(this.genreProvinces)) {
      if (titleLower.includes(genreKey.replace('_', ' ')) ||
          (musicXMLData && musicXMLData.genre === genreKey)) {
        result.found = true;
        result.genre = genreKey;
        result.alternatives = provinces;
        result.bestGuess = provinces[0];
        return result;
      }
    }

    return result;
  }

  /**
   * Generate visual report for all songs
   */
  generateReport(songsData) {
    const report = {
      timestamp: new Date().toISOString(),
      totalSongs: songsData.length,
      byConfidence: {
        explicit: 0,   // BLACK
        high: 0,       // BLUE
        medium: 0,     // BLUE
        low: 0,        // BLUE
        unknown: 0     // RED
      },
      bySource: {
        musicxml: 0,
        filename: 0,
        region: 0,
        genre: 0,
        llm: 0,
        none: 0
      },
      songs: []
    };

    songsData.forEach(song => {
      const inference = this.inferProvince(song.filename, song.musicXMLData, song.title);

      report.byConfidence[inference.confidence]++;
      report.bySource[inference.source]++;

      report.songs.push({
        title: song.title,
        filename: song.filename,
        ...inference
      });
    });

    return report;
  }

  /**
   * Strategy 5: LLM-based inference
   */
  extractFromLLM(songTitle, musicXMLData) {
    const result = { found: false, province: null, confidence: 0, reason: null, alternatives: [] };

    try {
      const inference = this.llmInference.inferProvince(songTitle, null, musicXMLData);

      if (inference.found) {
        result.found = true;
        result.province = inference.province;
        result.confidence = inference.confidence;
        result.reason = inference.reason;
        result.alternatives = inference.alternatives || [];
      } else {
        result.reason = inference.reason;
      }
    } catch (error) {
      result.reason = `LLM error: ${error.message}`;
    }

    return result;
  }

  /**
   * Helper: Remove Vietnamese diacritics
   */
  removeVietnameseDiacritics(str) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  /**
   * Helper: Simplify Vietnamese text for matching
   */
  simplifyVietnamese(str) {
    const replacements = {
      'á': 'a', 'à': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
      'ă': 'a', 'ắ': 'a', 'ằ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
      'â': 'a', 'ấ': 'a', 'ầ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
      'é': 'e', 'è': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
      'ê': 'e', 'ế': 'e', 'ề': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
      'í': 'i', 'ì': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
      'ó': 'o', 'ò': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
      'ô': 'o', 'ố': 'o', 'ồ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
      'ơ': 'o', 'ớ': 'o', 'ờ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
      'ú': 'u', 'ù': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
      'ư': 'u', 'ứ': 'u', 'ừ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
      'ý': 'y', 'ỳ': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
      'đ': 'd'
    };

    let result = str;
    for (const [accented, simple] of Object.entries(replacements)) {
      result = result.replace(new RegExp(accented, 'g'), simple);
    }
    return result;
  }
}

module.exports = ProvinceInferenceEngine;
