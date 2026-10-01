const TRIGGER = 0.55;
const RESET = 0.3;
const RAD = Math.PI / 180;

export class TiltDetector {
  constructor(onTilt) {
    this.onTilt = onTilt;
    this.armed = false;
    this.handler = (e) => this.handle(e);
  }

  static get supported() {
    return 'DeviceOrientationEvent' in window;
  }

  async start() {
    if (!TiltDetector.supported) return false;
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        if (await DeviceOrientationEvent.requestPermission() !== 'granted') return false;
      } catch {
        return false;
      }
    }
    this.armed = false;
    window.addEventListener('deviceorientation', this.handler);
    return true;
  }

  stop() {
    window.removeEventListener('deviceorientation', this.handler);
  }

  handle(e) {
    if (e.beta == null || e.gamma == null) return;
    const screenUp = Math.cos(e.beta * RAD) * Math.cos(e.gamma * RAD);
    if (this.armed) {
      if (screenUp < -TRIGGER) {
        this.armed = false;
        this.onTilt(true);
      } else if (screenUp > TRIGGER) {
        this.armed = false;
        this.onTilt(false);
      }
    } else if (Math.abs(screenUp) < RESET) {
      this.armed = true;
    }
  }
}
