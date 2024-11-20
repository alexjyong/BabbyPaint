document.addEventListener('deviceready', onDeviceReady, false);

var color = $(".selected").css("background-color");
var $canvas = $("#mainCanvas");
var context = $canvas[0].getContext("2d");
var lastEvent;
var mouseDown = false;

var lockButton = $('#lockButton');
var clearButton = $('#clearButton');
var fabButton = $('#fabButton'); // Main FAB button
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

// Function to handle multitouch drawing
function handleTouches(event, isStart = false) {
    const touches = event.touches;
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const rect = $canvas[0].getBoundingClientRect();
        const isInsideCanvas =
            touch.clientX >= rect.left &&
            touch.clientX <= rect.right &&
            touch.clientY >= rect.top &&
            touch.clientY <= rect.bottom;

        if (isInsideCanvas) {
            const touchPos = getTouchPos({ touches: [touch] });
            if (isStart) {
                lastEvent = touchPos;
                mouseDown = true;
            } else if (mouseDown) {
                context.beginPath();
                context.moveTo(lastEvent.offsetX, lastEvent.offsetY);
                context.lineTo(touchPos.offsetX, touchPos.offsetY);
                context.strokeStyle = color;
                context.lineWidth = 5;
                context.lineCap = "round";
                context.stroke();
                lastEvent = touchPos;
            }
        }
    }
}

// Update touchstart, touchmove, and touchend handlers
$canvas.on("touchstart", function (e) {
    e.preventDefault();
    handleTouches(e.originalEvent, true);
}).on("touchmove", function (e) {
    e.preventDefault();
    handleTouches(e.originalEvent);
}).on("touchend touchcancel", function () {
    mouseDown = false;
});

// Prevent default behavior on the entire document for touchmove
document.addEventListener(
    "touchmove",
    function (e) {
        e.preventDefault(); // Prevent scrolling or other default actions
    },
    { passive: false }
);

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
    if (!isLocked){
        cordova.plugins.screenPinning.enterPinnedMode(
            function () {
                console.log("Pinned mode activated!");
                isLocked = true;

                window.plugins.toast.hide();
                window.plugins.toast.showWithOptions(
                    {
                      message: "Tap 4 times quickly to unlock",
                      duration: "short", // which is 2000 ms. "long" is 4000. Or specify the nr of ms yourself.
                      position: "top"
                    }
                  );
                lockButton.text('Unlock app');
            },
            function (errorMessage) {
                console.log("Error activating pinned mode:", errorMessage);
            }
        );
    }
    else {
        clearTimeout(resetLockTextTimeout); 
        var currentTime = Date.now();

        // On the first tap, skip comparison logic but update the button text immediately
        if (lastTapLock === 0 || currentTime - lastTapLock >= 1000) {  
            tapCountLock = 1; // First tap starts the counting at 1
            window.plugins.toast.hide();
            window.plugins.toast.showWithOptions(
                {
                  message: "Tap 3 more times quickly to unlock",
                  duration: "short", // which is 2000 ms. "long" is 4000. Or specify the nr of ms yourself.
                  position: "top"
                }
              );
        } else { 
            tapCountLock++;
            if (tapCountLock >= 4) {
                cordova.plugins.screenPinning.exitPinnedMode(
                    function () {
                        console.log("Pinned mode deactivated!");
                        isLocked = false;
                        tapCountLock = 0;
                        lockButton.text('Lock app');
                    },
                    function (errorMessage) {
                        console.log("Error deactivating pinned mode:", errorMessage);
                    }
                );
                lastTapLock = 0; 
                tapCountLock = 0; 
            } else {
                var message = "";
                if (3 - tapCountLock == 2) {
                    message = `Tap 1 more time quickly to unlock.`; 
                }
                else {
                    message = `Tap ${4 - tapCountLock} more times quickly to unlock.` 
                }
                window.plugins.toast.hide();
                window.plugins.toast.showWithOptions(
                    {
                      message: message,
                      duration: "short", // which is 2000 ms. "long" is 4000. Or specify the nr of ms yourself.
                      position: "top"
                    }
                  ); 
            }
        }
        
        lastTapLock = currentTime;

    }
});

// Clear canvas on 3 button click
var resetClearTextTimeout; 
var lastTapClear = 0; 
var tapCountClear = 0;
clearButton.on('click', function() {
    clearTimeout(resetClearTextTimeout); // Clear any existing timeout
    var currentTime = Date.now();

    // On the first tap, skip comparison logic but update the button text immediately
    if (lastTapClear === 0 || currentTime - lastTapClear >= 1000) {  
        tapCountClear = 1; // First tap starts the counting at 1
        clearButton.text('Tap 2 more times quickly to clear');  // Immediate feedback on first tap
    } else { 
        tapCountClear++;
        if (tapCountClear >= 3) {
            context.clearRect(0, 0, $canvas[0].width, $canvas[0].height);  
            tapCountClear = 0;
            clearButton.text('Clear Canvas'); 
        } else {
            if (3 - tapCountClear == 2) {
                clearButton.text(`Tap 1 more time quickly to clear`); 
            }
            else {
                clearButton.text(`Tap ${3 - tapCountClear} more times quickly to clear`); 
            }
             
        }
    }

    lastTapClear = currentTime;

    // Set a timeout to reset the button text after 1000 ms (1 second) of inactivity
    resetClearTextTimeout = setTimeout(function() {
        clearButton.text('Clear Canvas');
    }, 1000);
});

// Toggle FAB expansion to show or hide the lock button
fabButton.on('click', function() {
    console.log('FAB clicked');
    $(this).toggleClass('expanded');
    $('.sub-fab').toggleClass('expanded');
    console.log('FAB class:', $(this).attr('class'));
    console.log('Sub-FAB class:', $('.sub-fab').attr('class'));
});
