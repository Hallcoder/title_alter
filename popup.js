document.getElementById('changeTitle').addEventListener('click', () => {
    const customTitle = document.getElementById('customTitle').value;
    console.log("customTitle", customTitle);
    if (customTitle) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: changeYouTubeTitle,
                args: [customTitle]
            });
        });
    }
});

function changeYouTubeTitle(newTitle) {
    const titleElement = document.querySelector('h1.style-scope.ytd-watch-metadata yt-formatted-string');
    if (titleElement) {
        titleElement.textContent = newTitle;
    }
    // document.getElementById('customTitle').value = "";
}

document.getElementById('upgradeButton').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('pricing.html') });
});

document.getElementById('generateAIButton').addEventListener('click', async () => {
    const prompt = 'Generate a catchy YouTube title'; // Modify the prompt as needed
    try {
        const newTitle = await generateTitle(prompt);
        
        // Update YouTube title with the new AI-generated title
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: changeYouTubeTitle,
                args: [newTitle]
            });
        });
    } catch (error) {
        console.error("Error generating title using AI:", error);
    }
});
async function generateTitle(prompt) {
    const response = await fetch('https://api.openai.com/v1/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer`,
        },
        body: JSON.stringify({
            model:'davinci-002',
            prompt: prompt,
            max_tokens: 60,
        }),
    });

    const data = await response.json();
    console.log(data);
    alert(JSON.stringify(data));
    return "data"   
}
