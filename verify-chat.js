const http = require('http');

function call(url, method = 'GET', body) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      { method, headers: body ? { 'Content-Type': 'application/json' } : {} },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }
    );

    req.setTimeout(20000, () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async function main() {
  const home = await call('http://localhost:3011');
  console.log('HOME_STATUS:' + home.status);
  console.log(home.body.slice(0, 90));

  const chat = await call(
    'http://localhost:3011/api/chat',
    'POST',
    JSON.stringify({ videoId: 'test', messages: [{ role: 'user', content: 'Oi' }] })
  );

  console.log('CHAT_STATUS:' + chat.status);
  console.log(chat.body.slice(0, 400));
})().catch((err) => {
  console.error('ERR:' + (err && err.message ? err.message : String(err)));
  process.exit(1);
});
