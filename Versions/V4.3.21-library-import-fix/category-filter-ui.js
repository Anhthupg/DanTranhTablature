/**
 * Category Filter UI Controller
 *
 * Provides UI controls for filtering and aggregating songs by category
 */
class CategoryFilterController {
    constructor() {
        this.categories = {
            'vietnamese-skeletal': { name: 'Vietnamese Skeletal', color: '#27AE60', badge: 'VN-S' },
            'vietnamese-dantranh': { name: 'Vietnamese Dan Tranh', color: '#3498DB', badge: 'VN-DT' },
            'nonvietnamese-skeletal': { name: 'Non-Vietnamese Skeletal', color: '#E67E22', badge: 'NV-S' },
            'nonvietnamese-dantranh': { name: 'Non-Vietnamese Dan Tranh', color: '#9B59B6', badge: 'NV-DT' }
        };

        this.selectedCategories = new Set();
        this.library = null;
        this.onFilterChange = null; // Callback when filter changes
    }

    /**
     * Initialize with library data
     */
    async initialize(libraryData) {
        this.library = libraryData;

        // Select all categories by default
        Object.keys(this.categories).forEach(cat => {
            this.selectedCategories.add(cat);
        });

        this.renderFilterUI();
        this.renderMetricsSummary();
    }

