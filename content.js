let lastVideoId = null;

function monitorVideoChange() {
    const observer = new MutationObserver(() => {
        const currentVideoId = new URLSearchParams(window.location.search).get('v');

        if (currentVideoId !== lastVideoId) {
            lastVideoId = currentVideoId;

            // Reset title to the original YouTube title
            resetTitleOnNewVideo();

            // Handle auto-generation if enabled
            chrome.storage.local.get('autoGenerateOnReload', (result) => {
                if (result.autoGenerateOnReload) {
                    chrome.runtime.sendMessage({ type: 'GENERATE_TITLE' });
                }
            });
        }
    });

    observer.observe(document, { subtree: true, childList: true });
}

// Reset title when a new video is detected
function resetTitleOnNewVideo() {
    const videoTitleElement = document.querySelector('h1.title, h1.style-scope.ytd-watch-metadata yt-formatted-string');
    if (videoTitleElement) {
        const originalTitle = videoTitleElement.getAttribute('data-original-title');
        if (originalTitle) {
            videoTitleElement.innerText = originalTitle;
        }
        localStorage.removeItem('customTitle'); // Clear stored custom title
    }
}

// Store the original title when the page loads
function storeOriginalTitle() {
    const videoTitleElement = document.querySelector('h1.title, h1.style-scope.ytd-watch-metadata yt-formatted-string');
    if (videoTitleElement && !videoTitleElement.getAttribute('data-original-title')) {
        videoTitleElement.setAttribute('data-original-title', videoTitleElement.innerText);
    }
}

// Run this when the page loads
storeOriginalTitle();
monitorVideoChange(); // Start monitoring video changes
