import http from 'node:http';
function start(port, cors) {
  return http.createServer(async (req, res) => {
    if (cors) {
      res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:4173');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Test,Authorization');
      res.setHeader('Access-Control-Expose-Headers', 'X-API-Key');
    }
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    const url = new URL(req.url, 'http://127.0.0.1:' + port);
    let body = ''; for await (const chunk of req) body += chunk;
    res.setHeader('Content-Type', 'application/json');
    if (url.pathname === '/slow') await new Promise(resolve => setTimeout(resolve, Number(url.searchParams.get('delay') || 250)));
    if (res.destroyed) return;
    if (url.pathname.startsWith('/status/')) res.statusCode = Number(url.pathname.split('/').pop());
    if (res.statusCode === 204) { res.end(); return; }
    if (url.pathname === '/text') { res.setHeader('Content-Type', 'text/plain'); res.end('<script>window.serverExecuted=true</script>'); return; }
    if (url.pathname === '/invalid-json') { res.end('{broken'); return; }
    if (url.pathname === '/large') { res.setHeader('Content-Type', 'text/plain'); res.end('x'.repeat(100500)); return; }
    if (url.pathname === '/nested') { res.end(JSON.stringify({ a: { b: [1, true, null] }, html: '<img src=x onerror=alert(1)>' })); return; }
    res.setHeader('X-API-Key', 'response-secret');
    res.end(JSON.stringify({ method: req.method, query: [...url.searchParams], headers: { 'x-test': req.headers['x-test'], 'content-type': req.headers['content-type'], authorization: req.headers.authorization }, body, tag: url.searchParams.get('tag') || '', status: res.statusCode }));
  }).listen(port, '127.0.0.1', () => console.log('HTTP fixture ' + port));
}
const servers = [start(4174, true), start(4175, false)];
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { for (const server of servers) server.close(); });
