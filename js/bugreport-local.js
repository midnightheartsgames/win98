const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ID_PATTERN = /^BR-\d{6}-[0-9A-HJKMNP-TV-Z]{4}$/;
const FILE_NAMES = new Set(['shot.png', 'shot.jpg', 'shot-marked.png', 'shot-marked.jpg', 'shot-window.png', 'shot-window.jpg', 'save.json.gz']);
const MAX_BODY = 10 * 1024 * 1024;
const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;

function bugsDir(root) {
  const dir = process.env.WIN98_BUGS_DIR || path.join(root, 'bugreports');
  return fs.existsSync(dir) ? dir : null;
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function gitBuild(root) {
  const git = args => execFileSync('git', args, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  try {
    return { commit: git(['rev-parse', '--short', 'HEAD']), date: git(['log', '-1', '--format=%cs']), dirty: git(['status', '--porcelain']).length > 0 };
  } catch (err) {
    return {};
  }
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    req.on('data', chunk => {
      size += chunk.length;
      if (tooLarge) return;
      if (size > limit) {
        tooLarge = true;
        chunks.length = 0;
        reject(Object.assign(new Error('report too large'), { status: 413 }));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function validate(data) {
  if (!data || data.format !== 'win98-bugreport-file' || data.v !== 1) return 'bad file format';
  const report = data.report;
  if (!report || report.format !== 'win98-bugreport' || report.v !== 1) return 'bad report format';
  if (!ID_PATTERN.test(String(report.id))) return 'bad report id';
  const files = data.files || {};
  if (typeof files !== 'object' || Array.isArray(files)) return 'bad files';
  for (const [name, value] of Object.entries(files)) {
    if (!FILE_NAMES.has(name)) return 'unexpected file ' + name;
    if (typeof value !== 'string' || !BASE64.test(value)) return 'bad file data ' + name;
  }
  return '';
}

async function receive(req, res, dir) {
  let data;
  try {
    data = JSON.parse((await readBody(req, MAX_BODY)).toString('utf8'));
  } catch (err) {
    sendJson(res, err.status || 400, { ok: false, error: err.status ? err.message : 'bad json' });
    return;
  }
  const problem = validate(data);
  if (problem) {
    sendJson(res, 400, { ok: false, error: problem });
    return;
  }
  const id = data.report.id;
  const target = path.join(dir, id);
  try {
    fs.mkdirSync(target);
  } catch (err) {
    sendJson(res, err.code === 'EEXIST' ? 409 : 500, { ok: false, error: err.code === 'EEXIST' ? 'duplicate id' : 'cannot store report' });
    return;
  }
  fs.writeFileSync(path.join(target, 'report.json'), JSON.stringify(data.report, null, 2));
  for (const [name, value] of Object.entries(data.files || {})) fs.writeFileSync(path.join(target, name), Buffer.from(value, 'base64'));
  sendJson(res, 200, { ok: true, id, local: true });
}

function createBugHandler(root) {
  return function handleBugRequest(req, res) {
    const url = req.url.split('?')[0];
    if (url === '/build.json') {
      if (fs.existsSync(path.join(root, 'build.json'))) return false;
      sendJson(res, 200, Object.assign(gitBuild(root), { dev: true, version: 'dev' }));
      return true;
    }
    if (url !== '/api/bugs' && !url.startsWith('/api/bugs/')) return false;
    const dir = bugsDir(root);
    if (!dir) return false;
    if (req.method === 'GET' && url === '/api/bugs/ping') {
      sendJson(res, 200, { ok: true, v: 1, local: true });
      return true;
    }
    if (req.method === 'GET' && url.startsWith('/api/bugs/repro/')) {
      const id = url.slice('/api/bugs/repro/'.length);
      const folder = path.join(dir, id);
      if (!ID_PATTERN.test(id) || !fs.existsSync(path.join(folder, 'report.json'))) {
        sendJson(res, 404, { ok: false, error: 'no such report' });
        return true;
      }
      const report = JSON.parse(fs.readFileSync(path.join(folder, 'report.json'), 'utf8'));
      const saveFile = path.join(folder, 'save.json.gz');
      sendJson(res, 200, { ok: true, report: { id: report.id, where: report.where, user: report.user, source: report.source, apps: report.apps || {} }, save: fs.existsSync(saveFile) ? fs.readFileSync(saveFile).toString('base64') : null });
      return true;
    }
    if (req.method === 'POST' && url === '/api/bugs') {
      receive(req, res, dir).catch(() => {
        if (!res.headersSent) sendJson(res, 500, { ok: false, error: 'cannot store report' });
      });
      return true;
    }
    sendJson(res, 404, { ok: false, error: 'not found' });
    return true;
  };
}

module.exports = { createBugHandler, ID_PATTERN, FILE_NAMES };
