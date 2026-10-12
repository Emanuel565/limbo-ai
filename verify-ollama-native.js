fetch('http://localhost:11434/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'llama3.1:8b',
    messages: [{ role: 'user', content: 'Oi' }],
    stream: false,
  }),
})
  .then(async (res) => {
    const text = await res.text();
    console.log('STATUS=' + res.status);
    console.log(text);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
