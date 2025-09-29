// Debug script for moveSection function
// Paste this entire block into the browser console

console.log("=== DEBUGGING moveSection ===");

// Check if function exists
console.log("1. window.moveSection exists?", typeof window.moveSection);
console.log("2. moveSection exists?", typeof moveSection);

// Try to redefine it if needed
if (typeof window.moveSection === 'undefined') {
    console.log("3. Function not found, defining it now...");

    window.moveSection = function(panelId, direction) {
        console.log(`DEBUG: moveSection called with ${panelId} ${direction}`);

        const panel = document.getElementById(panelId);
        if (!panel) {
            console.error(`Panel not found: ${panelId}`);
            return;
        }

        const container = panel.parentElement;
        const panels = Array.from(container.querySelectorAll('.collapsible-panel'));

        // Get current orders
        const orders = panels.map(p => ({
            panel: p,
            order: parseInt(p.style.order) || 0
        })).sort((a, b) => a.order - b.order);

        const currentIndex = orders.findIndex(o => o.panel === panel);

        if (direction === 'up' && currentIndex > 0) {
            // Swap with previous
            const temp = orders[currentIndex].order;
            orders[currentIndex].order = orders[currentIndex - 1].order;
            orders[currentIndex - 1].order = temp;

            // Apply new orders
            orders[currentIndex].panel.style.order = orders[currentIndex].order;
            orders[currentIndex - 1].panel.style.order = orders[currentIndex - 1].order;

            console.log(`Moved ${panelId} up successfully`);
        } else if (direction === 'down' && currentIndex < orders.length - 1) {
            // Swap with next
            const temp = orders[currentIndex].order;
            orders[currentIndex].order = orders[currentIndex + 1].order;
            orders[currentIndex + 1].order = temp;

            // Apply new orders
            orders[currentIndex].panel.style.order = orders[currentIndex].order;
            orders[currentIndex + 1].panel.style.order = orders[currentIndex + 1].order;

            console.log(`Moved ${panelId} down successfully`);
        } else {
            console.log(`Cannot move ${panelId} ${direction} - at boundary`);
        }
    };

    console.log("4. Function defined successfully");
}

// Test it
console.log("5. Testing moveSection...");
try {
    moveSection('lyricsPanel', 'up');
    console.log("6. Test completed - check if sections moved visually");
} catch (e) {
    console.error("7. Error during test:", e);
}

console.log("=== DEBUG COMPLETE ===");