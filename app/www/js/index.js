document.addEventListener('DOMContentLoaded', function () {

    var canvas = document.getElementById('mainCanvas');
    var context = canvas.getContext('2d');
    var color = '#34495E'; // default: black swatch
    var mouseDown = false;
    var lastX = 0;
    var lastY = 0;
    var touchPositions = {}; // tracks last position per touch identifier

    // ── Canvas resize ────────────────────────────────────────────────────────

    function resizeCanvas() {
        var dpr = window.devicePixelRatio || 1;
        var width = window.innerWidth * 0.9;
        var height = window.innerHeight * 0.8;

        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        canvas.width = width * dpr;
        canvas.height = height * dpr;

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.scale(dpr, dpr);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // ── Toast ────────────────────────────────────────────────────────────────

    function showCustomToast(message, duration) {
        duration = duration || 3000;
        var container = document.getElementById('custom-toast-container');
        var toast = document.createElement('div');
        toast.classList.add('custom-toast');
        toast.textContent = message;
        container.appendChild(toast);

        requestAnimationFrame(function () {
            toast.classList.add('show');
        });

        setTimeout(function () {
            toast.classList.remove('show');
            setTimeout(function () {
                toast.remove();
            }, 300);
        }, duration);
    }

    // ── Color selection ──────────────────────────────────────────────────────

    var colorList = document.querySelector('.controls ul');
    colorList.addEventListener('click', function (e) {
        var target = e.target;
        if (target.tagName !== 'LI') return;
        var prev = colorList.querySelector('.selected');
        if (prev) prev.classList.remove('selected');
        target.classList.add('selected');
        color = getComputedStyle(target).backgroundColor;
    });

    // ── Drawing helpers ──────────────────────────────────────────────────────

    function drawLine(fromX, fromY, toX, toY) {
        context.beginPath();
        context.moveTo(fromX, fromY);
        context.lineTo(toX, toY);
        context.strokeStyle = color;
        context.lineWidth = 5;
        context.lineCap = 'round';
        context.stroke();
    }

    function getTouchCanvasPos(touch) {
        var rect = canvas.getBoundingClientRect();
        var dpr = window.devicePixelRatio || 1;
        return {
            x: (touch.clientX - rect.left) * (canvas.width / rect.width) / dpr,
            y: (touch.clientY - rect.top) * (canvas.height / rect.height) / dpr,
        };
    }

    // ── Mouse events ─────────────────────────────────────────────────────────

    canvas.addEventListener('mousedown', function (e) {
        mouseDown = true;
        lastX = e.offsetX;
        lastY = e.offsetY;
    });

    canvas.addEventListener('mousemove', function (e) {
        if (!mouseDown) return;
        drawLine(lastX, lastY, e.offsetX, e.offsetY);
        lastX = e.offsetX;
        lastY = e.offsetY;
    });

    canvas.addEventListener('mouseup', function () { mouseDown = false; });
    canvas.addEventListener('mouseleave', function () { mouseDown = false; });

    // ── Touch events ─────────────────────────────────────────────────────────

    canvas.addEventListener('touchstart', function (e) {
        e.preventDefault();
        mouseDown = true;
        for (var i = 0; i < e.changedTouches.length; i++) {
            var touch = e.changedTouches[i];
            var pos = getTouchCanvasPos(touch);
            touchPositions[touch.identifier] = pos;
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', function (e) {
        e.preventDefault();
        if (!mouseDown) return;
        var rect = canvas.getBoundingClientRect();
        for (var i = 0; i < e.changedTouches.length; i++) {
            var touch = e.changedTouches[i];
            var inside = touch.clientX >= rect.left && touch.clientX <= rect.right &&
                         touch.clientY >= rect.top  && touch.clientY <= rect.bottom;
            if (!inside) continue;
            var pos = getTouchCanvasPos(touch);
            var last = touchPositions[touch.identifier];
            if (last) drawLine(last.x, last.y, pos.x, pos.y);
            touchPositions[touch.identifier] = pos;
        }
    }, { passive: false });

    canvas.addEventListener('touchend', function (e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
            delete touchPositions[e.changedTouches[i].identifier];
        }
        if (Object.keys(touchPositions).length === 0) mouseDown = false;
    });
    canvas.addEventListener('touchcancel', function (e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
            delete touchPositions[e.changedTouches[i].identifier];
        }
        if (Object.keys(touchPositions).length === 0) mouseDown = false;
    });

    document.addEventListener('touchmove', function (e) {
        e.preventDefault();
    }, { passive: false });

    // ── Lock / screen pinning ─────────────────────────────────────────────────

    var ScreenPinning = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.ScreenPinning;
    var fabButton = document.getElementById('fabButton');
    var lockButton = document.getElementById('lockButton');
    var isLocked = false;
    var tapCountLock = 0;
    var lastTapLock = 0;

    // Hide FAB entirely when running outside Capacitor (e.g. plain browser)
    if (!ScreenPinning) {
        document.querySelector('.fab-container').style.display = 'none';
    }

    fabButton.addEventListener('click', function () {
        fabButton.classList.toggle('expanded');
        lockButton.classList.toggle('expanded');
    });

    lockButton.addEventListener('click', function () {
        if (!isLocked) {
            ScreenPinning.enterPinnedMode()
                .then(function () {
                    isLocked = true;
                    lockButton.textContent = 'Unlock app';
                    showCustomToast('Tap 4 times quickly to unlock', 2000);
                })
                .catch(function (err) {
                    console.error('enterPinnedMode failed', err);
                });
        } else {
            var now = Date.now();
            if (lastTapLock === 0 || now - lastTapLock >= 1000) {
                tapCountLock = 1;
                showCustomToast('Tap 3 more times quickly to unlock', 2000);
            } else {
                tapCountLock++;
                if (tapCountLock >= 4) {
                    ScreenPinning.exitPinnedMode()
                        .then(function () {
                            isLocked = false;
                            tapCountLock = 0;
                            lastTapLock = 0;
                            lockButton.textContent = 'Lock app';
                            showCustomToast('App unlocked', 2000);
                        })
                        .catch(function (err) {
                            console.error('exitPinnedMode failed', err);
                            showCustomToast('Error unlocking app', 2000);
                        });
                    return;
                } else {
                    var remaining = 4 - tapCountLock;
                    showCustomToast('Tap ' + remaining + ' more time' + (remaining === 1 ? '' : 's') + ' quickly to unlock', 2000);
                }
            }
            lastTapLock = now;
        }
    });

    // ── Clear canvas (3-tap confirmation) ────────────────────────────────────

    var clearButton = document.getElementById('clearButton');
    var tapCountClear = 0;
    var lastTapClear = 0;
    var resetClearTextTimeout;

    clearButton.addEventListener('click', function () {
        clearTimeout(resetClearTextTimeout);
        var now = Date.now();

        if (lastTapClear === 0 || now - lastTapClear >= 1000) {
            tapCountClear = 1;
            clearButton.textContent = 'Tap 2 more times quickly to clear';
        } else {
            tapCountClear++;
            if (tapCountClear >= 3) {
                context.clearRect(0, 0, canvas.width, canvas.height);
                tapCountClear = 0;
                clearButton.textContent = 'Clear Canvas';
            } else {
                var remaining = 3 - tapCountClear;
                clearButton.textContent = 'Tap ' + remaining + ' more time' + (remaining === 1 ? '' : 's') + ' quickly to clear';
            }
        }

        lastTapClear = now;

        resetClearTextTimeout = setTimeout(function () {
            clearButton.textContent = 'Clear Canvas';
            tapCountClear = 0;
            lastTapClear = 0;
        }, 1000);
    });

});