    /**
     * Render filter checkboxes
     */
    renderFilterUI() {
        const container = document.getElementById('categoryFilters');
        if (!container) return;

        let html = `
            <div class="category-filter-section">
                <h4>Filter by Category</h4>
                <div class="filter-options">
                    ${Object.keys(this.categories).map(catKey => {
                        const cat = this.categories[catKey];
                        const checked = this.selectedCategories.has(catKey) ? 'checked' : '';
                        const count = this.library?.byCategory[catKey]?.length || 0;

                        return `
                            <label class="category-filter-item">
                                <input type="checkbox"
                                       value="${catKey}"
                                       ${checked}
                                       onchange="window.categoryFilter.toggleCategory('${catKey}')">
                                <span class="category-badge" style="background: ${cat.color};">
                                    ${cat.badge}
                                </span>
                                <span class="category-label">${cat.name}</span>
                                <span class="category-count">(${count})</span>
                            </label>
                        `;
                    }).join('')}
                </div>

                <div class="filter-presets">
                    <h5>Quick Filters:</h5>
                    <button onclick="window.categoryFilter.selectPreset('all')">All Songs</button>
                    <button onclick="window.categoryFilter.selectPreset('vietnamese')">Vietnamese Only</button>
                    <button onclick="window.categoryFilter.selectPreset('nonvietnamese')">Non-Vietnamese Only</button>
                    <button onclick="window.categoryFilter.selectPreset('skeletal')">Skeletal Only</button>
                    <button onclick="window.categoryFilter.selectPreset('dantranh')">Dan Tranh Only</button>
                    <button onclick="window.categoryFilter.selectPreset('paired')">Paired Songs Only</button>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Render aggregated metrics summary
     */
    renderMetricsSummary() {
        const container = document.getElementById('metricsSummary');
        if (!container || !this.library) return;

        const aggregated = this.aggregateSelectedCategories();

        let html = `
            <div class="metrics-summary-section">
                <h4>Selected Categories Summary</h4>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">${aggregated.totalSongs}</div>
                        <div class="metric-label">Total Songs</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${aggregated.totalNotes.toLocaleString()}</div>
                        <div class="metric-label">Total Notes</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${aggregated.avgNotesPerSong}</div>
                        <div class="metric-label">Avg Notes/Song</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${aggregated.totalGraceNotes}</div>
                        <div class="metric-label">Grace Notes</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${aggregated.totalBentNotes}</div>
                        <div class="metric-label">Bent Notes</div>
                    </div>
                </div>

                <div class="category-breakdown">
                    <h5>Breakdown by Selected Categories:</h5>
                    ${Array.from(this.selectedCategories).map(catKey => {
                        const cat = this.categories[catKey];
                        const metrics = this.library.metrics.byCategory[catKey];

                        return `
                            <div class="category-breakdown-item">
                                <span class="category-badge" style="background: ${cat.color};">
                                    ${cat.badge}
                                </span>
                                <span class="breakdown-label">${cat.name}:</span>
                                <span class="breakdown-value">
                                    ${metrics.count} songs, ${metrics.totalNotes} notes (avg ${metrics.avgNotesPerSong}/song)
                                </span>
                            </div>
                        `;
                    }).join('')}
                </div>

                ${this.renderRelationshipsSummary(aggregated)}
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Render relationships summary (skeletal vs interpretation pairs)
     */
    renderRelationshipsSummary(aggregated) {
        const relevantRelationships = this.library.relationships.filter(rel => {
            const skeletalCat = rel.skeletal.category;
            const interpretedCat = rel.interpreted.category;
            return this.selectedCategories.has(skeletalCat) &&
                   this.selectedCategories.has(interpretedCat);
        });

        if (relevantRelationships.length === 0) {
            return '';
        }

        return `
            <div class="relationships-summary">
                <h5>Skeletal vs Dan Tranh Pairs:</h5>
                <div class="pairs-count">${relevantRelationships.length} complete pairs found</div>
                <div class="pairs-list">
                    ${relevantRelationships.slice(0, 5).map(rel => `
                        <div class="pair-item">
                            <strong>${rel.baseName}</strong>
                            <div class="pair-comparison">
                                <span class="skeletal-info">
                                    Skeletal: ${rel.skeletal.metrics.totalNotes} notes
                                </span>
                                <span class="arrow">→</span>
                                <span class="interpreted-info">
                                    Dan Tranh: ${rel.interpreted.metrics.totalNotes} notes
                                    (+${rel.interpreted.metrics.totalNotes - rel.skeletal.metrics.totalNotes})
                                </span>
                            </div>
                        </div>
                    `).join('')}
                    ${relevantRelationships.length > 5 ? `
                        <div class="more-pairs">... and ${relevantRelationships.length - 5} more pairs</div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Toggle category selection
     */
    toggleCategory(categoryKey) {
        if (this.selectedCategories.has(categoryKey)) {
            this.selectedCategories.delete(categoryKey);
        } else {
            this.selectedCategories.add(categoryKey);
        }

        this.renderMetricsSummary();
        this.notifyFilterChange();
    }

    /**
     * Select preset filter combination
     */
    selectPreset(presetName) {
        this.selectedCategories.clear();

        switch (presetName) {
            case 'all':
                Object.keys(this.categories).forEach(cat => this.selectedCategories.add(cat));
                break;
            case 'vietnamese':
                this.selectedCategories.add('vietnamese-skeletal');
                this.selectedCategories.add('vietnamese-dantranh');
                break;
            case 'nonvietnamese':
                this.selectedCategories.add('nonvietnamese-skeletal');
                this.selectedCategories.add('nonvietnamese-dantranh');
                break;
            case 'skeletal':
                this.selectedCategories.add('vietnamese-skeletal');
                this.selectedCategories.add('nonvietnamese-skeletal');
                break;
            case 'dantranh':
                this.selectedCategories.add('vietnamese-dantranh');
                this.selectedCategories.add('nonvietnamese-dantranh');
                break;
            case 'paired':
                // Only include categories that have pairs
                const pairedCategories = new Set();
                this.library.relationships.forEach(rel => {
                    pairedCategories.add(rel.skeletal.category);
                    pairedCategories.add(rel.interpreted.category);
                });
                pairedCategories.forEach(cat => this.selectedCategories.add(cat));
                break;
        }

        this.renderFilterUI();
        this.renderMetricsSummary();
        this.notifyFilterChange();
    }

    /**
     * Aggregate metrics for selected categories
     */
    aggregateSelectedCategories() {
        const aggregated = {
            totalSongs: 0,
            totalNotes: 0,
            totalGraceNotes: 0,
            totalBentNotes: 0,
            avgNotesPerSong: 0,
            songs: []
        };

        this.selectedCategories.forEach(cat => {
            if (this.library.byCategory[cat]) {
                aggregated.songs.push(...this.library.byCategory[cat]);
                aggregated.totalSongs += this.library.metrics.byCategory[cat].count;
                aggregated.totalNotes += this.library.metrics.byCategory[cat].totalNotes;
                aggregated.totalGraceNotes += this.library.metrics.byCategory[cat].totalGraceNotes;
                aggregated.totalBentNotes += this.library.metrics.byCategory[cat].totalBentNotes;
            }
        });

        if (aggregated.totalSongs > 0) {
            aggregated.avgNotesPerSong = Math.round(aggregated.totalNotes / aggregated.totalSongs);
        }

        return aggregated;
    }

    /**
     * Get filtered song list
     */
    getFilteredSongs() {
        const aggregated = this.aggregateSelectedCategories();
        return aggregated.songs;
    }

    /**
     * Notify listeners that filter changed
     */
    notifyFilterChange() {
        if (this.onFilterChange) {
            const filteredSongs = this.getFilteredSongs();
            this.onFilterChange(filteredSongs);
        }
    }

    /**
     * Register callback for filter changes
     */
    setFilterChangeCallback(callback) {
        this.onFilterChange = callback;
    }
}

// Initialize global instance
window.categoryFilter = new CategoryFilterController();
