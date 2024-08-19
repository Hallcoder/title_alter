let lastKnownTitle = '';

function applyTitleChange(autoGenerate) {
    if (autoGenerate) {
        // Generate a new title using AI
        generateNewTitle().then((newTitle) => {
            updateYouTubeTitle(newTitle);
            saveTitle(newTitle);
        });
    } else {
        // Maintain the original title
        updateYouTubeTitle(lastKnownTitle);
    }
}

function saveTitle(title) {
    chrome.storage.local.set({ storedTitle: title });
}

function updateYouTubeTitle(newTitle) {
    const titleElement = document.querySelector('h1.style-scope.ytd-watch-metadata yt-formatted-string');
    if (titleElement) {
        titleElement.textContent = newTitle;
    }
}

async function generateNewTitle() {
    const prompt = 'Generate a catchy YouTube title in French';
    try {
        const response = await fetch('http://localhost:3000/openai/generate-title?prompt=' + encodeURIComponent(prompt));
        const newTitle = await response.text();
        return newTitle.replace(/^"|"$/g, ''); // Clean up the title
    } catch (error) {
        console.error("Error generating title using AI:", error);
        return '';
    }
}

function observeTitleChange() {
    const titleElement = document.querySelector('h1.style-scope.ytd-watch-metadata yt-formatted-string');

    if (titleElement) {
        lastKnownTitle = titleElement.textContent;

        const observer = new MutationObserver(() => {
            chrome.storage.local.get('autoGenerateOnReload', (result) => {
                applyTitleChange(result.autoGenerateOnReload || false);
            });
        });

        observer.observe(titleElement, { childList: true, subtree: true });
    }
}

// Start observing for URL changes or video changes
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'URL_CHANGED') {
        observeTitleChange();  // Reattach the observer when a new video is loaded
    }
});

// Initial call when the script is first injected
observeTitleChange();
