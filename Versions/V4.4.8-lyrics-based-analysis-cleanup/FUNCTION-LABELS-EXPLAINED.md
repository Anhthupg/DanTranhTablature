# Layer 4: Function Labels - Complete Guide

## What Are Function Labels?

**Function labels** (Layer 4) describe the **narrative role** each phrase plays in the song's structure.

**Location in visualization:** Small gray text near the bottom of each phrase box

**Source code:** `generate-phrase-annotations.js` lines 445-454

---

## 📋 COMPLETE LIST OF FUNCTION LABELS

### **1. OPENING**

**When:** First phrase of the song (index === 0)

**Meaning:** Grabs attention, sets the mood, introduces the topic

**Examples:**
- "Bà rằng bà rí, ơi hỡi cho dày" (Calls out to Mrs. Rang and Mrs. Ri)
- "Lý chiều chiều" (Time reference: "evening, evening")

**Priority:** Highest (checked first)

---

### **2. CLOSING**

**When:** Last phrase of the song (index === totalPhrases - 1)

**Meaning:** Conclusion, final thought, resolution

**Examples:**
- "Mãi mãi không quên" (Never forget)
- "Về đâu xa xôi" (Where did you go, so far away?)

**Priority:** High (checked second)

---

### **3. QUESTION**

**When:** `phrase.linguisticType === 'question'`

**Meaning:** Interrogative phrase, creates suspense, sets up interaction

**Examples:**
- "Chồng gì mà chồng bé?" (What kind of husband is this tiny husband?)
- "Đi đâu mà về muộn?" (Where did you go that you returned late?)

**Vietnamese markers:** ai (who), gì (what), đâu (where), sao (why), nào (which)

**Priority:** Medium

---

### **4. ANSWER**

**When:** `phrase.linguisticType === 'answer'`

**Meaning:** Response to a question, provides information, resolves suspense

**Examples:**
- "Chồng nhà ta đây" (This is my husband)
- "Đi chợ mua thóc về" (Went to market to buy rice)

**Context:** Often follows QUESTION label (call-response pattern)

**Priority:** Medium

---

### **5. EXCLAMATION**

**When:** `phrase.linguisticType === 'exclamatory'`

**Meaning:** Emotional outburst, emphasis, vocative calls

**Examples:**
- "Ơi!" (Oh!)
- "Ới khắp chốn nối cái" (Oh, everywhere connected)
- "Hỡi bà!" (Hey Mrs.!)

**Vietnamese markers:** ơi, ới, hỡi, í, à, ạ, chao

**Priority:** Medium

---

### **6. ANCHOR**

**When:** `phrase.type?.includes('refrain')`

**Meaning:** Structural anchor point, repeated reference phrase, thematic hook

**Examples:**
- Main refrain phrases that don't fit other categories
- Phrases marked as 'refrain' in original data

**Note:** Different from REPEAT badge (which shows textual repetition count)

**Priority:** Medium

---

### **7. COMPLAINT**

**When:** `phrase.linguisticType === 'complaint'`

**Meaning:** Expression of grievance, lament, suffering

**Examples:**
- "Làm khổ cái đời tôi" (Making my life suffer)
- "Buồn quá bà ơi" (So sad, oh Mrs.!)

**Common in:** Vietnamese folk songs about hardship, labor, social issues

**Priority:** Low

---

### **8. (No Label)**

**When:** None of the above conditions match

**Meaning:** General narrative phrase, no special function

**Examples:**
- "Mang theo giỏ lúa" (Carrying a basket of rice)
- "Dưới sông nước chảy" (Below, the river flows)

**Priority:** Default (most phrases)

---

## 🔍 DETECTION LOGIC (Priority Order)

```javascript
getFunctionLabel(phrase, index, totalPhrases) {
    // Priority 1: Position-based (highest)
    if (index === 0) return { text: 'OPENING' };
    if (index === totalPhrases - 1) return { text: 'CLOSING' };

    // Priority 2: Linguistic type
    if (phrase.linguisticType === 'question') return { text: 'QUESTION' };
    if (phrase.linguisticType === 'answer') return { text: 'ANSWER' };
    if (phrase.linguisticType === 'exclamatory') return { text: 'EXCLAMATION' };

    // Priority 3: Structural type
    if (phrase.type?.includes('refrain')) return { text: 'ANCHOR' };

    // Priority 4: Specific linguistic type
    if (phrase.linguisticType === 'complaint') return { text: 'COMPLAINT' };

    // Default: No label
    return null;
}
```

**Only ONE label per phrase** - highest priority wins!

---

## 📊 TYPICAL DISTRIBUTION (Example: "Bà Rằng Bà Rí")

| Label | Count | Percentage | Meaning |
|-------|-------|------------|---------|
| OPENING | 1 | 3.6% | First phrase only |
| CLOSING | 1 | 3.6% | Last phrase only |
| QUESTION | 3 | 10.7% | Interrogative phrases |
| ANSWER | 1 | 3.6% | Response phrases |
| EXCLAMATION | 8 | 28.6% | Emotional outbursts |
| ANCHOR | 2 | 7.1% | Structural hooks |
| COMPLAINT | 5 | 17.9% | Grievance expressions |
| (none) | 7 | 25.0% | General narrative |

