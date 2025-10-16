/**
 * Category Filter UI Controller V2 - With Exercise Support
 *
 * Provides UI controls for filtering and aggregating songs and exercises by category
 */
class CategoryFilterController {
    constructor() {
        this.categories = {
            // Song categories
            'vietnamese-skeletal': { name: 'Vietnamese Skeletal', color: '#27AE60', badge: 'VN-S', type: 'song' },
            'vietnamese-dantranh': { name: 'Vietnamese Dan Tranh', color: '#3498DB', badge: 'VN-DT', type: 'song' },
            'nonvietnamese-skeletal': { name: 'Non-Vietnamese Skeletal', color: '#E67E22', badge: 'NV-S', type: 'song' },
            'nonvietnamese-dantranh': { name: 'Non-Vietnamese Dan Tranh', color: '#9B59B6', badge: 'NV-DT', type: 'song' },
            // Exercise categories
            'exercises-skeletal': { name: 'Exercises/Patterns Skeletal', color: '#E74C3C', badge: 'EX-S', type: 'exercise' },
            'exercises-dantranh': { name: 'Exercises/Patterns Dan Tranh', color: '#F39C12', badge: 'EX-DT', type: 'exercise' }
        };

        this.selectedCategories = new Set();
        this.library = null;
        this.onFilterChange = null;
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
     * Render filter checkboxes organized by type
     */
    renderFilterUI() {
        const container = document.getElementById('categoryFilters');
        if (!container) return;

        const songCategories = Object.keys(this.categories).filter(k => this.categories[k].type === 'song');
        const exerciseCategories = Object.keys(this.categories).filter(k => this.categories[k].type === 'exercise');

        let html = `
            <div class="category-filter-section">
                <h4>Filter by Category</h4>

                <!-- Song Categories -->
                <h5 class="category-group-title">Songs</h5>
                <div class="filter-options">
                    ${songCategories.map(catKey => this.renderCategoryCheckbox(catKey)).join('')}
                </div>

                <!-- Exercise Categories -->
                <h5 class="category-group-title">Exercises/Patterns</h5>
                <div class="filter-options">
                    ${exerciseCategories.map(catKey => this.renderCategoryCheckbox(catKey)).join('')}
                </div>

                <div class="filter-presets">
                    <h5>Quick Filters:</h5>
                    <button onclick="window.categoryFilter.selectPreset('all')">All</button>
                    <button onclick="window.categoryFilter.selectPreset('songs')">Songs Only</button>
                    <button onclick="window.categoryFilter.selectPreset('exercises')">Exercises Only</button>
                    <button onclick="window.categoryFilter.selectPreset('vietnamese')">Vietnamese</button>
                    <button onclick="window.categoryFilter.selectPreset('nonvietnamese')">Non-Vietnamese</button>
                    <button onclick="window.categoryFilter.selectPreset('skeletal')">Skeletal</button>
                    <button onclick="window.categoryFilter.selectPreset('dantranh')">Dan Tranh</button>
                    <button onclick="window.categoryFilter.selectPreset('paired')">Paired Only</button>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Render a single category checkbox
     */
    renderCategoryCheckbox(catKey) {
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
                        <div class="metric-label">Songs</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${aggregated.totalExercises}</div>
                        <div class="metric-label">Exercises</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${aggregated.totalNotes.toLocaleString()}</div>
                        <div class="metric-label">Total Notes</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${aggregated.avgNotesPerItem}</div>
                        <div class="metric-label">Avg Notes/Item</div>
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
                                    ${metrics.count} items, ${metrics.totalNotes} notes (avg ${metrics.avgNotesPerSong}/item)
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
     * Render relationships summary
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

        const songPairs = relevantRelationships.filter(r => r.type === 'song');
        const exercisePairs = relevantRelationships.filter(r => r.type === 'exercise');

        return `
            <div class="relationships-summary">
                <h5>Skeletal vs Dan Tranh Pairs:</h5>
                <div class="pairs-count">
                    ${songPairs.length} song pairs, ${exercisePairs.length} exercise pairs
                </div>

                ${songPairs.length > 0 ? `
                    <div class="pairs-section">
                        <h6>Song Pairs:</h6>
                        <div class="pairs-list">
                            ${songPairs.slice(0, 3).map(rel => this.renderPairItem(rel)).join('')}
                            ${songPairs.length > 3 ? `
                                <div class="more-pairs">... and ${songPairs.length - 3} more song pairs</div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}

                ${exercisePairs.length > 0 ? `
                    <div class="pairs-section">
                        <h6>Exercise Pairs:</h6>
                        <div class="pairs-list">
                            ${exercisePairs.slice(0, 3).map(rel => this.renderPairItem(rel)).join('')}
                            ${exercisePairs.length > 3 ? `
                                <div class="more-pairs">... and ${exercisePairs.length - 3} more exercise pairs</div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render a single pair item
     */
    renderPairItem(rel) {
        return `
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
            case 'songs':
                Object.keys(this.categories).forEach(cat => {
                    if (this.categories[cat].type === 'song') {
                        this.selectedCategories.add(cat);
                    }
                });
                break;
            case 'exercises':
                Object.keys(this.categories).forEach(cat => {
                    if (this.categories[cat].type === 'exercise') {
                        this.selectedCategories.add(cat);
                    }
                });
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
                this.selectedCategories.add('exercises-skeletal');
                break;
            case 'dantranh':
                this.selectedCategories.add('vietnamese-dantranh');
                this.selectedCategories.add('nonvietnamese-dantranh');
                this.selectedCategories.add('exercises-dantranh');
                break;
            case 'paired':
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
            totalExercises: 0,
            totalNotes: 0,
            totalGraceNotes: 0,
            totalBentNotes: 0,
            avgNotesPerItem: 0,
            items: []
        };

        this.selectedCategories.forEach(cat => {
            if (this.library.byCategory[cat]) {
                aggregated.items.push(...this.library.byCategory[cat]);

                const metrics = this.library.metrics.byCategory[cat];
                if (this.categories[cat].type === 'song') {
                    aggregated.totalSongs += metrics.count;
                } else {
                    aggregated.totalExercises += metrics.count;
                }
                aggregated.totalNotes += metrics.totalNotes;
                aggregated.totalGraceNotes += metrics.totalGraceNotes;
                aggregated.totalBentNotes += metrics.totalBentNotes;
            }
        });

        const totalItems = aggregated.totalSongs + aggregated.totalExercises;
        if (totalItems > 0) {
            aggregated.avgNotesPerItem = Math.round(aggregated.totalNotes / totalItems);
        }

        return aggregated;
    }

    /**
     * Get filtered item list
     */
    getFilteredItems() {
        const aggregated = this.aggregateSelectedCategories();
        return aggregated.items;
    }

    /**
     * Notify listeners that filter changed
     */
    notifyFilterChange() {
        if (this.onFilterChange) {
            const filteredItems = this.getFilteredItems();
            this.onFilterChange(filteredItems);
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
