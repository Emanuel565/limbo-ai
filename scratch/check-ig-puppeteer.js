import puppeteer from 'puppeteer-core';
import { findChromePath } from '../lib/ghost-engine/core.js';

async function checkIgFollowers(handle) {
    const chromePath = await findChromePath();
    console.log('Using chrome at:', chromePath);
    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
        console.log('Navigating to IG...');
        await page.goto(`https://www.instagram.com/${handle}/`, { waitUntil: 'networkidle2', timeout: 15000 });
        
        const info = await page.evaluate(() => {
            const meta = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
            const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
            const title = document.title;
            // Also check header text
            const headerSpans = Array.from(document.querySelectorAll('header section ul li, header ul li')).map(el => el.textContent);
            return { meta, ogDesc, title, headerSpans };
        });
        console.log('PAGE EVALUATE:', info);
    } catch (e) {
        console.error('PUPPETEER ERROR:', e.message);
    } finally {
        await browser.close();
    }
}

checkIgFollowers('limboinpink');
