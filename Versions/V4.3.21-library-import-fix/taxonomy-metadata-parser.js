/**
 * TaxonomyMetadataParser - Rich metadata extraction from MusicXML files
 *
 * Extracts:
 * - Composer (genre + region info)
 * - Arranger (collector, performer)
 * - Movement title (subtitle)
 * - Province/region
 * - Time signature, tempo
 * - Key signature
 */

const fs = require('fs');
const path = require('path');
const { parseStringPromise } = require('xml2js');

class TaxonomyMetadataParser {
  constructor() {
    this.provinceToRegion = {
      // Northern provinces
      'hà nội': 'northern',
      'bắc ninh': 'northern',
      'phú thọ': 'northern',
      'vĩnh phúc': 'northern',
      'hải dương': 'northern',
      'hải phòng': 'northern',
      'hưng yên': 'northern',

      // Central provinces
      'nghệ an': 'central',
      'hà tĩnh': 'central',
      'quảng bình': 'central',
      'quảng trị': 'central',
      'huế': 'central',
      'thừa thiên-huế': 'central',
      'quảng nam': 'central',
      'quảng ngãi': 'central',
      'bình định': 'central',

      // Southern provinces
      'đồng tháp': 'southern',
      'an giang': 'southern',
      'cần thơ': 'southern',
      'bến tre': 'southern',
      'vĩnh long': 'southern',
      'tiền giang': 'southern',
      'sóc trăng': 'southern',

      // Highland
      'đắk lắk': 'highland',
      'gia lai': 'highland',
      'lâm đồng': 'highland'
    };

    this.genreKeywords = {
      'quan họ': 'quan_ho',
      'quan ho': 'quan_ho',
      'lý': 'ly',
      'hát ru': 'hat_ru',
      'ru': 'hat_ru',
      'hò': 'ho',
      'hát hò': 'ho',
      'trống quân': 'trong_quan',
      'vè': 've',
      'ví': 'vi',
      'hát ghẹo': 'hat_gheo',
      'hát chèo': 'hat_cheo',
      'ca trù': 'ca_tru',
      'dân ca': 'folk_song',
      'hát xẩm': 'hat_xam',
      'hò khoan': 'ho_khoan'
    };
  }

