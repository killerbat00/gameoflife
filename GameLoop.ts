export abstract class GameLoop {
  logicUpdateMs: number;
  updateMs: number;
  drawMs: number;
  lastLogicUpdate: number;
  lastDraw: number;
  lastUpdate: number;
  lastAnimRequest: number;
  running: boolean;

  constructor(logicUpdateMs: number, updateMs: number, drawMs: number) {
    this.logicUpdateMs = logicUpdateMs;
    this.updateMs = updateMs;
    this.drawMs = drawMs;
    this.lastLogicUpdate = 0;
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
      console.log("Drawing...");
      this.draw(timeStamp + soFar);
      this.lastDraw = timeStamp + soFar;
    }

    soFar = window.performance.now() - started;
    const update_elapsed = (timeStamp + soFar) - this.lastUpdate;
    if (update_elapsed > this.updateMs) {
      console.log("Updating...");
      this.update(timeStamp + soFar);
      this.lastUpdate = timeStamp + soFar;
    }

    soFar = window.performance.now() - started;
    const logic_update_elapsed = (timeStamp + soFar) - this.lastLogicUpdate;
    if (logic_update_elapsed > this.logicUpdateMs) {
      console.log("Updating Logic...");
      this.logicUpdate(timeStamp + soFar);
      this.lastLogicUpdate = timeStamp + soFar;
    }
  }

  abstract draw(timeStamp: number): void;

  abstract update(timeStamp: number): void;

  abstract logicUpdate(timeStamp: number): void;

}