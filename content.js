// content.js

const apiKey = 'e20e3ffc76578182dbda0c8ee47d11ad';

async function fetchHeadlines() {
    const endpoint = `http://api.mediastack.com/v1/news?access_key=${apiKey}&categories=business&countries=us&languages=en&limit=5&sort=published_desc`;

    try {
        const response = await fetch(endpoint);
        const data = await response.json();

        if (data && data.data) {
            displayHeadlines(data.data);
        } else {
            console.error('No data received from API.');
        }
    } catch (error) {
        console.error('Error fetching headlines:', error);
    }
}

function displayHeadlines(headlines) {
    const headlinesContainer = document.getElementById('headlines');
    headlinesContainer.innerHTML = '';

    headlines.forEach((headline, index) => {
        const headlineItem = document.createElement('li');
        headlineItem.innerText = `${index + 1}. ${headline.title} - ${headline.source}`;
        headlinesContainer.appendChild(headlineItem);
    });
}

// Event listener for the Collect News button
document.getElementById('collectNewsBtn').addEventListener('click', fetchHeadlines);
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'start_drawing') {
      startDrawing();
    }
  });
  
  function startDrawing() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('drawingtool.js');
    document.head.appendChild(script);
  }
  