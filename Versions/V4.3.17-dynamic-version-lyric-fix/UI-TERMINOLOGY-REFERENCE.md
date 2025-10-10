# V4 UI TERMINOLOGY & POSITIONING REFERENCE

**For your vertical header sections layout - complete terminology guide**

---

## 📋 **CORRECT UI TERMINOLOGY**

### **What you called "horizontal header/banner":**
✅ **Correct term**: **Section Header** or **Panel Header**
- Traditional term: "Header" (spans horizontally across section)
- Alternative terms: "Title Bar", "Panel Banner", "Section Banner"

### **What you want (vertical version):**
✅ **Correct term**: **Vertical Header** or **Sidebar Header**
- Description: Vertical panel on left side of section
- Alternative terms: "Side Panel", "Vertical Banner", "Section Sidebar"

### **The "rounded rectangles inside sections":**
✅ **Correct term**: **Metric Cards** or **Data Cards**
- Alternative terms: "Widget Cards", "Stat Cards", "Metric Tiles", "Data Widgets"
- Industry standard: "Cards" (from Material Design / Bootstrap card components)

---

## 🎯 **COMPLETE UI COMPONENT HIERARCHY**

```
V4 CONTAINER
├── TABLATURE OVERLAY CONTAINER
│   ├── Tablature Title (h1)
│   ├── Tablature Description (p)
│   └── Interactive Tablature
│       ├── Primary Tablature SVG
│       └── Highlight Overlay Container
│           └── Highlight Overlays (dynamic)
│
└── SECTIONS CONTAINER
    └── ANALYSIS SECTION (×10)
        ├── VERTICAL HEADER (left side, 80px width)
        │   ├── Section Icon (🎵, 🗣️, 🎶, etc.)
        │   ├── Section Title (text)
        │   └── Vertical Controls
        │       ├── Vertical Move Arrow (up ▲)
        │       ├── Vertical Move Arrow (down ▼)
        │       └── Vertical Collapse Toggle (▼/▶)
        │
        └── SECTION CONTENT (right side, remaining width)
            ├── Metric Grid (container)
            │   └── Metric Cards (×multiple)
            │       ├── Metric Value (large number/text)
            │       └── Metric Label (description)
            ├── Cross Reference Box (relationships)
            └── Tablature Reference (mini tablature clone)
```

---

## 📐 **POSITIONING COORDINATES (X-Y REFERENCE)**

### **COORDINATE SYSTEM**
- **X-axis**: 0 = left edge, increases rightward →
- **Y-axis**: 0 = top edge, increases downward ↓
- **Units**: Pixels (px) for absolute positioning, percentages (%) for responsive

### **MAIN LAYOUT POSITIONS**

**TABLATURE OVERLAY CONTAINER**
- Position: `x=0, y=0` (top-left of viewport)
- Dimensions: `width=100vw, height=auto` (content-based)

**SECTIONS CONTAINER**
- Position: `x=0, y=after_tablature` (below tablature)
- Dimensions: `width=100%, height=auto`
- Gap: `15px` between sections

**ANALYSIS SECTION (each)**
- Position: `x=0, y=previous_section + gap`
- Dimensions: `width=100%, height=auto`
- Layout: `display: flex` (horizontal: vertical header + content)

### **VERTICAL HEADER POSITIONS**

**VERTICAL HEADER**
- Position: `x=0, y=0` (left edge of section)
- Dimensions: `width=80px, height=100%` (full section height)
- Layout: `flex-direction: column` (vertical stacking)

**SECTION ICON**
- Position: `x=40px` (center of header), `y=20px` (top area)
- Dimensions: `font-size=24px`

**SECTION TITLE**
- Position: `x=40px` (center of header), `y=middle` (varies by content)
- Dimensions: `max-width=70px, font-size=11px`

**VERTICAL CONTROLS**
- Position: `x=40px` (center of header), `y=bottom_area`
- Layout: `flex-direction: column, gap=3px`

**VERTICAL MOVE ARROWS**
- Up Arrow: `x=40px, y=controls_top`
- Down Arrow: `x=40px, y=controls_top + arrow_height + gap`
- Dimensions: `width=20px, height=16px, font-size=10px`

**VERTICAL COLLAPSE TOGGLE**
- Position: `x=40px, y=bottom` (of controls)
- Dimensions: `font-size=14px`

### **SECTION CONTENT POSITIONS**

