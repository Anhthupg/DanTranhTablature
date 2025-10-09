// Emergency fix for immediate testing
// Run this in browser console to enable move functionality

console.log("🚀 EMERGENCY MOVE FIX - Starting...");

// Override moveSection with working version
window.moveSection = function(panelId, direction) {
    console.log(`🔧 moveSection: ${panelId} ${direction}`);

    const panel = document.getElementById(panelId);
    if (!panel) {
        console.error('Panel not found:', panelId);
        return false;
    }

    const container = panel.parentElement;
    const allPanels = Array.from(container.querySelectorAll('.tuning-panel:not(#optimalPanel)'));

    // Ensure container is flex
    if (container.style.display !== 'flex') {
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
    }

    // Initialize orders if missing
    allPanels.forEach((p, i) => {
        if (!p.style.order) {
            p.style.order = p.dataset.order || (i + 1);
        }
    });

    // Create sorted order array
    const orders = allPanels.map(p => ({
        panel: p,
        order: parseInt(p.style.order),
        id: p.id
    })).sort((a, b) => a.order - b.order);

    const currentIndex = orders.findIndex(o => o.panel === panel);

    if (direction === 'up' && currentIndex > 0) {
        // Swap with previous
        const prevOrder = orders[currentIndex - 1].order;
        const currentOrder = orders[currentIndex].order;

        panel.style.order = prevOrder;
        orders[currentIndex - 1].panel.style.order = currentOrder;

        // Force reflow
        container.style.display = 'none';
        container.offsetHeight;
        container.style.display = 'flex';

        console.log(`✅ Moved ${panelId} UP`);
        return true;

    } else if (direction === 'down' && currentIndex < orders.length - 1) {
        // Swap with next
        const nextOrder = orders[currentIndex + 1].order;
        const currentOrder = orders[currentIndex].order;

        panel.style.order = nextOrder;
        orders[currentIndex + 1].panel.style.order = currentOrder;

        // Force reflow
        container.style.display = 'none';
        container.offsetHeight;
        container.style.display = 'flex';

        console.log(`✅ Moved ${panelId} DOWN`);
        return true;
    }

    console.log(`❌ Cannot move ${direction} - at boundary`);
    return false;
};

// Fix all arrow buttons
let fixed = 0;
document.querySelectorAll('.move-arrow').forEach(btn => {
    const onclick = btn.getAttribute('onclick');
    if (onclick && onclick.includes('moveSection')) {
        btn.onclick = function(e) {
            e.stopPropagation();
            const match = onclick.match(/moveSection\('([^']+)',\s*'([^']+)'\)/);
            if (match) {
                window.moveSection(match[1], match[2]);
            }
        };
        fixed++;
    }
});

console.log(`✅ EMERGENCY FIX COMPLETE - Fixed ${fixed} buttons`);
console.log("Test with: moveSection('lyricsPanel', 'up') or click arrow buttons");