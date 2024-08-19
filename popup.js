document.addEventListener('DOMContentLoaded', () => {
    // Retrieve and set the checkbox state for auto-generating titles
    chrome.storage.local.get('autoGenerateOnReload', (result) => {
        document.getElementById('autoSet').checked = result.autoGenerateOnReload || false;
    });

    // Listen for video change events from content.js
    chrome.runtime.onMessage.addListener(async (message) => {
        if (message.type === 'VIDEO_CHANGED') {
            const tabId = await getCurrentTabId();
            await handleVideoChange(tabId, message.videoId);
        }
    });
});

document.getElementById('changeTitle').addEventListener('click', async () => {
    const customTitle = document.getElementById('customTitle').value;
    if (customTitle) {
        const tabId = await getCurrentTabId();
        await setTitleOnPage(tabId, customTitle);
        // Store the custom title temporarily to avoid appending issue
        chrome.storage.local.set({ storedTitle: customTitle });
    }
});

document.getElementById('autoSet').addEventListener('change', (event) => {
    chrome.storage.local.set({ autoGenerateOnReload: event.target.checked });
});

document.getElementById('generateAIButton').addEventListener('click', async () => {
    const tabId = await getCurrentTabId();
    await generateNewTitle(tabId);
});

// Function to handle video change
async function handleVideoChange(tabId, videoId) {
    chrome.storage.local.remove('storedTitle');  // Clear the stored title when a new video loads

    chrome.storage.local.get('autoGenerateOnReload', async (result) => {
        if (result.autoGenerateOnReload) {
            // Generate a new title using AI if auto-generate is enabled
            await generateNewTitle(tabId, videoId);
        } else {
            // Reset to the video's original title
            const currentTitle = await getCurrentTitle(tabId);
            if (currentTitle) {
                await setTitleOnPage(tabId, currentTitle);
            }
        }
    });
}

// Function to set title on the page
async function setTitleOnPage(tabId, title) {
    await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (newTitle) => {
            const titleElement = document.querySelector('h1.style-scope.ytd-watch-metadata yt-formatted-string');
            if (titleElement) {
                titleElement.textContent = newTitle;
            }
        },
        args: [title]
    });
}

// Function to generate a new title using AI
async function generateNewTitle(tabId, videoId = '') {
    const prompt = 'Generate a catchy YouTube title in French';
    const generateButton = document.getElementById('generateAIButton');
    generateButton.textContent = 'Loading...';
    generateButton.disabled = true;

    try {
        const newTitle = await generateUsingAI(prompt, videoId);
        if (newTitle && newTitle.trim()) {
            await setTitleOnPage(tabId, newTitle.trim());
            chrome.storage.local.set({ storedTitle: newTitle.trim() });  // Store the new title
        } else {
            console.error("AI generated an empty title.");
            alert("Failed to generate a valid title. Please try again.");
        }
    } catch (error) {
        console.error("Error generating title using AI:", error);
    } finally {
        generateButton.textContent = 'Generate Using AI';
        generateButton.disabled = false;
    }
}

// Function to generate a title using AI
async function generateUsingAI(prompt, videoId) {
    try {
        const response = await fetch('http://localhost:3000/openai/generate-title?prompt=' + encodeURIComponent(prompt) + '&videoId=' + videoId);
        const newTitle = await response.text();
        return newTitle.replace(/^"|"$/g, '');  // Clean up the title
    } catch (error) {
        console.error("Error generating title using AI:", error);
        return '';  // Return empty string on error
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

// Helper function to get the current title on the page
function getCurrentTitle(tabId) {
    return new Promise((resolve) => {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                const titleElement = document.querySelector('h1.style-scope.ytd-watch-metadata yt-formatted-string');
                return titleElement ? titleElement.textContent : '';
            }
        }, (results) => {
            resolve(results[0].result || '');
        });
    });
}
