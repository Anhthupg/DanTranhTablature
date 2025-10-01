/**
 * V4 Library Controller - Song Library Management
 *
 * Handles all library operations:
 * - Loading song data from server
 * - Filtering and sorting
 * - Rendering song cards
 * - Selection state management
 * - Loading song tablatures
 */

class LibraryController {
    constructor() {
        this.libraryData = [];
        this.currentSelectedSong = null;
    }

    /**
     * Initialize library - load data and render
     */
    async initialize() {
        console.log('Initializing Library Controller...');
        await this.refresh();
    }

    /**
     * Refresh library from server
     */
    async refresh() {
        console.log('Refreshing library...');

        try {
            const response = await fetch('/api/library');
            const data = await response.json();

            this.libraryData = data;
            this.update();
            console.log(`Loaded ${data.length} songs from library`);

            // V4.2.14: DON'T auto-select - page is already loaded with a song via query param
            // (Auto-selection would cause infinite refresh loop)
        } catch (error) {
            console.error('Error loading library:', error);
            // Use demo data if API fails
            this.loadDemoData();
        }
    }

    /**
     * Update library display based on current filters and sorting
     */
    update() {
        const sortBy = document.getElementById('librarySortBy')?.value || 'title';
        const filterRegion = document.getElementById('libraryFilterRegion')?.value || 'all';
        const filterGenre = document.getElementById('libraryFilterGenre')?.value || 'all';

        console.log(`Updating library: sort=${sortBy}, region=${filterRegion}, genre=${filterGenre}`);

        // Apply filters
        let filteredData = this.libraryData.filter(song => {
            const regionMatch = filterRegion === 'all' || song.region === filterRegion;
            const genreMatch = filterGenre === 'all' || song.genre === filterGenre;
            return regionMatch && genreMatch;
        });

        // Apply sorting
        filteredData.sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];

