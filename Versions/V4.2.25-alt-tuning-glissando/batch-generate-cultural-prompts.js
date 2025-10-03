/**
 * Batch Generate Cultural Context Prompts for LLM Processing
 *
 * This script:
 * 1. Scans all existing lyrics segmentation files
 * 2. Generates LLM prompts for cultural context
 * 3. Outputs prompts ready to copy to Claude/GPT
 * 4. Saves prompts to individual files for easy processing
 */

const fs = require('fs');
const path = require('path');

class CulturalPromptGenerator {
    constructor() {
        this.lyricsDir = path.join(__dirname, 'data', 'lyrics-segmentations');
        this.promptsDir = path.join(__dirname, 'data', 'cultural-prompts');
        this.outputDir = path.join(__dirname, 'data', 'cultural-context-outputs');

        // Ensure directories exist
        [this.promptsDir, this.outputDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * Generate prompts for all songs
     */
    async generateAllPrompts() {
        const files = fs.readdirSync(this.lyricsDir).filter(f => f.endsWith('.json'));

        console.log(`\n╔════════════════════════════════════════════════════════════╗`);
        console.log(`║  Cultural Context Prompt Generator                       ║`);
        console.log(`╚════════════════════════════════════════════════════════════╝\n`);
        console.log(`Found ${files.length} lyrics files\n`);

        let processedCount = 0;
        let skippedCount = 0;

        for (const file of files) {
            const songName = file.replace('.json', '');
            const lyricsPath = path.join(this.lyricsDir, file);

            try {
                const lyricsData = JSON.parse(fs.readFileSync(lyricsPath, 'utf8'));

                // Check if already has cultural context
                const hasCulturalContext = lyricsData.phrases.some(p => p.culturalContext);

                if (hasCulturalContext) {
                    console.log(`⏭️  SKIP: ${songName} (already has cultural context)`);
                    skippedCount++;
                    continue;
                }

                // Generate prompt
                const prompt = this.generatePromptForSong(lyricsData, songName);

                // Save prompt to file
                const promptFile = path.join(this.promptsDir, `${songName}-prompt.txt`);
                fs.writeFileSync(promptFile, prompt, 'utf8');

                processedCount++;
                console.log(`✅ [${processedCount}/${files.length}] Generated prompt: ${songName}`);

            } catch (error) {
                console.error(`❌ Error processing ${songName}:`, error.message);
            }
        }

        // Generate master prompt file combining all songs
        this.generateMasterPrompt(files);

        console.log(`\n╔════════════════════════════════════════════════════════════╗`);
        console.log(`║  Generation Complete!                                     ║`);
        console.log(`║  Generated: ${processedCount} prompts                    `);
        console.log(`║  Skipped: ${skippedCount} (already have context)         `);
        console.log(`╚════════════════════════════════════════════════════════════╝\n`);

        console.log(`📂 Individual prompts: ${this.promptsDir}`);
        console.log(`📄 Master prompt: ${this.promptsDir}/MASTER-PROMPT.txt`);
        console.log(`\n📋 Next Steps:`);
        console.log(`   1. Copy prompts from ${this.promptsDir}`);
        console.log(`   2. Send to Claude/GPT for processing`);
        console.log(`   3. Save responses in ${this.outputDir}`);
        console.log(`   4. Run merge script to update lyrics files\n`);
    }

    /**
     * Generate LLM prompt for a single song
     */
    generatePromptForSong(lyricsData, songName) {
        const songTitle = lyricsData.songTitle || songName;
        const theme = lyricsData.patterns?.theme || 'traditional Vietnamese folk song';

        let prompt = `# Cultural Context Generation: ${songTitle}\n\n`;
        prompt += `## Song Information\n`;
        prompt += `- **Title:** ${songTitle}\n`;
        prompt += `- **Theme:** ${theme}\n`;
        prompt += `- **Total Phrases:** ${lyricsData.phrases.length}\n`;
        prompt += `- **Pattern:** ${lyricsData.statistics?.dominantPattern || 'N/A'}\n\n`;

        prompt += `## Task\n`;
        prompt += `For each phrase below, provide culturally-informed context including:\n`;
        prompt += `1. **description** - 2-3 sentences about cultural/historical significance\n`;
        prompt += `2. **facts** - 3-4 specific Vietnamese cultural facts related to this phrase\n`;
        prompt += `3. **musicalContext** - How this phrase functions in traditional performance\n\n`;

        prompt += `## Phrases\n\n`;

        lyricsData.phrases.forEach(phrase => {
            prompt += `### Phrase ${phrase.id}\n`;
            prompt += `**Vietnamese:** ${phrase.text}\n`;
            prompt += `**English:** ${phrase.english || '[NEEDS TRANSLATION]'}\n`;
            prompt += `**Type:** ${phrase.linguisticType}\n`;
            prompt += `**Syllables:** ${phrase.syllableCount}\n\n`;
        });

        prompt += `\n## Output Format\n\n`;
        prompt += `Please provide a JSON array with the following structure:\n\n`;
        prompt += `\`\`\`json\n`;
        prompt += `[\n`;
        prompt += `  {\n`;
        prompt += `    "phraseId": 1,\n`;
        prompt += `    "culturalContext": {\n`;
        prompt += `      "description": "This refrain uses 'Bà' (Mrs.) as a respectful address typical in Northern Vietnamese culture. 'Rằng' and 'Rí' are likely place names or personal names, common in quan họ love exchange songs where singers playfully address each other.",\n`;
        prompt += `      "facts": [\n`;
        prompt += `        "Quan họ songs originated in Bắc Ninh province as courtship songs between villages",\n`;
        prompt += `        "Using 'Bà' for young women is traditional respectful address in Vietnamese",\n`;
        prompt += `        "Repetition of names creates rhythmic foundation typical of folk music",\n`;
        prompt += `        "These refrains often serve as musical anchors between narrative verses"\n`;
        prompt += `      ],\n`;
        prompt += `      "musicalContext": "The exclamatory opening establishes the call-and-response pattern and sets the emotional tone. The 4-syllable structure creates natural phrasing that aligns with the pentatonic melody."\n`;
        prompt += `    }\n`;
        prompt += `  },\n`;
        prompt += `  {\n`;
        prompt += `    "phraseId": 2,\n`;
        prompt += `    "culturalContext": { ... }\n`;
        prompt += `  }\n`;
        prompt += `  // ... for all ${lyricsData.phrases.length} phrases\n`;
        prompt += `]\n`;
        prompt += `\`\`\`\n\n`;

        prompt += `## Guidelines\n`;
        prompt += `- Focus on Vietnamese cultural specifics, not generic statements\n`;
        prompt += `- Include historical context where relevant\n`;
        prompt += `- Mention regional variations if applicable\n`;
        prompt += `- Explain traditional music performance practices\n`;
        prompt += `- Connect lyrics to Vietnamese daily life, customs, traditions\n`;
        prompt += `- For place names, provide geographical/historical background\n`;
        prompt += `- For social roles (chồng/wife, etc.), explain cultural context\n`;
        prompt += `- For nature references, explain symbolic meanings in Vietnamese culture\n\n`;

        return prompt;
    }

    /**
     * Generate master prompt file combining all songs
     */
    generateMasterPrompt(files) {
        let masterPrompt = `# Master Cultural Context Generation Prompt\n\n`;
        masterPrompt += `## Overview\n`;
        masterPrompt += `This master prompt contains cultural context requests for ${files.length} Vietnamese traditional songs.\n`;
        masterPrompt += `Process each song separately and save responses in the outputs directory.\n\n`;

        masterPrompt += `## Song List\n\n`;
        files.forEach((file, idx) => {
            const songName = file.replace('.json', '');
            masterPrompt += `${idx + 1}. ${songName}\n`;
        });

        masterPrompt += `\n## Individual Prompt Files\n`;
        masterPrompt += `Each song has a dedicated prompt file in: data/cultural-prompts/\n\n`;

        masterPrompt += `## Processing Instructions\n`;
        masterPrompt += `1. Open individual prompt file (e.g., "Bà rằng bà rí-prompt.txt")\n`;
        masterPrompt += `2. Copy entire prompt to Claude/GPT\n`;
        masterPrompt += `3. Save JSON response to: data/cultural-context-outputs/[song-name]-context.json\n`;
        masterPrompt += `4. Run merge script to integrate into lyrics files\n\n`;

        masterPrompt += `## Batch Processing Option\n`;
        masterPrompt += `For faster processing, you can combine multiple songs (5-10) into one LLM request:\n`;
        masterPrompt += `- Songs 1-10: [list]\n`;
        masterPrompt += `- Songs 11-20: [list]\n`;
        masterPrompt += `- etc.\n\n`;

        const masterFile = path.join(this.promptsDir, 'MASTER-PROMPT.txt');
        fs.writeFileSync(masterFile, masterPrompt, 'utf8');

        console.log(`\n✅ Generated master prompt file`);
    }

    /**
     * Generate merge script to integrate LLM responses back into lyrics files
     */
    generateMergeScript() {
        const mergeScript = `/**
 * Merge Cultural Context from LLM Responses into Lyrics Files
 */

const fs = require('fs');
const path = require('path');

class CulturalContextMerger {
    constructor() {
        this.lyricsDir = path.join(__dirname, 'data', 'lyrics-segmentations');
        this.contextDir = path.join(__dirname, 'data', 'cultural-context-outputs');
    }

    mergeAll() {
        const contextFiles = fs.readdirSync(this.contextDir).filter(f => f.endsWith('-context.json'));

        console.log(\`Merging \${contextFiles.length} cultural context files...\`);

        contextFiles.forEach(file => {
            const songName = file.replace('-context.json', '');
            const contextPath = path.join(this.contextDir, file);
            const lyricsPath = path.join(this.lyricsDir, songName + '.json');

            if (!fs.existsSync(lyricsPath)) {
                console.log(\`⚠️  Lyrics file not found: \${songName}\`);
                return;
            }

            // Load both files
            const contextData = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
            const lyricsData = JSON.parse(fs.readFileSync(lyricsPath, 'utf8'));

            // Merge cultural context into each phrase
            contextData.forEach(item => {
                const phrase = lyricsData.phrases.find(p => p.id === item.phraseId);
                if (phrase) {
                    phrase.culturalContext = item.culturalContext;
                }
            });

            // Save updated lyrics file
            fs.writeFileSync(lyricsPath, JSON.stringify(lyricsData, null, 2), 'utf8');
            console.log(\`✅ Merged: \${songName}\`);
        });

        console.log(\`\\nMerge complete!\`);
    }
}

const merger = new CulturalContextMerger();
merger.mergeAll();
`;

        const mergeScriptPath = path.join(__dirname, 'merge-cultural-context.js');
        fs.writeFileSync(mergeScriptPath, mergeScript, 'utf8');
        console.log(`✅ Generated merge script: merge-cultural-context.js`);
    }
}

// Run if called directly
if (require.main === module) {
    const generator = new CulturalPromptGenerator();
    generator.generateAllPrompts();
    generator.generateMergeScript();
}

module.exports = CulturalPromptGenerator;
