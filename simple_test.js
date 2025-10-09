setTimeout(() => {
    const container = document.getElementById("string-usage-table");
    if (container) {
        const notes = document.querySelectorAll(".note-circle");
        let mainCount = 0, graceCount = 0;
        notes.forEach(note => {
            if (note.getAttribute("data-is-grace") === "true") graceCount++;
            else mainCount++;
        });
        container.innerHTML = `<p>Found ${mainCount} main notes, ${graceCount} grace notes</p>`;
    }
}, 2000);
