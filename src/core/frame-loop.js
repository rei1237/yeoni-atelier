// [이식] rei1237/killerflowerpig @1e33016 src/core/frame-loop.js 를 그대로 가져왔다(동작 변경 없음).
// 숨김/BFCache 상태에서는 프레임 작업을 하지 않고, 복귀 시 시계를 리셋해 다른 앱에 있던 시간을 시뮬레이션하지 않는다.
// Own exactly one animation request. Hidden/BFCache pages do no frame work;
// resuming resets the clock instead of simulating time spent in another app.
export function createFrameLoop({ frame, reset, onSuspend, onResume, host = window, page = document }) {
    let started = false, suspended = !!page.hidden, request = null;
    const schedule = () => {
        if (started && !suspended && request === null) request = host.requestAnimationFrame(tick);
    };
    const tick = now => {
        request = null;
        if (!started || suspended) return;
        frame(now);
        schedule();
    };
    const suspend = () => {
        if (request !== null) host.cancelAnimationFrame(request);
        request = null;
        if (!suspended) { suspended = true; onSuspend?.(); }
        reset();
    };
    const resume = () => {
        if (page.hidden) return;
        const wasSuspended = suspended;
        suspended = false;
        reset();
        if (wasSuspended) onResume?.();
        schedule();
    };
    page.addEventListener('visibilitychange', () => page.hidden ? suspend() : resume());
    host.addEventListener('pagehide', suspend);
    host.addEventListener('pageshow', resume);
    return { start() { started = true; reset(); schedule(); }, suspend, resume };
}
