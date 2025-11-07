# Phrase Taxonomy Migration Plan - V4.4.8

## Problem Statement

Current `phraseType` field mixes two different taxonomies:
- **Structural roles**: `"refrain_opening"`, `"verse"`, `"closing"`
- **Linguistic types**: `"question"`, `"answer"`, `"exclamatory"`

**This is architecturally incorrect** - they are different hierarchical dimensions.

## Correct Taxonomy - 3 Independent Hierarchies

### Hierarchy 1: Structural Role (Where in song structure?)

**Definition**: Position and function within the song's formal structure.

```javascript
structuralRole: {
  // Primary sections
  "opening": "First phrase(s) of song",
  "verse": "Main narrative/story section",
  "refrain": "Repeating anchor phrase",
  "bridge": "Contrasting middle section",
  "closing": "Final phrase(s) of song",

  // Special sections
  "intro": "Instrumental/non-lyrical opening",
  "interlude": "Instrumental break",
  "coda": "Extended ending",
  "tag": "Repeated ending phrase"
}
```

### Hierarchy 2: Linguistic Type (What kind of sentence?)

**Definition**: Grammatical/pragmatic function of the phrase.

```javascript
linguisticType: {
  // Speech acts
  "exclamatory": "Exclamations, interjections (Ới!, Í!, Ơi!)",
  "question": "Interrogative phrases",
  "answer": "Response to question",
  "imperative": "Commands, requests",
  "declarative": "Statements, descriptions",

  // Discourse functions
  "vocative": "Addressing/calling someone",
  "narrative": "Story-telling, description",
  "dialogue": "Conversational exchange"
}
```

### Hierarchy 3: Semantic Category (What is it about?)

**Definition**: Thematic content and meaning domain.

```javascript
semanticCategory: {
  // Content domains
  "nature": "Natural imagery (river, mountain, bird)",
  "love": "Romantic themes",
  "work": "Labor, farming, daily tasks",
  "festival": "Celebration, ceremonies",
  "spiritual": "Religious, philosophical",
  "social": "Community, relationships",
  "emotional": "Feelings, moods",
  "abstract": "General concepts"
}
```

---

## New Data Structure

### Before (Current - WRONG):
```json
{
  "phraseId": 1,
  "syllable": "Bà",
  "phraseType": "refrain_opening"  // ❌ Mixing structural + position
}

{
  "phraseId": 2,
  "syllable": "Ới",
  "phraseType": "question"  // ❌ Only linguistic, no structure
}
```

### After (Correct - 3 Hierarchies):
```json
{
  "phraseId": 1,
  "syllable": "Bà",

  // Structure hierarchy
  "structuralRole": "refrain",
  "structuralPosition": "opening",

  // Linguistic hierarchy
  "linguisticType": "exclamatory",

  // Semantic hierarchy
  "semanticCategory": "vocative"
}

{
  "phraseId": 2,
  "syllable": "Ới",

  // Structure hierarchy
  "structuralRole": "verse",
  "structuralPosition": "middle",

  // Linguistic hierarchy
  "linguisticType": "question",

  // Semantic hierarchy
  "semanticCategory": "emotional"
}
```

---

## Migration Strategy

### Phase 1: Parse Current phraseType

Detect composite types and split them:

```javascript
function parseCurrentPhraseType(phraseType) {
  // Pattern: "structural_position" or "linguistic" or "structural_position"

  const patterns = {
    // Composite patterns (structural + position)
    'refrain_opening': { structural: 'refrain', position: 'opening' },
    'refrain_closing': { structural: 'refrain', position: 'closing' },
    'verse_opening': { structural: 'verse', position: 'opening' },
    'question_opening': { structural: 'verse', position: 'opening', linguistic: 'question' },

    // Pure structural
    'refrain': { structural: 'refrain', position: null },
    'verse': { structural: 'verse', position: null },
    'bridge': { structural: 'bridge', position: null },
    'closing': { structural: null, position: 'closing' },
    'opening': { structural: null, position: 'opening' },

    // Pure linguistic
    'question': { linguistic: 'question' },
    'answer': { linguistic: 'answer' },
    'exclamatory': { linguistic: 'exclamatory' },
    'narrative': { linguistic: 'narrative' },
    'imperative': { linguistic: 'imperative' }
  };

  return patterns[phraseType] || { structural: null, position: null, linguistic: null };
}
```

