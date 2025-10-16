# Clean Taxonomy Architecture - Lyrics-Based Song Structure

## 🎯 Core Principle: Separate Independent Dimensions

**Based on user insight:** Don't mix repetition (structural property) with phrase types (linguistic property)!

---

## 📊 THE 5 INDEPENDENT DIMENSIONS

### **Dimension 1: PHRASE SEGMENTATION** (Foundation)

**Question:** Where do phrases start and end?

**Method:**
- LLM segmentation (Claude analyzes lyrics)
- Punctuation boundaries
- Natural speech units

**Output:**
```json
{
  "phrases": [
    { "id": 1, "text": "Bà rằng bà rí, ơi hỡi cho dày" },
    { "id": 2, "text": "Ới khắp chốn nối cái" }
  ]
}
```

**Status:** ✅ Already implemented

---

### **Dimension 2: LINGUISTIC TYPE** (MUST HAVE)

**Question:** WHAT KIND of sentence/phrase is this?

**Categories:**
- **Exclamatory** - Emotional outbursts (ơi, ới, hỡi, í, à)
- **Question** - Interrogatives (ai, gì, đâu, sao, thế nào, ?)
- **Answer** - Responses to questions
- **Narrative** - Story-telling, descriptions
- **Complaint** - Grievances, laments (khổ, buồn)
- **Imperative** - Commands (hãy, đừng, chớ)
- **Vocative** - Calling/addressing (pure vocative phrases)

**Visual Encoding:**
- **Background section boxes** - Groups consecutive phrases of same type
  - "Exclamatory 1", "Exclamatory 2", "Exclamatory 3"
  - "Question 1", "Question 2"
  - "Narrative 1", "Narrative 2"
- **Border color** - All same type have matching border

**Status:** ✅ Implemented (after V4.4.9 fix)

---

### **Dimension 3: REPETITION PATTERN** (IMPORTANT - Variation vs Repeat)

**Question:** How does this phrase relate to others in the song?

**Categories:**

#### **Tier 1: Exact Repetition**
- Word-for-word identical phrases
- Badge: `REPEAT (2/4)` = 2nd of 4 occurrences
- Visual: Gold badge + matching fill color

#### **Tier 2: Structural Parallelism**
- Same grammatical pattern, different words
- Badge: `STRUCTURAL`
- Visual: Blue badge

**Tier 3: Semantic Parallelism**
- Same themes, different structure
- No badge (shown via semantic icons instead)

#### **Tier 4: Unique**
- Appears only once
- No badge

**Visual Encoding:**
- **Badges** - REPEAT (exact), STRUCTURAL (pattern)
- **Fill color** - Identical text = same color (all "Bà rằng bà rí" = PINK)

**Critical Rule:** **Repetition is INDEPENDENT of linguistic type!**
- A question CAN repeat → Question section + REPEAT (1/3) badge
- An exclamation CAN be unique → Exclamatory section + no badge

**Status:** ✅ Implemented

---

### **Dimension 4: SEMANTIC CONTENT** (IMPORTANT)

**Question:** WHAT vocabulary themes/topics appear?

**Categories:**
- **Characters** - People (bà, chồng, em, con, mẹ)
- **Emotion** - Feelings (khổ, thương, nhớ, buồn, vui)
- **Action** - Verbs (đi, làm, ru, hát, gánh)
- **Nature** - Natural imagery (chiều, gió, cây, sông, mưa)
- **Abstract** - Concepts (duyên, đời, lòng, tình)
- **Vocatives** - Calls (ơi, hỡi, ới)

**Visual Encoding:**
- **Icons** - 👤 characters, 😢 emotion, 🗣️ action, 🌳 nature, 💭 abstract, 📣 vocative
- **Multiple icons** - Phrases can mix themes (👤 + 😢 + 🗣️)

**Status:** ✅ Implemented

---

### **Dimension 5: FIGURATIVE LANGUAGE** (NEW! - Your Missing Piece)

**Question:** HOW is meaning expressed?

**Categories:**

#### **Metaphor** 🎭
- **"Borrow nature to talk about emotion"**
- Has BOTH nature + emotion vocabulary
- Example: "Chiều buồn" (evening = sadness)
- Nature imagery represents emotional state

#### **Literal Emotion** 💔
- **Direct emotional expression**
- Has emotion, NO nature
- Example: "Khổ quá" (so much suffering)
- States emotion directly

#### **Literal Nature** 🌿
- **Pure nature description**
- Has nature, NO emotion
- Example: "Gió thổi nhẹ" (wind blows gently)
- Describes natural phenomena objectively

#### **Abstract** 💭
- **Philosophical concepts**
- Has abstract vocabulary, NO nature
- Example: "Duyên số đã định" (fate has determined)

**Detection Logic:**
```javascript
detectFigurativeLanguage(phrase) {
    const hasNature = semantics.includes('nature');
    const hasEmotion = semantics.includes('emotions');
    const hasAbstract = semantics.includes('abstract');

    // Metaphor: Borrowing nature to express emotion/abstract
    if (hasNature && (hasEmotion || hasAbstract)) {
        return { type: 'metaphor', icon: '🎭' };
    }

    // Literal emotion
    if (hasEmotion && !hasNature) {
        return { type: 'literal-emotion', icon: '💔' };
    }

    // Literal nature
    if (hasNature && !hasEmotion && !hasAbstract) {
        return { type: 'literal-nature', icon: '🌿' };
    }

    // Abstract
    if (hasAbstract && !hasNature) {
        return { type: 'abstract', icon: '💭' };
    }

    return null;
}
```

