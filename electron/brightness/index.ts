export interface BrightnessService {
  getBrightness(): Promise<number>; // 0-1
  setBrightness(level: number): Promise<void>;
}
