export abstract class GameLoop {
  updateMs: number;
  drawMs: number;
  lastDraw: number;
  lastUpdate: number;
  lastAnimRequest: number;
  running: boolean;

  constructor(updateMs: number, drawMs: number) {
    this.updateMs = updateMs;
    this.drawMs = drawMs;
    this.lastDraw = 0;
    this.lastUpdate = 0;
    this.lastAnimRequest = 0;
    this.running = false;
  }

  start() {
    if (this.running) {
      return;
    }
    this.running = true;
    this.lastAnimRequest = window.requestAnimationFrame(this.loop.bind(this));
  }

  stop() {
    if (!this.running) {
      return;
    }
    this.running = false;
    window.cancelAnimationFrame(this.lastAnimRequest);
  }

  loop(timeStamp: DOMHighResTimeStamp): void {
    const started = window.performance.now();
    this.lastAnimRequest = window.requestAnimationFrame(this.loop.bind(this));

    let soFar = window.performance.now() - started;
    const draw_elapsed = (timeStamp + soFar) - this.lastDraw;
    if (draw_elapsed > this.drawMs) {
      this.draw(timeStamp + soFar);
      this.lastDraw = timeStamp + soFar;
    }

    soFar = window.performance.now() - started;
    const update_elapsed = (timeStamp + soFar) - this.lastUpdate;
    if (update_elapsed > this.updateMs) {
      this.update(timeStamp + soFar);
      this.lastUpdate = timeStamp + soFar;
    }
  }

  abstract draw(timeStamp: number): void;

  abstract update(timeStamp: number): void;

}