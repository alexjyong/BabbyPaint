document.addEventListener('deviceready', onDeviceReady, false);

var color = $(".selected").css("background-color");
var $canvas = $("#mainCanvas");
var context = $canvas[0].getContext("2d");
var lastEvent;
var mouseDown = false;

var lockButton = $('#lockButton');
var clearButton = $('#clearButton');
var isLocked = false;
var tapCount = 0;
var lastTap = 0;

// Function to resize the canvas
function resizeCanvas() {
    var canvas = $canvas[0];  // Access the native DOM element of the canvas
    var dpr = window.devicePixelRatio || 1;

    // Clear the canvas before resizing to avoid stretched content
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Resize canvas to fit 90% of the window width and 80% of the height
    var width = window.innerWidth * 0.9;
    var height = window.innerHeight * 0.8;

    // Set CSS size
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    // Set the actual size in device pixels
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Reset the scaling transformation (clear any previous scale)
    context.setTransform(1, 0, 0, 1, 0, 0);
    
    // Apply scaling to match the device pixel ratio (DPR)
    context.scale(dpr, dpr);
}

// Call resizeCanvas on load and window resize
function onDeviceReady() {
    console.log('Cordova is ready');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

// Clear button event
clearButton.on('click', function() {
    context.clearRect(0, 0, $canvas[0].width, $canvas[0].height);
});

// Color selection
$(".controls").on("click", "li", function () {
    $(this).siblings().removeClass("selected");
    $(this).addClass("selected");
    color = $(this).css("background-color");
});

// Function to get touch position, accounting for canvas size and scaling
function getTouchPos(touchEvent) {
    var rect = $canvas[0].getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;

    // Adjust touch coordinates for canvas size and scaling
    return {
        offsetX: (touchEvent.touches[0].clientX - rect.left) * ($canvas[0].width / rect.width) / dpr,
        offsetY: (touchEvent.touches[0].clientY - rect.top) * ($canvas[0].height / rect.height) / dpr
    };
}

// On touch events
$canvas.on('touchstart', function (e) {
    e.preventDefault();
    var touchPos = getTouchPos(e.originalEvent);
    lastEvent = touchPos;
    mouseDown = true;
}).on('touchmove', function (e) {
    e.preventDefault();
    if (mouseDown) {
        var touchPos = getTouchPos(e.originalEvent);
        context.beginPath();
        context.moveTo(lastEvent.offsetX, lastEvent.offsetY);
        context.lineTo(touchPos.offsetX, touchPos.offsetY);
        context.strokeStyle = color;
        context.lineWidth = 5;
        context.lineCap = 'round';
        context.stroke();
        lastEvent = touchPos;
    }
}).on('touchend', function () {
    mouseDown = false;
});

$canvas.on('touchcancel', function () {
    mouseDown = false;
});

// On mouse events
$canvas.mousedown(function (e) {
    lastEvent = e;
    mouseDown = true;
}).mousemove(function (e) {
    if (mouseDown) {
        context.beginPath();
        context.moveTo(lastEvent.offsetX, lastEvent.offsetY);
        context.lineTo(e.offsetX, e.offsetY);
        context.strokeStyle = color;
        context.lineWidth = 5;
        context.lineCap = 'round';
        context.stroke();
        lastEvent = e;
    }
}).mouseup(function () {
    mouseDown = false;
}).mouseleave(function () {
    $canvas.mouseup();
});

// Lock button event
lockButton.on('click', function() {
    if (!isLocked) {
        cordova.plugins.screenPinning.enterPinnedMode(
            function () {
                console.log("Pinned mode activated!");
                isLocked = true;
                lockButton.text('Tap 4 times quickly to unlock');
            },
            function (errorMessage) {
                console.log("Error activating pinned mode:", errorMessage);
            }
        );
    } else {
        var currentTime = Date.now();
        if (currentTime - lastTap < 500) {
            tapCount++;
            if (tapCount >= 4) {
                cordova.plugins.screenPinning.exitPinnedMode(
                    function () {
                        console.log("Pinned mode deactivated!");
                        isLocked = false;
                        tapCount = 0;
                        lockButton.text('Lock');
                    },
                    function (errorMessage) {
                        console.log("Error deactivating pinned mode:", errorMessage);
                    }
                );
            }
        } else {
            tapCount = 1;
        }
        lastTap = currentTime;
    }
});

// Clear canvas on 3 button click
clearButton.on('click', function() {
    var currentTime = Date.now();
        if (currentTime - lastTap < 500) {
            tapCount++;
            if (tapCount >= 3) {
                context.clearRect(0, 0, $canvas[0].width, $canvas[0].height);
            }
        } else {
            tapCount = 1;
        }
        lastTap = currentTime;
});
