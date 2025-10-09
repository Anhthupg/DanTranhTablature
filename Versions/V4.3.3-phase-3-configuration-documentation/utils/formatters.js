/**
 * V4 Formatting Utilities
 *
 * Shared formatting functions used across controllers, generators, and templates.
 * Ensures consistent data presentation throughout the application.
 */

/**
 * Format note count with proper singular/plural
 * @param {number} count - Number of notes
 * @returns {string} Formatted string like "14 notes" or "1 note"
 */
function formatNoteCount(count) {
    return `${count} note${count !== 1 ? 's' : ''}`;
}

/**
 * Format bent note count with proper singular/plural
 * @param {number} count - Number of bent notes
 * @returns {string} Formatted string like "14 bent notes" or "1 bent note"
 */
function formatBentNotes(count) {
    return `${count} bent note${count !== 1 ? 's' : ''}`;
}

/**
 * Format grace note count with proper singular/plural
 * @param {number} count - Number of grace notes
 * @returns {string} Formatted string like "7 grace notes" or "1 grace note"
 */
function formatGraceNotes(count) {
    return `${count} grace note${count !== 1 ? 's' : ''}`;
}

/**
 * Format percentage with 1 decimal place
 * @param {number} value - Percentage value (0-100)
 * @returns {string} Formatted percentage like "78.4%"
 */
function formatPercentage(value) {
    return `${value.toFixed(1)}%`;
}

/**
 * Format large numbers with commas
 * @param {number} value - Number to format
 * @returns {string} Formatted number like "1,234"
 */
function formatNumber(value) {
    return value.toLocaleString();
}

/**
 * Format tuning from array of notes
 * @param {Array<string>} notes - Array of note names like ['C', 'D', 'E', 'G', 'A']
 * @returns {string} Formatted tuning like "C-D-E-G-A"
 */
function formatTuning(notes) {
    if (Array.isArray(notes)) {
        return notes.join('-');
    }
    return notes; // Already formatted
}

/**
 * Format time signature
 * @param {Object} timeSig - Time signature object with numerator and denominator
 * @returns {string} Formatted time signature like "2/4"
 */
function formatTimeSignature(timeSig) {
    if (typeof timeSig === 'object' && timeSig.numerator && timeSig.denominator) {
        return `${timeSig.numerator}/${timeSig.denominator}`;
    }
    return timeSig; // Already formatted
}

/**
 * Format duration in beats
 * @param {number} beats - Duration in beats
 * @returns {string} Formatted duration like "4 beats"
 */
function formatDuration(beats) {
    return `${beats} beat${beats !== 1 ? 's' : ''}`;
}

/**
 * Format song title with proper capitalization
 * @param {string} title - Song title (may have underscores)
 * @returns {string} Formatted title with spaces and title case
 */
function formatSongTitle(title) {
    return title
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Remove diacritics from Vietnamese text for normalization
 * @param {string} str - String with diacritics
 * @returns {string} Normalized string without diacritics
 */
function removeDiacritics(str) {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd');
}

/**
 * Normalize string for comparison (remove diacritics, lowercase, remove spaces/underscores)
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
function normalize(str) {
    return removeDiacritics(str)
        .toLowerCase()
        .replace(/[_\s]+/g, '');
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatNoteCount,
        formatBentNotes,
        formatGraceNotes,
        formatPercentage,
        formatNumber,
        formatTuning,
        formatTimeSignature,
        formatDuration,
        formatSongTitle,
        removeDiacritics,
        normalize
    };
}
