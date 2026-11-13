// Captura uma página pelo protocolo de depuração do Chrome.
// uso: node tools/shot.mjs <url> <saída.png> [esperaMs=7000] [largura=390] [altura=844] [dpr=2] [expressão]
// variáveis: CPU=4 (lentidão de CPU emulada), REDUCE=1 (prefers-reduced-motion)
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [, , url, out, waitMs = '7000', w = '390', h = '844', dpr = '2', expr = ''] = process.argv;
if (!url || !out) { console.error('uso: node tools/shot.mjs <url> <saída.png> [esperaMs] [largura] [altura] [dpr] [expressão]'); process.exit(2); }
const port = 9400 + Math.floor(Math.random() * 400), profile = mkdtempSync(join(tmpdir(), 'shot-'));
const chrome = spawn('google-chrome', ['--headless=new', '--no-first-run', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, `--window-size=${w},${h}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let code = 0;
try {
  let target;
  for (let i = 0; i < 60 && !target; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page'); } catch { /* ainda subindo */ }
    if (!target) await sleep(200);
  }
  if (!target) throw new Error('Chrome não abriu a porta de depuração');
  const ws = new WebSocket(target.webSocketDebuggerUrl), pending = new Map(), logs = [];
  let id = 0;
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result || m.error); pending.delete(m.id); }
    else if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + JSON.stringify(m.params.exceptionDetails.exception || m.params.exceptionDetails).slice(0, 500));
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') logs.push('ERR ' + m.params.args.map(a => a.value ?? a.description).join(' '));
    else if (m.method === 'Network.loadingFailed') logs.push('NETFAIL ' + m.params.errorText);
  };
  await new Promise(r => (ws.onopen = r));
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: +dpr, mobile: +w < 700 });
  if (process.env.CPU) await send('Emulation.setCPUThrottlingRate', { rate: +process.env.CPU });
  if (process.env.REDUCE) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Page.navigate', { url });
  await sleep(+waitMs);
  if (expr) { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); logs.push('EVAL ' + JSON.stringify(r.result && r.result.value)); }
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(out, Buffer.from(shot.data, 'base64'));
  console.log(logs.join('\n') || 'sem erros no console');
} catch (err) { console.error(String(err)); code = 1; } finally { chrome.kill(); await sleep(300); rmSync(profile, { recursive: true, force: true }); }
process.exit(code);
