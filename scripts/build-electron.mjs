import { cp, mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(scriptDirectory);
const electronDirectory = join(projectRoot, 'node_modules', 'electron', 'dist');
const outputDirectory = join(projectRoot, 'dist', 'TwinTicker-Desktop-win32-x64');
const appDirectory = join(outputDirectory, 'resources', 'app');
const appFiles = ['app.js', 'core.js', 'desktop.cjs', 'electron-main.cjs', 'index.html', 'preload.cjs', 'styles.css'];

if (process.platform !== 'win32') throw new Error('Windows 앱 패키지는 Windows에서만 빌드할 수 있습니다.');

await rm(outputDirectory, { recursive: true, force: true });
await cp(electronDirectory, outputDirectory, { recursive: true });
await rename(join(outputDirectory, 'electron.exe'), join(outputDirectory, 'TwinTicker.exe'));
await mkdir(appDirectory, { recursive: true });
await Promise.all(appFiles.map((file) => cp(join(projectRoot, file), join(appDirectory, file))));
await writeFile(join(appDirectory, 'package.json'), JSON.stringify({ name: 'twinticker', productName: 'TwinTicker', version: process.env.npm_package_version || '0.1.0', main: 'electron-main.cjs', private: true }, null, 2));
console.log(`Created ${join(outputDirectory, 'TwinTicker.exe')}`);
