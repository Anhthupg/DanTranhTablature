
// Simple string analysis function
function showStringUsage() {
    const container = document.getElementById("string-usage-table");
    if (!container) return;
    
    const notes = document.querySelectorAll(".note-circle");
    const yCount = {};
    
    notes.forEach(note => {
        const y = note.getAttribute("cy");
        const isGrace = note.getAttribute("data-is-grace") === "true";
        if (!yCount[y]) yCount[y] = {main: 0, grace: 0};
        if (isGrace) yCount[y].grace++; else yCount[y].main++;
    });
    
    let html = "<h5>String Usage (by Y-coordinate):</h5>";
    Object.entries(yCount).sort().forEach(([y, counts]) => {
        html += `<p>Y=${y}: ${counts.main} main, ${counts.grace} grace</p>`;
    });
    
    container.innerHTML = html;
}
