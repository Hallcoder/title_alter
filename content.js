// Content script to monitor URL changes (detecting video changes on YouTube)
(function() {
    let lastUrl = location.href;

    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            const videoId = new URL(url).searchParams.get('v');
            if (videoId) {
                // Notify popup.js or background.js about the video change
                chrome.runtime.sendMessage({ type: 'VIDEO_CHANGED', videoId: videoId });
            }
        }
    }).observe(document, { subtree: true, childList: true });
})();
