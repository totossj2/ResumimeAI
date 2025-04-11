// Guardar la API key ingresada por el usuario
document.getElementById("save-api-key").addEventListener("click", async () => {
    const apiKeyInput = document.getElementById("api-key-input").value.trim();

    if (apiKeyInput) {
        await chrome.storage.local.set({ apiKey: apiKeyInput });
        alert("API key guardada correctamente.");
    } else {
        alert("Por favor, ingresa una API key válida.");
    }
});

// Chat functionality
const chatContainer = document.getElementById("chat-container");
const sendButton = document.getElementById("send-button");

// Function to add a message to the chat
function addMessage(text, isUser, isInitial = false) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    messageElement.classList.add(isUser ? "user-message" : "ai-message");
    messageElement.textContent = text;

    if (!isUser && !isInitial) {
        const copyButton = document.createElement("button");
        copyButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-copy">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z" />
                <path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" />
            </svg>
            Copiar`;
        copyButton.classList.add("copy-button");
        copyButton.addEventListener("click", () => copyToClipboard(text));
        messageElement.appendChild(copyButton);
    }

    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Function to copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        console.log('Texto copiado al portapapeles');
    } catch (err) {
        console.error('Error al copiar al portapapeles: ', err);
    }
}

// Function to display AI response in the chat
function displayAIResponse(message) {
    addMessage(message, false);
    saveMessage(message, false); // Save the summary as an AI message
}

// Function to save messages to Chrome storage
async function saveMessage(text, isUser, isInitial = false) {
    const { messages } = await chrome.storage.local.get({ messages: [] });
    messages.push({ text, isUser, isInitial });
    await chrome.storage.local.set({ messages });
}

// Function to load messages from Chrome storage
async function loadMessages() {
    const { messages } = await chrome.storage.local.get({ messages: [] });
    if (messages.length === 0) {
        addMessage("¡Hola! Soy ResumimeAI. ¿En qué puedo ayudarte hoy?", false, true);
        saveMessage("¡Hola! Soy ResumimeAI. ¿En qué puedo ayudarte hoy?", false, true);
    } else {
        messages.forEach(message => {
            addMessage(message.text, message.isUser, message.isInitial); // Display each message
        });
    }
}

// Function to clear chat history
async function clearChatHistory() {
    await chrome.storage.local.set({ messages: [] });
    chatContainer.innerHTML = ''; // Clear the chat container
    addMessage("¡Hola! Soy ResumimeAI. ¿En qué puedo ayudarte hoy?", false, true); // Add the initial message
    saveMessage("¡Hola! Soy ResumimeAI. ¿En qué puedo ayudarte hoy?", false, true); // Add the initial message
}

// Handle messages from background script
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.type === "SUMMARY_REQUEST") {
            const selectedText = request.text;

            // Display user message (selected text)
            addMessage(selectedText, true);
            saveMessage(selectedText, true);

            // Send the selected text to the background script for summarization
            chrome.runtime.sendMessage(
                { type: "SUMMARY_REQUEST", text: selectedText },
                (response) => {
                    if (response?.summary) {
                        // Display the summary
                        displayAIResponse(response.summary);
                    } else {
                        console.error("Error al resumir:", response?.error);
                        displayAIResponse("Error al resumir.");
                    }
                }
            );
        }
    }
);

// Handle sending messages
async function sendMessage() {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Send message to content script to get selected text
    chrome.tabs.sendMessage(tab.id, { type: "GET_SELECTED_TEXT" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            displayAIResponse("Error: Could not connect to the page. Try reloading the page.");
            return;
        }

        let selectedText = response?.text || "";

        if (!selectedText) {
            displayAIResponse("No text selected.");
            return;
        }

        // Display user message (selected text)
        addMessage(selectedText, true);
        saveMessage(selectedText, true); // Save the user message

        // Send the selected text to the background script for summarization
        chrome.runtime.sendMessage(
            { type: "SUMMARY_REQUEST", text: selectedText },
            (response) => {
                if (response?.summary) {
                    // Display the summary
                    displayAIResponse(response.summary);
                } else {
                    console.error("Error al resumir:", response?.error);
                    displayAIResponse("Error al resumir.");
                }
            }
        );
    });
}

// Event listeners
sendButton.addEventListener("click", sendMessage);

// Zoom functionality
let isZoomed = false;
const defaultWidth = "350px";
const defaultHeight = "500px";
const zoomedWidth = "700px";
const zoomedHeight = "1000px";

const zoomInDefault = document.getElementById("zoom-in-default");
const zoomInMaximized = document.getElementById("zoom-in-maximized");

document.getElementById("zoom-in").addEventListener("click", () => {
    isZoomed = !isZoomed;
    document.body.style.width = isZoomed ? zoomedWidth : defaultWidth;
    document.body.style.height = isZoomed ? zoomedHeight : defaultHeight;

    zoomInDefault.style.display = isZoomed ? "none" : "inline";
    zoomInMaximized.style.display = isZoomed ? "inline" : "none";
});

// New chat functionality
document.getElementById("new-chat").addEventListener("click", clearChatHistory);

loadMessages(); // Load messages when the popup opens