**Total:** 28 phrases

---

## 🎨 HOW IT APPEARS IN VISUALIZATION

### Example Phrase Box:

```
┌───────────────────────┐
│  REPEAT (2/4)         │  ← Layer 2: Parallelism badge
│                       │
│  👤 😢 characters     │  ← Layer 3: Semantic icons
│     emotion           │
│                       │
│  QUESTION             │  ← Layer 4: Function label ⭐
│                       │
│  "Chồng gì mà chồng"  │  ← Phrase text
│  Phrase 5             │
└───────────────────────┘
```

**Function label = QUESTION** tells you:
- This phrase is asking something
- Creates suspense
- Likely sets up an answer later
- Part of call-response pattern

---

## 🔄 HOW LAYERS INTERACT

### Example 1: Repeated Question

```
Phrase: "Chồng gì mà chồng bé?"
Appears: 2 times

Layer 1 (Section): Call 1 (background box)
Layer 2 (Badge): REPEAT (1/2) (gold badge)
Layer 3 (Semantics): 👤 characters (icons)
Layer 4 (Function): QUESTION (label)

Fill color: CYAN (same for both occurrences)
Border color: CYAN (question type)
```

### Example 2: Unique Complaint

```
Phrase: "Làm khổ cái đời tôi"
Appears: Once

Layer 1 (Section): Verse 1 (background box)
Layer 2 (Badge): (none - unique phrase)
Layer 3 (Semantics): 🗣️ action, 😢 emotion, 💭 abstract
Layer 4 (Function): COMPLAINT (label)

Fill color: YELLOW (unique color)
Border color: YELLOW (complaint type)
```

### Example 3: Opening Exclamation

```
Phrase: "Bà rằng bà rí, ơi hỡi cho dày"
Appears: 4 times

Layer 1 (Section): Refrain 1 (background box)
Layer 2 (Badge): REPEAT (1/4) (gold badge)
Layer 3 (Semantics): 👤 characters, 📣 vocatives
Layer 4 (Function): OPENING (label)

Fill color: PINK (same for all 4 occurrences)
Border color: RED (exclamatory type)
```

---

## 🤔 COMMON CONFUSIONS EXPLAINED

### "Why does a phrase have QUESTION label AND be in a Call section?"

**Answer:** They're **two different taxonomies**!

- **Call section (Layer 1):** Musical structure grouping - where in the song?
- **QUESTION label (Layer 4):** Narrative function - what role does it play?

**Analogy:**
- Layer 1 = "This happens in Act 2 of the play"
- Layer 4 = "This character asks a question"

Both are true, different dimensions!

---

### "What's the difference between ANCHOR and Refrain section?"

**Answer:**

- **Refrain section (Layer 1):** Musical section containing hook phrases (background box)
- **ANCHOR label (Layer 4):** Individual phrase that serves as structural anchor

**Example:**
```
Refrain 1 section contains 3 phrases:
  Phrase A: ANCHOR label ← Structural hook
  Phrase B: EXCLAMATION label ← Emotional emphasis
  Phrase C: (no label) ← General content
```

All 3 are IN "Refrain 1" section, but only Phrase A is labeled "ANCHOR"

---

### "Why do some phrases have no function label?"

**Answer:** Most phrases are **general narrative** - they don't have a special role.

**Labels are for NOTABLE functions:**
- First/last position (OPENING/CLOSING)
- Interactive elements (QUESTION/ANSWER)
- Emotional emphasis (EXCLAMATION)
- Structural importance (ANCHOR)
- Specific attitudes (COMPLAINT)

**No label = background narrative content** (like "Carrying rice down the river")

---

## 📊 LABEL PRIORITY RULES

If a phrase matches multiple conditions, **highest priority wins:**

```
Example: First phrase that's also a question

Position: index === 0 (OPENING) ← Priority 1 ✅ WINS
Type: linguisticType === 'question' (QUESTION) ← Priority 2 ❌ Loses

Result: Shows "OPENING" only (not "QUESTION")
```

**Why:** Position is more unique than type - only ONE phrase can be first!

---

## 🎯 QUICK REFERENCE

| Label | Meaning | Look For |
|-------|---------|----------|
| **OPENING** | First phrase | Grabs attention |
| **CLOSING** | Last phrase | Final thought |
| **QUESTION** | Asks something | ai, gì, đâu, sao, ? |
| **ANSWER** | Responds | Follows question |
| **EXCLAMATION** | Emotional outburst | ơi, ới, hỡi, í |
| **ANCHOR** | Structural hook | Repeated reference |
| **COMPLAINT** | Expresses grievance | khổ, buồn |
| **(none)** | General narrative | Background story |

---

## 💡 PROPOSED CLARITY IMPROVEMENT

**Current issue:** "ANCHOR" is still confusing - what does it anchor?

**Better names:**
- "ANCHOR" → "HOOK" (more intuitive)
- Or: "KEY PHRASE" (structural importance)
- Or: "THEMATIC ANCHOR" (clear purpose)

**Should I rename "ANCHOR" to something clearer?**

---

**Status**: Function labels fully documented
**Current**: 8 label types (7 shown + none)
**Purpose**: Shows narrative role independent of section/type/semantics
**Date**: 2025-10-16
