let drawing = false;
let startX, startY;
let box = null;

const apiKey = 'e20e3ffc76578182dbda0c8ee47d11ad';

function onMouseDown(e) {
  if (drawing) return; // Prevent drawing multiple boxes simultaneously
  drawing = true;
  startX = e.clientX + window.scrollX;
  startY = e.clientY + window.scrollY;

  box = document.createElement('div');
  box.style.position = 'absolute';
  box.style.border = '2px dashed red';
  box.style.left = `${startX}px`;
  box.style.top = `${startY}px`;
  document.body.appendChild(box);
}

function onMouseMove(e) {
  if (!drawing) return;
  const currentX = e.clientX + window.scrollX;
  const currentY = e.clientY + window.scrollY;

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

  // Capture the screenshot and process
  captureAndProcess();
}

function captureAndProcess() {
  const boxRect = box.getBoundingClientRect();

  html2canvas(document.body, {
    x: boxRect.left + window.scrollX,
    y: boxRect.top + window.scrollY,
    width: boxRect.width,
    height: boxRect.height
  }).then(canvas => {
    // Convert captured image to grayscale
    grayscaleImage(canvas);

    canvas.toBlob(blob => {
      const item = new ClipboardItem({ 'image/png': blob });
      navigator.clipboard.write([item]).then(() => {
        console.log('Screenshot (grayscale) copied to clipboard!');
        // Clean up
        document.body.removeChild(box);
        // Compare the screenshot with chart images
        compareWithCharts(canvas);
        // Retrace lines and show in popup
        retraceLines(canvas);
      }).catch(err => {
        console.error('Error copying to clipboard:', err);
      });
    }, 'image/png');
  });
}

function compareWithCharts(capturedCanvas) {
  const capturedCtx = capturedCanvas.getContext('2d');
  const capturedImageData = capturedCtx.getImageData(0, 0, capturedCanvas.width, capturedCanvas.height);

  // Load and compare with charts
  const chartsFolder = chrome.runtime.getURL('charts');
  const charts = ['chart1.png', 'chart2.png', 'chart3.png']; // Replace with actual chart names

  let bestMatch = null;
  let maxSimilarity = -1;

  charts.forEach(chart => {
    const chartImage = new Image();
    chartImage.onload = function() {
      const chartCanvas = document.createElement('canvas');
      chartCanvas.width = chartImage.width;
      chartCanvas.height = chartImage.height;
      const ctx = chartCanvas.getContext('2d');
      ctx.drawImage(chartImage, 0, 0);

      // Convert chart image to grayscale
      grayscaleImage(chartCanvas);

      const chartImageData = ctx.getImageData(0, 0, chartCanvas.width, chartCanvas.height);

      // Compare pixel data and calculate similarity
      const similarity = calculateSimilarity(capturedImageData.data, chartImageData.data);
      console.log(`Similarity with ${chart}: ${similarity}`);

      // Update best match if similarity is higher
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        bestMatch = chart;
      }
    };
    chartImage.src = `${chartsFolder}/${chart}`;
  });

  // Show popup with best match information
  if (bestMatch && maxSimilarity >= 0) {
    showPopup(`Best match: ${bestMatch}, Similarity: ${(maxSimilarity * 100).toFixed(2)}%`);
  } else {
    showPopup('No match found with any chart');
  }
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

function calculateSimilarity(img1, img2) {
  if (img1.length !== img2.length) return 0;

  let sumDiff = 0;
  for (let i = 0; i < img1.length; i++) {
    sumDiff += Math.abs(img1[i] - img2[i]);
  }

  // Normalize the difference
  const similarity = 1 - (sumDiff / (img1.length * 255 * 3));
  return similarity;
}

function showPopup(message) {
  const popup = document.createElement('div');
  popup.style.position = 'fixed';
  popup.style.bottom = '10px';
  popup.style.left = '10px'; // Adjusted to bottom left corner
  popup.style.padding = '10px';
  popup.style.backgroundColor = 'white';
  popup.style.color = 'black'; // Set text color to black
  popup.style.border = '1px solid black';
  popup.style.zIndex = '10000';
  popup.innerText = message;
  document.body.appendChild(popup);

  setTimeout(() => {
    document.body.removeChild(popup);
  }, 5000); // Popup disappears after 5 seconds
}

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

function enableDrawing() {
  document.body.style.cursor = 'crosshair';
  document.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

// Function to fetch headlines using Media Stack API
async function fetchHeadlines() {
    const endpoint = `http://api.mediastack.com/v1/news?access_key=${apiKey}&categories=business&countries=us&languages=en&limit=5&sort=published_desc`;

    try {
        const response = await fetch(endpoint);
        const data = await response.json();

        if (data && data.data) {
            displayHeadlines(data.data.map(item => item.title));
        } else {
          console.error('No data found from the Media Stack API.');
        }
    } catch (error) {
        console.error('Error fetching headlines:', error);
    }
}

// Add event listeners for the buttons
document.getElementById('startDrawing').addEventListener('click', enableDrawing);
document.getElementById('collectNews').addEventListener('click', fetchHeadlines);

