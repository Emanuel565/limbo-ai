import { CoherentPersona } from './types';

export const COHERENT_PERSONAS: CoherentPersona[] = [
    {
        id: 'win10-nvidia-gtx1660',
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        dpr: 1,
        timezone: 'America/Sao_Paulo',
        glVendor: 'Google Inc. (NVIDIA)',
        glRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        canvasSeed: 0x4a3f,
        deviceMemory: 8,
        hardwareConcurrency: 8,
        platform: 'Win32',
        languages: ['pt-BR', 'pt', 'en-US', 'en'],
    },
    {
        id: 'win11-nvidia-rtx3060',
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        dpr: 1,
        timezone: 'America/Sao_Paulo',
        glVendor: 'Google Inc. (NVIDIA)',
        glRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        canvasSeed: 0x7b1c,
        deviceMemory: 16,
        hardwareConcurrency: 12,
        platform: 'Win32',
        languages: ['pt-BR', 'pt', 'en-US', 'en'],
    },
    {
        id: 'win11-intel-iris',
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        viewport: { width: 1536, height: 864 },
        dpr: 1.25,
        timezone: 'America/Sao_Paulo',
        glVendor: 'Google Inc. (Intel)',
        glRenderer: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
        canvasSeed: 0x9e2d,
        deviceMemory: 8,
        hardwareConcurrency: 8,
        platform: 'Win32',
        languages: ['pt-BR', 'pt', 'en-US', 'en'],
    },
    {
        id: 'win10-amd-radeon',
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        dpr: 1,
        timezone: 'America/Sao_Paulo',
        glVendor: 'Google Inc. (AMD)',
        glRenderer: 'ANGLE (AMD, AMD Radeon RX 6600 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        canvasSeed: 0x3f5a,
        deviceMemory: 16,
        hardwareConcurrency: 12,
        platform: 'Win32',
        languages: ['pt-BR', 'pt', 'en-US', 'en'],
    },
];

let personaIndex = 0;
export function getNextPersona(): CoherentPersona {
    const persona = COHERENT_PERSONAS[personaIndex % COHERENT_PERSONAS.length];
    personaIndex++;
    return persona;
}

export async function injectCoherentPersona(page: any, persona: CoherentPersona): Promise<void> {
    await page.setUserAgent(persona.ua);
    await page.setViewport({
        width: persona.viewport.width,
        height: persona.viewport.height,
        deviceScaleFactor: persona.dpr,
    });

    if (page.emulateTimezone) {
        try {
            await page.emulateTimezone(persona.timezone);
        } catch {
            // Emulate fallback via script
        }
    }

    await page.evaluateOnNewDocument((p: CoherentPersona) => {
        // 1. Hardware & Navigator Override
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        Object.defineProperty(navigator, 'deviceMemory', { get: () => p.deviceMemory });
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => p.hardwareConcurrency });
        Object.defineProperty(navigator, 'platform', { get: () => p.platform });
        Object.defineProperty(navigator, 'languages', { get: () => p.languages });

        // 2. Native Chrome Object Emulation
        if (!(window as any).chrome) {
            (window as any).chrome = {
                runtime: {},
                loadTimes: () => ({}),
                csi: () => ({}),
                app: {},
            };
        }

        // 3. WebGL Spoofing (Vendor & Renderer)
        const getParameterBackup = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function (parameter: number) {
            // UNMASKED_VENDOR_WEBGL = 37445
            if (parameter === 37445) return p.glVendor;
            // UNMASKED_RENDERER_WEBGL = 37446
            if (parameter === 37446) return p.glRenderer;
            return getParameterBackup.apply(this, [parameter]);
        };

        if (typeof WebGL2RenderingContext !== 'undefined') {
            const getParam2 = WebGL2RenderingContext.prototype.getParameter;
            WebGL2RenderingContext.prototype.getParameter = function (parameter: number) {
                if (parameter === 37445) return p.glVendor;
                if (parameter === 37446) return p.glRenderer;
                return getParam2.apply(this, [parameter]);
            };
        }

        // 4. Deterministic Canvas Fingerprint Noise via LCG
        const origGetImageData = CanvasRenderingContext2D.prototype.getImageData;
        CanvasRenderingContext2D.prototype.getImageData = function (
            sx: number,
            sy: number,
            sw: number,
            sh: number
        ) {
            const imageData = origGetImageData.apply(this, [sx, sy, sw, sh]);
            let seed = p.canvasSeed;
            const lcg = () => {
                seed = (seed * 1664525 + 1013904223) % 4294967296;
                return seed / 4294967296;
            };

            const data = imageData.data;
            const step = Math.max(1, Math.floor(data.length / 200)); // ~0.1% a 0.5%
            for (let i = 0; i < data.length; i += step * 4) {
                const shift = lcg() > 0.5 ? 1 : -1;
                data[i] = Math.max(0, Math.min(255, data[i] + shift));
            }
            return imageData;
        };

        // 5. Coherent Timezone Emulation
        try {
            const origDateTimeFormat = Intl.DateTimeFormat;
            const personaTz = p.timezone;
            (Intl as any).DateTimeFormat = function (locales?: any, options?: any) {
                const opts = Object.assign({}, options, { timeZone: options?.timeZone || personaTz });
                return new origDateTimeFormat(locales || 'pt-BR', opts);
            };
            (Intl as any).DateTimeFormat.prototype = origDateTimeFormat.prototype;
            (Intl as any).DateTimeFormat.supportedLocalesOf = origDateTimeFormat.supportedLocalesOf;
        } catch {
            // Ignore if sealed
        }
    }, persona);
}
