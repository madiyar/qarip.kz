#!/usr/bin/env node
// Local admin for editors who don't use git.
//
//   npm run admin   (or double-click admin.cmd on Windows / admin.command on macOS)
//
// 1. Pulls the latest main, so the editor starts from what is on the site.
// 2. Serves public/ on localhost and opens /admin/. There the editor clicks
//    "Work with Local Repository" and picks this folder: Sveltia then saves
//    straight to disk, with no GitHub API and so no upload time-out.
// 3. Watches the content folders; a few seconds after a save it commits,
//    pulls (rebase) and pushes to main, and Netlify redeploys.
//
// No dependencies beyond Node itself, so it runs without `npm install`.

import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
// Everything the CMS writes to (see public/admin/config.yml). Only these are committed.
const CONTENT = ['public/fonts', 'public/images', 'src/content', 'src/data'];
// Locally files go to disk, not through the GitHub API, so the web cap (10 MB) doesn't apply.
// GitHub refuses files over 100 MB and warns from 50 MB.
const LOCAL_MAX_FILE = 50 * 1024 * 1024;
const QUIET_MS = 5000; // wait this long after the last change before committing
const RETRY_MS = 60_000;

const say = (m) => console.log(`[${new Date().toLocaleTimeString('ru-RU')}] ${m}`);
const warn = (m) => console.log(`\n  !!! ${m}\n`);

function git(...args) {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  // trimEnd, not trim: `git status --porcelain` lines start with a meaningful space.
  return { ok: r.status === 0, out: `${r.stdout || ''}${r.stderr || ''}`.trimEnd(), error: r.error };
}

// Commits need an author; fall back to a neutral one on machines where git isn't set up.
function identity() {
  if (git('config', 'user.email').out) return [];
  const name = `${os.userInfo().username} (qarip admin)`;
  return ['-c', `user.name=${name}`, '-c', 'user.email=admin@qarip.app'];
}

function changedContent() {
  const r = git('-c', 'core.quotepath=false', 'status', '--porcelain', '--', ...CONTENT);
  return r.out ? r.out.split('\n') : [];
}

function unpushed() {
  const r = git('rev-list', '--count', '@{u}..HEAD');
  return r.ok ? Number(r.out) : 0;
}