**Visual Encoding:**
- **Icon badge** - Shows figurative type
- **Positioned** - Above semantic icons, below REPEAT badge

**Status:** ✅ Detection added (V4.4.9), visualization pending

---

## 🏗️ COMPLETE VISUAL ARCHITECTURE

### **Each phrase box encodes all 5 dimensions:**

```
┌─────────────────────────────────┐
│  REPEAT (2/4)                   │ ← Dimension 3: Repetition (2nd of 4 times)
│  🎭 Metaphor                    │ ← Dimension 5: Figurative (nature→emotion)
│  🌳 nature  😢 emotion          │ ← Dimension 4: Semantic (nature + emotion themes)
│                                 │
│  "Chiều buồn khổ quá"           │ ← Dimension 1: Phrase text
│  Phrase 7                       │
└─────────────────────────────────┘
 ▲                            ▲
 │                            └─ Dimension 2: Border = Question type (CYAN)
 └─ Dimension 2: Fill = Unique text color

Background box: "Complaint 1" ← Dimension 2: Linguistic type section
```

---

## ✅ WHAT YOU HAVE (Complete)

| Dimension | What | How Shown | Example |
|-----------|------|-----------|---------|
| **1. Segmentation** | Where phrases are | Phrase boundaries | 28 phrases detected |
| **2. Linguistic Type** | What KIND | Section boxes + border color | "Question 1" section, cyan border |
| **3. Repetition** | Variation vs repeat | REPEAT badge + fill color | REPEAT (2/4), pink fill |
| **4. Semantic Themes** | WHAT vocabulary | Icons (👤😢🌳) | nature + emotion |
| **5. Figurative Language** | HOW expressed | 🎭 icon | Metaphor |

---

## ❌ WHAT YOU DON'T NEED

### ~~"Refrain" as Section Type~~ ← REMOVED!

**Why removed:**
- "Refrain" = repetition property (Dimension 3)
- Should NOT be a section type (Dimension 2)
- Mixing taxonomies causes confusion

**How repetition is shown instead:**
- REPEAT badge (Layer 2)
- Matching fill colors
- Can have "Question REPEAT (1/3)" (repeated question) ✅

---

## 🎨 ARCHITECTURAL RULES

### Rule 1: One Dimension Per Layer
Each visual layer encodes EXACTLY ONE dimension - no mixing!

### Rule 2: Independence
Any combination is valid:
- ✅ Repeated question (Dimension 2 + 3)
- ✅ Unique exclamation (Dimension 2 only)
- ✅ Metaphorical complaint that repeats (Dimension 2 + 3 + 5)

### Rule 3: No Forced Relationships
- Questions don't require answers
- Repetition doesn't require specific types
- Metaphors don't require specific positions

---

## 📋 COMPLETE IMPLEMENTATION CHECKLIST

### ✅ Dimension 1: Phrase Segmentation
- [x] LLM-based segmentation
- [x] Stored in `lyrics-segmentations/*.json`
- [x] 28 phrases per song average

### ✅ Dimension 2: Linguistic Type
- [x] Detection in migration (V4.4.8)
- [x] Section boxes by type (V4.4.9)
- [x] Border colors by type (V4.4.9)
- [x] 7 types: exclamatory, question, answer, complaint, narrative, imperative, vocative

### ✅ Dimension 3: Repetition Pattern
- [x] Exact repetition detection
- [x] REPEAT badge shows count
- [x] Fill colors by unique text
- [x] Structural parallelism detection (blue badge)

### ✅ Dimension 4: Semantic Content
- [x] Theme detection (characters, emotion, action, nature, abstract, vocatives)
- [x] Icons showing themes
- [x] Multiple themes per phrase

### ⏸️ Dimension 5: Figurative Language
- [x] Detection logic added (V4.4.9)
- [ ] Visual icon in phrase boxes (pending)
- [ ] Legend entry (done in modal)
- [ ] Hover tooltip integration (pending)

---

## 🚀 NEXT STEP: Visualize Dimension 5

Add figurative language icon to phrase boxes:

```javascript
// In annotated-phrases-ii-generator.js
const figurative = this.analyzer.detectFigurativeLanguage(phrase);

if (figurative) {
    parts.push(`
        <!-- Figurative language icon -->
        <text
            x="${position.centerX}"
            y="90"
            text-anchor="middle"
            font-size="14"
            data-base-x="${position.centerX}">
            ${figurative.icon} ${figurative.type}
        </text>
    `);
}
```

**Should I add this visualization now?**

---

**Status**: Clean 5-dimension taxonomy designed
**Implementation**: Dimensions 1-4 complete, Dimension 5 detection ready
**Date**: 2025-10-16
**Key Insight**: Repetition is NOT a section type - it's a separate structural property!
