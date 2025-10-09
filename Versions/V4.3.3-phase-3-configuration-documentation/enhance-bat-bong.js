#!/usr/bin/env node

/**
 * Deep Manual Enhancement for "Bát bồng, nhất trò, xuân nữ"
 * Adds comprehensive figurative expressions to each phrase
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, 'data/lyrics-enhanced-tier1/Bát bồng, nhất trò, xuân nữ.json');

// Read existing file
const songData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));

// Deep figurative expressions for each phrase
const figurativeExpressionsByPhrase = {
  1: [
    {
      "vietnamese": "trăng non",
      "literal": "young moon / new moon",
      "meaning": "new beginning, fresh start, budding romance - symbolic of youth and new cycles",
      "classification": {
        "vietnameseCategory": "từ_kết_hợp",
        "semanticMechanism": "metaphorical",
        "culturalScope": "east_asian",
        "fixedness": "semi_fixed",
        "meaningDepth": "multi_layered"
      },
      "features": [
        "lunar_symbolism",
        "temporal_metaphor",
        "romantic_imagery",
        "cyclical_renewal",
        "youth_association"
      ],
      "culturalContext": "Trăng non (new moon) carries multiple layers: literal astronomical event, metaphor for new beginnings, and romantic symbol of fresh relationships. Central to Vietnamese lunar calendar culture where moon phases mark life events.",
      "words": ["trăng", "non"]
    },
    {
      "vietnamese": "Chầu rày",
      "literal": "period this / time now",
      "meaning": "at this time, nowadays - poetic temporal marker with elevated register",
      "classification": {
        "vietnameseCategory": "từ_kết_hợp",
        "semanticMechanism": "literal",
        "culturalScope": "vietnamese_specific",
        "fixedness": "frozen",
        "meaningDepth": "layered"
      },
      "features": [
        "temporal_marker",
        "poetic_register",
        "folk_song_formula",
        "archaic_flavor"
      ],
      "culturalContext": "Chầu rày is elevated poetic alternative to simple 'bây giờ' (now) - signals folk song register and traditional narrative opening formula",
      "words": ["Chầu", "rày"]
    }
  ],
  2: [
    {
      "vietnamese": "lên xuống",
      "literal": "go up go down",
      "meaning": "traveling back and forth, visiting repeatedly, journey metaphor",
      "classification": {
        "vietnameseCategory": "từ_kết_hợp",
        "semanticMechanism": "metaphorical",
        "culturalScope": "universal",
        "fixedness": "semi_fixed",
        "meaningDepth": "multi_layered"
      },
      "features": [
        "movement_metaphor",
        "cyclical_action",
        "journey_imagery",
        "spatial_opposition",
        "visitation_ritual"
      ],
      "culturalContext": "Lên xuống (up down) suggests repeated journeys between villages or homes - common courtship pattern in traditional Vietnam where young men would travel to visit loved ones. Also metaphor for life's ups and downs experienced together.",
      "words": ["lên", "xuống"]
    },
    {
      "vietnamese": "con em bồng",
      "literal": "classifier-you carry-in-arms",
      "meaning": "you whom I carry tenderly - endearing romantic imagery with animacy classifier",
      "classification": {
        "vietnameseCategory": "ca_dao_formula",
        "semanticMechanism": "metaphorical",
        "culturalScope": "vietnamese_specific",
        "fixedness": "semi_fixed",
        "meaningDepth": "multi_layered"
      },
      "features": [
        "animacy_classifier",
        "tender_imagery",
        "protective_love",
        "parent_child_metaphor",
        "intimate_care"
      ],
      "culturalContext": "Con em bồng uses 'con' (classifier for small living things/children) to add intimacy and protectiveness. 'Bồng' (carry in arms like a child) elevates beloved to precious, cherished status - common romantic formula in Northern folk songs.",
      "words": ["con", "em", "bồng"]
    }
  ],
  3: [
    {
      "vietnamese": "mang sách",
      "literal": "carry books",
      "meaning": "pursuing education, aspiring to scholarly status and social advancement",
      "classification": {
        "vietnameseCategory": "từ_kết_hợp",
        "semanticMechanism": "metonymic",
        "culturalScope": "vietnamese_specific",
        "fixedness": "frozen",
        "meaningDepth": "multi_layered"
      },
      "features": [
        "metonymic_representation",
        "social_aspiration",
        "confucian_education_value",
        "class_mobility_symbol",
        "examination_culture"
      ],
      "culturalContext": "Mang sách (carrying books) metonymically represents entire pursuit of education and social mobility through imperial examination system. Books stand for scholarly class, Confucian values, and escape from peasant life - powerful symbol in feudal Vietnamese society.",
      "words": ["mà", "sách"]
    },
    {
      "vietnamese": "đi hoài",
      "literal": "go constantly / go endlessly",
      "meaning": "habitual persistent action without cessation",
      "classification": {
        "vietnameseCategory": "từ_kết_hợp",
        "semanticMechanism": "literal",
        "culturalScope": "vietnamese_specific",
        "fixedness": "semi_fixed",
        "meaningDepth": "layered"
      },
      "features": [
        "temporal_emphasis",
        "habitual_aspect",
        "persistence_marker",
        "mild_teasing_tone"
      ],
      "culturalContext": "Hoài (constantly/endlessly) adds temporal persistence creating mild teasing about repetitive behavior. Common in folk songs to gently mock those who persist without success.",
      "words": ["đi", "hoài"]
    }
  ],
  4: [
    {
      "vietnamese": "Cử nhân",
      "literal": "raise person / appoint scholar",
      "meaning": "bachelor's degree (first tier in Confucian examination system)",
      "classification": {
        "vietnameseCategory": "thành_ngữ",
        "semanticMechanism": "metonymic",
        "culturalScope": "east_asian",
        "fixedness": "frozen",
        "meaningDepth": "multi_layered"
      },
      "features": [
        "sino_vietnamese_compound",
        "historical_terminology",
        "examination_system_reference",
        "social_status_marker",
        "confucian_education"
      ],
      "culturalContext": "Cử nhân was lowest examination degree in Vietnamese imperial system (based on Chinese keju 科举). Passing meant entry to scholarly class and government positions - enormous social mobility but rare achievement.",
      "words": ["Cử", "nhân"]
    },
    {
      "vietnamese": "Tú tài",
      "literal": "refined talent / laureate talent",
      "meaning": "laureate degree (regional examination success)",
      "classification": {
        "vietnameseCategory": "thành_ngữ",
        "semanticMechanism": "metonymic",
        "culturalScope": "east_asian",
        "fixedness": "frozen",
        "meaningDepth": "multi_layered"
      },
      "features": [
        "sino_vietnamese_compound",
        "historical_terminology",
        "examination_system_reference",
        "higher_status_marker",
        "elite_education"
      ],
      "culturalContext": "Tú tài was regional examination degree, higher than Cử nhân - represented significant scholarly achievement and social prestige in traditional Vietnam.",
      "words": ["tú", "tài"]
    },
    {
      "vietnamese": "chẳng...mà...cũng không",
      "literal": "not...and...also not",
      "meaning": "parallel negation construction - neither this nor that",
      "classification": {
        "vietnameseCategory": "ca_dao_formula",
        "semanticMechanism": "literal",
        "culturalScope": "vietnamese_specific",
        "fixedness": "frozen",
        "meaningDepth": "multi_layered"
      },
      "features": [
        "parallel_construction",
        "exhaustive_negation",
        "syntactic_formula",
        "ca_dao_pattern",
        "emphatic_denial"
      ],
      "culturalContext": "Chẳng...mà...cũng không is classic ca dao parallel negation formula - creates emphatic total denial through exhaustive listing. Mirrors poetic structure common in 6-8 syllable folk song meters.",
      "words": ["chẳng", "có", "mà", "cũng", "không"]
    }
  ],
  5: [
    {
      "vietnamese": "mang sách",
      "literal": "carry books",
      "meaning": "pursuing education, aspiring to scholarly status",
      "classification": {
        "vietnameseCategory": "từ_kết_hợp",
        "semanticMechanism": "metonymic",
        "culturalScope": "vietnamese_specific",
        "fixedness": "frozen",
        "meaningDepth": "multi_layered"
      },
      "features": [
        "metonymic_representation",
        "social_aspiration",
        "confucian_education_value",
        "class_mobility_symbol"
      ],
      "culturalContext": "Books metonymically represent education and social advancement (refrain repetition from phrase 3)",
      "words": ["mang", "sách"]
    },
    {
      "vietnamese": "đi hoài",
      "literal": "go constantly",
      "meaning": "habitual, persistent action without end",
      "classification": {
        "vietnameseCategory": "từ_kết_hợp",
        "semanticMechanism": "literal",
        "culturalScope": "vietnamese_specific",
        "fixedness": "semi_fixed",
        "meaningDepth": "layered"
      },
      "features": [
        "temporal_emphasis",
        "habitual_aspect",
        "persistence_marker"
      ],
      "culturalContext": "Temporal persistence creating teasing tone (refrain repetition from phrase 3)",
      "words": ["đi", "hoài"]
    }
  ],
  6: [
    {
      "vietnamese": "Cử nhân",
      "literal": "bachelor degree",
      "meaning": "lowest examination tier",
      "classification": {
        "vietnameseCategory": "thành_ngữ",
        "semanticMechanism": "metonymic",
        "culturalScope": "east_asian",
        "fixedness": "frozen",
        "meaningDepth": "multi_layered"
      },
      "features": [
        "sino_vietnamese_compound",
        "historical_terminology",
        "examination_system_reference"
      ],
      "culturalContext": "Repeated from phrase 4",
      "words": ["Cử", "nhân"]
    },
    {
      "vietnamese": "Tú tài",
      "literal": "laureate talent",
      "meaning": "regional examination degree",
      "classification": {
        "vietnameseCategory": "thành_ngữ",
        "semanticMechanism": "metonymic",
        "culturalScope": "east_asian",
        "fixedness": "frozen",
        "meaningDepth": "multi_layered"
      },
      "features": [
        "sino_vietnamese_compound",
        "historical_terminology",
        "examination_system_reference"
      ],
      "culturalContext": "Repeated from phrase 4",
      "words": ["tú", "tài"]
    },
    {
      "vietnamese": "không...cũng không",
      "literal": "not...also not",
      "meaning": "parallel negation - neither one nor the other",
      "classification": {
        "vietnameseCategory": "ca_dao_formula",
        "semanticMechanism": "literal",
        "culturalScope": "vietnamese_specific",
        "fixedness": "frozen",
        "meaningDepth": "layered"
      },
      "features": [
        "parallel_construction",
        "exhaustive_negation",
        "ca_dao_pattern"
      ],
      "culturalContext": "Variant of phrase 4's parallel negation formula",
      "words": ["không", "cũng", "không"]
    }
  ],
  7: [
    {
      "vietnamese": "bánh ít lá gai",
      "literal": "small cake leaf thorn - sticky rice cake wrapped in spiky leaves",
      "meaning": "humble self-worth despite imperfections - food metaphor for modest value",
      "classification": {
        "vietnameseCategory": "thành_ngữ",
        "semanticMechanism": "metaphorical",
        "culturalScope": "vietnamese_specific",
        "fixedness": "frozen",
        "meaningDepth": "multi_layered"
      },
      "features": [
        "food_metaphor",
        "self_deprecation",
        "humble_affirmation",
        "central_vietnamese_delicacy",
        "modest_self_worth",
        "regional_cuisine_reference"
      ],
      "culturalContext": "Bánh ít lá gai is Central Vietnamese specialty wrapped in spiky ramie leaves - humble peasant food that's still valued. Speaker uses food metaphor: even if I'm not impressive (not delicious), I still have basic worth (still a cake). Common self-deprecating yet affirming pattern in Vietnamese folk songs.",
      "words": ["bánh", "ít", "lá", "gai"]
    },
    {
      "vietnamese": "Dù...cũng",
      "literal": "even if...still",
      "meaning": "concessive construction acknowledging fault while asserting truth",
      "classification": {
        "vietnameseCategory": "ca_dao_formula",
        "semanticMechanism": "literal",
        "culturalScope": "vietnamese_specific",
        "fixedness": "frozen",
        "meaningDepth": "multi_layered"
      },
      "features": [
        "concessive_construction",
        "syntactic_formula",
        "self_affirmation_pattern",
        "humble_yet_persistent"
      ],
      "culturalContext": "Dù...cũng (even if...still) is classic ca dao concessive formula - acknowledges weakness while asserting persistent identity or value. Common pattern for self-deprecating yet determined statements in folk songs.",
      "words": ["Dù", "cũng"]
    }
  ],
  8: [
    {
      "vietnamese": "trò học trò",
      "literal": "student study student - student who studies, scholarly student",
      "meaning": "enduring identity as lifelong learner through reduplication emphasis",
      "classification": {
        "vietnameseCategory": "từ_láy",
        "semanticMechanism": "literal",
        "culturalScope": "vietnamese_specific",
        "fixedness": "semi_fixed",
        "meaningDepth": "multi_layered"
      },
      "features": [
        "partial_reduplication",
        "identity_emphasis",
        "persistence_value",
        "scholarly_commitment",
        "confucian_learning_ideal"
      ],
      "culturalContext": "Trò học trò uses partial reduplication (trò...trò) to emphasize enduring identity as student/scholar regardless of exam results. Reflects Vietnamese cultural value that learning itself matters more than credentials - Confucian ideal of lifelong self-cultivation.",
      "words": ["trai", "trò", "học", "trò"]
    },
    {
      "vietnamese": "Dù...có...cũng",
      "literal": "even if...may...still",
      "meaning": "intensified concessive construction - stronger acknowledgment with persistent assertion",
      "classification": {
        "vietnameseCategory": "ca_dao_formula",
        "semanticMechanism": "literal",
        "culturalScope": "vietnamese_specific",
        "fixedness": "frozen",
        "meaningDepth": "multi_layered"
      },
      "features": [
        "concessive_construction",
        "intensified_pattern",
        "self_affirmation_formula",
        "parallel_with_previous_phrase"
      ],
      "culturalContext": "Dù...có...cũng is intensified version of phrase 7's Dù...cũng - the added 'có' (may/might) strengthens acknowledgment of potential fault (may indeed be foolish) while more emphatically asserting enduring identity. Creates structural echo reinforcing thematic message.",
      "words": ["Dù", "có", "cũng"]
    }
  ]
};

// Update each phrase with comprehensive figurative expressions
songData.phrases.forEach(phrase => {
  if (figurativeExpressionsByPhrase[phrase.id]) {
    phrase.figurativeExpressions = figurativeExpressionsByPhrase[phrase.id];
  }
});

// Build comprehensive figurativeLanguageAnalysis summary
const allExpressions = [];
const expressionCounts = {};

songData.phrases.forEach(phrase => {
  if (phrase.figurativeExpressions && phrase.figurativeExpressions.length > 0) {
    phrase.figurativeExpressions.forEach(expr => {
      allExpressions.push(expr);
      const key = expr.vietnamese;
      expressionCounts[key] = (expressionCounts[key] || 0) + 1;
    });
  }
});

// Calculate pattern statistics
const patterns = {
  totalExpressions: allExpressions.length,
  uniqueExpressions: Object.keys(expressionCounts).length,
  expressionCounts: expressionCounts,
  byVietnameseCategory: {},
  bySemanticMechanism: {},
  byCulturalScope: {},
  byMeaningDepth: {},
  featureDistribution: {},
  mostCommon: Object.entries(expressionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([expression, count]) => ({ expression, count }))
};

allExpressions.forEach(expr => {
  const cat = expr.classification.vietnameseCategory;
  const sem = expr.classification.semanticMechanism;
  const scope = expr.classification.culturalScope;
  const depth = expr.classification.meaningDepth;

  patterns.byVietnameseCategory[cat] = (patterns.byVietnameseCategory[cat] || 0) + 1;
  patterns.bySemanticMechanism[sem] = (patterns.bySemanticMechanism[sem] || 0) + 1;
  patterns.byCulturalScope[scope] = (patterns.byCulturalScope[scope] || 0) + 1;
  patterns.byMeaningDepth[depth] = (patterns.byMeaningDepth[depth] || 0) + 1;

  expr.features.forEach(feature => {
    patterns.featureDistribution[feature] = (patterns.featureDistribution[feature] || 0) + 1;
  });
});

// Calculate cultural richness assessment
const density = patterns.totalExpressions > 0 ?
  (patterns.uniqueExpressions / patterns.totalExpressions).toFixed(2) : "0.00";

let richness = "sparse";
if (patterns.totalExpressions >= 15) richness = "very_rich";
else if (patterns.totalExpressions >= 10) richness = "rich";
else if (patterns.totalExpressions >= 5) richness = "moderate";

const dominantCat = Object.entries(patterns.byVietnameseCategory)
  .sort((a, b) => b[1] - a[1])[0];
const dominantSem = Object.entries(patterns.bySemanticMechanism)
  .sort((a, b) => b[1] - a[1])[0];
const dominantDepth = Object.entries(patterns.byMeaningDepth)
  .sort((a, b) => b[1] - a[1])[0];

const assessment = {
  culturalRichness: richness,
  dominantVietnameseCategory: dominantCat ? dominantCat[0] : "none",
  dominantSemanticMechanism: dominantSem ? dominantSem[0] : "none",
  dominantMeaningDepth: dominantDepth ? dominantDepth[0] : "none",
  expressionDensity: density,
  description: `Highly sophisticated figurative language combining ${dominantCat ? dominantCat[0].replace(/_/g, ' ') : 'various categories'} with rich cultural and educational references. Song explores scholarly aspiration, romantic longing, and self-affirmation through parallel structures and metaphorical constructions characteristic of Vietnamese ca dao tradition.`
};

// Update figurativeLanguageAnalysis section
songData.figurativeLanguageAnalysis = {
  patterns,
  assessment,
  processingDate: "2025-10-05",
  taxonomy: "multi_dimensional_v1.0",
  analyzedBy: "Claude Assistant (Deep Manual Analysis - Template Example)"
};

// Save enhanced file
fs.writeFileSync(INPUT_FILE, JSON.stringify(songData, null, 2), 'utf8');

console.log('✅ Deep enhancement complete for "Bát bồng, nhất trò, xuân nữ"');
console.log(`📊 Total expressions: ${patterns.totalExpressions}`);
console.log(`📊 Unique expressions: ${patterns.uniqueExpressions}`);
console.log(`📊 Cultural richness: ${richness}`);
console.log(`📊 Dominant category: ${dominantCat ? dominantCat[0] : 'none'}`);
