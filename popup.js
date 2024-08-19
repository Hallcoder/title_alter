document.addEventListener('DOMContentLoaded', () => {
    // Retrieve and set the checkbox state
    chrome.storage.local.get('autoGenerateOnReload', (result) => {
        document.getElementById('autoSet').checked = result.autoGenerateOnReload || false;
    });

    // Monitor URL changes to detect video change
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;

        chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: monitorVideoChange
        });
    });
});

document.getElementById('changeTitle').addEventListener('click', () => {
    const customTitle = document.getElementById('customTitle').value;
    if (customTitle) {
        chrome.runtime.sendMessage({ type: 'SET_TITLE', title: customTitle });
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: changeYouTubeTitle,
                args: [customTitle]
            });
        });
    }
});

document.getElementById('autoSet').addEventListener('change', (event) => {
    chrome.runtime.sendMessage({ type: 'TOGGLE_AUTO_GENERATE', autoGenerateOnReload: event.target.checked });
});

document.getElementById('generateAIButton').addEventListener('click', async () => {
    const tabId = await getCurrentTabId();
    generateNewTitle(tabId);
});

// Function to change the YouTube title
function changeYouTubeTitle(newTitle) {
    const titleElement = document.querySelector('h1.style-scope.ytd-watch-metadata yt-formatted-string');
    if (titleElement) {
        titleElement.textContent = newTitle;
    }
}

// Function to generate a new title using AI and update the title
async function generateNewTitle(tabId) {
    const prompt = 'Generate a catchy YouTube title in French';
    const loadingSpinner = document.getElementById('loadingSpinner');
    const generateButton = document.getElementById('generateAIButton');
    generateButton.textContent = 'Loading...';
    generateButton.disabled = true;
    loadingSpinner.style.display = 'block';

    try {
        const newTitle = await generateUsingAI(prompt);
        if (newTitle && newTitle.trim()) {
            chrome.runtime.sendMessage({ type: 'SET_TITLE', title: newTitle.trim() });
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                function: changeYouTubeTitle,
                args: [newTitle.trim()]
            });
        } else {
            console.error("AI generated an empty title.");
            alert("Failed to generate a valid title. Please try again.");
        }
    } catch (error) {
        console.error("Error generating title using AI:", error);
    } finally {
        generateButton.textContent = 'Generate Using AI';
        generateButton.disabled = false;
        loadingSpinner.style.display = 'none';
    }
}

// Function to generate a new title using AI
async function generateUsingAI(prompt) {
    try {
        const response = await fetch('http://localhost:3000/openai/generate-title?prompt=' + encodeURIComponent(prompt));
        const newTitle = await response.text();
        return newTitle.replace(/^"|"$/g, ''); // Clean up the title
    } catch (error) {
        console.error("Error generating title using AI:", error);
        return ''; // Return empty string on error
    }
}

// Helper function to get the current tab ID
function getCurrentTabId() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            resolve(tabs[0].id);
        });
    });
}

// Function to monitor URL changes (i.e., video changes) and update the title accordingly
function monitorVideoChange() {
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;

            // Update the title when the video changes
            chrome.storage.local.get(['autoGenerateOnReload'], (result) => {
                if (result.autoGenerateOnReload) {
                    // If auto-generate is enabled, generate a new title
                    chrome.runtime.sendMessage({ type: 'GENERATE_TITLE' });
                } else {
                    // Otherwise, use the video's existing title
                    const currentTitle = document.querySelector('h1.style-scope.ytd-watch-metadata yt-formatted-string').textContent;
                    chrome.runtime.sendMessage({ type: 'SET_TITLE', title: currentTitle });
                }
            });
        }
    }).observe(document, { subtree: true, childList: true });
}
