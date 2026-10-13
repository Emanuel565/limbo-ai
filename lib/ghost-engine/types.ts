export interface CoherentPersona {
    id: string;
    ua: string;
    viewport: { width: number; height: number };
    dpr: number;
    timezone: string;
    glVendor: string;
    glRenderer: string;
    canvasSeed: number;
    deviceMemory: number;
    hardwareConcurrency: number;
    platform: string;
    languages: string[];
}

export interface PoolPageEntry {
    id: string;
    page: any;
    persona: CoherentPersona;
    busy: boolean;
    createdAt: number;
    lastUsedAt: number;
    requestCount: number;
}

export interface GhostScrapeOptions {
    targetUrl: string;
    apiMatchPattern?: string | RegExp | ((url: string, res: any) => boolean);
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
    timeoutMs?: number;
    waitForSelector?: string;
    fallbackExtractor?: (page: any) => Promise<any>;
}

export interface GhostTrendingItem {
    id: string;
    title: string;
    url: string;
    platform: 'youtube' | 'tiktok' | 'instagram';
    creator: string;
    creatorHandle?: string;
    views: number;
    likes: number;
    comments: number;
    shares?: number;
    durationSeconds?: number;
    durationFormatted?: string;
    thumbnail?: string;
    engagementRate: number;
    viralityScore: number;
    tags?: string[];
    soundTitle?: string;
    soundAuthor?: string;
    publishedAt?: string;
    source: 'ghost-engine' | 'official-api';
}

export interface GhostEngineStatus {
    initialized: boolean;
    activePages: number;
    totalPoolSize: number;
    queueLength: number;
    cacheEntries: number;
    lastError?: string;
}
