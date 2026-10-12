# Limbo AI

Limbo AI is a YouTube content intelligence platform designed to help creators analyze videos, generate transcriptions, create title ideas, and explore AI-driven content strategies from a single workflow.

Repository: [https://github.com/Emanuel565/limbo-ai](https://github.com/Emanuel565/limbo-ai)

## Features

- AI-powered video analysis
- Smart transcription extraction
- Title generation using local or cloud models
- Thumbnail and image generation support
- AI agent chat for planning and content ideation
- Integrated auth, database, and analytics tooling

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- AI SDK
- Anthropic / OpenAI / Ollama
- Clerk Auth
- Convex
- Schematic

## Local development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Open the local URL shown by Next.js, or use http://localhost:3000 if that port is free.

## Environment setup

Copy `.env.example` and configure the values for your local environment:

```bash
cp .env.example .env.local
```

For local AI with Ollama, use:

```bash
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=llama3.1:8b
```

Then pull the model:

```bash
ollama pull llama3.1:8b
```

This keeps chat and title generation on the local model. Image generation still requires either a cloud OpenAI API key or a local image-capable model if you want that feature enabled in Ollama mode.

## Notes

- The app is designed to work without Schematic keys in local development and will fall back gracefully when those credentials are not present.
- The project supports multiple AI providers via the `AI_PROVIDER` variable.

## Repository status

This repository is the active working repository for the current version of the project, while the original project remains available as an upstream reference only.
