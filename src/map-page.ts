/**
 * The RPC Map (milestone 1): the people's view of an app's `describe/1` document, served as ONE self-contained page.
 * app → part (the core, then each extension) → family → command; a command is coloured by what it does (read / write /
 * long job), marked when only a person may call it, and shown used or unused from the app's call counts. Open a command
 * for its inputs, output and a request that works; a READ command also has a "Try it" that calls the app's own door with
 * the page's token (writes are never offered here — the console is the place for those).
 *
 * Built beside `renderApiPage`, which stays byte-identical. Light AppyDave only: cream canvas, brown text, one yellow
 * action. No network fonts or scripts; the page runs one inline script (host it with a CSP that allows that script's hash).
 */

import type { DescribeDocument } from './describe.js';

export interface MapPageOptions {
  /** Where the page reads the document: same-origin GET answering `describe/1` (e.g. `/api/describe`). */
  describePath: string;
  /** Same-origin JSON-RPC endpoint the Try-it button calls (e.g. `/api/rpc`). */
  rpcPath: string;
  /** Same-origin GET answering `{ token }` (e.g. `/api/session`), when the door needs a bearer token. */
  tokenPath?: string;
  /** Who Try-it calls as. Default `agent:map`. */
  principal?: string;
  /** A saved copy of the document to show instead of fetching one (a snapshot page). */
  snapshot?: DescribeDocument;
  /** A link to the full console, for writes. */
  consoleHref?: string;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function scriptJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/[\u2028\u2029]/g, ' ');
}

export function renderMapPage(options: MapPageOptions): string {
  const config = {
    describePath: options.describePath,
    rpcPath: options.rpcPath,
    tokenPath: options.tokenPath ?? null,
    principal: options.principal ?? 'agent:map',
    consoleHref: options.consoleHref ?? null,
    snapshot: options.snapshot ?? null,
  };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml('RPC Map')}</title>
