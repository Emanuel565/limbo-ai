import { execSync } from 'node:child_process';

async function testOllamaAudit() {
    const cut = {
        title: "ROUND 4: 1 HP E CONTRA 5 NO RETAKE DA B 💀",
        headline: "CLUTCH 1 HP NO SPIKE",
        hookText: "O time todo no chão e restava 1 segundo no relógio...",
        duration: 25,
    };

    const prompt = `Você é um auditor de qualidade e viralidade de vídeos curtos (TikTok, Instagram Reels, YouTube Shorts) para canais profissionais de games (Valorant).
Avalie o corte abaixo:
Título: "${cut.title}"
Headline Visual: "${cut.headline}"
Gancho de Abertura (0-3s): "${cut.hookText}"
Duração do corte: ${cut.duration} segundos
Critérios de Qualidade:
1. O gancho gera curiosidade extrema e quebra de padrão nos primeiros 3 segundos?
2. A duração (25s) é ideal para taxa de conclusão acima de 80% nos algoritmos?
3. O tema tem apelo para jogadores de Valorant engajarem nos comentários?

Retorne OBRIGATORIAMENTE um JSON estrito no formato:
{
  "viralScore": 94,
  "status": "APPROVED",
  "checklist": {
    "noLobbyOrScoreboard": true,
    "hook3sPresent": true,
    "combatPacing": true,
    "aspectRatioOptimized": true
  },
  "verdict": "Aprovado: Gancho de 1 HP de altíssima tensão emocional e copy que estimula comentários imediatos."
}`;

    const t0 = Date.now();
    try {
        const res = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3.1:8b',
                messages: [{ role: 'user', content: prompt }],
                stream: false,
                format: 'json',
                options: { temperature: 0.3, num_predict: 250 }
            })
        });

        const data = await res.json();
        console.log(`Resposta em ${Date.now() - t0}ms:`, JSON.parse(data.message.content));
    } catch (err) {
        console.error('Erro ao chamar Ollama:', err.message);
    }
}

testOllamaAudit();
