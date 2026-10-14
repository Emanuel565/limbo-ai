async function testOllama() {
    const prompt = `Você é um estrategista de conteúdo viral e editor sênior de Valorant para TikTok, Reels e Shorts.
Gere 5 títulos e ganchos altamente apelativos, com alto CTR e psicologia de retenção para cortes de uma gameplay de 2 horas.
Retorne EXCLUSIVAMENTE um array JSON válido no formato:
[
  {
    "title": "TÍTULO VIRAL EM MAIÚSCULAS COM EMOJI (máx 50 chars)",
    "headline": "GANCHO DE TOPO (máx 36 chars)",
    "hook": "Frase de gancho narrativo dos primeiros 3 segundos"
  }
]`;

    const res = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'llama3.1:8b',
            messages: [{ role: 'user', content: prompt }],
            stream: false,
            format: 'json',
        }),
    });

    const data = await res.json();
    console.log('Resposta Ollama:', data.message?.content);
}

testOllama().catch(console.error);
