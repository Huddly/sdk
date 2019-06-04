const execa = require('execa');
const cpy = require('cpy');
const path = require('path');

async function execute() {
  const pkg = path.join(__dirname, 'node_modules/.bin/pkg');
  const {stdout} = await execa(pkg, ['.', '--out-path', './dist'], { shell: true });
  const lines = stdout.split(/[\r\n]+/);
  const addons = [];
  let i = 0;
  while (i < lines.length - 1) {
    const [line, next] = lines.slice(i, i + 2).map(s => s && s.trim());
    i += 1;
    if (
      line && next &&
      line.startsWith('The addon must be distributed') &&
      next.indexOf('win32-x64') > 0 &&
      next.endsWith('.node')) {
        addons.push(next);
        // already know the next was match, so skip 2
        i += 1;
    }
    continue;
  }
  if (addons.length) {
    await cpy(addons, './dist');
  }
}

execute();