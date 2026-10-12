# Limbo AI

Limbo AI é uma plataforma de inteligência para conteúdo do YouTube feita para ajudar criadores a analisar vídeos, gerar transcrições, criar ideias de títulos e explorar estratégias de conteúdo com IA em um único fluxo de trabalho.

Repositório: [https://github.com/Emanuel565/limbo-ai](https://github.com/Emanuel565/limbo-ai)

## Funcionalidades

- Análise de vídeo com IA
- Extração inteligente de transcrições
- Geração de títulos usando modelos locais ou na nuvem
- Suporte a miniaturas e geração de imagens
- Chat com agente de IA para planejamento e ideação de conteúdo
- Autenticação, banco de dados e ferramentas de analytics integrados

## Stack tecnológica

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- AI SDK
- Anthropic / OpenAI / Ollama
- Clerk Auth
- Convex
- Schematic

## Desenvolvimento local

Instale as dependências:

```bash
npm install
```

Execute a aplicação:

```bash
npm run dev
```

Abra a URL local exibida pelo Next.js, ou use http://localhost:3000 se essa porta estiver livre.

## Configuração de ambiente

Copie `.env.example` e configure os valores para o seu ambiente local:

```bash
cp .env.example .env.local
```

Para IA local com Ollama, use:

```bash
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b-instruct
OLLAMA_FALLBACK_MODEL=qwen2.5:3b
```

Depois baixe os modelos:

```bash
ollama pull llama3.2:3b-instruct
ollama pull qwen2.5:3b
```

O app tenta primeiro o modelo principal e, se ele não estiver disponível ou falhar, usa automaticamente o modelo de fallback. Isso permite trocar de modelo apenas alterando as variáveis de ambiente, sem mexer no código.

Para velocidade máxima em máquinas locais com 8GB de VRAM, experimente manter `OLLAMA_MODEL=qwen2.5:3b` e `OLLAMA_FALLBACK_MODEL=llama3.2:3b-instruct`. Para um equilíbrio mais estável, deixe o `llama3.2:3b-instruct` como principal e o `qwen2.5:3b` como fallback.

Isso mantém o chat e a geração de títulos no modelo local. A geração de imagens ainda exige uma chave da OpenAI na nuvem ou um modelo local compatível com imagem se você quiser ativar esse recurso em modo Ollama.

## Observações

- A aplicação foi pensada para funcionar sem chaves do Schematic em desenvolvimento local e faz fallback com segurança quando essas credenciais não estão presentes.
- O projeto suporta vários provedores de IA via a variável `AI_PROVIDER`.

## Status do repositório

Este repositório é o repositório ativo da versão atual do projeto, enquanto o repositório original permanece disponível apenas como referência upstream.
