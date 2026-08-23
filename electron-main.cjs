const { app, BrowserWindow, ipcMain, safeStorage } = require('electron');
const { mkdir, readFile, rename, unlink, writeFile } = require('node:fs/promises');
const { existsSync } = require('node:fs');
const { dirname, join } = require('node:path');
const { createMarketServer, resetToken } = require('./desktop.cjs');

let mainWindow;
let marketServer;
let credentialsPath;

function assertOwnWindow(event) {
  if (!mainWindow || event.sender !== mainWindow.webContents) throw new Error('허용되지 않은 설정 요청입니다.');
}

async function cryptAvailable() {
  return safeStorage.isAsyncEncryptionAvailable ? safeStorage.isAsyncEncryptionAvailable() : safeStorage.isEncryptionAvailable();
}

async function encrypt(value) {
  return safeStorage.encryptStringAsync ? safeStorage.encryptStringAsync(value) : safeStorage.encryptString(value);
}

async function decrypt(value) {
  return safeStorage.decryptStringAsync ? safeStorage.decryptStringAsync(value) : safeStorage.decryptString(value);
}

async function getCredentials() {
  if (!existsSync(credentialsPath)) return null;
  if (!(await cryptAvailable())) throw new Error('Windows 보안 저장소를 사용할 수 없습니다.');
  const decoded = await decrypt(await readFile(credentialsPath));
  const credentials = JSON.parse(decoded);
  return credentials.clientId && credentials.clientSecret ? credentials : null;
}

async function saveCredentials(clientId, clientSecret) {
  if (typeof clientId !== 'string' || typeof clientSecret !== 'string' || !clientId.trim() || !clientSecret.trim()) {
    throw new Error('Client ID와 Client Secret을 모두 입력하세요.');
  }
  if (!(await cryptAvailable())) throw new Error('Windows 보안 저장소를 사용할 수 없습니다.');
  await mkdir(dirname(credentialsPath), { recursive: true });
  const encrypted = await encrypt(JSON.stringify({ clientId: clientId.trim(), clientSecret: clientSecret.trim() }));
  const temporary = `${credentialsPath}.tmp`;
  await writeFile(temporary, encrypted, { mode: 0o600 });
  await rename(temporary, credentialsPath);
  resetToken();
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 820,
    minWidth: 760,
    minHeight: 620,
    title: 'TwinTicker',
    backgroundColor: '#f7f8fc',
    webPreferences: { preload: join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  mainWindow.removeMenu();
  mainWindow.loadURL(`http://127.0.0.1:${port}/`);
}

app.whenReady().then(async () => {
  credentialsPath = join(app.getPath('userData'), 'toss-credentials.bin');
  ipcMain.handle('settings:status', async (event) => {
    assertOwnWindow(event);
    return { configured: Boolean(await getCredentials()), encryptionAvailable: await cryptAvailable() };
  });
  ipcMain.handle('settings:save', async (event, values) => {
    assertOwnWindow(event);
    await saveCredentials(values?.clientId, values?.clientSecret);
    return { configured: true };
  });
  ipcMain.handle('settings:clear', async (event) => {
    assertOwnWindow(event);
    if (existsSync(credentialsPath)) await unlink(credentialsPath);
    resetToken();
    return { configured: false };
  });
  marketServer = createMarketServer(getCredentials);
  marketServer.listen(0, '127.0.0.1', () => createWindow(marketServer.address().port));
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(marketServer.address().port);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => marketServer?.close());
