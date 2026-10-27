import path from 'node:path';
import { app } from 'electron';

// Packaged builds copy the icon via electron-builder `extraResources`; renderer/src is not shipped.
export const getAppIconPath = (): string =>
  app.isPackaged
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(__dirname, '../renderer/src/assets/icon.png');
