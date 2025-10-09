// Final fix for moveSection - works with actual HTML structure
// Copy and paste this entire block into the browser console

console.log("Installing working moveSection function...");

// Override with correct selectors
window.moveSection = function(panelId, direction) {
    console.log(`Moving ${panelId} ${direction}`);

    const panel = document.getElementById(panelId);
    if (!panel) {
        console.error(`Panel not found: ${panelId}`);
        return;
    }

    // Get the parent container (should contain all panels)
    const container = panel.parentElement;
    if (!container) {
        console.error('Parent container not found');
        return;
    }

    // Get all tuning panels (the actual class used)
    const panels = Array.from(container.querySelectorAll('.tuning-panel'));
    console.log(`Found ${panels.length} panels total`);

    // Get current orders from data-order attribute or style.order
    const orders = panels.map(p => ({
        panel: p,
        order: parseInt(p.dataset.order) || parseInt(p.style.order) || 0,
        id: p.id
    })).sort((a, b) => a.order - b.order);

    // Log current state
    console.log("Current panel order:");
    orders.forEach((o, i) => console.log(`  ${i}: ${o.id} (order=${o.order})`));

    // Find current panel
    const currentIndex = orders.findIndex(o => o.panel === panel);
    console.log(`Current panel "${panelId}" is at index ${currentIndex}`);

    if (direction === 'up' && currentIndex > 0) {
        // Swap with previous panel
        const currentOrder = orders[currentIndex].order;
        const prevOrder = orders[currentIndex - 1].order;

        // Apply new orders
        orders[currentIndex].panel.style.order = prevOrder;
        orders[currentIndex].panel.dataset.order = prevOrder;
        orders[currentIndex - 1].panel.style.order = currentOrder;
        orders[currentIndex - 1].panel.dataset.order = currentOrder;

        console.log(`✓ Moved ${panelId} UP (swapped with ${orders[currentIndex - 1].id})`);
        return true;
    } else if (direction === 'down' && currentIndex < orders.length - 1 && currentIndex >= 0) {
        // Swap with next panel
        const currentOrder = orders[currentIndex].order;
        const nextOrder = orders[currentIndex + 1].order;

        // Apply new orders
        orders[currentIndex].panel.style.order = nextOrder;
        orders[currentIndex].panel.dataset.order = nextOrder;
        orders[currentIndex + 1].panel.style.order = currentOrder;
        orders[currentIndex + 1].panel.dataset.order = currentOrder;

        console.log(`✓ Moved ${panelId} DOWN (swapped with ${orders[currentIndex + 1].id})`);
        return true;
    } else {
        console.log(`✗ Cannot move ${panelId} ${direction} - at boundary or not found`);
        return false;
    }
};

// Fix all arrow button handlers
document.querySelectorAll('.move-arrow').forEach(btn => {
    const onclick = btn.getAttribute('onclick');
    if (onclick && onclick.includes('moveSection')) {
        btn.onclick = function(event) {
            event.stopPropagation();
            const match = onclick.match(/moveSection\('([^']+)',\s*'([^']+)'\)/);
            if (match) {
                window.moveSection(match[1], match[2]);
            }
        };
        console.log(`✓ Fixed arrow button for: ${onclick}`);
    }
});

// Also ensure the parent container has flex display
const containers = document.querySelectorAll('.tuning-panel').length > 0 ?
    [...new Set(Array.from(document.querySelectorAll('.tuning-panel')).map(p => p.parentElement))] : [];

containers.forEach(container => {
    if (container && !container.style.display) {
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        console.log(`✓ Set flex display on container`);
    }
});

console.log("\n=== Installation complete! ===");
console.log("Test by clicking arrow buttons or typing:");
console.log("  moveSection('lyricsPanel', 'up')");
console.log("  moveSection('lyricsPanel', 'down')");

// Auto-test
setTimeout(() => {
    console.log("\n=== Running test... ===");
    const result = window.moveSection('lyricsPanel', 'up');
    if (result) {
        console.log("✓ Test successful - sections should have moved!");
    } else {
        console.log("✗ Test failed - check console for details");
    }
}, 100);