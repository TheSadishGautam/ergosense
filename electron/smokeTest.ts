import fs from 'node:fs';
import { app, BrowserWindow, nativeImage } from 'electron';
import { getAppIconPath } from './appIcon';
import type { MLEngine } from './mlEngine';

// Opt-in self-check for CI: `ERGOSENSE_SMOKE_TEST=<result.json>` launches the packaged app,
// verifies the parts that break per-platform (native modules, bundled resources, IPC), then exits.

export const SMOKE_TEST_OUTPUT = process.env.ERGOSENSE_SMOKE_TEST;

const TIMEOUT_MS = 90_000;

const waitForLoad = (win: BrowserWindow) =>
  win.webContents.isLoading()
    ? new Promise<void>((resolve) => win.webContents.once('did-finish-load', () => resolve()))
    : Promise.resolve();

export async function runSmokeTest(win: BrowserWindow, mlEngine: MLEngine, outputFile: string) {
  const timer = setTimeout(() => {
    fs.writeFileSync(outputFile, JSON.stringify({ ok: false, error: 'timeout' }, null, 2));
    app.exit(2);
  }, TIMEOUT_MS);

  const checks: Record<string, unknown> = {};
  try {
    checks.modelsLoaded = await mlEngine.modelsLoaded();
    checks.database = Boolean(mlEngine.getStore().getNotificationSettings());
    checks.icon = !nativeImage.createFromPath(getAppIconPath()).isEmpty();

    await waitForLoad(win);
    // Round-trips renderer -> preload -> IPC -> main -> SQLite, which also exercises the sender check.
    checks.rendererIpc = await win.webContents.executeJavaScript(
      'window.electronAPI.getNotificationSettings().then((s) => Boolean(s && s.posture))'
    );
  } catch (err) {
    checks.error = err instanceof Error ? err.message : String(err);
  }

  const ok = ['modelsLoaded', 'database', 'icon', 'rendererIpc'].every((key) => checks[key] === true);
  const result = {
    ok,
    checks,
    platform: process.platform,
    arch: process.arch,
    electron: process.versions.electron,
    resourcesPath: process.resourcesPath,
  };

  clearTimeout(timer);
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
  app.exit(ok ? 0 : 1);
}
