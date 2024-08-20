document.addEventListener('DOMContentLoaded', () => {
    // Retrieve and set the checkbox state
    chrome.storage.local.get('autoGenerateOnReload', (result) => {
        document.getElementById('autoSet').checked = result.autoGenerateOnReload || false;
    });

    // Inject content script to monitor video changes
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;

        // Inject the content script to monitor video changes
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        });
    });
});

// Change title manually
document.getElementById('changeTitle').addEventListener('click', () => {
    const customTitle = document.getElementById('customTitle').value;
    if (customTitle) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: changeTitle,
                args: [customTitle]
            });
        });
    }
});

// Auto-generate title using AI
document.getElementById('generateAIButton').addEventListener('click', async () => {
    const tabId = await getCurrentTabId();
    generateNewTitle(tabId);
});

document.getElementById('autoSet').addEventListener('change', (event) => {
    chrome.storage.local.set({ autoGenerateOnReload: event.target.checked });
});

// Function to change the title based on user input
function changeTitle(customTitle) {
    const videoTitleElement = document.querySelector('h1.title, h1.style-scope.ytd-watch-metadata yt-formatted-string');
    if (videoTitleElement) {
        videoTitleElement.innerText = customTitle;
        localStorage.setItem('customTitle', customTitle); // Store custom title
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
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                function: changeTitle,
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
