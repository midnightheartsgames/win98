const { execFileSync } = require('child_process');

const USAGE = 'node tools/net.cjs stats | desync | ban <uid> | unban <uid> | rename <uid> | unrename <uid> | book-clear <uid>';
const UID_COMMANDS = ['ban', 'unban', 'rename', 'unrename', 'book-clear'];

function adminRoute(argv) {
  const [cmd, uid] = argv;
  if (cmd === 'stats' || cmd === 'desync') return cmd;
  if (UID_COMMANDS.includes(cmd) && /^7\d{8}$/.test(uid || '')) return cmd + '/' + uid;
  return null;
}

function main() {
  const route = adminRoute(process.argv.slice(2));
  if (!route) { console.error(USAGE); process.exit(1); }
  const out = execFileSync('ssh', ['mini-pc', 'curl -s http://127.0.0.1:39900/api/net/admin/' + route], { encoding: 'utf8' });
  console.log(JSON.stringify(JSON.parse(out), null, 2));
}

if (require.main === module) main();

module.exports = { adminRoute };
