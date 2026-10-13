import { CoherentPersona, PoolPageEntry } from './types';
import { getNextPersona, injectCoherentPersona } from './personas';

let pExtra: any = null;
async function getPuppeteer() {
    if (pExtra) return pExtra;
    const { default: puppeteer } = await import('puppeteer-extra');
    const { default: StealthPlugin } = await import('puppeteer-extra-plugin-stealth');
    puppeteer.use(StealthPlugin());
    pExtra = puppeteer;
    return pExtra;
}

let browserInstance: any = null;
let isInitializing = false;
const pagePool: PoolPageEntry[] = [];

const MAX_PAGES = 4;
const POOL_ACQUIRE_TIMEOUT_MS = 30000;
const BLOCKED_RESOURCES = new Set([
    'image',
    'stylesheet',
    'font',
    'media',
    'manifest',
    'texttrack',
    'eventsource',
]);

export function isBrowserActive(b: any): boolean {
    if (!b) return false;
    if (typeof b.isConnected === 'function') return b.isConnected();
    if (typeof b.connected === 'boolean') return b.connected;
    return Boolean(b.process?.() || b.process);
}

export async function ensureBrowser(): Promise<any> {
    if (browserInstance && isBrowserActive(browserInstance)) {
        return browserInstance;
    }

    if (isInitializing) {
        // Aguarda inicialização em andamento
        for (let i = 0; i < 50; i++) {
            await new Promise((r) => setTimeout(r, 100));
            if (browserInstance && isBrowserActive(browserInstance)) {
                return browserInstance;
            }
        }
    }

    isInitializing = true;
    try {
        console.log('[GhostEngine] 👻 Inicializando Singleton Chromium com Stealth & Anti-Detecção...');
        const puppeteer = await getPuppeteer();
        browserInstance = await (puppeteer as any).launch({
            headless: 'new',
            ignoreDefaultArgs: ['--enable-automation'],
            args: [
                '--disable-blink-features=AutomationControlled',
                '--window-position=-32000,-32000',
                '--disable-dev-shm-usage',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-infobars',
                '--lang=pt-BR,pt,en-US,en',
            ],
        });

        browserInstance.on('disconnected', () => {
            console.warn('[GhostEngine] ⚠️ Processo do Chromium desconectado. Limpando pool e singleton.');
            browserInstance = null;
            pagePool.length = 0;
        });

        console.log('[GhostEngine] ✅ Singleton Chromium pronto e aquecido.');
        return browserInstance;
    } catch (error) {
        console.error('[GhostEngine] ❌ Falha ao iniciar browser singleton:', error);
        browserInstance = null;
        throw error;
    } finally {
        isInitializing = false;
    }
}

async function createPoolPage(browser: any, persona: CoherentPersona): Promise<PoolPageEntry> {
    const page = await browser.newPage();

    // 1. Injetar identidade coerente
    await injectCoherentPersona(page, persona);

    // 2. Firewall de Recursos (Pilar 2)
    await page.setRequestInterception(true);
    page.on('request', (req: any) => {
        const resourceType = req.resourceType();
        if (BLOCKED_RESOURCES.has(resourceType)) {
            req.abort().catch(() => {});
        } else {
            req.continue().catch(() => {});
        }
    });

    const entry: PoolPageEntry = {
        id: `tab-${Math.random().toString(36).substring(2, 8)}`,
        page,
        persona,
        busy: true,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
        requestCount: 0,
    };

    pagePool.push(entry);
    return entry;
}

export async function acquirePage(): Promise<PoolPageEntry> {
    const browser = await ensureBrowser();

    // 1. Verifica se há aba livre no pool
    for (const entry of pagePool) {
        if (!entry.busy && !entry.page.isClosed()) {
            entry.busy = true;
            entry.lastUsedAt = Date.now();
            entry.requestCount++;
            return entry;
        }
    }

    // 2. Se não há livre e ainda há espaço no pool, cria uma nova
    if (pagePool.length < MAX_PAGES) {
        const persona = getNextPersona();
        const newEntry = await createPoolPage(browser, persona);
        newEntry.requestCount++;
        return newEntry;
    }

    // 3. Pool cheio: Polling a cada 50ms até liberar
    const startTime = Date.now();
    while (Date.now() - startTime < POOL_ACQUIRE_TIMEOUT_MS) {
        await new Promise((r) => setTimeout(r, 50));
        for (const entry of pagePool) {
            if (!entry.busy && !entry.page.isClosed()) {
                entry.busy = true;
                entry.lastUsedAt = Date.now();
                entry.requestCount++;
                return entry;
            }
        }
    }

    throw new Error(`[GhostEngine] Timeout (${POOL_ACQUIRE_TIMEOUT_MS}ms) aguardando aba livre no pool.`);
}

export function releasePage(entry: PoolPageEntry): void {
    if (entry) {
        entry.busy = false;
        entry.lastUsedAt = Date.now();
    }
}

export function getPoolStats() {
    return {
        totalTabs: pagePool.length,
        busyTabs: pagePool.filter((e) => e.busy).length,
        idleTabs: pagePool.filter((e) => !e.busy).length,
        hasBrowser: isBrowserActive(browserInstance),
    };
}

export async function shutdownGhostEngine(): Promise<void> {
    if (browserInstance) {
        console.log('[GhostEngine] Fechando abas e encerrando processo do Chromium...');
        try {
            await browserInstance.close();
        } catch {
            // Ignora se já estiver fechado
        }
        browserInstance = null;
        pagePool.length = 0;
    }
}
