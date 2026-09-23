import type { OpenRpcDocument } from './openrpc.js';

/**
 * The self-describing surface as ONE served HTML page (agent-drivable step 2). Two modes from one renderer:
 *
 *   reference — read-only: every method, who may call it, its fields, its refusals. Safe to serve unauthenticated.
 *   console   — the same page plus a form per method and a Fire button: pick a verb, fill the fields, fire it as a
 *               named principal, see the answer. Human-only verbs can be fired too, so the reader SEES the fence
 *               refuse them (FliCast ADR-0008). This is the Swagger-style control plane.
 *
 * The page is self-contained (no network fonts or scripts — the apps run offline) and light-only (AppyDave has no
 * dark theme). It fires JSON-RPC 2.0 at `rpcPath`, or through `window.fliConsole.call(method, params)` when the host
 * provides one (an Electron preload), and fetches its bearer token from `tokenPath` when it has no bridge.
 */

export interface ApiPageOptions {
  /** Present → the console; absent → the read-only reference. */
  console?: {
    /** Same-origin JSON-RPC endpoint, e.g. `/api/rpc`. */
    rpcPath: string;
    /** Principal the console fires as; an agent name shows the fence working. Default `agent:console`. */
    principal?: string;
    /** Same-origin GET answering `{ token }`, when the door needs a bearer token and there is no bridge. */
    tokenPath?: string;
    /**
     * Show a "Dry run" box. Ticked, a call goes as `window.fliConsole.call(method, params, { dryRun: true })` or with
     * an `x-fli-dry-run: 1` header — offer it only when the app's seam honours one of them.
     */
    dryRun?: boolean;
  };
  /** A link back to the other mode (reference ↔ console). */
  otherPage?: { href: string; label: string };
}