### Phase 2: Infer Missing Data

Use context clues to fill in missing hierarchies:

```javascript
function inferMissingHierarchies(phrase, phraseIndex, totalPhrases, allPhrases) {
  const result = parseCurrentPhraseType(phrase.phraseType);

  // Infer structural position if missing
  if (!result.position) {
    if (phraseIndex === 0) result.position = 'opening';
    else if (phraseIndex === totalPhrases - 1) result.position = 'closing';
    else result.position = 'middle';
  }

  // Infer structural role if missing
  if (!result.structural) {
    // Check if phrase repeats (refrain detection)
    const phraseText = phrase.text || getPhraseText(phrase.phraseId, allPhrases);
    const repetitions = countRepetitions(phraseText, allPhrases);

    if (repetitions >= 2) {
      result.structural = 'refrain';
    } else {
      result.structural = 'verse';
    }
  }

  // Infer linguistic type if missing
  if (!result.linguistic) {
    const text = phrase.text || getPhraseText(phrase.phraseId, allPhrases);
    result.linguistic = detectLinguisticType(text);
  }

  // Infer semantic category (always needed)
  const text = phrase.text || getPhraseText(phrase.phraseId, allPhrases);
  result.semantic = detectSemanticCategory(text);

  return result;
}
```

### Phase 3: Detect Linguistic Type

```javascript
function detectLinguisticType(phraseText) {
  const text = phraseText.toLowerCase();

  // Exclamatory markers
  if (/^(ới|ơi|í|à|ạ|hỡi|chao|úi|ôi)\b/i.test(text)) {
    return 'exclamatory';
  }

  // Question markers
  if (/\b(ai|gì|đâu|sao|thế nào|bao giờ|nào|chi)\b/i.test(text) || text.includes('?')) {
    return 'question';
  }

  // Imperative markers
  if (/^(hãy|đừng|chớ|mau|nhanh)\b/i.test(text)) {
    return 'imperative';
  }

  // Vocative markers (addressing)
  if (/\b(bà|ông|anh|chị|em|cô|chú|bác|cậu)\b/i.test(text)) {
    return 'vocative';
  }

  // Default: narrative/declarative
  return 'narrative';
}
```

### Phase 4: Detect Semantic Category

```javascript
function detectSemanticCategory(phraseText) {
  const text = phraseText.toLowerCase();

  // Nature keywords
  const natureWords = ['núi', 'sông', 'biển', 'trời', 'mây', 'gió', 'mưa', 'nắng', 'hoa', 'cây', 'lá', 'chim', 'sóng'];
  if (natureWords.some(w => text.includes(w))) return 'nature';

  // Love keywords
  const loveWords = ['yêu', 'thương', 'tình', 'nhớ', 'mến', 'gần', 'xa', 'lòng'];
  if (loveWords.some(w => text.includes(w))) return 'love';

  // Work keywords
  const workWords = ['cày', 'bừa', 'gặt', 'gieo', 'làm', 'ruộng', 'đồng', 'nông', 'thuyền', 'chèo'];
  if (workWords.some(w => text.includes(w))) return 'work';

  // Emotional keywords
  const emotionWords = ['vui', 'buồn', 'sướng', 'khổ', 'cười', 'khóc', 'mừng', 'lo'];
  if (emotionWords.some(w => text.includes(w))) return 'emotional';

  // Social keywords
  const socialWords = ['quan họ', 'hội', 'làng', 'xóm', 'bạn', 'người'];
  if (socialWords.some(w => text.includes(w))) return 'social';

  // Vocative patterns (just names/pronouns)
  if (/^(bà|ông|anh|chị|em)\s+\w+[,\s]*$/i.test(text)) {
    return 'vocative';
  }

  return 'abstract';
}
```

