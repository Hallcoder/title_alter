// Initialize storage
console.log('Background script is running');
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ title: '', autoGenerateOnReload: false });
});

// Listen for changes in the popup settings
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SET_TITLE') {
        chrome.storage.local.set({ title: message.title });
    } else if (message.type === 'TOGGLE_AUTO_GENERATE') {
        chrome.storage.local.set({ autoGenerateOnReload: message.autoGenerateOnReload });
    }
});

// Handle tab updates and apply title based on settings
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    if (changeInfo.status === 'complete') {
        const { title, autoGenerateOnReload } = await chrome.storage.local.get(['title', 'autoGenerateOnReload']);

        if (autoGenerateOnReload) {
            // Generate a new title using AI
            const newTitle = await generateUsingAI('Generate a catchy YouTube title in French');
            chrome.storage.local.set({ title: newTitle });
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                function: applyTitle,
                args: [newTitle]
            });
        } else {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                function: applyTitle,
                args: [title]
            });
        }
    }
});

// Function to generate a new title using AI
async function generateUsingAI(prompt) {
    try {
        const response = await fetch('http://localhost:3000/openai/generate-title?prompt=' + encodeURIComponent(prompt));
        const newTitle = await response.text();
        return newTitle.replace(/^"|"$/g, ''); // Clean up the title
    } catch (error) {
        console.error("Error generating title using AI:", error);
        return '';
    }
}

// Function to apply the title
function applyTitle(title) {
    const titleElement = document.querySelector('h1.style-scope.ytd-watch-metadata yt-formatted-string');
    if (titleElement && title) {
        titleElement.textContent = title;
    }
}
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    chrome.tabs.sendMessage(details.tabId, { type: 'URL_CHANGED' });
});

