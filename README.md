# 🚀 Limbo AI — Viral Studio & Intelligence Engine

> Plataforma completa de inteligência para conteúdo em vídeo, análise de tendências em tempo real e automação de edição de cortes verticais de alto impacto (TikTok, YouTube Shorts e Instagram Reels) acelerada por GPU local e IA.

**Repositório Oficial:** [https://github.com/Emanuel565/limbo-ai](https://github.com/Emanuel565/limbo-ai.git)  
**Autor:** [Emanuel565](https://github.com/Emanuel565)  
**Tema Visual:** Deep Pink Luxury (`#14010e` com realces em rosa choque `#FF1493` e tipografia inspirada na Clínica Belvè)

---

## 🗺️ Visão Geral da Arquitetura

```mermaid
flowchart TD
    A[🔥 Trend Hunter: YouTube API v3] -->|Top Charts BR / Pesquisa de Nicho| B[🤖 Ollama: Llama 3.1 / Gemma 2]
    B -->|Matriz de Viralidade & Hook Headline| C[✂️ Shorts Pipeline Studio]
    C -->|Vídeo Original + Transcrição| D[⚡ Engine de Edição FFmpeg NVENC]
    D -->|Corte 9:16 + Legendas ASS + Áudio Loudnorm| E[📱 Vídeo Vertical Renderizado]
    E -->|Payload TikTok API v2 + Hashtags #fyp| F[🌐 Módulo de Publicação Multiplataforma]
```

---

## ⚡ Principais Módulos

### 1. 🎯 Trend Hunter & Matriz Psicológica de Viralidade
- **Modos de Descoberta:**
  - **🔥 Em Alta no Brasil (Top Charts):** Captura em tempo real os vídeos mais populares do momento (`chart: mostPopular`, regiões `BR`, `US`, `GB`).
  - **🎯 Pesquisa Específica por Nicho:** Busca direcionada por termos e categorias chave com ordenação por densidade de engajamento.
- **Matriz Psicológica da IA Local (Ollama):** O modelo avalia cada vídeo através de 4 dimensões científicas de retenção:
  1. **Curiosity Gap (Lacuna de Curiosidade):** Grau de mistério gerado nos primeiros segundos.
  2. **Pattern Interrupt (Quebra de Padrão):** Capacidade de interromper o scroll do usuário.
  3. **Emotional Resonance (Impacto Emocional):** Força emocional e conexão imediata.
  4. **Shareability Factor (Potencial de Compartilhamento):** Propensão a ser enviado para terceiros.
- **Botão "Usar no Editor":** Transfere o vídeo vencedor, a transcrição e a headline diretamente para o estúdio de renderização com um clique.

### 2. 🎬 Engine de Edição Vertical de Alta Precisão (GPU NVENC)
- **Reenquadramento Automático 9:16 (1080x1920):** Conversão de formatos horizontais para corte vertical centralizado usando interpolação `lanczos` de alta definição.
- **Aceleração por Hardware (NVIDIA RTX 3060 Ti):** Codificação via `h264_nvenc` com preset de alta qualidade (`-preset p6 -tune hq -cq 19 -b:v 10M -maxrate 16M`).
- **Tarja Superior Fixa (*Hook Headline*):** Banner superior estilizado desenhado via FFmpeg `drawbox` + `drawtext` para reter o público logo no início do vídeo.
- **Legendas Dinâmicas em SubStation Alpha (`.ass`):**
  - Blocos curtos de 2 a 3 palavras no ritmo da fala (estilo Alex Hormozi).
  - Animação de escala *pop* (`\t(0,90,\fscx108\fscy108)`).
  - Realce automático de palavras de choque e números com a cor rosa choque **`#FF1493`**.
  - Queima direta das legendas no vídeo (*burn-in*) sem desincronia de tempo.
- **Barra de Progresso de Retenção:** Linha inferior animada em rosa neon (`#FF1493`) que indica a evolução do corte, estimulando o espectador a assistir até o fim.
- **Cadeia de Áudio de Podcast:**
  - `highpass=f=80`: Eliminação de ruídos subsônicos e batidas de microfone.
  - `afftdn=nf=-25`: Redução espectral inteligente de ruído de fundo.
  - `acompressor`: Nivelamento e punch dinâmico vocal.
  - `loudnorm=I=-14:LRA=7:TP=-1.5`: Normalização profissional no padrão EBU R128 (-14 LUFS).

### 3. 📱 Publicação no TikTok, YouTube Shorts & Instagram Reels
- **Integração com TikTok:**
  - Gerador de legendas com hashtags algorítmicas de alto alcance (`#fyp`, `#foryou`, `#viral`, `#tiktokbrasil`).
  - Geração de payload compatível com a especificação oficial da **TikTok Content Posting API v2**.
- **Ações Rápidas:**
  - Cópia instantânea de legendas formatadas para a área de transferência.
  - Abas dedicadas para pré-visualização de cada rede social (TikTok, Shorts e Reels).
  - Download imediato dos arquivos finais (`.mp4`, `.srt` e `.ass`).

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Detalhes |
|---|---|---|
| **Frontend** | Next.js 15, React 19, TypeScript | Server Components, Hooks reativos, Tailwind CSS v4 |
| **Estilização** | Vanilla CSS + Tokens Belvè | `#14010e` base, `#FF1493` neon accents, glassmorphism |
| **Processamento de Vídeo** | FFmpeg 9.0.2 Gyan Build | Aceleração por hardware NVENC, filtros ASS, loudnorm, lanczos |
| **Inteligência Artificial** | Ollama local / Vercel AI SDK | Modelos `llama3.1:8b`, `gemma2:9b`, `qwen2.5-coder:7b` |
| **APIs Externas** | Google YouTube Data API v3 | Extração de métricas de engajamento, views, likes e charts |
| **Testes** | Node.js Test Runner nativo | Testes unitários com `node --test` e sem dependências pesadas |

---

## 💻 Como Executar Localmente

### Pré-requisitos
1. **Node.js 20+** instalado.
2. **FFmpeg** instalado com suporte a NVENC e libass (já configurado no Windows via Gyan build).
3. **Ollama** rodando localmente na porta padrão `11434` (com o modelo `llama3.1:8b` ou `gemma2:9b`).

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/Emanuel565/limbo-ai.git
cd limbo-ai

# 2. Instale as dependências
npm install

# 3. Configure o arquivo de variáveis de ambiente
cp .env.example .env.local
```

### Variáveis de Ambiente (`.env.local`)

```env
# YouTube Data API v3
YOUTUBE_API_KEY=sua_chave_do_google_cloud

# Ollama Local (GPU)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
OLLAMA_FALLBACK_MODEL=qwen2.5-coder:7b
```

### Executando o Projeto

```bash
# Iniciar o servidor de desenvolvimento
npm run dev

# Executar a suíte de testes do pipeline de vídeo e do Trend Hunter
npm run test:shorts
```

Acesse a interface no navegador em: **`http://localhost:3000`**

---

## 🔮 Roadmap: Como Levar a Edição de Vídeo ao Nível Máximo (CapCut / Opus Clip)

Para transformar o motor atual em uma solução industrial autônoma de edição comparável às melhores ferramentas do mercado mundial, recomendamos as seguintes integrações:

### 1. Sincronização de Legendas por Palavra (*Word-Level Timestamps*)
- **Ferramenta:** `whisper.cpp` ou `faster-whisper` (Python/C++ via CUDA).
- **Impacto:** Permite sincronização milimétrica palavra por palavra. Com isso, o efeito karaoke no formato `.ass` acende o rosa `#FF1493` exatamente no milissegundo em que cada sílaba é pronunciada pelo locutor.

### 2. Enquadramento Facial Inteligente (*Auto-Reframe com Detecção Facial*)
- **Ferramenta:** `mediapipe` (Google) ou `opencv4nodejs`.
- **Impacto:** Atualmente, o vídeo 9:16 faz um corte central `(iw-1080)/2`. Com rastreamento facial ativo, a janela horizontal de 1080px se move suavemente (*smooth panning*) acompanhando o rosto de quem está falando, eliminando qualquer risco de cortar o interlocutor para fora do enquadramento.

### 3. Remoção Automática de Silêncios e Respirações (*Auto Jumpcut*)
- **Ferramenta:** Filtro `silencedetect` do FFmpeg ou `Silero VAD`.
- **Impacto:** Corta automaticamente pausas sem fala superiores a 300ms. Esse corte seco contínuo acelera o ritmo do vídeo e pode elevar a retenção de tela em até 35% no TikTok e no Shorts.

### 4. Overlays Programáticos com Remotion
- **Ferramenta:** `@remotion/core` e `@remotion/cli`.
- **Impacto:** Permite desenhar templates de vídeo completos usando componentes React: efeitos de zoom elástico (*spring physics*), stickers animados, caixas de perguntas do Instagram e transições de tela cinemáticas com aceleração pela GPU.

### 5. Inserção Automática de B-Rolls Contextuais
- **Ferramenta:** Pexels API / Pixabay API integrada à IA.
- **Impacto:** O Ollama identifica conceitos-chave na transcrição (ex: "inteligência artificial", "dinheiro", "gráfico caindo") e insere pequenos vídeos de cobertura (*B-rolls*) de 2 segundos com transição rápida e opacidade reduzida sobre o vídeo principal.

### 6. Ducking de Trilha Sonora e Efeitos Sonoros (SFX)
- **Ferramenta:** Filtro `sidechaincompress` do FFmpeg.
- **Impacto:** Aplica uma música instrumental viral de fundo em volume baixo que se reduz automaticamente (*audio ducking*) sempre que o locutor fala, somada a pequenos efeitos de "whoosh" e "pop" nas trocas de legenda.

---

## 🛡️ Licença & Propriedade

Desenvolvido exclusivamente por **Emanuel565** para o ecossistema **Limbo AI**.  
Todos os direitos reservados.
