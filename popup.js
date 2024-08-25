document.addEventListener('DOMContentLoaded', function() {
  // Add event listener to 'Start Drawing' button
  document.getElementById('startDrawingBtn').addEventListener('click', function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'startDrawing' });
      });
  });

  // Add event listener to 'Collect News' button
  document.getElementById('collectNewsButton').addEventListener('click', function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'fetchHeadlines' });
      });
  });
});
