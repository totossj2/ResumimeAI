let selectedText = "";

document.addEventListener("mouseup", () => {
    selectedText = window.getSelection().toString().trim();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_SELECTED_TEXT") {
        sendResponse({ text: selectedText });
    }
});
