// Minimal working fix - paste this in browser console
console.log("🔧 Starting minimal fix...");

// Simple working moveSection
window.moveSection = function(id, dir) {
    console.log(`Moving ${id} ${dir}`);

    const panel = document.getElementById(id);
    if (!panel) return false;

    const container = panel.parentElement;
    const panels = Array.from(container.querySelectorAll('.tuning-panel:not(#optimalPanel)'));

    // Set orders
    panels.forEach((p, i) => p.style.order = i + 1);

    const currentIndex = panels.indexOf(panel);

    if (dir === 'up' && currentIndex > 0) {
        // Swap with previous
        const temp = panels[currentIndex - 1].style.order;
        panels[currentIndex - 1].style.order = panel.style.order;
        panel.style.order = temp;
        console.log(`✅ Moved ${id} up`);
        return true;
    } else if (dir === 'down' && currentIndex < panels.length - 1) {
        // Swap with next
        const temp = panels[currentIndex + 1].style.order;
        panels[currentIndex + 1].style.order = panel.style.order;
        panel.style.order = temp;
        console.log(`✅ Moved ${id} down`);
        return true;
    }

    console.log(`❌ Cannot move ${dir}`);
    return false;
};

console.log("✅ Function ready. Test: moveSection('lyricsPanel', 'up')");