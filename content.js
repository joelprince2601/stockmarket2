let drawing = false;
let startX, startY;
let box = null;
const apiKey = 'e20e3ffc76578182dbda0c8ee47d11ad';

// Drawing-related functions
function onMouseDown(e) {
    if (drawing) return;
    drawing = true;
    startX = e.clientX;
    startY = e.clientY;

    box = document.createElement('div');
    box.style.position = 'absolute';
    box.style.border = '2px dashed red';
    box.style.left = `${startX}px`;
    box.style.top = `${startY}px`;
    document.body.appendChild(box);
}

function onMouseMove(e) {
    if (!drawing) return;
    const currentX = e.clientX;
    const currentY = e.clientY;

    const width = currentX - startX;
    const height = currentY - startY;

    box.style.width = `${Math.abs(width)}px`;
    box.style.height = `${Math.abs(height)}px`;

    box.style.left = `${width < 0 ? currentX : startX}px`;
    box.style.top = `${height < 0 ? currentY : startY}px`;
}

function onMouseUp(e) {
    if (!drawing) return;
    drawing = false;

    captureAndCopy();
}

function captureAndCopy() {
    chrome.tabs.captureVisibleTab({ format: 'png' }, function(dataUrl) {
        const img = new Image();
        img.src = dataUrl;
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            grayscaleImage(canvas);
            canvas.toBlob(blob => {
                const item = new ClipboardItem({ 'image/png': blob });
                navigator.clipboard.write([item]).then(() => {
                    console.log('Screenshot (grayscale) copied to clipboard!');
                    document.body.removeChild(box);

                    // Compare the screenshot with chart images
                    compareWithCharts(canvas);

                    // Retrace lines and show in popup
                    retraceLines(canvas);
                }).catch(err => {
                    console.error('Error copying to clipboard:', err);
                });
            }, 'image/png');
        };
    });
}

function grayscaleImage(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;     // Red
        data[i + 1] = avg; // Green
        data[i + 2] = avg; // Blue
    }

    ctx.putImageData(imageData, 0, 0);
}

// Function to retrace lines on the screenshot and display in a popup
function retraceLines(canvas) {
    const retraceCanvas = document.createElement('canvas');
    retraceCanvas.width = canvas.width;
    retraceCanvas.height = canvas.height;
    const retraceCtx = retraceCanvas.getContext('2d');

    const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Edge detection using simple threshold
    const threshold = 128; // Adjust as needed
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (avg < threshold) {
            data[i] = data[i + 1] = data[i + 2] = 0; // Black
        } else {
            data[i] = data[i + 1] = data[i + 2] = 255; // White
        }
    }

    retraceCtx.putImageData(imageData, 0, 0);

    // Show retraced lines in a popup
    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.bottom = '10px';
    popup.style.right = '10px'; // Bottom right corner
    popup.style.padding = '10px';
    popup.style.backgroundColor = 'white';
    popup.style.border = '1px solid black';
    popup.style.zIndex = '10000';

    const img = new Image();
    img.src = retraceCanvas.toDataURL();
    popup.appendChild(img);

    document.body.appendChild(popup);

    setTimeout(() => {
        document.body.removeChild(popup);
    }, 5000); // Popup disappears after 5 seconds
}

// Fetch and display the headlines
async function fetchHeadlines() {
    const endpoint = `http://api.mediastack.com/v1/news?access_key=${apiKey}&categories=business&countries=us&languages=en&limit=5&sort=published_desc`;

    try {
        const response = await fetch(endpoint);
        const data = await response.json();

        if (data && data.data) {
            displayHeadlines(data.data.map(item => item.title));
        } else {
            console.error('No data received from API.');
        }
    } catch (error) {
        console.error('Error fetching headlines:', error);
    }
}

function displayHeadlines(headlines) {
    const headlinesPopup = document.createElement('div');
    headlinesPopup.style.position = 'fixed';
    headlinesPopup.style.top = '10px';
    headlinesPopup.style.left = '10px';
    headlinesPopup.style.padding = '10px';
    headlinesPopup.style.backgroundColor = 'white';
    headlinesPopup.style.border = '1px solid black';
    headlinesPopup.style.zIndex = '10000';

    const title = document.createElement('h3');
    title.innerText = 'Top 5 Stock Market Headlines';
    headlinesPopup.appendChild(title);

    headlines.forEach(headline => {
        const headlineElement = document.createElement('p');
        headlineElement.innerText = headline;
        headlinesPopup.appendChild(headlineElement);
    });

    document.body.appendChild(headlinesPopup);

    setTimeout(() => {
        document.body.removeChild(headlinesPopup);
    }, 10000); // Popup disappears after 10 seconds
}

// Event listener for the Collect News button
document.getElementById('collectNewsBtn').addEventListener('click', fetchHeadlines);

// Function to enable drawing
function enableDrawing() {
    document.body.style.cursor = 'crosshair';
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

// Event listener for the Start Drawing button
document.getElementById('startDrawingBtn').addEventListener('click', enableDrawing);
