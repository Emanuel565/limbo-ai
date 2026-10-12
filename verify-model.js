const { generateText } = require('ai');
const { createOpenAI } = require('@ai-sdk/openai');

(async function main() {
  const ollama = createOpenAI({
    apiKey: 'ollama',
    baseURL: 'http://localhost:11434/v1',
  });

  const result = await generateText({
    model: ollama('llama3.1:8b'),
    messages: [{ role: 'user', content: 'Oi' }],
  });

  console.log('TEXT_RAW=' + JSON.stringify(result.text));
  console.log('FINISH_REASON=' + result.finishReason);
})().catch((err) => {
  console.error('ERR:' + (err && err.message ? err.message : String(err)));
  process.exit(1);
});
