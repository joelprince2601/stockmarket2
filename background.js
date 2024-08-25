chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'startDrawing') {
      chrome.scripting.executeScript({
          target: { tabId: sender.tab.id },
          files: ['drawingtool.js']
          
      });
  } else if (request.action === 'fetchHeadlines') {
      chrome.scripting.executeScript({
          target: { tabId: sender.tab.id },
          func: fetchHeadlines
      });
  }
});

function fetchHeadlines() {
  fetch('https://api.mediastack.com/v1/news?access_key=e20e3ffc76578182dbda0c8ee47d11ad&categories=business&limit=5')
      .then(response => response.json())
      .then(data => {
          const headlines = data.data.map(item => item.title);
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
      })
      .catch(error => {
          console.error('Error fetching headlines:', error);
      });
}
