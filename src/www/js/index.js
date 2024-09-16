document.addEventListener('deviceready', onDeviceReady, false);

var color = $(".selected").css("background-color");
var $canvas = $("#mainCanvas");
var context = $canvas[0].getContext("2d");
var lastEvent;
var mouseDown = false;

var lockButton = $('#lockButton');
var clearButton = $('#clearButton');
var isLocked = false;

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

var resetLockTextTimeout; 
var lastTapLock = 0;
var tapCountLock = 0;

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
        clearTimeout(resetLockTextTimeout); 
        var currentTime = Date.now();

        // Skip comparison logic on the first tap when lastTapLock is 0
        if (lastTapLock !== 0 && currentTime - lastTapLock < 1000) {  
            tapCountLock++;
            if (tapCountLock >= 4) {
                cordova.plugins.screenPinning.exitPinnedMode(
                    function () {
                        console.log("Pinned mode deactivated!");
                        isLocked = false;
                        tapCountLock = 0;
                        lockButton.text('Lock'); 
                    },
                    function (errorMessage) {
                        console.log("Error deactivating pinned mode:", errorMessage);
                    }
                );
                lastTapLock = 0; 
                tapCountLock = 0; 
            } else {
                lockButton.text(`Tap ${4 - tapCountLock} more times quickly to unlock`);  
            }
        } else {
            tapCountLock = 1; // Start tap counting at 1 on first tap
        }
        
        lastTapLock = currentTime;

        // Set a timeout to reset the button text after 1000 ms (1 second) of inactivity
        resetLockTextTimeout = setTimeout(function() {
            lockButton.text('Lock');
        }, 1000);
    }
});

var resetClearTextTimeout; 
var lastTapClear = 0; 
var tapCountClear = 0;

// Clear canvas on 3 button click
clearButton.on('click', function() {
    clearTimeout(resetClearTextTimeout); // Clear any existing timeout
    var currentTime = Date.now();

    // Skip comparison logic on the first tap when lastTapClear is 0
    if (lastTapClear !== 0 && currentTime - lastTapClear < 1000) {  
        tapCountClear++;
        if (tapCountClear >= 3) {
            context.clearRect(0, 0, $canvas[0].width, $canvas[0].height);  
            tapCountClear = 0;
            lastTapClear = 0;  
            clearButton.text('Clear Canvas'); 
        } else {
            clearButton.text(`Tap ${3 - tapCountClear} more times quickly to clear`);  
        }
    } else {
        tapCountClear = 1; // Start tap counting at 1 on first tap
    }

    lastTapClear = currentTime;

    // Set a timeout to reset the button text after 1000 ms (1 second) of inactivity
    resetClearTextTimeout = setTimeout(function() {
        clearButton.text('Clear Canvas');
    }, 1000);
});
