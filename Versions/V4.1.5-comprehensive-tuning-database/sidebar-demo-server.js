const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3007;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // Default to index page
    if (pathname === '/') {
        pathname = '/index.html';
    }

    // Serve the V4 true vertical sidebar template
    if (pathname === '/index.html') {
        const templatePath = path.join(__dirname, 'templates', 'v4-true-vertical-sidebar-template.html');

        try {
            let content = fs.readFileSync(templatePath, 'utf8');

            // Replace placeholders with sample data
            content = content.replace(/{{SONG_NAME}}/g, 'Lý Chiều Chiều');
            content = content.replace(/{{SVG_WIDTH}}/g, '800');
            content = content.replace(/{{SVG_HEIGHT}}/g, '400');

            // Sample SVG content for optimal tuning
            const optimalSvg = `
                <defs>
                    <style>
                        .string-line { stroke: #333; stroke-width: 2; }
                        .note-circle { fill: #008080; stroke: #005959; stroke-width: 2; }
                        .note-text { fill: white; font-family: Arial; font-size: 12px; text-anchor: middle; }
                        .string-label { fill: #333; font-family: Arial; font-size: 14px; text-anchor: end; }
                    </style>
                </defs>

                <!-- String lines -->
                <line class="string-line" x1="120" y1="50" x2="780" y2="50"/>
                <line class="string-line" x1="120" y1="110" x2="780" y2="110"/>
                <line class="string-line" x1="120" y1="170" x2="780" y2="170"/>
                <line class="string-line" x1="120" y1="230" x2="780" y2="230"/>
                <line class="string-line" x1="120" y1="290" x2="780" y2="290"/>
                <line class="string-line" x1="120" y1="350" x2="780" y2="350"/>

                <!-- String labels -->
                <text class="string-label" x="100" y="55">String 12</text>
                <text class="string-label" x="100" y="115">String 11</text>
                <text class="string-label" x="100" y="175">String 10</text>
                <text class="string-label" x="100" y="235">String 9</text>
                <text class="string-label" x="100" y="295">String 8</text>
                <text class="string-label" x="100" y="355">String 7</text>

                <!-- Sample notes for optimal tuning -->
                <circle class="note-circle" cx="150" cy="110" r="12"/>
                <text class="note-text" x="150" y="115">1</text>

                <circle class="note-circle" cx="200" cy="230" r="12"/>
                <text class="note-text" x="200" y="235">2</text>

                <circle class="note-circle" cx="250" cy="170" r="12"/>
                <text class="note-text" x="250" y="175">3</text>

                <circle class="note-circle" cx="300" cy="290" r="12"/>
                <text class="note-text" x="300" y="295">4</text>

                <circle class="note-circle" cx="350" cy="110" r="12"/>
                <text class="note-text" x="350" y="115">5</text>

                <circle class="note-circle" cx="400" cy="230" r="12"/>
                <text class="note-text" x="400" y="235">6</text>

                <circle class="note-circle" cx="450" cy="170" r="12"/>
                <text class="note-text" x="450" y="175">7</text>
            `;

            // Sample SVG content for alternative tuning (similar but different positions)
            const alternativeSvg = `
                <defs>
                    <style>
                        .string-line { stroke: #333; stroke-width: 2; }
                        .note-circle { fill: #E67E22; stroke: #D35400; stroke-width: 2; }
                        .note-text { fill: white; font-family: Arial; font-size: 12px; text-anchor: middle; }
                        .string-label { fill: #333; font-family: Arial; font-size: 14px; text-anchor: end; }
                    </style>
                </defs>

                <!-- String lines -->
                <line class="string-line" x1="120" y1="50" x2="780" y2="50"/>
                <line class="string-line" x1="120" y1="110" x2="780" y2="110"/>
                <line class="string-line" x1="120" y1="170" x2="780" y2="170"/>
                <line class="string-line" x1="120" y1="230" x2="780" y2="230"/>
                <line class="string-line" x1="120" y1="290" x2="780" y2="290"/>
                <line class="string-line" x1="120" y1="350" x2="780" y2="350"/>

                <!-- String labels -->
                <text class="string-label" x="100" y="55">String 12</text>
                <text class="string-label" x="100" y="115">String 11</text>
                <text class="string-label" x="100" y="175">String 10</text>
                <text class="string-label" x="100" y="235">String 9</text>
                <text class="string-label" x="100" y="295">String 8</text>
                <text class="string-label" x="100" y="355">String 7</text>

                <!-- Sample notes for alternative tuning -->
                <circle class="note-circle" cx="160" cy="50" r="12"/>
                <text class="note-text" x="160" y="55">1</text>

                <circle class="note-circle" cx="210" cy="170" r="12"/>
                <text class="note-text" x="210" y="175">2</text>

                <circle class="note-circle" cx="260" cy="290" r="12"/>
                <text class="note-text" x="260" y="295">3</text>

                <circle class="note-circle" cx="310" cy="110" r="12"/>
                <text class="note-text" x="310" y="115">4</text>

                <circle class="note-circle" cx="360" cy="350" r="12"/>
                <text class="note-text" x="360" y="355">5</text>

                <circle class="note-circle" cx="410" cy="170" r="12"/>
                <text class="note-text" x="410" y="175">6</text>

                <circle class="note-circle" cx="460" cy="230" r="12"/>
                <text class="note-text" x="460" y="235">7</text>
            `;

            content = content.replace(/{{OPTIMAL_SVG_CONTENT}}/g, optimalSvg);
            content = content.replace(/{{COMPARISON_SVG_CONTENT}}/g, alternativeSvg);

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);

        } catch (error) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Template not found');
        }
        return;
    }

    // Handle other static files if needed
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
});

server.listen(PORT, 'localhost', () => {
    console.log(`V4 True Vertical Sidebar Demo Server running at http://localhost:${PORT}/`);
    console.log('Features:');
    console.log('- True vertical sidebar layout (left panel + main content)');
    console.log('- Fixed Optimal Tuning section (always visible at sidebar top)');
    console.log('- Moveable Alternative Tuning section (orange styling)');
    console.log('- Working move controls and collapsible functionality');
    console.log('- Additional analysis sections for linguistic and pattern analysis');
});