            if (typeof aVal === 'number') {
                return sortBy.includes('bent') ? bVal - aVal : aVal - bVal;
            }
            return aVal.localeCompare(bVal);
        });

        this.render(filteredData);

        const countElement = document.getElementById('libraryCount');
        if (countElement) {
            countElement.textContent = `${filteredData.length} songs`;
        }
    }

    /**
     * Render library grid with song cards
     */
    render(songs) {
        const grid = document.getElementById('libraryGrid');
        if (!grid) return;

        if (songs.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">No songs found. Add MusicXML files to: v4/data/musicxml/</div>';
            return;
        }

        grid.innerHTML = songs.map((song, index) => {
            const isSelected = index === 0 && !this.currentSelectedSong || song.filename === this.currentSelectedSong;
            const selectedClass = isSelected ? ' selected' : '';

            return `
            <div class="song-card${selectedClass}"
                 data-filename="${song.filename}"
                 onclick="window.libraryController.selectSong('${song.filename}')">

                <h5 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 16px; font-weight: 600;">${song.title}</h5>

                <div class="song-meta" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; margin-bottom: 10px;">
                    <span style="color: #007bff;"><strong>Region:</strong> ${song.region}</span>
                    <span style="color: #28a745;"><strong>Genre:</strong> ${song.genre}</span>
                    <span style="color: #6f42c1;"><strong>Tuning:</strong> ${song.optimalTuning}</span>
                    <span style="color: #dc3545;"><strong>Notes:</strong> ${song.totalNotes}</span>
                </div>

                <div class="song-stats" style="display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                    <span><strong>${song.bentNotes}</strong> bent notes</span>
                    <span><strong>${song.bentStrings}</strong> bent strings</span>
                    <span><strong>${song.uniquePitches}</strong> unique pitches</span>
                </div>

            </div>
            `;
        }).join('');

        // V4.2.5: Auto-select "Bà rằng bà rí" as default song
        const defaultSong = songs.find(s =>
            s.filename.toLowerCase().includes('bà rằng bà rí') ||
            s.filename.toLowerCase().includes('ba_rang_ba_ri') ||
            s.filename.toLowerCase().includes('ba rang ba ri')
        );
        if (!this.currentSelectedSong && defaultSong) {
            this.currentSelectedSong = defaultSong.filename;
        } else if (!this.currentSelectedSong && songs.length > 0) {
            this.currentSelectedSong = songs[0].filename;
        }
    }

    /**
     * Select a song and load its tablature
     */
    async selectSong(filename) {
        console.log(`Loading tablature for: ${filename}`);

        // V4.2.14: Reload entire page to regenerate server-side sections
        // (annotated phrases and structure overview are server-generated)
        window.location.href = `/?song=${encodeURIComponent(filename)}`;
        return;

        // OLD CLIENT-SIDE UPDATE CODE (kept for reference, not executed)
        // Update selection state
        this.currentSelectedSong = filename;
        this.currentSong = filename;  // Also set currentSong for phrase bars controller

        // Update UI: Remove 'selected' from all cards
        document.querySelectorAll('.song-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Add 'selected' to clicked card
        const selectedCard = document.querySelector(`.song-card[data-filename="${filename}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }

        try {
            // Fetch tablature data from server
            const response = await fetch(`/api/tablature/${filename}`);
            if (!response.ok) {
                throw new Error(`Failed to load song: ${response.statusText}`);
            }

            const data = await response.json();

            // Update song title in header
            const titleElement = document.getElementById('songTitle');
            if (titleElement) {
                titleElement.textContent = data.songName;
            }

            // Extract SVG content and attributes
            const extractSvgContent = (svgString) => {
                const match = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
                return match ? match[1] : svgString;
            };

            const extractSvgAttributes = (svgString) => {
                const widthMatch = svgString.match(/width="([^"]*)"/);
                const heightMatch = svgString.match(/height="([^"]*)"/);
                return {
                    width: widthMatch ? widthMatch[1] : null,
                    height: heightMatch ? heightMatch[1] : null
                };
            };

            // Update optimal tuning section
            const optimalSvg = document.getElementById('optimalSvg');
            if (optimalSvg) {
                // Extract content and dimensions
                const content = extractSvgContent(data.optimalSVG);
                const attrs = extractSvgAttributes(data.optimalSVG);

                // Set content
                optimalSvg.innerHTML = content;

                // V4.1.4: Set dimensions (critical - without these, SVG defaults to 100px width)
                if (attrs.width) optimalSvg.setAttribute('width', attrs.width);
                if (attrs.height) optimalSvg.setAttribute('height', attrs.height);
            }

            // Update optimal tuning display
            const optimalTuningDisplay = document.getElementById('optimalTuning');
            if (optimalTuningDisplay) {
                optimalTuningDisplay.textContent = `${data.optimalTuning} (Optimal)`;
            }

            // Update comparison section
            const comparisonSvg = document.getElementById('alt1Svg');
            if (comparisonSvg) {
                const compContent = extractSvgContent(data.comparisonSVG);
                const compAttrs = extractSvgAttributes(data.comparisonSVG);

                comparisonSvg.innerHTML = compContent;

                // Set dimensions
                if (compAttrs.width) comparisonSvg.setAttribute('width', compAttrs.width);
                if (compAttrs.height) comparisonSvg.setAttribute('height', compAttrs.height);
            }

            // Update alternative tuning display (if exists)
            const altTuningDisplay = document.querySelector('#alternativeTuning1 .tuning-display');
            if (altTuningDisplay) {
                altTuningDisplay.textContent = `${data.alternativeTuning} (Alternative)`;
            }

            // V4.0.10: Update bent note counts dynamically
            const optimalBentCount = optimalSvg ? optimalSvg.querySelectorAll('[data-bent="true"]').length / 4 : 0;  // Divide by 4 (circle, polygon, line, text per bent note)
            const alt1BentCount = comparisonSvg ? comparisonSvg.querySelectorAll('[data-bent="true"]').length / 4 : 0;

            const optimalCountEl = document.getElementById('optimalBentCount');
            if (optimalCountEl) {
                optimalCountEl.textContent = `${optimalBentCount} bent note${optimalBentCount !== 1 ? 's' : ''}`;
            }

            const alt1CountEl = document.getElementById('alt1BentCount');
            if (alt1CountEl) {
                alt1CountEl.textContent = `${alt1BentCount} bent note${alt1BentCount !== 1 ? 's' : ''}`;
            }

            // Scroll to top to show updated tablature
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // V4.0.7: Initialize bent notes to hidden state for newly loaded song
            setTimeout(() => {
                if (window.initializeBentNotesState) {
                    window.initializeBentNotesState('optimal');
                    window.initializeBentNotesState('alt1');
                }

                // V4.0.12: Refresh audio controller with new song notes
                if (window.audioController) {
                    // V4.0.13: Stop any playing audio first (old song notes don't exist anymore)
                    window.audioController.stop();

                    const optimalSvg = document.getElementById('optimalSvg');
                    const alt1Svg = document.getElementById('alt1Svg');
                    window.audioController.setSVGReferences(optimalSvg, alt1Svg);
                    console.log('Audio controller refreshed with new song notes');
                }

                // V4.2.5: Refresh zoom controller with new SVG elements
                if (window.zoomController) {
                    window.zoomController.refresh();
                    console.log('Zoom controller refreshed with new SVG dimensions');
                }

                // V4.2.5: Re-render phrase bars after SVG loads with note IDs
                if (window.phraseBarsController && window.phraseBarsController.refresh) {
                    window.phraseBarsController.refresh();
                    console.log('Phrase bars refreshed with new song data');
                }

                // V4.2.5: Refresh lyrics controller for new song
                if (window.lyricsController && window.lyricsController.refresh) {
                    window.lyricsController.refresh();
                    console.log('Lyrics controller refreshed with new song data');
                }
            }, 100);

            console.log(`Loaded: ${data.songName}`);
        } catch (error) {
            console.error('Error loading tablature:', error);
            alert(`Error loading song: ${error.message}`);
        }
    }

    /**
     * Load demo library data (fallback)
     */
    loadDemoData() {
        this.libraryData = [
            {
                title: "Lý Chiều Chiều",
                filename: "ly_chieu_chieu.xml",
                region: "Northern",
                genre: "Lý",
                optimalTuning: "C-D-E-G-A",
                totalNotes: 57,
                uniquePitches: 5,
                bentStrings: 2,
                bentNotes: 8
            },
            {
                title: "Hò Giã Gạo",
                filename: "ho_gia_gao.xml",
                region: "Southern",
                genre: "Hò",
                optimalTuning: "C-D-F-G-A",
                totalNotes: 43,
                uniquePitches: 6,
                bentStrings: 3,
                bentNotes: 12
            },
            {
                title: "Ru Con Quảng Nam",
                filename: "ru_con_quang_nam.xml",
                region: "Central",
                genre: "Ru Con",
                optimalTuning: "C-D-E-G-Bb",
                totalNotes: 32,
                uniquePitches: 4,
                bentStrings: 1,
                bentNotes: 3
            }
        ];

        this.update();

        // Auto-load first song's tablature
        if (this.libraryData.length > 0) {
            this.selectSong(this.libraryData[0].filename);
        }
    }
}

// Export for use in templates
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LibraryController;
}