// "public/fonts/inter/Inter.zip" → "fonts/inter"; "src/content/journal/x.md" → "journal/x"
function topics(lines) {
  const set = new Set();
  for (const l of lines) {
    let p = l.slice(3).replace(/^"|"$/g, '');
    if (p.includes(' -> ')) p = p.split(' -> ')[1];
    const parts = p.replace(/^(public|src\/content|src)\//, '').split('/');
    set.add(parts.length > 1 ? `${parts[0]}/${parts[1].replace(/\.(json|md|ya?ml)$/, '')}` : parts[0]);
  }
  return [...set];
}

function abortStuckRebase() {
  const dir = git('rev-parse', '--git-dir').out;
  if (['rebase-merge', 'rebase-apply'].some((d) => fs.existsSync(path.resolve(ROOT, dir, d)))) git('rebase', '--abort');
}

function pull() {
  const r = git('pull', '--rebase', '--autostash', 'origin', 'main');
  if (r.ok) return true;
  abortStuckRebase();
  if (/CONFLICT|could not apply/i.test(r.out)) return parkConflict();
  warn('Не удалось получить свежую версию сайта (нет интернета?). Попробую позже.\n    ' + r.out.split('\n').slice(-3).join('\n    '));
  return false;
}

// Someone else changed the same entry. Rather than leave the editor stuck, put their local
// commits on a branch of their own on GitHub (the owner merges it by hand) and return this
// copy to the site's current version, so the editor can carry on.
function parkConflict() {
  const branch = `conflict/${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}`;
  const saved = git('push', '-q', 'origin', `HEAD:refs/heads/${branch}`);
  const dirty = git('status', '--porcelain', '--untracked-files=no').out;
  if (!saved.ok || dirty) {
    warn(
      'Кто-то другой одновременно изменил ту же запись, и ваши правки нельзя отправить автоматически.\n' +
        '  Они сохранены на этом компьютере. Напишите Мадияру.' +
        (saved.ok ? '' : '\n    ' + saved.out),
    );
    return false;
  }
  git('reset', '-q', '--hard', 'origin/main');
  warn(
    'Кто-то другой одновременно изменил ту же запись.\n' +
      `  Ваша версия сохранена отдельно на GitHub (ветка ${branch}) — Мадияр её посмотрит.\n` +
      '  Здесь теперь свежая версия сайта: ОБНОВИТЕ СТРАНИЦУ АДМИНКИ (F5) и продолжайте.',
  );
  return true;
}

let busy = false;
let retryTimer = null;

/** Commit what the CMS saved, then pull and push. Returns true when everything is on GitHub. */
function sync() {
  if (busy) return false;
  busy = true;
  try {
    const lines = changedContent();
    if (lines.length) {
      const what = topics(lines);
      git('add', '-A', '--', ...CONTENT);
      const msg = `content: ${what.slice(0, 4).join(', ')}${what.length > 4 ? ` +${what.length - 4}` : ''} (local admin)`;
      const c = git(...identity(), 'commit', '-q', '-m', msg);
      if (!c.ok) {
        warn('Не удалось сохранить изменения в git:\n    ' + c.out);
        return false;
      }
      say(`Сохранено: ${what.join(', ')}`);
    }
    if (!unpushed()) return true;
    if (!pull()) return false;
    if (!unpushed()) return true; // the commits were parked on a conflict branch
    say('Отправляю на сайт…');
    const p = git('push', '-q', 'origin', 'HEAD:main');
    if (!p.ok) {
      warn('Не удалось отправить на сайт (нет интернета или нужен вход в GitHub). Попробую ещё раз через минуту.\n    ' + p.out);
      clearTimeout(retryTimer);
      retryTimer = setTimeout(sync, RETRY_MS);
      return false;
    }
    say('✓ Отправлено. Сайт обновится через 2–3 минуты.');
    return true;
  } finally {
    busy = false;
  }
}

// ---------- start ----------

console.log('\n  Qarip — локальная админка\n');

if (git('--version').error) {
  warn('Не найден git. Установите Git (https://git-scm.com) и запустите заново.');
  process.exit(1);
}
if (!git('rev-parse', '--is-inside-work-tree').ok) {
  warn(`Папка ${ROOT} — не копия репозитория. Скачайте её через git clone.`);
  process.exit(1);
}
abortStuckRebase();

say('Получаю свежую версию сайта…');
// Edits left from a previous run (window closed before the push) go out first.
sync();
if (!pull()) say('Продолжаю со старой версией.');
else say('Версия свежая.');

// ---------- static server for public/ ----------

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.yml': 'text/yaml; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (url === '/' || url === '/admin') {
    res.writeHead(302, { Location: '/admin/' });
    return res.end();
  }
  if (url.endsWith('/')) url += 'index.html';
  const file = path.join(PUBLIC, url);
  if (!file.startsWith(PUBLIC + path.sep)) {
    res.writeHead(403);
    return res.end();
  }
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    let body = buf;
    if (url === '/admin/config.yml') {
      body = buf.toString('utf8').replace(/max_file_size: \d+/g, `max_file_size: ${LOCAL_MAX_FILE}`);
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  });
});

function listen(port, tries = 10) {
  server.once('error', (e) => {
    if (e.code === 'EADDRINUSE' && tries > 0) listen(port + 1, tries - 1);
    else throw e;
  });
  server.listen(port, '127.0.0.1', () => started(port));
}

function openBrowser(url) {
  const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
  spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true }).unref();
}

function started(port) {
  const url = `http://localhost:${port}/admin/`;
  console.log(`
  Админка открыта: ${url}
  (нужен Chrome или Edge — в Safari и Firefox локальный режим не работает)

  1. Нажмите «Work with Local Repository».
  2. Выберите папку:  ${ROOT}
  3. Работайте как обычно. После «Save» изменения сами уйдут на сайт.

  Не закрывайте это окно, пока работаете.
  Закрывать — после строки «✓ Отправлено» (или нажмите Ctrl+C).
`);
  if (!process.env.NO_OPEN) openBrowser(url);
  watch();
}

// ---------- watch content folders ----------

function watch() {
  let timer = null;
  const onChange = (dir) => (_event, name) => {
    if (busy || !name || /(^|[\\/])\.DS_Store$/.test(name)) return;
    clearTimeout(timer);
    timer = setTimeout(sync, QUIET_MS);
  };
  for (const d of CONTENT) {
    const abs = path.join(ROOT, d);
    if (fs.existsSync(abs)) fs.watch(abs, { recursive: true }, onChange(d));
  }
}

function stop() {
  console.log('');
  say('Закрываю: проверяю, всё ли отправлено…');
  sync();
  if (changedContent().length || unpushed()) warn('Не всё отправлено. Запустите админку ещё раз — она отправит остальное.');
  else say('Всё отправлено. Окно можно закрыть.');
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('SIGHUP', stop); // the console window is closed

listen(4300);
