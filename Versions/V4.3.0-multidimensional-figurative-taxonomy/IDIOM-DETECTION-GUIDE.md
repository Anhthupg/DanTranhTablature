# Idiom Detection Guide - Automatic Mode Switching

## Overview

The integrated taxonomy pipeline **automatically switches** between LLM-based and local idiom detection based on API key availability.

## Usage

### Mode 1: Local Detection (Default - Free)

Just run the pipeline without API key:

```bash
node v4/parsers/integrated-taxonomy-pipeline.js
```

**Output:**
```
💻 Using local rule-based idiom detection

[1/122] Bengu Adai.json
  → Detecting idioms locally...
  ✓ Complete
```

**Characteristics:**
- ✅ Free, no API required
- ✅ Fast (instant processing)
- ✅ Good for reduplication detection
- ❌ Limited idiom database (~10 entries)
- ❌ Mainly detects reduplication patterns
- ❌ Misses cultural idioms/proverbs

---

### Mode 2: LLM Detection (Automatic with API Key)

Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
node v4/parsers/integrated-taxonomy-pipeline.js
```

**Output:**
```
🤖 Using LLM-based idiom detection (Claude API)

[1/122] Bengu Adai.json
  → Detecting idioms with LLM...
  → Processing phrase 1/28...
  ✓ Found 12 idioms (8 unique)
  ✓ Cultural richness: rich
```

**Characteristics:**
- ✅ Highly accurate idiom detection
- ✅ Understands cultural context
- ✅ Detects proverbs, metaphors, idioms
- ✅ Works with Claude Max plan (20x context)
- ⏱️ Slower (1 request/second rate limit)
- 💰 Costs ~$1 for all 122 songs (~$0.08 per 10 songs)

---

## How Automatic Switching Works

```javascript
// Constructor checks for API key
const hasApiKey = process.env.ANTHROPIC_API_KEY;

if (hasApiKey) {
    console.log('🤖 Using LLM-based idiom detection');
    this.idiomDetector = new LLMIdiomDetector();
} else {
    console.log('💻 Using local rule-based detection');
    this.idiomDetector = new LocalIdiomDetector();
}
```

**No code changes needed** - just set/unset the environment variable!

---

## Cost Estimates (with Claude Max)

### Full Collection (122 songs)
- **Phrases:** ~3,416 total (28 phrases/song avg)
- **Tokens:** ~341,600 input tokens
- **Cost:** ~$1.02 total
- **Time:** ~57 minutes (1 req/sec)

### Batch Processing (10 songs)
- **Phrases:** ~280 phrases
- **Tokens:** ~28,000 tokens
- **Cost:** ~$0.08
- **Time:** ~5 minutes

### Single Song Test
- **Phrases:** ~28 phrases
- **Tokens:** ~2,800 tokens
- **Cost:** ~$0.008 (less than 1 cent)
- **Time:** ~30 seconds

---

## Recommended Workflow

### 1. Test with Local (Free)
```bash
# No API key - uses local detection
node v4/parsers/integrated-taxonomy-pipeline.js
```
Result: Basic reduplication detection, good for structure testing

### 2. Verify with LLM on Sample (Pennies)
```bash
# Set API key temporarily
export ANTHROPIC_API_KEY="sk-ant-..."

# Process just 1 song to test
# (Modify script to process specific songs if needed)
```
Result: See actual idiom quality, verify it's worth running all songs

### 3. Run Full Collection when Ready ($1)
```bash
# With API key set
node v4/parsers/integrated-taxonomy-pipeline.js
```
Result: Complete, accurate idiom analysis for entire collection

---

## Output Comparison

### Local Detection Output
```json
{
  "idiomAnalysis": {
    "patterns": {
      "totalIdioms": 5,
      "typeDistribution": {
        "cultural_phrase": 5,
        "idiom": 0,
        "proverb": 0,
        "metaphor": 0
      }
    }
  }
}
```
**Most "idioms" are just reduplication (chiều chiều, ơ ơ)**

### LLM Detection Output
```json
{
  "idiomAnalysis": {
    "patterns": {
      "totalIdioms": 12,
      "typeDistribution": {
        "cultural_phrase": 4,
        "idiom": 5,
        "proverb": 2,
        "metaphor": 1
      }
    }
  }
}
```
**Actual idioms, proverbs, and metaphors detected with context**

---

## Files

- `integrated-taxonomy-pipeline.js` - Main pipeline (auto-switches)
- `llm-idiom-detector.js` - LLM-based detector (requires API)
- `local-idiom-detector.js` - Local rule-based detector (free)
- `IDIOM-DETECTION-GUIDE.md` - This guide

---

## When to Use Which Mode

**Use Local if:**
- Testing pipeline functionality
- Budget constraints
- Only need reduplication detection
- Already have reduplication from tu-lay-tagger

**Use LLM if:**
- Need accurate cultural idiom detection
- Analyzing Vietnamese traditional music professionally
- Want proverbs, metaphors, cultural phrases
- Have Claude Max plan (you do!)
- Can afford $1 for full collection

---

**Bottom Line:** The pipeline is ready for both modes. Set API key when you want accuracy, unset for free basic detection!
