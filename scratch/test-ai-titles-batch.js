import { generateAIViralTitlesBatch } from '../tools/gameplay-ai-analyzer.js';

async function main() {
    console.log('Testing generateAIViralTitlesBatch...');
    const titles = await generateAIViralTitlesBatch({
        fileName: 'gameplay_valorant_ascent_radiante.mp4',
        durationMinutes: 128,
        cutsCount: 15,
        roundTimestamps: [100, 300, 700, 1200, 1800, 2400, 3000, 3600, 4200, 4800, 5400, 6000, 6600, 7200, 7500],
    });
    console.log(`Generated ${titles.length} titles:`);
    titles.forEach((t, i) => {
        console.log(`${i + 1}. [${t.headline}] ${t.title}`);
        console.log(`   Hook: "${t.hook}"`);
    });
}