**SECTION CONTENT**
- Position: `x=80px` (after vertical header), `y=0`
- Dimensions: `width=calc(100% - 80px), height=auto`
- Padding: `20px` (all sides)

**METRIC GRID**
- Position: `x=0` (relative to content), `y=0` (top of content)
- Dimensions: `width=100%` (of content area)
- Layout: `grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))`
- Gap: `15px` between cards

**METRIC CARD**
- Position: `x=grid_column, y=grid_row` (grid positioning)
- Dimensions: `min-width=150px, height=auto`
- Padding: `15px`
- Border Radius: `8px`

**METRIC VALUE** (inside card)
- Position: `x=center` (of card), `y=top_area` (of card)
- Dimensions: `font-size=24px, margin-bottom=5px`

**METRIC LABEL** (inside card)
- Position: `x=center` (of card), `y=bottom_area` (of card)
- Dimensions: `font-size=12px`

**CROSS REFERENCE BOX**
- Position: `x=0` (relative to content), `y=after_metric_grid`
- Dimensions: `width=100%` (of content area), `height=auto`
- Margin: `10px 0` (top and bottom)

**TABLATURE REFERENCE**
- Position: `x=0` (relative to content), `y=bottom` (of content area)
- Dimensions: `width=100%` (of content area), `height=auto`
- Margin: `15px 0` (top and bottom)

---

## 🏷️ **QUICK REFERENCE FOR FUTURE COMMUNICATIONS**

**When you want to reference UI elements, use these terms:**

### **Layout Structure**
- **Tablature Overlay Container**: Top full-width tablature area
- **Sections Container**: Main area holding all analysis sections
- **Analysis Section**: Individual collapsible section (one per analysis type)

### **Vertical Header Components**
- **Vertical Header**: Left-side 80px panel (your "vertical banner")
- **Section Icon**: Visual identifier (🎵, 🗣️, etc.)
- **Section Title**: Text name of analysis
- **Vertical Controls**: Container for arrows and toggle
- **Vertical Move Arrows**: Up/down buttons (▲ ▼)
- **Vertical Collapse Toggle**: Expand/collapse indicator (▼/▶)

### **Content Area Components**
- **Section Content**: Main content area (right side after vertical header)
- **Metric Grid**: Container for metric cards
- **Metric Cards**: Individual stat displays (your "rounded rectangles")
- **Metric Value**: Main number/text (large, bold)
- **Metric Label**: Description text (small, below value)
- **Cross Reference Box**: Shows relationships to other sections
- **Tablature Reference**: Mini tablature clone for context

### **Interactive Elements**
- **Highlight Overlays**: Colored circles on tablature
- **Cross-Highlighting**: Visual connections between sections
- **Move Functionality**: Drag/reorder sections

---

## 📍 **POSITIONING SHORTHAND FOR FUTURE REFERENCE**

**Vertical Header Elements:**
- Icon: `VH(center, top)` = x=40px, y=20px
- Title: `VH(center, middle)` = x=40px, y=varies
- Arrows: `VH(center, bottom)` = x=40px, y=bottom area
- Toggle: `VH(center, end)` = x=40px, y=bottom

**Content Elements:**
- Grid: `SC(full, top)` = x=0, y=0 (relative to section content)
- Cards: `Grid(auto, auto)` = positioned by CSS grid
- Cross-Ref: `SC(full, after-grid)` = x=0, y=after metric grid
- Tablature: `SC(full, bottom)` = x=0, y=bottom of content

**Example Usage:**
"Move the collapse toggle to VH(center, end)" = center of vertical header, bottom position
"Add a metric card to Grid(column-2, row-1)" = second column, first row of metric grid

---

## 🚀 **LIVE DEMO**

**Your vertical header layout is live at:** http://localhost:3005/vertical

This shows your exact vision:
- ✅ **Vertical headers** (80px left panels) instead of horizontal banners
- ✅ **Move arrows** (▲ ▼) in vertical layout
- ✅ **Metric cards** (rounded rectangles) in grid layout
- ✅ **Cross-highlighting** between sections
- ✅ **Full positioning annotations** in the template

**Perfect for future reference - you can now say**:
- "Adjust the metric card padding"
- "Move the vertical collapse toggle up 5px"
- "Add a new metric card to the grid"
- "Change the vertical header width to 100px"

All terminology is industry-standard and precisely defined!