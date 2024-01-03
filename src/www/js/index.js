document.addEventListener("DOMContentLoaded", function() {
    const canvas = document.getElementById('drawingCanvas');
    const context = canvas.getContext('2d');
    const clearBtn = document.getElementById('clearBtn');
    const lockButton = document.getElementById('lockButton');
    let drawing = false;
    let currentColor = 'black';
    let isLocked = false;
    let tapCount = 0;
    let lastTap = 0;
    let selectedColorButton = null;

    // Set up the colors for the buttons
    const colors = [
        'red', 'pink', 'orange', 'yellow', 'lime', 'green', 'mint',
        'teal', 'cyan', 'blue', 'indigo', 'purple', 'violet',
        'magenta', 'brown', 'grey', 'black', 'white'
    ];

    // Create color buttons
    const colorPalette = document.getElementById('colorPalette');
    colors.forEach(color => {
        const colorButton = document.createElement('div');
        colorButton.classList.add('color-button');
        colorButton.style.backgroundColor = color;
        colorButton.addEventListener('click', function() {
            currentColor = color;
            if (selectedColorButton) {
                selectedColorButton.classList.remove('selected');
            }
            colorButton.classList.add('selected');
            selectedColorButton = colorButton;
        });
        colorPalette.appendChild(colorButton);

        // Set the default selected color button
        if (color === 'black') {
            colorButton.classList.add('selected');
            selectedColorButton = colorButton;
        }
    });

    function draw(e) {
        if (!drawing) return;
        context.lineWidth = 3;
        context.lineCap = 'round';
        context.strokeStyle = currentColor;

        let clientX, clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        context.lineTo(clientX - canvas.offsetLeft, clientY - canvas.offsetTop);
        context.stroke();
        context.beginPath();
        context.moveTo(clientX - canvas.offsetLeft, clientY - canvas.offsetTop);
    }

    function stopDrawing() {
        drawing = false;
        context.beginPath();
    }

    function startDrawing(e) {
        drawing = true;
        draw(e);
    }

    // Mouse Event Listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch Event Listeners
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing, { passive: false });

    // Prevent scrolling on touch events
    canvas.addEventListener('touchstart', e => e.preventDefault(), { passive: false });

    // Clear Canvas
    clearBtn.addEventListener('click', () => context.clearRect(0, 0, canvas.width, canvas.height));

    // Lock Button Logic
    lockButton.addEventListener('click', function() {
        if (!isLocked) {
            // Insert your actual screen pinning code here
            console.log("Pinned mode activated!");
            isLocked = true;
            lockButton.textContent = 'Tap 4 times quickly to unlock'; // Update button text
        } else {
            const currentTime = Date.now();
            if (currentTime - lastTap < 500) { // Check for quick succession
                tapCount++;
                if (tapCount >= 4) {
                    // Insert your actual screen unpinned code here
                    console.log("Pinned mode deactivated!");
                    isLocked = false;
                    tapCount = 0;
                    lockButton.textContent = 'Lock'; // Reset button text
                }
            } else {
                tapCount = 1; // Too slow, start over
            }
            lastTap = currentTime;
        }
    });

    // Set up canvas size for better mobile fit
    function setupCanvas() {
        const maxWidth = window.innerWidth;
        const maxHeight = window.innerHeight - (colorPalette.offsetHeight + lockButton.offsetHeight + 20); // Adjust for UI elements
        const aspectRatio = 3 / 2; // Maintain a 3:2 aspect ratio
        let canvasWidth = maxWidth;
        let canvasHeight = canvasWidth / aspectRatio;

        if (canvasHeight > maxHeight) {
            canvasHeight = maxHeight;
            canvasWidth = canvasHeight * aspectRatio;
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
    }

    // Initial setup and setup on resize
    window.addEventListener('load', setupCanvas);
    window.addEventListener('resize', setupCanvas);
});