  /**
   * Parse MusicXML file and extract all metadata
   */
  async parseMusicXML(filePath) {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const xmlContent = fs.readFileSync(filePath, 'utf8');
      const parsed = await parseStringPromise(xmlContent);

      const score = parsed['score-partwise'];
      if (!score) return null;

      const metadata = {
        title: this.extractTitle(score),
        subtitle: this.extractSubtitle(score),
        composer: this.extractComposer(score),
        arranger: this.extractArranger(score),
        lyricist: this.extractLyricist(score),
        copyright: this.extractCopyright(score),

        // Rich metadata
        genre: null,
        region: null,
        province: null,
        collector: null,
        performer: null,
        performerDetails: null,

        // Musical metadata
        timeSignature: this.extractTimeSignature(score),
        keySignature: this.extractKeySignature(score),
        tempo: this.extractTempo(score),

        // Raw fields for processing
        rawComposer: null,
        rawArranger: null
      };

      // Parse composer field for genre/region
      if (metadata.composer) {
        const composerInfo = this.parseComposerField(metadata.composer);
        Object.assign(metadata, composerInfo);
      }

      // Parse arranger field for collector/performer
      if (metadata.arranger) {
        const arrangerInfo = this.parseArrangerField(metadata.arranger);
        Object.assign(metadata, arrangerInfo);
      }

      return metadata;

    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error.message);
      return null;
    }
  }

  extractTitle(score) {
    if (score['work'] && score['work'][0] && score['work'][0]['work-title']) {
      return score['work'][0]['work-title'][0];
    }
    return null;
  }

  extractSubtitle(score) {
    if (score['movement-title']) {
      return score['movement-title'][0];
    }
    return null;
  }

  extractComposer(score) {
    return this.extractCreator(score, 'composer');
  }

  extractArranger(score) {
    return this.extractCreator(score, 'arranger');
  }

  extractLyricist(score) {
    return this.extractCreator(score, 'lyricist');
  }

  extractCreator(score, type) {
    if (!score.identification || !score.identification[0].creator) {
      return null;
    }

    const creators = score.identification[0].creator;
    const creator = creators.find(c => c.$ && c.$.type === type);

    return creator ? creator._ : null;
  }

  extractCopyright(score) {
    if (score.identification && score.identification[0].rights) {
      return score.identification[0].rights[0];
    }
    return null;
  }

  extractTimeSignature(score) {
    try {
      const part = score.part[0];
      const measure = part.measure[0];
      const attributes = measure.attributes[0];

      if (attributes.time) {
        const beats = attributes.time[0].beats[0];
        const beatType = attributes.time[0]['beat-type'][0];
        return `${beats}/${beatType}`;
      }
    } catch (e) {
      // Ignore
    }
    return null;
  }

  extractKeySignature(score) {
    try {
      const part = score.part[0];
      const measure = part.measure[0];
      const attributes = measure.attributes[0];

      if (attributes.key) {
        const fifths = parseInt(attributes.key[0].fifths[0]);
        return this.fifthsToKey(fifths);
      }
    } catch (e) {
      // Ignore
    }
    return null;
  }

  extractTempo(score) {
    try {
      const part = score.part[0];
      const measure = part.measure[0];

      if (measure.direction) {
        const direction = measure.direction.find(d => d['sound'] && d['sound'][0].$ && d['sound'][0].$.tempo);
        if (direction) {
          return parseInt(direction['sound'][0].$.tempo);
        }
      }
    } catch (e) {
      // Ignore
    }
    return null;
  }

  fifthsToKey(fifths) {
    const keys = {
      '-7': 'Cb', '-6': 'Gb', '-5': 'Db', '-4': 'Ab', '-3': 'Eb',
      '-2': 'Bb', '-1': 'F', '0': 'C', '1': 'G', '2': 'D',
      '3': 'A', '4': 'E', '5': 'B', '6': 'F#', '7': 'C#'
    };
    return keys[fifths.toString()] || 'C';
  }

  /**
   * Parse composer field: "Hát ghẹo - Dân ca Phú Thọ\nSưu tầm: Nguyễn Đằng Hòe"
   */
  parseComposerField(composerStr) {
    const result = {
      rawComposer: composerStr,
      genre: null,
      province: null,
      collector: null
    };

    // Extract genre
    const composerLower = composerStr.toLowerCase();
    for (const [keyword, genreKey] of Object.entries(this.genreKeywords)) {
      if (composerLower.includes(keyword)) {
        result.genre = genreKey;
        break;
      }
    }

    // Extract province
    const provinceLower = composerStr.toLowerCase();
    for (const [province, region] of Object.entries(this.provinceToRegion)) {
      if (provinceLower.includes(province)) {
        result.province = province.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        result.region = region;
        break;
      }
    }

    // Extract collector: "Sưu tầm: Name" or "Người sưu tầm: Name"
    const collectorMatch = composerStr.match(/(?:Người\s+)?Sưu tầm:\s*(.+?)(?:\n|$)/i);
    if (collectorMatch) {
      result.collector = collectorMatch[1].trim();
    }

    return result;
  }

  /**
   * Parse arranger field: "Người hô: Nguyễn Thị Đức" or "Người ghi âm: Nguyễn Minh Dũng"
   */
  parseArrangerField(arrangerStr) {
    const result = {
      rawArranger: arrangerStr,
      performer: null,
      performerDetails: null,
      recorder: null
    };

    // Extract performer: "Người hô:", "Người hát:", "Người trình bày:"
    const performerMatch = arrangerStr.match(/Người\s+(?:hô|hát|trình bày):\s*(.+?)(?:\n|\(|$)/i);
    if (performerMatch) {
      result.performer = performerMatch[1].trim();
    }

    // Extract performer location/group: "(Hoài Hương - Hoài Nhơn - Bình Định)"
    const detailsMatch = arrangerStr.match(/\(([^)]+)\)/);
    if (detailsMatch) {
      result.performerDetails = detailsMatch[1].trim();

      // Try to extract province from performer details
      const detailsLower = result.performerDetails.toLowerCase();
      for (const [province, region] of Object.entries(this.provinceToRegion)) {
        if (detailsLower.includes(province)) {
          if (!result.province) {
            result.province = province.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            result.region = region;
          }
          break;
        }
      }
    }

    // Extract recorder: "Người ghi âm:"
    const recorderMatch = arrangerStr.match(/Người ghi âm:\s*(.+?)(?:\n|$)/i);
    if (recorderMatch) {
      result.recorder = recorderMatch[1].trim();
    }

    return result;
  }

  /**
   * Classify song based on title
   */
  classifySongFromTitle(title) {
    const titleLower = title.toLowerCase();

    let genre = 'other';
    for (const [keyword, genreKey] of Object.entries(this.genreKeywords)) {
      if (titleLower.startsWith(keyword + ' ') || titleLower.includes(' ' + keyword)) {
        genre = genreKey;
        break;
      }
    }

    // Check for special cases
    if (titleLower.startsWith('lý ')) genre = 'ly';
    if (titleLower.includes('bengu') || titleLower.includes('ê đê')) genre = 'ethnic_minority';

    return { genre };
  }

  /**
   * Get region name from key
   */
  getRegionName(key) {
    const names = {
      'northern': 'Northern Vietnam',
      'central': 'Central Vietnam',
      'southern': 'Southern Vietnam',
      'highland': 'Highland/Ethnic Minorities'
    };
    return names[key] || key;
  }

  /**
   * Get genre display name
   */
  getGenreName(key) {
    const names = {
      'quan_ho': 'Quan Họ',
      'ly': 'Lý',
      'hat_ru': 'Hát Ru (Lullaby)',
      'ho': 'Hò (Work Song)',
      'trong_quan': 'Trống Quân',
      've': 'Vè',
      'vi': 'Ví',
      'hat_gheo': 'Hát Ghẹo',
      'hat_cheo': 'Hát Chèo',
      'ca_tru': 'Ca Trù',
      'folk_song': 'Folk Song',
      'hat_xam': 'Hát Xẩm',
      'ho_khoan': 'Hò Khoan',
      'ethnic_minority': 'Ethnic Minority',
      'other': 'Other'
    };
    return names[key] || key;
  }
}

module.exports = TaxonomyMetadataParser;
