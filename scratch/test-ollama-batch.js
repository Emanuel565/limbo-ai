async function testBatch() {
    const start = Date.now();
    const prompt = `Gere 5 títulos virais curtos de Valorant em português para cortes do TikTok.
Retorne um JSON com array "cuts":
[
  {"title": "MIRA DO ASPAS NA BREEZE 🎯", "headline": "COMO ELE ACERTOU ISSO?", "hook": "A mira desse cara não é normal", "tags": ["#valorant", "#aspa", "#mira"]}
]`;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 40000);

        const res = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3.1:8b',
                messages: [{ role: 'user', content: prompt }],
                stream: false,
                format: 'json',
                options: {
                    temperature: 0.7,
                    num_predict: 2048,
                }
            }),
            signal: controller.signal,
        });
        clearTimeout(timeout);
        const data = await res.json();
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`[Ollama] Respondeu em ${elapsed}s:`);
        const parsed = JSON.parse(data.message?.content);
        console.log(`Gerou ${parsed.cuts?.length || 0} cortes:`, JSON.stringify(parsed.cuts?.slice(0, 3), null, 2));
    } catch (err) {
        console.error('[Ollama Test Error]:', err.message);
    }
}

testBatch();
