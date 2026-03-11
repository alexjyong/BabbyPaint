document.addEventListener('DOMContentLoaded', function () {

    var canvas = document.getElementById('mainCanvas');
    var context = canvas.getContext('2d');
    var color = '#34495E'; // default: black swatch
    var lineWidth = 5;
    var isEraser = false;
    var mouseDown = false;
    var undoStack = [];
    var redoStack = [];
    var MAX_UNDO = 20;
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
    window.addEventListener('resize', function () {
        resizeCanvas();
        undoStack = [];
        redoStack = [];
        undoButton.disabled = true;
        redoButton.disabled = true;
    });

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

    // ── Undo ─────────────────────────────────────────────────────────────────

    function saveUndoState() {
        undoStack.push(context.getImageData(0, 0, canvas.width, canvas.height));
        if (undoStack.length > MAX_UNDO) undoStack.shift();
        undoButton.disabled = false;
        redoStack = [];
        redoButton.disabled = true;
    }

    // ── Color selection ──────────────────────────────────────────────────────

    var colorList = document.querySelector('ul.colors');
    var eraserButton = document.getElementById('eraserButton');
    var undoButton = document.getElementById('undoButton');
    var redoButton = document.getElementById('redoButton');
    colorList.addEventListener('click', function (e) {
        var target = e.target;
        if (target.tagName !== 'LI') return;
        var prev = colorList.querySelector('.selected');
        if (prev) prev.classList.remove('selected');
        target.classList.add('selected');
        color = getComputedStyle(target).backgroundColor;
        // deactivate eraser when a colour is chosen
        isEraser = false;
        eraserButton.classList.remove('eraser-active');
    });

    // ── Brush size selection ──────────────────────────────────────────────────

    var sizeList = document.querySelector('ul.sizes');
    sizeList.addEventListener('click', function (e) {
        var target = e.target.closest('li');
        if (!target) return;
        var prev = sizeList.querySelector('.selected');
        if (prev) prev.classList.remove('selected');
        target.classList.add('selected');
        lineWidth = parseInt(target.dataset.size, 10);
    });

    // ── Drawing helpers ──────────────────────────────────────────────────────

    function drawLine(fromX, fromY, toX, toY) {
        context.beginPath();
        context.moveTo(fromX, fromY);
        context.lineTo(toX, toY);
        context.lineWidth = lineWidth;
        context.lineCap = 'round';
        if (isEraser) {
            context.globalCompositeOperation = 'destination-out';
            context.strokeStyle = 'rgba(0,0,0,1)';
        } else {
            context.globalCompositeOperation = 'source-over';
            context.strokeStyle = color;
        }
        context.stroke();
        context.globalCompositeOperation = 'source-over';
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
        saveUndoState();
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
        saveUndoState();
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
    var clearSubFab = document.getElementById('clearSubFab');
    var lockButton = document.getElementById('lockButton');
    var isLocked = false;
    var tapCountLock = 0;
    var lastTapLock = 0;

    // Hide lock button when ScreenPinning is unavailable; clear FAB always shows
    if (!ScreenPinning) {
        lockButton.style.display = 'none';
    }

    fabButton.addEventListener('click', function () {
        fabButton.classList.toggle('expanded');
        clearSubFab.classList.toggle('expanded');
        if (ScreenPinning) lockButton.classList.toggle('expanded');
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

    undoButton.addEventListener('click', function () {
        if (undoStack.length === 0) return;
        redoStack.push(context.getImageData(0, 0, canvas.width, canvas.height));
        redoButton.disabled = false;
        context.putImageData(undoStack.pop(), 0, 0);
        undoButton.disabled = undoStack.length === 0;
    });

    redoButton.addEventListener('click', function () {
        if (redoStack.length === 0) return;
        undoStack.push(context.getImageData(0, 0, canvas.width, canvas.height));
        undoButton.disabled = false;
        context.putImageData(redoStack.pop(), 0, 0);
        redoButton.disabled = redoStack.length === 0;
    });

    // ── Eraser ────────────────────────────────────────────────────────────────

    eraserButton.addEventListener('click', function () {
        isEraser = !isEraser;
        if (isEraser) {
            eraserButton.classList.add('eraser-active');
            var prev = colorList.querySelector('.selected');
            if (prev) prev.classList.remove('selected');
        } else {
            eraserButton.classList.remove('eraser-active');
        }
    });

    // ── Clear canvas (3-tap on FAB) ───────────────────────────────────────────

    var tapCountClear = 0;
    var lastTapClear = 0;
    var resetClearTimeout;

    clearSubFab.addEventListener('click', function () {
        clearTimeout(resetClearTimeout);
        var now = Date.now();

        if (lastTapClear === 0 || now - lastTapClear >= 1000) {
            tapCountClear = 1;
            showCustomToast('Tap 2 more times to clear', 900);
        } else {
            tapCountClear++;
            if (tapCountClear >= 3) {
                saveUndoState();
                context.clearRect(0, 0, canvas.width, canvas.height);
                tapCountClear = 0;
                lastTapClear = 0;
                return;
            } else {
                var remaining = 3 - tapCountClear;
                showCustomToast('Tap ' + remaining + ' more time' + (remaining === 1 ? '' : 's') + ' to clear', 900);
            }
        }

        lastTapClear = now;
        resetClearTimeout = setTimeout(function () {
            tapCountClear = 0;
            lastTapClear = 0;
        }, 1000);
    });

});
