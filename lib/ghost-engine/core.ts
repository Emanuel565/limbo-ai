import { acquirePage, releasePage } from './pool';
import { humanDelay, retryWithExponentialBackoff } from './delays';
import { getCached, setCached } from './cache';
import { GhostScrapeOptions } from './types';

const MAX_CONCURRENT = 4;
let activeTasks = 0;
const waitingQueue: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
    if (activeTasks < MAX_CONCURRENT) {
        activeTasks++;
        return;
    }

    return new Promise<void>((resolve) => {
        waitingQueue.push(() => {
            activeTasks++;
            resolve();
        });
    });
}

function releaseSlot(): void {
    activeTasks--;
    if (waitingQueue.length > 0) {
        const next = waitingQueue.shift();
        if (next) next();
    }
}

/**
 * Main GhostEngine v2 extraction entrypoint.
 * Manages caching, concurrency slot, page acquisition, Box-Muller human delay,
 * network XHR/Fetch interception and graceful page release.
 */
export async function executeGhostExtraction<T = any>(options: GhostScrapeOptions): Promise<T> {
    const {
        targetUrl,
        apiMatchPattern,
        waitUntil = 'domcontentloaded',
        timeoutMs = 25000,
        waitForSelector,
        fallbackExtractor,
    } = options;

    // 1. Verificação de Cache em Memória (< 2ms)
    const cached = getCached<T>(targetUrl);
    if (cached) {
        console.log(`[GhostEngine Cache Hit] Retornando dados em cache para: ${targetUrl}`);
        return cached;
    }

    // 2. Fila de Concorrência FIFO
    await acquireSlot();

    try {
        return await retryWithExponentialBackoff(async (attempt) => {
            const entry = await acquirePage();
            const page = entry.page;

            let interceptedPayload: any = null;
            let responseListener: any = null;

            try {
                // 3. Box-Muller Human Delay
                await humanDelay();

                // 4. Interceptação de Rede XHR/Fetch em Tempo Real (Pilar 5)
                if (apiMatchPattern) {
                    responseListener = async (response: any) => {
                        try {
                            const resUrl = response.url();
                            let matches = false;

                            if (typeof apiMatchPattern === 'function') {
                                matches = apiMatchPattern(resUrl, response);
                            } else if (apiMatchPattern instanceof RegExp) {
                                matches = apiMatchPattern.test(resUrl);
                            } else {
                                matches = resUrl.includes(apiMatchPattern);
                            }

                            if (matches && response.status() === 200) {
                                const contentType = (response.headers()['content-type'] || '').toLowerCase();
                                if (contentType.includes('json') || contentType.includes('javascript') || contentType.includes('text/plain')) {
                                    const json = await response.json().catch(() => null);
                                    if (json) {
                                        interceptedPayload = json;
                                    }
                                }
                            }
                        } catch {
                            // Erro silencioso em frames fechados
                        }
                    };

                    page.on('response', responseListener);
                }

                // 5. Navegação rápida com domcontentloaded
                await page.goto(targetUrl, {
                    waitUntil,
                    timeout: timeoutMs,
                });

                // Se houver seletor opcional para aguardar renderização parcial
                if (waitForSelector) {
                    await page.waitForSelector(waitForSelector, { timeout: 5000 }).catch(() => {});
                }

                // Pequeno respiro para garantir resolução do último pacote XHR
                if (apiMatchPattern && !interceptedPayload) {
                    await new Promise((r) => setTimeout(r, 600));
                }

                // 6. Decisão de Payload (XHR vs Fallback)
                let finalData: any = interceptedPayload;

                if (!finalData && fallbackExtractor) {
                    console.log('[GhostEngine] XHR direto não capturado, acionando fallbackExtractor...');
                    finalData = await fallbackExtractor(page);
                }

                if (!finalData) {
                    // Fallback de emergência no texto da página
                    finalData = await page.evaluate(() => {
                        return {
                            rawBody: document.body?.innerText?.slice(0, 10000) || '',
                            title: document.title,
                        };
                    });
                }

                // 7. Salva em cache
                setCached(targetUrl, finalData);

                return finalData as T;
            } finally {
                if (responseListener) {
                    page.off('response', responseListener);
                }
                releasePage(entry);
            }
        });
    } finally {
        releaseSlot();
    }
}
