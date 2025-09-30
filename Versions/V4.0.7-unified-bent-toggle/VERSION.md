# V4.0.7 - Unified Bent Note Toggle System

## Major Improvement: Single Attribute Grouping

### Architecture Change
Simplified bent note toggle from managing 3 separate element types to a unified `data-bent="true"` attribute system.

### What Changed

#### 1. Server-Side Generator (`server-tablature-generator.js`)
Added `data-bent="true"` to ALL bent-related elements:
```javascript
// V4.0.7: Group all bent elements with data-bent="true"
const bentAttr = isBent ? ' data-bent="true"' : '';

// Applied to 4 element types:
svg += `<circle class="bent-note"${bentAttr}/>`           // Bent note heads
svg += `<polygon class="resonance-triangle-bent"${bentAttr}/>` // Bent triangles
svg += `<text class="bent-indicator" data-bent="true">`  // Bent dots
svg += `<line class="bent-line" data-bent="true"/>`      // Bent lines
```

#### 2. Template Toggle Function
Unified toggle using single selector:
```javascript
// Before: 3 separate selectors
const bentNotes = svg.querySelectorAll('.bent-note');
const bentTriangles = svg.querySelectorAll('.resonance-triangle-bent');
const bentElements = svg.querySelectorAll('.bent-elements');

// After: 1 unified selector
const allBentElements = svg.querySelectorAll('[data-bent="true"]');

// Handle all types in one loop
allBentElements.forEach(element => {
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'circle') { /* toggle circle colors */ }
    else if (tagName === 'polygon') { /* toggle triangle colors */ }
    else if (tagName === 'line' || tagName === 'text') { /* toggle visibility */ }
});
```

#### 3. CSS Override Fix
Changed from `setAttribute()` to `element.style` to override CSS:
```javascript
// ❌ Before: Didn't work (CSS has priority)
element.setAttribute('fill', '#333333');

// ✅ After: Works (inline style overrides CSS)
element.style.fill = '#333333';
```

### Toggle Behavior

#### Hidden (Default State):
- **Note heads**: Grey fill (#333333), black stroke
- **Triangles**: Grey fill (#666666)
- **Lines/Dots**: Hidden (`display: none`)
- **Button**: Orange background (#E67E22)

#### Shown (Active State):
- **Note heads**: Red fill (#FF0000), dark red stroke (#CC0000)
- **Triangles**: Red fill (#FF0000)
- **Lines/Dots**: Visible (`display: block`)
- **Button**: Red background (#FF0000)

### Code Simplification

#### Before (Complex):
```javascript
// Separate queries and loops
const bentElements = svg.querySelectorAll('.bent-elements');
bentElements.forEach(e => e.style.display = visible ? 'block' : 'none');

const bentNotes = svg.querySelectorAll('.bent-note');
bentNotes.forEach(circle => {
    circle.setAttribute('fill', visible ? '#FF0000' : '#333333');
});

const bentTriangles = svg.querySelectorAll('.resonance-triangle-bent');
bentTriangles.forEach(triangle => {
    triangle.setAttribute('fill', visible ? '#FF0000' : '#666666');
});
```

#### After (Unified):
```javascript
// Single query, single loop, handles all types
const allBentElements = svg.querySelectorAll('[data-bent="true"]');

allBentElements.forEach(element => {
    const tagName = element.tagName.toLowerCase();
    
    if (tagName === 'circle') {
        element.style.fill = visible ? '#FF0000' : '#333333';
        element.style.stroke = visible ? '#CC0000' : '#000000';
    } else if (tagName === 'polygon') {
        element.style.fill = visible ? '#FF0000' : '#666666';
    } else if (tagName === 'line' || tagName === 'text') {
        element.style.display = visible ? 'block' : 'none';
    }
});
```

### Benefits

1. **Cleaner Code**
   - Single selector instead of 3
   - Single loop instead of 3
   - Easier to maintain

2. **Better Grouping**
   - All bent elements identified by single attribute
   - Easy to extend to more element types
   - Clear semantic meaning

3. **Reliable Toggling**
   - Inline styles override CSS classes
   - No priority conflicts
   - Works consistently

4. **Better Debugging**
   - Console shows total element count
   - Easy to verify all elements found
   - Clear state logging

### Initialization

Both on page load and when new songs load:
```javascript
// Initialize all sections to hidden state
setTimeout(() => {
    initializeBentNotesState('optimal');
    initializeBentNotesState('alt1');
    initializeBentNotesState('alt2');
    initializeBentNotesState('alt3');
}, 100);
```

### Testing Results

**Console Output (Example):**
```
optimal initialized: 36 bent elements set to default (hidden)
alt1 initialized: 16 bent elements set to default (hidden)

[Click Show/Hide]
optimal bent: SHOWN (red) - 36 elements toggled

[Click Show/Hide again]
optimal bent: HIDDEN (grey) - 36 elements toggled
```

### Files Modified

1. **server-tablature-generator.js**
   - Added `data-bent="true"` to circles, polygons, lines, text

2. **v4-vertical-header-sections-annotated.html**
   - Unified toggle function using single selector
   - Changed to `element.style` for CSS override
   - Added button color toggling
   - Removed old `window.toggleBentNotes` wrapper

### Preserved from V4.0.6
- ✅ Library section expanded by default
- ✅ First song auto-selected
- ✅ First song auto-loaded
- ✅ Selection state management

### Preserved from V4.0.5
- ✅ Clean zoom architecture
- ✅ External zoom controller
- ✅ No stretching/cropping/scroll issues
- ✅ 60% faster zoom performance

### Elements Toggled Together

For a song like "Bengu Adai" with 9 bent notes:
- 9 circle elements (note heads)
- 9 polygon elements (resonance triangles)  
- 9 line elements (bending lines)
- 9 text elements (bending dots)
- **Total: 36 elements** toggled as one group

---

**V4.0.7 implements elegant bent note toggling with unified grouping and reliable CSS override using inline styles.**
