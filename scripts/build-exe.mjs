import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { execFile as run } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postject from 'postject';

const execFile = promisify(run);
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(scriptDirectory);
const version = process.env.npm_package_version || '0.1.0-alpha.2';
const outputDirectory = join(projectRoot, 'dist');
const outputFile = join(outputDirectory, `TwinTicker-Alpha-${version}.exe`);
const configFile = join(outputDirectory, 'sea-config.json');
const blobFile = join(outputDirectory, 'twinticker.sea.blob');

if (process.platform !== 'win32') {
  throw new Error('The portable executable is built on Windows.');
}

await mkdir(outputDirectory, { recursive: true });
await writeFile(configFile, JSON.stringify({
  main: join(projectRoot, 'desktop.cjs'),
  output: blobFile,
  disableExperimentalSEAWarning: true,
  assets: {
    'index.html': join(projectRoot, 'index.html'),
    'styles.css': join(projectRoot, 'styles.css'),
    'app.js': join(projectRoot, 'app.js'),
    'core.js': join(projectRoot, 'core.js')
  }
}, null, 2));

try {
  await execFile(process.execPath, ['--experimental-sea-config', configFile], { cwd: projectRoot });
  await copyFile(process.execPath, outputFile);
  await postject.inject(outputFile, 'NODE_SEA_BLOB', await readFile(blobFile), {
    sentinelFuse: 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2'
  });
  const output = await stat(outputFile);
  console.log(`Created ${outputFile} (${output.size} bytes)`);
} finally {
  await Promise.all([rm(configFile, { force: true }), rm(blobFile, { force: true })]);
}
