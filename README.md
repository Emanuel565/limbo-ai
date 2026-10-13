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

## Plano de IA local para desenvolvimento (Ollama + Continue)

Para um fluxo de desenvolvimento local com máxima privacidade, velocidade e desempenho, o ideal é usar modelos de 7B a 8B em quantização Q4. Eles rodam inteiramente na GPU, mantendo resposta rápida e sem depender de APIs externas.

### Modelos recomendados

- `gemma4:9b` — modelo local forte e bem equilibrado para desenvolvimento, raciocínio e assistência em código.
- `qwen2.5-coder:7b` — ótima alternativa focada em código e tarefas técnicas.
- `deepseek-coder:6.7b` — excelente para arquitetura de software e depuração.
- `llama3.1:8b` — modelo geral robusto e muito útil em documentação e revisão.

### Passo a passo para configurar no VS Code

#### 1) Instalar o Ollama

1. Baixe e instale o Ollama em https://ollama.com/.
2. Abra o terminal e rode:

```bash
ollama run gemma4:9b
```

3. Faça uma pergunta rápida para validar que o modelo está funcionando e depois feche o terminal. O serviço continua rodando em segundo plano.

#### 2) Instalar a extensão Continue

1. Abra o VS Code.
2. Vá em Extensões (`Ctrl + Shift + X`).
3. Busque por `Continue` e instale a extensão.
4. Clique no ícone do Continue na barra lateral.
5. Abra o arquivo de configuração do Continue (`config.json`).

#### 3) Configuração local recomendada

```json
{
  "models": [
    {
      "title": "Gemma 4 9B",
      "provider": "ollama",
      "model": "gemma4:9b"
    }
  ],
  "tabAutocompleteModel": {
    "title": "Gemma 4 1B",
    "provider": "ollama",
    "model": "gemma4:1b"
  }
}
```

Para o autocompletar instantâneo, também vale rodar:

```bash
ollama run gemma4:1b
```

### Benefícios desta arquitetura

- Privacidade total: o código fica local.
- Sem custos recorrentes por token.
- Respostas mais rápidas em hardware local compatível com CUDA.
- Flexibilidade para trocar de modelo sem mexer na aplicação principal.

### Plano de implementação para este projeto

1. Manter o backend principal do Limbo AI em modo local-first com Ollama.
2. Usar modelos 7B/8B como padrão de desenvolvimento para edição e análise de código.
3. Manter o modelo 1.5B para autocomplete rápido no editor.
4. Usar o fluxo do app para análise de vídeos e geração de conteúdo com IA local, sem depender de tokens externos.
5. Sempre manter um fallback de modelos locais para garantir resiliência em máquinas mais limitadas.

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

## Repositório Oficial

Repositório oficial e autônomo mantido por Emanuel565: [https://github.com/Emanuel565/limbo-ai](https://github.com/Emanuel565/limbo-ai)

