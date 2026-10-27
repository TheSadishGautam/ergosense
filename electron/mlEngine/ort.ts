import type * as ORT from 'onnxruntime-node';
import { app, dialog } from 'electron';

const VC_REDIST_URL = 'https://aka.ms/vs/17/release/vc_redist.x64.exe';

const isMissingWindowsRuntime = (e: unknown): boolean => {
  const message = e instanceof Error ? e.message : String(e);
  // DLL load failures surface as "The specified module could not be found" / ERR_DLOPEN_FAILED.
  return /specified module could not be found|ERR_DLOPEN_FAILED|vcruntime|msvcp/i.test(message);
};

const loadOrt = (): typeof ORT => {
  try {
    return require('onnxruntime-node');
  } catch (e) {
    const message = (e as Error).message;
    // Runs at import time, before app 'ready' — showErrorBox is the only dialog safe to use here.
    if (process.platform === 'win32' && isMissingWindowsRuntime(e)) {
      dialog.showErrorBox(
        'Missing System Dependency',
        `ErgoSense needs the Microsoft Visual C++ Redistributable 2015-2022 (x64).\n\nDownload it from ${VC_REDIST_URL}, install it, then start ErgoSense again.\n\nError: ${message}`
      );
    } else {
      dialog.showErrorBox('ErgoSense failed to start', `The AI engine could not be loaded.\n\nError: ${message}`);
    }
    app.exit(1);
    throw e;
  }
};

export const ort = loadOrt();
export type { ORT };