---

## Migration Script Implementation

### File: `v4/migrate-phrase-taxonomy.js`

```javascript
const fs = require('fs');
const path = require('path');

class PhraseTaxonomyMigrator {
  constructor() {
    this.relationshipsDir = path.join(__dirname, 'data/relationships');
    this.lyricsDir = path.join(__dirname, 'data/lyrics-segmentations');
    this.backupDir = path.join(__dirname, 'data/relationships-backup-v4.4.7');
  }

  async migrate() {
    console.log('🔄 Starting Phrase Taxonomy Migration...\n');

    // Step 1: Backup existing data
    await this.backupExistingData();

    // Step 2: Get all relationship files
    const files = fs.readdirSync(this.relationshipsDir)
      .filter(f => f.endsWith('-relationships.json'));

    console.log(`Found ${files.length} relationship files\n`);

    // Step 3: Migrate each file
    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        await this.migrateFile(file);
        successCount++;
      } catch (error) {
        console.error(`❌ Error migrating ${file}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n✅ Migration Complete!');
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Backup: ${this.backupDir}`);
  }

  async backupExistingData() {
    console.log('📦 Creating backup...');

    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    const files = fs.readdirSync(this.relationshipsDir)
      .filter(f => f.endsWith('-relationships.json'));

    for (const file of files) {
      const src = path.join(this.relationshipsDir, file);
      const dest = path.join(this.backupDir, file);
      fs.copyFileSync(src, dest);
    }

    console.log(`✓ Backed up ${files.length} files\n`);
  }

  async migrateFile(filename) {
    const filePath = path.join(this.relationshipsDir, filename);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    console.log(`Processing: ${data.metadata.songName}`);

    // Load lyrics segmentation for phrase texts
    const songName = data.metadata.songName;
    const lyricsFile = fs.readdirSync(this.lyricsDir)
      .find(f => f.toLowerCase().includes(songName.toLowerCase().replace(/\s+/g, '-')));

    let lyricsData = null;
    if (lyricsFile) {
      lyricsData = JSON.parse(fs.readFileSync(path.join(this.lyricsDir, lyricsFile), 'utf8'));
    }

    // Migrate each word mapping
    const totalPhrases = Math.max(...data.wordToNoteMap.map(w => w.phraseId));

    data.wordToNoteMap = data.wordToNoteMap.map((word, index) => {
      // Get phrase text
      const phraseText = lyricsData?.phrases.find(p => p.id === word.phraseId)?.text || '';

      // Parse and infer hierarchies
      const parsed = this.parseCurrentPhraseType(word.phraseType);
      const inferred = this.inferMissingHierarchies(
        { ...word, text: phraseText },
        word.phraseId - 1,
        totalPhrases,
        lyricsData?.phrases || []
      );

      // Remove old phraseType
      delete word.phraseType;

      // Add new hierarchical fields
      return {
        ...word,
        structuralRole: inferred.structural,
        structuralPosition: inferred.position,
        linguisticType: inferred.linguistic,
        semanticCategory: inferred.semantic
      };
    });

    // Update metadata
    data.metadata.taxonomyVersion = '4.4.8';
    data.metadata.migrationDate = new Date().toISOString();

    // Save migrated file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    console.log(`  ✓ Migrated ${data.wordToNoteMap.length} word mappings`);
  }

  parseCurrentPhraseType(phraseType) {
    const patterns = {
      'refrain_opening': { structural: 'refrain', position: 'opening' },
      'refrain_closing': { structural: 'refrain', position: 'closing' },
      'verse_opening': { structural: 'verse', position: 'opening' },
      'question_opening': { structural: 'verse', position: 'opening', linguistic: 'question' },
      'refrain': { structural: 'refrain', position: null },
      'verse': { structural: 'verse', position: null },
      'bridge': { structural: 'bridge', position: null },
      'closing': { structural: null, position: 'closing' },
      'opening': { structural: null, position: 'opening' },
      'question': { linguistic: 'question' },
      'answer': { linguistic: 'answer' },
      'exclamatory': { linguistic: 'exclamatory' },
      'narrative': { linguistic: 'narrative' },
      'imperative': { linguistic: 'imperative' }
    };

    return patterns[phraseType] || { structural: null, position: null, linguistic: null };
  }

  inferMissingHierarchies(phrase, phraseIndex, totalPhrases, allPhrases) {
    const result = this.parseCurrentPhraseType(phrase.phraseType);

    // Infer position
    if (!result.position) {
      if (phraseIndex === 0) result.position = 'opening';
      else if (phraseIndex === totalPhrases - 1) result.position = 'closing';
      else result.position = 'middle';
    }

    // Infer structural role
    if (!result.structural) {
      const phraseText = phrase.text;
      const repetitions = allPhrases.filter(p => p.text === phraseText).length;
      result.structural = (repetitions >= 2) ? 'refrain' : 'verse';
    }

    // Infer linguistic type
    if (!result.linguistic) {
      result.linguistic = this.detectLinguisticType(phrase.text);
    }

    // Always infer semantic
    result.semantic = this.detectSemanticCategory(phrase.text);

    return result;
  }

  detectLinguisticType(text) {
    if (!text) return 'narrative';

    const lower = text.toLowerCase();

    if (/^(ới|ơi|í|à|ạ|hỡi|chao|úi|ôi)\b/i.test(lower)) return 'exclamatory';
    if (/\b(ai|gì|đâu|sao|thế nào|bao giờ|nào|chi)\b/i.test(lower) || lower.includes('?')) return 'question';
    if (/^(hãy|đừng|chớ|mau|nhanh)\b/i.test(lower)) return 'imperative';
    if (/\b(bà|ông|anh|chị|em|cô|chú|bác|cậu)\b/i.test(lower)) return 'vocative';

    return 'narrative';
  }

  detectSemanticCategory(text) {
    if (!text) return 'abstract';

    const lower = text.toLowerCase();

    const categories = {
      nature: ['núi', 'sông', 'biển', 'trời', 'mây', 'gió', 'mưa', 'nắng', 'hoa', 'cây', 'lá', 'chim', 'sóng'],
      love: ['yêu', 'thương', 'tình', 'nhớ', 'mến', 'gần', 'xa', 'lòng'],
      work: ['cày', 'bừa', 'gặt', 'gieo', 'làm', 'ruộng', 'đồng', 'nông', 'thuyền', 'chèo'],
      emotional: ['vui', 'buồn', 'sướng', 'khổ', 'cười', 'khóc', 'mừng', 'lo'],
      social: ['quan họ', 'hội', 'làng', 'xóm', 'bạn', 'người']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(w => lower.includes(w))) return category;
    }

    if (/^(bà|ông|anh|chị|em)\s+\w+[,\s]*$/i.test(lower)) return 'vocative';

    return 'abstract';
  }

  async rollback() {
    console.log('⏮️  Rolling back migration...\n');

    if (!fs.existsSync(this.backupDir)) {
      console.error('❌ No backup found!');
      return;
    }

    const files = fs.readdirSync(this.backupDir);

    for (const file of files) {
      const src = path.join(this.backupDir, file);
      const dest = path.join(this.relationshipsDir, file);
      fs.copyFileSync(src, dest);
    }

    console.log(`✅ Rolled back ${files.length} files`);
  }
}

// CLI
const migrator = new PhraseTaxonomyMigrator();

const command = process.argv[2];

if (command === 'rollback') {
  migrator.rollback();
} else {
  migrator.migrate();
}
```

