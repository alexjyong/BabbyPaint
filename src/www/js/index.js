
// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
//document.addEventListener('deviceready', onDeviceReady, false);

var color = $(".selected").css("background-color");
var $canvas = $("canvas");
var context = $canvas[0].getContext("2d");
var lastEvent;
var mouseDown = false;

var lockButton = $('#lockButton');
var isLocked = false;
var tapCount = 0;
var lastTap = 0;

lockButton.on('click', function() {
    if (!isLocked) {
        cordova.plugins.screenPinning.enterPinnedMode(
            function () {
                console.log("Pinned mode activated!");
                isLocked = true;
                lockButton.text('Tap 4 times quickly to unlock'); // Update button text
            },
            function (errorMessage) {
                console.log("Error activating pinned mode:", errorMessage);
            }
        );
    } else {
        var currentTime = Date.now();
        if (currentTime - lastTap < 500) { // Check for quick succession
            tapCount++;
            if (tapCount >= 4) {
                cordova.plugins.screenPinning.exitPinnedMode(
                    function () {
                        console.log("Pinned mode deactivated!");
                        isLocked = false;
                        tapCount = 0;
                        lockButton.text('Lock'); // Reset button text
                    },
                    function (errorMessage) {
                        console.log("Error deactivating pinned mode:", errorMessage);
                    }
                );
            }
        } else {
            tapCount = 1; // Too slow, start over
        }
        lastTap = currentTime;
    }
});

// When clicking on colors items
$(".controls").on("click", "li", function () {
    //  Deselect sibling elements
    $(this).siblings().removeClass("selected");
    //  Select clicked element
    $(this).addClass("selected");

    // Cache current color
    color = $(this).css("background-color");

});

// Function to get the touch position
function getTouchPos(touchEvent) {
    var rect = $canvas[0].getBoundingClientRect();
    return {
      offsetX: touchEvent.touches[0].clientX - rect.left,
      offsetY: touchEvent.touches[0].clientY - rect.top
    };
  }
  
// On touch events on the canvas
$canvas.on('touchstart', function (e) {
    e.preventDefault(); // Prevent scrolling when touching the canvas
    var touchPos = getTouchPos(e.originalEvent);
    lastEvent = touchPos;
    mouseDown = true;
}).on('touchmove', function (e) {
    e.preventDefault(); // Prevent scrolling when touching the canvas
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
}).on('touchend', function (e) {
    mouseDown = false;
});

$canvas.on('touchcancel', function () {
    mouseDown = false;
});
  

// On mouse events on the canvas
$canvas.mousedown(function (e) {
    lastEvent = e;
    mouseDown = true;
}).mousemove(function (e) {
    // Draw lines
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

// Clear the canvas when button is clicked
function clear_canvas_width() {
    var s = document.getElementById("mainCanvas");
    var w = s.width;
    s.width = 10;
    s.width = w;
}