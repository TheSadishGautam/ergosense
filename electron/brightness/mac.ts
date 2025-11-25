import { BrightnessService } from './index';
import brightness from 'brightness';

export class MacBrightnessService implements BrightnessService {
  async getBrightness(): Promise<number> {
    try {
      return await brightness.get();
    } catch (e) {
      console.error('Failed to get brightness:', e);
      return 1.0;
    }
  }

  async setBrightness(level: number): Promise<void> {
    try {
      await brightness.set(level);
    } catch (e) {
      console.error('Failed to set brightness:', e);
    }
  }
}