/** JSON inside a <script> tag: `<` escaped so no string in the document can close the tag. */
function scriptJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/[\u2028\u2029]/g, ' ');
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function renderApiPage(doc: OpenRpcDocument, options: ApiPageOptions = {}): string {
  const mode = options.console ? 'console' : 'reference';
  const config = {
    mode,
    rpcPath: options.console?.rpcPath ?? null,
    principal: options.console?.principal ?? 'agent:console',
    tokenPath: options.console?.tokenPath ?? null,
    dryRun: options.console?.dryRun ?? false,
  };
  const title = `${doc.info.title} — ${mode === 'console' ? 'console' : 'reference'}`;
  const other = options.otherPage
    ? `<a class="other" href="${escapeHtml(options.otherPage.href)}">${escapeHtml(options.otherPage.label)}</a>`
    : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
:root { color-scheme: light; --bg:#faf5ec; --surface:#f0ebe4; --card:#fffdf8; --line:#d4cdc4; --text:#342d2d;
  --muted:#7a6e5e; --amber:#c8841a; --yellow:#ffde59; --link:#2E91FC; --ok:#2f7d4f; --bad:#b5524a; --chrome:#25201e; }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--text); font:15px/1.5 -apple-system, "Helvetica Neue", Roboto, sans-serif; }
header { padding:20px 16px 12px; max-width:1100px; margin:0 auto; }
h1 { font:600 22px/1.2 "Oswald", -apple-system, sans-serif; text-transform:uppercase; letter-spacing:.03em; margin:0 0 4px; }
.sub { color:var(--muted); margin:0; white-space:pre-line; }
.bar { display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-top:12px; }
.bar input[type=search] { flex:1; min-width:180px; padding:8px 10px; border:1px solid var(--line); border-radius:6px; background:var(--card); font:inherit; }
.other { color:var(--link); }
.as { color:var(--muted); font-size:13px; }
.as code { background:var(--surface); padding:1px 5px; border-radius:4px; }
main { max-width:1100px; margin:0 auto; padding:0 16px 40px; }
.family { font:600 13px/1 "Oswald", sans-serif; color:var(--amber); text-transform:uppercase; letter-spacing:.08em; margin:22px 0 8px; }
details.m { background:var(--card); border:1px solid var(--line); border-radius:8px; margin:6px 0; }
details.m > summary { cursor:pointer; padding:10px 12px; display:flex; gap:10px; align-items:baseline; flex-wrap:wrap; list-style:none; }
details.m > summary::-webkit-details-marker { display:none; }
.name { font:600 14px ui-monospace, "Roboto Mono", Menlo, monospace; }
.summary { color:var(--muted); flex:1; min-width:200px; }
.tag { font-size:11px; padding:1px 7px; border-radius:10px; border:1px solid var(--line); color:var(--muted); white-space:nowrap; }
.tag.star { border-color:var(--amber); color:var(--amber); font-weight:600; }
.body { padding:0 12px 12px; border-top:1px solid var(--line); }
table { border-collapse:collapse; width:100%; margin:8px 0; font-size:13px; }
th, td { text-align:left; padding:4px 8px; border-bottom:1px solid var(--surface); vertical-align:top; }
th { color:var(--muted); font-weight:500; }
td code, .mono { font-family:ui-monospace, "Roboto Mono", Menlo, monospace; font-size:12.5px; }
form { display:grid; gap:8px; margin-top:10px; }
label { display:grid; gap:2px; font-size:13px; }
label span { color:var(--muted); }
input, select, textarea { font:inherit; padding:6px 8px; border:1px solid var(--line); border-radius:6px; background:#fff; }
textarea { font-family:ui-monospace, Menlo, monospace; font-size:12.5px; min-height:70px; }
button { justify-self:start; font:600 13px "Oswald", sans-serif; text-transform:uppercase; letter-spacing:.05em; background:var(--yellow); color:var(--text); border:1px solid #e6c640; border-radius:6px; padding:7px 16px; cursor:pointer; }
pre.out { margin:8px 0 0; padding:10px; border-radius:6px; background:var(--surface); border-left:4px solid var(--line); overflow:auto; font-size:12.5px; max-height:360px; }
pre.out.ok { border-left-color:var(--ok); } pre.out.bad { border-left-color:var(--bad); }
.empty { color:var(--muted); padding:20px 0; }
label.dry { display:flex; gap:6px; align-items:center; }
</style>
</head>
<body>
<header>
  <h1>${escapeHtml(doc.info.title)}</h1>
  <p class="sub" id="desc"></p>
  <div class="bar">
    <input type="search" id="q" placeholder="Filter methods" aria-label="Filter methods">
    <span class="as" id="as"></span>
    ${other}
  </div>
</header>
<main id="list"></main>
<script id="fli-openrpc" type="application/json">${scriptJson(doc)}</script>
<script id="fli-config" type="application/json">${scriptJson(config)}</script>
<script>
(() => {
  const doc = JSON.parse(document.getElementById('fli-openrpc').textContent);
  const cfg = JSON.parse(document.getElementById('fli-config').textContent);
  const $ = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'text') el.textContent = v; else if (v !== undefined && v !== null) el.setAttribute(k, v);
    }
    for (const kid of kids) if (kid) el.append(kid);
    return el;
  };
  document.getElementById('desc').textContent = doc.info.description || '';
  if (cfg.mode === 'console') {
    const as = document.getElementById('as');
    as.append('Fires as ', $('code', { text: cfg.principal }), ' — human-only verbs are refused, on purpose.');
  }
  // A schema in a line a person can read: an object's fields with their types, or a value's type and limits.
  function brief(s) {
    if (!s || typeof s !== 'object' || !Object.keys(s).some((k) => k !== '$schema')) return '';
    if (s.properties) {
      const req = new Set(s.required || []);
      return '{ ' + Object.entries(s.properties).map(([k, v]) => k + (req.has(k) ? '' : '?') + ': ' + typeName(v)).join(', ') + ' }';
    }
    return typeName(s);
  }
  function typeName(s) {
    if (!s || typeof s !== 'object') return 'any';
    if (s.enum) return s.enum.map((v) => JSON.stringify(v)).join(' | ');
    if ('const' in s) return JSON.stringify(s.const);
    if (s.anyOf || s.oneOf) return (s.anyOf || s.oneOf).map(typeName).join(' | ');
    if (s.type === 'array') { const t = typeName(s.items); return (t.includes(' | ') ? '(' + t + ')' : t) + '[]'; }
    if (s.type === 'object') return s.properties ? brief(s) : 'object';
    const limits = [s.format, s.pattern && '/' + s.pattern + '/', s.minLength !== undefined && 'min ' + s.minLength].filter(Boolean);
    return (s.type || 'any') + (limits.length ? ' (' + limits.join(', ') + ')' : '');
  }
  const starOf = (m) => m['x-human-only'] === true ? '★ human-only' : (m['x-human-only'] && m['x-human-only'].when ? '★ human-only when ' + m['x-human-only'].when : null);

  let token = null;
  async function fire(method, params, dryRun) {
    if (window.fliConsole && typeof window.fliConsole.call === 'function') {
      return dryRun ? window.fliConsole.call(method, params, { dryRun: true }) : window.fliConsole.call(method, params);
    }
    if (cfg.tokenPath && token === null) {
      const t = await fetch(cfg.tokenPath, { credentials: 'same-origin' });
      token = t.ok ? (await t.json()).token : '';
    }
    const headers = { 'content-type': 'application/json', 'x-fli-principal': cfg.principal };
    if (token) headers.authorization = 'Bearer ' + token;
    if (dryRun) headers['x-fli-dry-run'] = '1';
    const res = await fetch(cfg.rpcPath, { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }) });
    return res.json();
  }

  function field(p) {
    const s = p.schema || {};
    const label = $('label', {}, $('span', { text: p.name + (p.required ? ' *' : '') + (p.summary ? ' — ' + p.summary : '') }));
    let input;
    const opts = s.enum || (s.anyOf || []).filter((x) => 'const' in x).map((x) => x.const);
    if (opts && opts.length) {
      input = $('select', { name: p.name }, $('option', { value: '', text: '—' }), ...opts.map((o) => $('option', { value: JSON.stringify(o), text: String(o) })));
      input.dataset.kind = 'enum';
    } else if (s.type === 'boolean') {
      input = $('select', { name: p.name }, $('option', { value: '', text: '—' }), $('option', { value: 'true', text: 'true' }), $('option', { value: 'false', text: 'false' }));
      input.dataset.kind = 'json';
    } else if (s.type === 'string') {
      input = $('input', { name: p.name, type: 'text', placeholder: s.format || '' }); input.dataset.kind = 'string';
    } else if (s.type === 'number' || s.type === 'integer') {
      input = $('input', { name: p.name, type: 'number' }); input.dataset.kind = 'json';
    } else {
      input = $('textarea', { name: p.name, placeholder: 'JSON' }); input.dataset.kind = 'json';
    }
    label.append(input);
    return label;
  }

  function consoleFor(m) {
    const form = $('form', { 'data-verb': m.name });
    for (const p of m.params) form.append(field(p));
    const out = $('pre', { class: 'out', hidden: '' });
    const dry = cfg.dryRun ? $('input', { type: 'checkbox', 'data-dry-run': '' }) : null;
    if (dry) form.append($('label', { class: 'dry' }, dry, $('span', { text: 'Dry run — preview, change nothing' })));
    form.append($('button', { type: 'submit', text: 'Fire' }), out);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const params = {};
      try {
        for (const el of form.querySelectorAll('[name]')) {
        if (el.hasAttribute('data-dry-run')) continue;
          if (el.value === '') continue;
          params[el.name] = el.dataset.kind === 'string' ? el.value : JSON.parse(el.value);
        }
      } catch (err) { out.hidden = false; out.className = 'out bad'; out.textContent = 'Not JSON: ' + err.message; return; }
      out.hidden = false; out.className = 'out'; out.textContent = '…';
      try {
        const answer = await fire(m.name, params, Boolean(dry && dry.checked));
        const bad = answer && (answer.error || answer.ok === false);
        out.className = 'out ' + (bad ? 'bad' : 'ok');
        out.textContent = JSON.stringify(answer, null, 2);
      } catch (err) { out.className = 'out bad'; out.textContent = String(err); }
    });
    return form;
  }

  function methodCard(m) {
    const star = starOf(m);
    const summary = $('summary', {},
      $('span', { class: 'name', text: m.name }),
      $('span', { class: 'summary', text: m.summary }),
      $('span', { class: 'tag', text: m['x-kind'] }),
      $('span', { class: 'tag', text: m['x-side-effects'] }),
      star && $('span', { class: 'tag star', text: star }));
    const body = $('div', { class: 'body' });
    const facts = $('table', {}, $('tbody', {},
      $('tr', {}, $('th', { text: 'Who may call' }), $('td', { text: (m['x-principals'] || []).join(', ') })),
      $('tr', {}, $('th', { text: 'Idempotent' }), $('td', { text: String(m['x-idempotent']) })),
      $('tr', {}, $('th', { text: 'Asks a person first' }), $('td', { text: String(m['x-confirmation-required']) }))));
    body.append(facts);
    if (m.params.length) {
      const rows = m.params.map((p) => $('tr', {}, $('td', {}, $('code', { text: p.name + (p.required ? ' *' : '') })),
        $('td', { class: 'mono', text: brief(p.schema) }), $('td', { text: p.summary || '' })));
      body.append($('table', {}, $('thead', {}, $('tr', {}, $('th', { text: 'Param' }), $('th', { text: 'Schema' }), $('th', { text: '' }))), $('tbody', {}, ...rows)));
    }
    const errs = m.errors.map((e) => $('tr', {}, $('td', {}, $('code', { text: e.message })), $('td', { class: 'mono', text: String(e.code) }),
      $('td', { class: 'mono', text: e.data && e.data.properties ? brief(e.data.properties.details) : '' })));
    body.append($('table', {}, $('thead', {}, $('tr', {}, $('th', { text: 'Refusal' }), $('th', { text: 'Code' }), $('th', { text: 'Details' }))), $('tbody', {}, ...errs)));
    if (cfg.mode === 'console') body.append(consoleFor(m));
    const card = $('details', { class: 'm', id: 'm-' + m.name });
    card.append(summary, body);
    return card;
  }

  const list = document.getElementById('list');
  function render(filter) {
    list.textContent = '';
    const q = filter.trim().toLowerCase();
    const methods = doc.methods.filter((m) => !q || (m.name + ' ' + m.summary).toLowerCase().includes(q));
    if (!methods.length) { list.append($('p', { class: 'empty', text: 'No method matches.' })); return; }
    let family = null;
    for (const m of methods) {
      const f = m['x-family'] || m.name.split('.')[0];
      if (f !== family) { family = f; list.append($('h2', { class: 'family', text: f })); }
      list.append(methodCard(m));
    }
    const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) target.open = true;
  }
  document.getElementById('q').addEventListener('input', (e) => render(e.target.value));
  render('');
})();
</script>
</body>
</html>
`;
}
