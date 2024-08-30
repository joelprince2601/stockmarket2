document.addEventListener('DOMContentLoaded', function() {
    // Add event listener to 'Start Drawing' button
    document.getElementById('startDrawingBtn').addEventListener('click', function() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              files: ['html2canvas.min.js', 'drawingTool.js']
            });
        });
    });

    // Add event listener to 'Collect News' button
    document.getElementById('collectNewsBtn').addEventListener('click', function() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'fetchHeadlines' });
        });
    });
});