---

## Updated Data Structure Specification

### File: `v4/types.d.js`

```javascript
/**
 * @typedef {Object} PhraseHierarchies
 * @property {string} structuralRole - Song structure role (refrain, verse, bridge, etc.)
 * @property {string} structuralPosition - Position in song (opening, middle, closing)
 * @property {string} linguisticType - Linguistic function (question, answer, exclamatory, etc.)
 * @property {string} semanticCategory - Thematic content (nature, love, work, etc.)
 */

/**
 * @typedef {Object} WordToNoteMapping
 * @property {number} phraseId - Phrase identifier
 * @property {number} wordIndex - Word position in song
 * @property {string} syllable - Vietnamese syllable
 * @property {string} tone - Vietnamese tone (ngang, sắc, huyền, etc.)
 * @property {string} rhymeFamily - Rhyme classification
 * @property {string} translation - English translation
 *
 * // NEW: Hierarchical classification (replaces single phraseType)
 * @property {string} structuralRole - Structure hierarchy
 * @property {string} structuralPosition - Position hierarchy
 * @property {string} linguisticType - Linguistic hierarchy
 * @property {string} semanticCategory - Semantic hierarchy
 *
 * // DEPRECATED: Remove after migration
 * // @property {string} phraseType - REMOVED - Split into 3 hierarchies
 *
 * @property {string[]} noteIds - Note IDs for this word
 * @property {string} mainNoteId - Primary note ID
 * @property {boolean} hasGraceNotes - Has grace notes
 * @property {string[]} graceNotesBefore - Grace notes before main
 * @property {string[]} graceNotesAfter - Grace notes after main
 * @property {boolean} isMelisma - Multiple notes on one syllable
 * @property {string[]} melismaNotes - Additional melisma notes
 */
```

