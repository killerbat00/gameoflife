export abstract class GameLoop {
    last_draw_time: number;
    last_update_time: number;
    last_anim_request: number;
    running: boolean;
    update_after_ms: number;
    draw_after_ms: number;

    constructor(update_after_ms: number, draw_after_ms: number) {
        this.last_draw_time = 0;
        this.last_update_time = 0;
        this.running = false;
        this.last_anim_request = 0;
        this.update_after_ms = update_after_ms;
        this.draw_after_ms = draw_after_ms;
    }

    start() {
        if (this.running) {
            return;
        }
        this.running = true;
        this.last_anim_request = window.requestAnimationFrame(this.loop.bind(this));
    }

    stop() {
        if (!this.running) {
            return;
        }
        this.running = false;
        window.cancelAnimationFrame(this.last_anim_request);
    }

    loop(timeStamp: number): void {
        this.last_anim_request = window.requestAnimationFrame(this.loop.bind(this));

        const draw_elapsed = timeStamp - this.last_draw_time;
        const update_elapsed = timeStamp - this.last_update_time;

        if (update_elapsed > this.update_after_ms) {
            this.update(timeStamp);
            this.last_update_time = timeStamp;
        }

        if (draw_elapsed > this.draw_after_ms) {
            this.draw(timeStamp);
            this.last_draw_time = timeStamp;
        }
    }

    abstract draw(timeStamp: number): void;

    abstract update(timeStamp: number): void;
}