// Comprehensive fix for moveSection function
// This script addresses all potential issues with the move functionality

console.log("=== COMPREHENSIVE MOVE SECTION FIX ===");

// Step 1: Check if the function exists
console.log("1. Checking if moveSection exists...");
if (typeof window.moveSection !== 'undefined') {
    console.log("✓ moveSection already exists");
} else {
    console.log("✗ moveSection not found - defining it now");
}

// Step 2: Override with working version
console.log("\n2. Installing comprehensive moveSection function...");

window.moveSection = function(panelId, direction) {
    console.log(`\n=== moveSection called ===`);
    console.log(`Panel ID: ${panelId}`);
    console.log(`Direction: ${direction}`);

    // Find the panel
    const panel = document.getElementById(panelId);
    if (!panel) {
        console.error(`✗ Panel not found: ${panelId}`);
        return false;
    }
    console.log(`✓ Panel found:`, panel);

    // Get parent container - should be the direct parent
    const container = panel.parentElement;
    if (!container) {
        console.error('✗ Parent container not found');
        return false;
    }
    console.log(`✓ Parent container found:`, container);

    // Check if container has flex display
    const containerStyle = window.getComputedStyle(container);
    console.log(`Container display: ${containerStyle.display}`);
    if (containerStyle.display !== 'flex') {
        console.log('Setting container to flex display');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
    }

    // Get all tuning panels (excluding optimal which always stays on top)
    const allPanels = Array.from(container.querySelectorAll('.tuning-panel:not(#optimalPanel)'));
    console.log(`✓ Found ${allPanels.length} moveable panels`);

    if (allPanels.length === 0) {
        console.error('✗ No moveable panels found');
        return false;
    }

    // Log current state
    console.log("Current panel order:");
    allPanels.forEach((p, i) => {
        console.log(`  ${i}: ${p.id} (order=${p.style.order || p.dataset.order || 'none'})`);
    });

    // Get current orders and ensure they have values
    allPanels.forEach((p, i) => {
        if (!p.style.order && !p.dataset.order) {
            // If no order set, use the DOM position
            const order = parseInt(p.dataset.order) || (i + 1); // +1 because optimalPanel is 0
            p.style.order = order;
            p.dataset.order = order;
            console.log(`  Set initial order for ${p.id}: ${order}`);
        }
    });

    // Create ordered array
    const orders = allPanels.map(p => ({
        panel: p,
        order: parseInt(p.style.order) || parseInt(p.dataset.order) || 0,
        id: p.id
    })).sort((a, b) => a.order - b.order);

    // Find current panel in the ordered list
    const currentIndex = orders.findIndex(o => o.panel === panel);
    console.log(`Current panel "${panelId}" is at position ${currentIndex} of ${orders.length - 1}`);

    if (currentIndex === -1) {
        console.error(`✗ Panel ${panelId} not found in moveable panels`);
        return false;
    }

    // Perform the move
    if (direction === 'up' && currentIndex > 0) {
        console.log(`Moving UP - swapping with ${orders[currentIndex - 1].id}`);

        // Swap order values
        const currentOrder = orders[currentIndex].order;
        const prevOrder = orders[currentIndex - 1].order;

        // Apply new orders to both style and dataset
        orders[currentIndex].panel.style.order = prevOrder;
        orders[currentIndex].panel.dataset.order = prevOrder;
        orders[currentIndex - 1].panel.style.order = currentOrder;
        orders[currentIndex - 1].panel.dataset.order = currentOrder;

        console.log(`✓ Swapped orders: ${panelId}=${prevOrder}, ${orders[currentIndex - 1].id}=${currentOrder}`);

        // Force browser reflow
        container.style.display = 'none';
        container.offsetHeight; // Trigger reflow
        container.style.display = 'flex';

        return true;

    } else if (direction === 'down' && currentIndex < orders.length - 1) {
        console.log(`Moving DOWN - swapping with ${orders[currentIndex + 1].id}`);

        // Swap order values
        const currentOrder = orders[currentIndex].order;
        const nextOrder = orders[currentIndex + 1].order;

        // Apply new orders to both style and dataset
        orders[currentIndex].panel.style.order = nextOrder;
        orders[currentIndex].panel.dataset.order = nextOrder;
        orders[currentIndex + 1].panel.style.order = currentOrder;
        orders[currentIndex + 1].panel.dataset.order = currentOrder;

        console.log(`✓ Swapped orders: ${panelId}=${nextOrder}, ${orders[currentIndex + 1].id}=${currentOrder}`);

        // Force browser reflow
        container.style.display = 'none';
        container.offsetHeight; // Trigger reflow
        container.style.display = 'flex';

        return true;

    } else {
        console.log(`✗ Cannot move ${direction}: at boundary`);
        return false;
    }
};

console.log("✓ Function installed successfully");

// Step 3: Fix all arrow button handlers
console.log("\n3. Fixing arrow button event handlers...");
let arrowCount = 0;
document.querySelectorAll('.move-arrow').forEach(btn => {
    const onclick = btn.getAttribute('onclick');
    if (onclick && onclick.includes('moveSection')) {
        // Clear any existing handlers
        btn.onclick = null;

        // Create new handler
        btn.addEventListener('click', function(event) {
            event.stopPropagation();
            event.preventDefault();

            const match = onclick.match(/moveSection\('([^']+)',\s*'([^']+)'\)/);
            if (match) {
                console.log(`Arrow clicked: ${match[1]} ${match[2]}`);
                const result = window.moveSection(match[1], match[2]);
                console.log(`Move result: ${result ? 'success' : 'failed'}`);
            }
        });
        arrowCount++;
    }
});
console.log(`✓ Fixed ${arrowCount} arrow buttons`);

// Step 4: Ensure parent containers have correct styling
console.log("\n4. Setting up container styling...");
const containers = new Set();
document.querySelectorAll('.tuning-panel').forEach(panel => {
    if (panel.parentElement) {
        containers.add(panel.parentElement);
    }
});

containers.forEach(container => {
    const currentDisplay = window.getComputedStyle(container).display;
    if (currentDisplay !== 'flex') {
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        console.log(`✓ Set flex display on container`);
    } else {
        console.log(`✓ Container already has flex display`);
    }
});

// Step 5: Initialize panel orders if needed
console.log("\n5. Initializing panel orders...");
document.querySelectorAll('.tuning-panel').forEach((panel, index) => {
    if (!panel.style.order) {
        const order = panel.dataset.order || index;
        panel.style.order = order;
        console.log(`✓ Set order ${order} for ${panel.id}`);
    }
});

// Step 6: Test the function
console.log("\n6. Running test move...");
console.log("Testing: moveSection('lyricsPanel', 'up')");
const testResult = window.moveSection('lyricsPanel', 'up');
console.log(`Test result: ${testResult ? '✓ SUCCESS' : '✗ FAILED'}`);

console.log("\n=== FIX COMPLETE ===");
console.log("You can now:");
console.log("  - Click the arrow buttons to move sections");
console.log("  - Call moveSection('lyricsPanel', 'down') in console");
console.log("  - Call moveSection('infoPanel', 'up') in console");