<style>
:root { color-scheme: light; --bg:#faf5ec; --surface:#f0ebe4; --card:#fffdf8; --line:#d4cdc4; --text:#342d2d;
  --muted:#7a6e5e; --amber:#c8841a; --yellow:#ffde59; --link:#2E91FC; --read:#2f7d4f; --write:#b5524a; --job:#c8841a; }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--text); font:15px/1.5 -apple-system, "Helvetica Neue", Roboto, sans-serif; }
header, main { max-width:1180px; margin:0 auto; padding-left:16px; padding-right:16px; }
header { padding-top:22px; padding-bottom:6px; }
h1 { font:600 26px/1.15 "Bebas Neue", "Oswald", -apple-system, sans-serif; text-transform:uppercase; letter-spacing:.04em; margin:0; }
.app { color:var(--muted); margin:2px 0 0; }
.app b { color:var(--text); }
.purpose { margin:8px 0 0; max-width:80ch; }
.totals { display:flex; gap:8px; flex-wrap:wrap; margin:14px 0 0; }
.chip { background:var(--card); border:1px solid var(--line); border-radius:999px; padding:3px 12px; font-size:13px; }
.chip b { font-weight:700; }
.bar { display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin:14px 0 4px; }
.bar input[type=search] { flex:1; min-width:200px; padding:8px 10px; border:1px solid var(--line); border-radius:6px; background:var(--card); font:inherit; }
.toggle { display:inline-flex; gap:6px; align-items:center; color:var(--muted); font-size:13px; cursor:pointer; user-select:none; }
.toggle input { accent-color:var(--amber); }
.legend { display:flex; gap:14px; flex-wrap:wrap; color:var(--muted); font-size:12px; margin:4px 0 0; }
.dot { display:inline-block; width:9px; height:9px; border-radius:50%; margin-right:5px; vertical-align:baseline; }
.dot.read { background:var(--read); } .dot.write { background:var(--write); } .dot.long-job { background:var(--job); }
main { padding-bottom:48px; }
details.part { background:var(--card); border:1px solid var(--line); border-radius:10px; margin:16px 0 0; }
details.part > summary { cursor:pointer; list-style:none; padding:14px 16px; display:flex; gap:12px; align-items:baseline; flex-wrap:wrap; }
details.part > summary::-webkit-details-marker { display:none; }
.pname { font:600 20px/1.1 "Bebas Neue", "Oswald", sans-serif; text-transform:uppercase; letter-spacing:.04em; }
.pkind { font-size:11px; padding:1px 8px; border-radius:10px; border:1px solid var(--amber); color:var(--amber); font-weight:600; text-transform:uppercase; letter-spacing:.06em; }
.pmeta { color:var(--muted); font-size:13px; }
.psum { flex-basis:100%; color:var(--muted); font-size:13px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
.part[open] > summary .psum { display:none; }
.about { margin:6px 0 0; }
.about > summary { cursor:pointer; color:var(--link); font-size:13px; }
.fact code { word-break:break-all; }
.pbody { padding:0 16px 14px; border-top:1px solid var(--line); }
.ppurpose { margin:10px 0 6px; max-width:90ch; }
.facts { display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:10px; margin:8px 0 4px; }
.fact { background:var(--bg); border:1px solid var(--line); border-radius:8px; padding:8px 10px; font-size:13px; }
.fact h4 { margin:0 0 4px; font:600 11px/1 "Oswald", sans-serif; letter-spacing:.08em; text-transform:uppercase; color:var(--amber); }
.fact ul { margin:0; padding-left:16px; } .fact li { margin:2px 0; }
.fact code, .path { font:12px ui-monospace, "Roboto Mono", Menlo, monospace; }
.family { font:600 13px/1 "Oswald", sans-serif; color:var(--amber); text-transform:uppercase; letter-spacing:.08em; margin:18px 0 6px; }
details.cmd { border:1px solid var(--line); border-radius:8px; margin:5px 0; background:var(--bg); }
details.cmd.unused { background:var(--card); }
details.cmd > summary { cursor:pointer; padding:7px 10px; display:flex; gap:10px; align-items:baseline; flex-wrap:wrap; list-style:none; }
details.cmd > summary::-webkit-details-marker { display:none; }
.cname { font:600 14px ui-monospace, "Roboto Mono", Menlo, monospace; }
.csum { color:var(--muted); flex:1; min-width:220px; font-size:13px; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
.tag { font-size:11px; padding:1px 7px; border-radius:10px; border:1px solid var(--line); color:var(--muted); white-space:nowrap; }
.tag.star { border-color:var(--amber); color:var(--amber); font-weight:700; }
.tag.used { border-color:var(--read); color:var(--read); }
.tag.unused { color:var(--muted); border-style:dashed; }
.cbody { padding:2px 12px 12px; border-top:1px solid var(--line); }
.cbody h4 { margin:12px 0 4px; font:600 11px/1 "Oswald", sans-serif; letter-spacing:.08em; text-transform:uppercase; color:var(--amber); }
.desc { margin:8px 0 0; white-space:pre-wrap; max-width:100ch; }
table.in { border-collapse:collapse; font-size:13px; }
table.in td, table.in th { text-align:left; padding:2px 14px 2px 0; vertical-align:top; }
table.in th { color:var(--muted); font-weight:600; }
pre { background:var(--surface); border:1px solid var(--line); border-radius:6px; padding:8px 10px; overflow:auto; max-height:320px; font:12px/1.45 ui-monospace, "Roboto Mono", Menlo, monospace; margin:4px 0; white-space:pre-wrap; word-break:break-word; }
textarea { width:100%; min-height:70px; padding:8px; border:1px solid var(--line); border-radius:6px; font:12px/1.45 ui-monospace, "Roboto Mono", Menlo, monospace; background:var(--card); color:var(--text); }
button.fire { background:var(--yellow); color:var(--text); border:1px solid var(--text); border-radius:6px; padding:6px 16px; font:600 13px "Roboto", sans-serif; cursor:pointer; margin-top:6px; }
button.fire:disabled { opacity:.5; cursor:default; }
.note { color:var(--muted); font-size:12px; }
.empty { color:var(--muted); padding:30px 0; text-align:center; }
a { color:var(--link); }
@media (max-width: 600px) { .csum { min-width:100%; } }
</style>
</head>
<body>
<header>
  <h1>RPC Map</h1>
  <p class="app" id="app">Loading…</p>
  <p class="purpose" id="purpose"></p>
  <div class="totals" id="totals"></div>
  <div class="bar">
    <input type="search" id="q" placeholder="Filter commands (name or words)" aria-label="Filter commands">
    <label class="toggle"><input type="checkbox" id="unused"> only commands nobody has used</label>
    <span class="note" id="since"></span>
  </div>
  <div class="legend"><span><i class="dot read"></i>read (changes nothing)</span><span><i class="dot write"></i>write</span><span><i class="dot long-job"></i>long job</span><span>★ only a person may call it</span></div>
</header>
<main id="map"></main>
<script>
(function () {
  var CONFIG = ${scriptJson(config)};
  var token = null;
  var doc = null;
  var openState = {};
  var outs = {};
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function ago(iso) {
    if (!iso) return 'never';
    var s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return s + 's ago';
    if (s < 3600) return Math.round(s / 60) + 'm ago';
    if (s < 86400) return Math.round(s / 3600) + 'h ago';
    return Math.round(s / 86400) + 'd ago';
  }
  function chip(label, value) {
    var c = el('span', 'chip');
    var b = el('b', null, String(value));
    c.appendChild(b);
    c.appendChild(document.createTextNode(' ' + label));
    return c;
  }
  function factList(title, rows) {
    if (!rows.length) return null;
    var box = el('div', 'fact');
    box.appendChild(el('h4', null, title));
    var ul = el('ul');
    rows.forEach(function (r) {
      var li = el('li');
      r.forEach(function (piece) {
        if (piece.code) li.appendChild(el('code', null, piece.code));
        else li.appendChild(document.createTextNode(piece.text));
      });
      ul.appendChild(li);
    });
    box.appendChild(ul);
    return box;
  }
  function commandNode(c) {
    var d = el('details', 'cmd' + ((c.usage && c.usage.calls > 0) ? '' : ' unused'));
    d.dataset.name = c.name;
    d.dataset.text = (c.name + ' ' + c.summary).toLowerCase();
    d.dataset.used = c.usage && c.usage.calls > 0 ? '1' : '0';
    if (openState[c.name]) d.open = true;
    var s = el('summary');
    var dot = el('i', 'dot ' + c.access);
    s.appendChild(dot);
    s.appendChild(el('span', 'cname', c.name));
    s.appendChild(el('span', 'csum', c.summary));
    if (c.humanOnly !== false) {
      var star = el('span', 'tag star', '\\u2605 person only');
      star.title = c.humanOnly === true ? 'Only a person may call this.' : 'Only a person may send: ' + c.humanOnly.when;
      s.appendChild(star);
    }
    s.appendChild(el('span', 'tag', c.access));
    if (c.usage) {
      s.appendChild(c.usage.calls > 0
        ? el('span', 'tag used', c.usage.calls + '\\u00d7 \\u00b7 ' + ago(c.usage.lastUsed))
        : el('span', 'tag unused', 'unused'));
    }
    d.appendChild(s);
    var body = el('div', 'cbody');
    body.appendChild(el('p', 'desc', c.summary));
    body.appendChild(el('h4', null, 'Inputs'));
    if (!c.inputs.length) body.appendChild(el('div', 'note', 'none'));
    else {
      var t = el('table', 'in');
      c.inputs.forEach(function (i) {
        var tr = el('tr');
        tr.appendChild(el('td', null, i.name + (i.required ? ' *' : '')));
        tr.appendChild(el('td', null, i.type));
        tr.appendChild(el('td', 'note', i.description || ''));
        t.appendChild(tr);
      });
      body.appendChild(t);
    }
    body.appendChild(el('h4', null, 'Output'));
    body.appendChild(el('div', 'note', c.output));
    if (c.failureModes.length) {
      body.appendChild(el('h4', null, 'Can refuse with'));
      body.appendChild(el('div', 'note', c.failureModes.join(', ')));
    }
    if (c.usage && c.usage.calls > 0) {
      body.appendChild(el('h4', null, 'Used'));
      body.appendChild(el('div', 'note', c.usage.calls + ' calls \\u00b7 first ' + ago(c.usage.firstUsed) + ' \\u00b7 last ' + ago(c.usage.lastUsed) +
        ' by ' + c.usage.lastPrincipal + (c.usage.lastFailureMode ? ' \\u00b7 last outcome: ' + c.usage.lastFailureMode : '')));
    }
    body.appendChild(el('h4', null, 'Example request'));
    body.appendChild(el('pre', null, JSON.stringify(c.example, null, 2)));
    if (c.access === 'read' && c.humanOnly === false) {
      body.appendChild(el('h4', null, 'Try it (read only)'));
      var ta = el('textarea');
      ta.value = JSON.stringify(c.example.params, null, 2);
      ta.setAttribute('aria-label', 'Params for ' + c.name);
      var btn = el('button', 'fire', 'Try it');
      var out = el('pre');
      out.hidden = !outs[c.name];
      out.textContent = outs[c.name] || '';
      btn.addEventListener('click', function () { tryIt(c, ta, btn, out); });
      body.appendChild(ta); body.appendChild(btn); body.appendChild(out);
    } else {
      body.appendChild(el('div', 'note', c.humanOnly !== false ? 'Not offered here: a person-only command.' : 'Not offered here: it writes. Use the console' + (CONFIG.consoleHref ? ' (' + CONFIG.consoleHref + ')' : '') + '.'));
    }
    d.appendChild(body);
    return d;
  }
  function getToken() {
    if (token || !CONFIG.tokenPath) return Promise.resolve(token);
    return fetch(CONFIG.tokenPath).then(function (r) { return r.json(); }).then(function (j) { token = j.token || null; return token; });
  }
  function tryIt(c, ta, btn, out) {
    var params;
    try { params = JSON.parse(ta.value || '{}'); } catch (e) { out.hidden = false; out.textContent = 'Params are not valid JSON: ' + e.message; return; }
    btn.disabled = true; out.hidden = false; out.textContent = '\\u2026';
    getToken().then(function (tk) {
      var headers = { 'content-type': 'application/json', 'x-fli-principal': CONFIG.principal };
      if (tk) headers.authorization = 'Bearer ' + tk;
      return fetch(CONFIG.rpcPath, { method: 'POST', headers: headers, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: c.name, params: params }) });
    }).then(function (r) { return r.text(); }).then(function (text) {
      try { out.textContent = JSON.stringify(JSON.parse(text), null, 2); } catch (e) { out.textContent = text; }
      outs[c.name] = out.textContent;
      return load(true);
    }).catch(function (e) { out.textContent = 'Failed: ' + e.message; }).then(function () { btn.disabled = false; });
  }
  function render() {
    $('app').textContent = '';
    var a = doc.app;
    var b = el('b', null, a.name);
    $('app').appendChild(b);
    $('app').appendChild(document.createTextNode(' v' + a.version + (a.gitSha ? ' \\u00b7 ' + a.gitSha.slice(0, 7) : '') + ' \\u00b7 ' + a.machine + (a.startedAt ? ' \\u00b7 up since ' + a.startedAt.slice(0, 16).replace('T', ' ') : '')));
    $('purpose').textContent = a.purpose;
    var t = doc.totals;
    var tt = $('totals'); tt.textContent = '';
    tt.appendChild(chip('parts', t.parts)); tt.appendChild(chip('commands', t.commands));
    tt.appendChild(chip('read', t.read)); tt.appendChild(chip('write', t.write)); tt.appendChild(chip('long jobs', t.longJob));
    tt.appendChild(chip('person-only', t.humanOnly));
    if (t.used !== undefined) { tt.appendChild(chip('used', t.used)); tt.appendChild(chip('unused', t.unused)); }
    $('since').textContent = doc.usageSince ? 'counting since ' + doc.usageSince.slice(0, 10) : '';
    var main = $('map'); var partOpen = {};
    main.querySelectorAll('details[open]').forEach(function (d) { if (d.dataset.name) openState[d.dataset.name] = true; else if (d.dataset.part) partOpen[d.dataset.part] = true; });
    main.querySelectorAll('details.cmd:not([open])').forEach(function (d) { delete openState[d.dataset.name]; });
    main.textContent = '';
    doc.parts.forEach(function (p) {
      var sec = el('details', 'part'); sec.dataset.part = p.key;
      sec.open = !!partOpen[p.key];
      var s = el('summary');
      s.appendChild(el('span', 'pname', p.name));
      s.appendChild(el('span', 'pkind', p.kind === 'core' ? 'app core' : 'extension'));
      var used = p.commands.filter(function (c) { return c.usage && c.usage.calls > 0; }).length;
      s.appendChild(el('span', 'pmeta', p.commands.length + ' commands' + (doc.totals.used !== undefined ? ' \\u00b7 ' + used + ' used' : '') + ' \\u00b7 v' + p.version + ' \\u00b7 owner: ' + p.owner));
      s.appendChild(el('span', 'psum', p.purpose));
      sec.appendChild(s);
      var body = el('div', 'pbody');
      body.appendChild(el('p', 'ppurpose', p.purpose));
      var facts = el('div', 'facts');
      [factList('Data files', p.dataFiles.map(function (f) { return [{ code: f.path }, { text: ' \\u2014 ' + f.access + '. ' + f.purpose }]; })),
       factList('Events', p.events.map(function (e) { return [{ code: e.name }, { text: ' \\u2014 ' + (e.channel ? e.channel + '. ' : '') + e.purpose }]; })),
       factList('Settings', p.settings.map(function (e) { return [{ code: e.name }, { text: ' (' + e.where + ') \\u2014 ' + e.purpose }]; })),
       factList('Docs', p.docs.map(function (e) { return [{ text: e.label + ': ' }, { code: e.href }]; }))
      ].forEach(function (f) { if (f) facts.appendChild(f); });
      var about = el('details', 'about');
      about.appendChild(el('summary', null, 'Data files, events, settings, docs (' + (p.dataFiles.length + p.events.length + p.settings.length + p.docs.length) + ')'));
      about.appendChild(facts);
      body.appendChild(about);
      var fams = {};
      p.commands.forEach(function (c) { (fams[c.family] = fams[c.family] || []).push(c); });
      Object.keys(fams).sort().forEach(function (f) {
        var g = el('div'); g.dataset.family = f;
        g.appendChild(el('div', 'family', f + ' \\u00b7 ' + fams[f].length));
        fams[f].forEach(function (c) { g.appendChild(commandNode(c)); });
        body.appendChild(g);
      });
      sec.appendChild(body);
      main.appendChild(sec);
    });
    applyFilter();
  }
  function applyFilter() {
    var q = $('q').value.trim().toLowerCase();
    var onlyUnused = $('unused').checked;
    var shown = 0;
    document.querySelectorAll('details.cmd').forEach(function (d) {
      var ok = (!q || d.dataset.text.indexOf(q) >= 0) && (!onlyUnused || d.dataset.used === '0');
      d.hidden = !ok; if (ok) shown++;
    });
    document.querySelectorAll('#map [data-family]').forEach(function (g) {
      g.hidden = !g.querySelector('details.cmd:not([hidden])');
    });
    if ((q || onlyUnused)) document.querySelectorAll('details.part').forEach(function (p) { if (shown) p.open = true; });
    var old = document.getElementById('none'); if (old) old.remove();
    if (!shown) { var n = el('div', 'empty', 'No command matches.'); n.id = 'none'; $('map').appendChild(n); }
  }
  function load(quiet) {
    if (CONFIG.snapshot) { doc = CONFIG.snapshot; render(); return Promise.resolve(); }
    return fetch(CONFIG.describePath).then(function (r) { return r.json(); }).then(function (j) { doc = j; render(); })
      .catch(function (e) { if (!quiet) $('app').textContent = 'Could not read ' + CONFIG.describePath + ': ' + e.message; });
  }
  $('q').addEventListener('input', applyFilter);
  $('unused').addEventListener('change', applyFilter);
  load(false);
})();
</script>
</body>
</html>
`;
}
