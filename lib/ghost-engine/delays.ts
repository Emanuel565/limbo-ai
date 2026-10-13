/**
 * Generates a standard normal random variable using the Box-Muller transform.
 */
function randomNormal(mean = 0, stdDev = 1): number {
    let u1 = 0;
    let u2 = 0;
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
}

/**
 * Calculates human-like log-normal delay in ms with peak around 250ms (ranging 80ms to 900ms)
 */
export function getHumanDelayMs(): number {
    // ln(250) ~ 5.52. Using mu = 5.52, sigma = 0.45 produces distribution peaked at 250ms
    const val = Math.exp(randomNormal(5.52, 0.45));
    return Math.floor(Math.max(80, Math.min(950, val)));
}

/**
 * Pauses execution for a human-like duration.
 */
export async function humanDelay(): Promise<number> {
    const delay = getHumanDelayMs();
    await new Promise((resolve) => setTimeout(resolve, delay));
    return delay;
}

/**
 * Executes an async operation with exponential backoff retries (1s, 2s, 4s).
 */
export async function retryWithExponentialBackoff<T>(
    operation: (attempt: number) => Promise<T>,
    maxRetries = 3,
    baseDelayMs = 1000
): Promise<T> {
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation(attempt);
        } catch (error) {
            lastError = error;
            if (attempt === maxRetries) {
                break;
            }
            const delay = baseDelayMs * Math.pow(2, attempt - 1);
            console.warn(`[GhostEngine Retry] Tentativa ${attempt} falhou. Aguardando ${delay}ms... Erro:`, error);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw lastError || new Error('Operação falhou após múltiplas tentativas.');
}
