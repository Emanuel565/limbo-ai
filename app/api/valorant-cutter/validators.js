/**
 * Validadores de entrada para as rotas da API do Valorant Cutter
 */
export function validateAnalyzeRequest(body) {
    if (!body || typeof body !== 'object') {
        return { valid: false, error: 'Corpo da requisição inválido.' };
    }

    const sourceUrl = typeof body.sourceUrl === 'string' ? body.sourceUrl.trim() : (typeof body.source === 'string' && /^https?:\/\//i.test(body.source) ? body.source.trim() : '');
    const localFile = typeof body.localFile === 'string' ? body.localFile.trim() : (typeof body.source === 'string' && !/^https?:\/\//i.test(body.source) ? body.source.trim() : '');

    if (!sourceUrl && !localFile) {
        return { valid: false, error: 'Informe a URL da live/VOD ou o caminho do arquivo local.' };
    }

    return {
        valid: true,
        source: sourceUrl || localFile,
        isUrl: Boolean(sourceUrl),
    };
}

export function validateRenderRequest(body) {
    if (!body || typeof body !== 'object') {
        return { valid: false, error: 'Corpo da requisição inválido.' };
    }

    const sourceUrl = typeof body.sourceUrl === 'string' ? body.sourceUrl.trim() : (typeof body.source === 'string' && /^https?:\/\//i.test(body.source) ? body.source.trim() : '');
    const localFile = typeof body.localFile === 'string' ? body.localFile.trim() : (typeof body.source === 'string' && !/^https?:\/\//i.test(body.source) ? body.source.trim() : '');
    const selectedCuts = Array.isArray(body.selectedCuts) ? body.selectedCuts : [];

    if (!sourceUrl && !localFile) {
        return { valid: false, error: 'Informe a URL da live/VOD ou o caminho do arquivo local.' };
    }

    if (selectedCuts.length === 0) {
        return { valid: false, error: 'Selecione pelo menos um corte para renderizar.' };
    }

    return {
        valid: true,
        source: sourceUrl || localFile,
        isUrl: Boolean(sourceUrl),
        cuts: selectedCuts,
    };
}
