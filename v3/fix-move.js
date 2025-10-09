// Direct fix for moveSection
// Copy and paste this entire block into the browser console

console.log("Fixing moveSection function...");

// Override the existing function with a working version
window.moveSection = function(panelId, direction) {
    console.log(`Moving ${panelId} ${direction}`);

    const panel = document.getElementById(panelId);
    if (!panel) {
        console.error(`Panel not found: ${panelId}`);
        return;
    }

    // Get container
    const container = document.getElementById('sectionContainer');
    if (!container) {
        console.error('Container not found');
        return;
    }

    // Get all panels
    const panels = Array.from(container.querySelectorAll('.collapsible-panel'));
    console.log(`Found ${panels.length} panels`);

    // Get current orders
    const orders = panels.map(p => ({
        panel: p,
        order: parseInt(p.style.order) || 0
    })).sort((a, b) => a.order - b.order);

    // Find current panel
    const currentIndex = orders.findIndex(o => o.panel === panel);
    console.log(`Current panel at index ${currentIndex}`);

    if (direction === 'up' && currentIndex > 0) {
        // Swap with previous
        const temp = orders[currentIndex].order;
        orders[currentIndex].order = orders[currentIndex - 1].order;
        orders[currentIndex - 1].order = temp;

        // Apply new orders
        orders[currentIndex].panel.style.order = orders[currentIndex].order;
        orders[currentIndex - 1].panel.style.order = orders[currentIndex - 1].order;

        console.log(`Moved ${panelId} UP`);
        return true; // Return success
    } else if (direction === 'down' && currentIndex < orders.length - 1) {
        // Swap with next
        const temp = orders[currentIndex].order;
        orders[currentIndex].order = orders[currentIndex + 1].order;
        orders[currentIndex + 1].order = temp;

        // Apply new orders
        orders[currentIndex].panel.style.order = orders[currentIndex].order;
        orders[currentIndex + 1].panel.style.order = orders[currentIndex + 1].order;

        console.log(`Moved ${panelId} DOWN`);
        return true; // Return success
    } else {
        console.log(`Cannot move ${panelId} ${direction} - at boundary`);
        return false; // Return failure
    }
};

console.log("Function fixed! Testing...");

// Test it
const result = window.moveSection('lyricsPanel', 'up');
console.log("Test result:", result);

// Also fix the onclick handlers
document.querySelectorAll('.move-arrow').forEach(btn => {
    const onclick = btn.getAttribute('onclick');
    if (onclick && onclick.includes('moveSection')) {
        // Re-attach the event handler
        btn.onclick = function(event) {
            event.stopPropagation();
            const match = onclick.match(/moveSection\('([^']+)',\s*'([^']+)'\)/);
            if (match) {
                window.moveSection(match[1], match[2]);
            }
        };
    }
});

console.log("All move arrows fixed!");
console.log("Try clicking the arrows or calling: moveSection('lyricsPanel', 'down')");