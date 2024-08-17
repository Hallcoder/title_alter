// Function to apply the stored title
function applyStoredTitle() {
    chrome.storage.local.get('title', (result) => {
        const titleElement = document.querySelector('h1.style-scope.ytd-watch-metadata yt-formatted-string');
        if (titleElement && result.title) {
            titleElement.textContent = result.title;
        }
    });
}

// Observe changes in the document
const observer = new MutationObserver(() => {
    applyStoredTitle();
});

// Start observing the document
observer.observe(document.body, { childList: true, subtree: true });

// Apply the stored title on initial load
applyStoredTitle();
