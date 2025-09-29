// FINAL WORKING FIX - This is the exact working code
// Copy-paste this into browser console for immediate results

console.log("🚀 FINAL WORKING FIX - Installing...");

// Step 1: Install the exact working moveSection function
window.moveSection = function(panelId, direction) {
    console.log(`\n=== moveSection called ===`);
    console.log(`Panel ID: ${panelId}`);
    console.log(`Direction: ${direction}`);

    const panel = document.getElementById(panelId);
    if (!panel) {
        console.error(`✗ Panel not found: ${panelId}`);
        return false;
    }
    console.log(`✓ Panel found:`, panel);

    const container = panel.parentElement;
    if (!container) {
        console.error('✗ Parent container not found');
        return false;
    }
    console.log(`✓ Parent container found:`, container);

    const containerStyle = window.getComputedStyle(container);
    console.log(`Container display: ${containerStyle.display}`);
    if (containerStyle.display !== 'flex') {
        console.log('Setting container to flex display');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
    }

    const allPanels = Array.from(container.querySelectorAll('.tuning-panel:not(#optimalPanel)'));
    console.log(`✓ Found ${allPanels.length} moveable panels`);

    if (allPanels.length === 0) {
        console.error('✗ No moveable panels found');
        return false;
    }

    console.log("Current panel order:");
    allPanels.forEach((p, i) => {
        console.log(`  ${i}: ${p.id} (order=${p.style.order || p.dataset.order || 'none'})`);
    });

    allPanels.forEach((p, i) => {
        if (!p.style.order && !p.dataset.order) {
            const order = parseInt(p.dataset.order) || (i + 1);
            p.style.order = order;
            p.dataset.order = order;
            console.log(`  Set initial order for ${p.id}: ${order}`);
        }
    });

    const orders = allPanels.map(p => ({
        panel: p,
        order: parseInt(p.style.order) || parseInt(p.dataset.order) || 0,
        id: p.id
    })).sort((a, b) => a.order - b.order);

    const currentIndex = orders.findIndex(o => o.panel === panel);
    console.log(`Current panel "${panelId}" is at position ${currentIndex} of ${orders.length - 1}`);

    if (currentIndex === -1) {
        console.error(`✗ Panel ${panelId} not found in moveable panels`);
        return false;
    }

    if (direction === 'up' && currentIndex > 0) {
        console.log(`Moving UP - swapping with ${orders[currentIndex - 1].id}`);

        const currentOrder = orders[currentIndex].order;
        const prevOrder = orders[currentIndex - 1].order;

        orders[currentIndex].panel.style.order = prevOrder;
        orders[currentIndex].panel.dataset.order = prevOrder;
        orders[currentIndex - 1].panel.style.order = currentOrder;
        orders[currentIndex - 1].panel.dataset.order = currentOrder;

        console.log(`✓ Swapped orders: ${panelId}=${prevOrder}, ${orders[currentIndex - 1].id}=${currentOrder}`);

        container.style.display = 'none';
        container.offsetHeight;
        container.style.display = 'flex';

        return true;

    } else if (direction === 'down' && currentIndex < orders.length - 1) {
        console.log(`Moving DOWN - swapping with ${orders[currentIndex + 1].id}`);

        const currentOrder = orders[currentIndex].order;
        const nextOrder = orders[currentIndex + 1].order;

        orders[currentIndex].panel.style.order = nextOrder;
        orders[currentIndex].panel.dataset.order = nextOrder;
        orders[currentIndex + 1].panel.style.order = currentOrder;
        orders[currentIndex + 1].panel.dataset.order = currentOrder;

        console.log(`✓ Swapped orders: ${panelId}=${nextOrder}, ${orders[currentIndex + 1].id}=${currentOrder}`);

        container.style.display = 'none';
        container.offsetHeight;
        container.style.display = 'flex';

        return true;

    } else {
        console.log(`✗ Cannot move ${direction}: at boundary`);
        return false;
    }
};

// Step 2: Fix all arrow button handlers
console.log("🔧 Fixing arrow button handlers...");
let arrowCount = 0;
document.querySelectorAll('.move-arrow').forEach(btn => {
    const onclick = btn.getAttribute('onclick');
    if (onclick && onclick.includes('moveSection')) {
        btn.onclick = null;
        btn.addEventListener('click', function(event) {
            event.stopPropagation();
            event.preventDefault();
            const match = onclick.match(/moveSection\('([^']+)',\s*'([^']+)'\)/);
            if (match) {
                console.log(`Arrow clicked: ${match[1]} ${match[2]}`);
                window.moveSection(match[1], match[2]);
            }
        });
        arrowCount++;
    }
});

console.log(`✅ FINAL FIX COMPLETE - Fixed ${arrowCount} arrow buttons`);
console.log("🎉 ALL READY! Click arrows or test: moveSection('lyricsPanel', 'up')");