---

## Controller Updates

### File: `v4/lyrics-controller.js`

**Before:**
```javascript
const typeColor = this.typeColors[phrase.linguisticType] || '#999';
```

**After:**
```javascript
// Color by linguistic type (most relevant for display)
const typeColor = this.typeColors[phrase.linguisticType] || '#999';

// Badge shows all 3 hierarchies
const badge = `
  <div class="phrase-hierarchies">
    <span class="structural">${phrase.structuralRole}</span>
    <span class="position">${phrase.structuralPosition}</span>
    <span class="linguistic" style="background: ${typeColor}">${phrase.linguisticType}</span>
    <span class="semantic">${phrase.semanticCategory}</span>
  </div>
`;
```

---

## Testing Strategy

### Phase 1: Sample Test (5 songs)
```bash
# Test with 5 diverse songs
node migrate-phrase-taxonomy.js --sample --songs="ba-rang-ba-ri,ly-chieu-chieu,ho-gia-gao,hat-ru-con,do-dua"
```

### Phase 2: Validation
```bash
# Validate migration accuracy
node validate-taxonomy.js --compare-before-after
```

### Phase 3: Full Migration
```bash
# Migrate all 126 songs
node migrate-phrase-taxonomy.js
```

### Phase 4: Rollback (if needed)
```bash
# Restore from backup
node migrate-phrase-taxonomy.js rollback
```

---

## Success Criteria

- [ ] All 126 relationship files migrated
- [ ] Backup created in `relationships-backup-v4.4.7/`
- [ ] Every word mapping has 4 fields: `structuralRole`, `structuralPosition`, `linguisticType`, `semanticCategory`
- [ ] Old `phraseType` field removed
- [ ] Lyrics controller displays all 3 hierarchies
- [ ] No data loss (word count unchanged)
- [ ] Rollback tested and works

---

## Next Steps After Migration

1. **Update phrase-bars-controller.js** - Use `structuralRole` for color coding
2. **Update statistics** - Separate counts by hierarchy
3. **Create advanced filters** - Filter by any combination of hierarchies
4. **Cross-song analysis** - Compare structural patterns across regions
5. **Documentation** - Update CLAUDE.md with new taxonomy

---

**Version**: V4.4.8
**Status**: Ready for implementation
**Impact**: All 126 songs, ~15,000 word-to-note mappings
**Rollback**: Supported via backup directory
