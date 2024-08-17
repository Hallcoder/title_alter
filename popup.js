document.addEventListener('DOMContentLoaded', () => {
    // Retrieve and set the checkbox state
    chrome.storage.local.get('autoGenerateOnReload', (result) => {
        document.getElementById('autoSet').checked = result.autoGenerateOnReload || false;
    });

    // Handle the page load
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;

        chrome.storage.local.get('storedTitle', (result) => {
            const storedTitle = result.storedTitle;

            if (storedTitle && !document.getElementById('autoSet').checked) {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    function: changeYouTubeTitle,
                    args: [storedTitle]
                });
            }
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
    const prompt = 'Generate a catchy YouTube title in French';
    const loadingSpinner = document.getElementById('loadingSpinner');
    const generateButton = document.getElementById('generateAIButton');
    generateButton.textContent = 'Loading...';
    generateButton.disabled = true;
    loadingSpinner.style.display = 'block';

    try {
        const newTitle = await generateUsingAI(prompt);
        chrome.runtime.sendMessage({ type: 'SET_TITLE', title: newTitle });
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: changeYouTubeTitle,
                args: [newTitle]
            });
        });
    } catch (error) {
        console.error("Error generating title using AI:", error);
    } finally {
        generateButton.textContent = 'Generate Using AI';
        generateButton.disabled = false;
        loadingSpinner.style.display = 'none';
    }
});

// Function to change the YouTube title
function changeYouTubeTitle(newTitle) {
    const titleElement = document.querySelector('h1.style-scope.ytd-watch-metadata yt-formatted-string');
    if (titleElement) {
        titleElement.textContent = newTitle;
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
        return '';
    }
}
