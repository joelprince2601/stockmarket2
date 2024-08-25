let drawing = false;
let startX, startY;
let box = null;

function onMouseDown(e) {
  if (drawing) return;
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

  // Capture the screenshot and copy to clipboard
  captureAndCopy();
}

function captureAndCopy() {
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

// Fetch and display the headlines
function fetchHeadlines() {
  chrome.runtime.sendMessage({ action: 'fetch_headlines' }, response => {
    if (response && response.headlines) {
      displayHeadlines(response.headlines);
    } else {
      console.error('Failed to fetch headlines');
    }
  });
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

// Function to enable drawing
function enableDrawing() {
  document.body.style.cursor = 'crosshair';
  document.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

// Automatically enable drawing mode
enableDrawing();

// Fetch the headlines on page load
fetchHeadlines();
