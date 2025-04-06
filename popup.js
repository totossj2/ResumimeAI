// Guardar y cambiar el estado en el storage
document.getElementById("toggle").addEventListener("click", async () => {
    const { autoCopy } = await chrome.storage.local.get("autoCopy");
    const newState = !autoCopy;

    await chrome.storage.local.set({ autoCopy: newState });

    document.getElementById("toggle").textContent = newState
        ? "Desactivar copia automática"
        : "Activar copia automática";
});

// Mostrar estado actual cuando se abre el popup
chrome.storage.local.get("autoCopy", ({ autoCopy }) => {
    document.getElementById("toggle").textContent = autoCopy
        ? "Desactivar copia automática"
        : "Activar copia automática";
});

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
function addMessage(text, isUser) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");
    messageElement.classList.add(isUser ? "user-message" : "ai-message");
    messageElement.textContent = text;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Function to display AI response in the chat
function displayAIResponse(message) {
    addMessage(message, false);
}

// Handle sending messages
async function sendMessage() {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Execute script to get selected text
    chrome.scripting.executeScript(
        {
            target: { tabId: tab.id },
            function: () => {
                return window.getSelection().toString().trim();
            },
        },
        (injectionResults) => {
            const selectedText = injectionResults[0].result;

            if (!selectedText) {
                displayAIResponse("No text selected.");
                return;
            }

            // Display user message (selected text)
            addMessage(selectedText, true);

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
    );
}

// Event listeners
sendButton.addEventListener("click", sendMessage);

// Add a welcome message when the popup opens
addMessage("¡Hola! Soy ResumimeAI. ¿En qué puedo ayudarte hoy?", false);
