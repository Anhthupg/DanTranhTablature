/**
 * Connect Existing Library to New Song Pages
 * Add this script to your existing library page to link thumbnails to new v3 song pages
 */

// Simply include this script tag in your existing library page:
// <script src="connect_to_new_pages.js"></script>

(function connectLibraryToNewPages() {
    console.log('🔗 Connecting library thumbnails to new V3 song pages...');

    // Wait for page to be ready
    function init() {
        // Find all song links in your existing library
        const songLinks = document.querySelectorAll('a[href*="song"], .song-link, [data-song-id]');

        songLinks.forEach(link => {
            const originalHref = link.href || '#';
            const songTitle = link.textContent || link.title || link.dataset.songId || '';

            // Check if this is Xỉa Cá Mè
            if (songTitle.toLowerCase().includes('xỉa cá mè') ||
                songTitle.toLowerCase().includes('xia ca me')) {

                // Update link to point to new V3 page
                link.href = 'xia_ca_me_v3.html';
                link.target = '_blank'; // Open in new tab

                // Add visual indicator
                addNewVersionBadge(link);

                console.log('✅ Updated Xỉa Cá Mè link to V3 page');
            }

            // Add more song mappings here as needed
            // Example for other songs:
            // if (songTitle.toLowerCase().includes('bà rằng bà rí')) {
            //     link.href = 'ba_rang_ba_ri_v3.html';
            //     link.target = '_blank';
            //     addNewVersionBadge(link);
            // }
        });
    }

    // Add "V3" badge to indicate new version
    function addNewVersionBadge(element) {
        // Make sure element is positioned relative
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.position === 'static') {
            element.style.position = 'relative';
        }

        // Create V3 badge
        const badge = document.createElement('div');
        badge.innerHTML = 'V3';
        badge.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: linear-gradient(135deg, #00c851, #00ff7f);
            color: white;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            z-index: 10;
            box-shadow: 0 2px 8px rgba(0,200,81,0.3);
            pointer-events: none;
        `;

        element.appendChild(badge);
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('🎵 Library connector ready - Xỉa Cá Mè will open V3 page with 4 strings!');
})();