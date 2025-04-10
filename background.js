// background.js

async function callOpenAI(promptText) {
    const { apiKey } = await chrome.storage.local.get("apiKey"); // Obtener la API key del almacenamiento local

    if (!apiKey) {
        throw new Error("API key no configurada.");
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'Sos un experto en comprensión de textos y tu tarea es **resumir de forma clara, concisa y fiel** el siguiente contenido. Mantené las ideas más importantes, evitá detalles menores, y expresalo en un lenguaje sencillo pero profesional. El resumen debe ser fácil de leer, como si se lo explicaras a alguien con poco tiempo. No agregues opinión ni interpretación personal.' },
                { role: 'user', content: promptText }
            ],
            max_tokens: 300,
            temperature: 0.2
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error en la API: ${response.status} - ${errorText}`); // Log detallado
        throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Respuesta de OpenAI:", data); // Log de la respuesta
    return data.choices[0].message.content;
}

// Crear un item en el menu contextual
chrome.contextMenus.create({
    id: "summarizeSelection",
    title: "Summarize with ResumimeAI",
    contexts: ["selection"]
});

// Listener para el menu contextual
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "summarizeSelection") {
        const selectedText = info.selectionText;
        chrome.action.openPopup().then(() => {
            chrome.runtime.sendMessage({ type: "SUMMARY_REQUEST", text: selectedText });
        });
    }
});

// Listener para el command (shortcut)
chrome.commands.onCommand.addListener((command, tab) => {
    if (command === "summarizeSelection") {
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

                if (selectedText) {
                    chrome.runtime.sendMessage({ type: "SUMMARY_REQUEST", text: selectedText });
                }
            }
        );
    }
});

// Escuchar mensajes desde el content-script o popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SUMMARY_REQUEST') {
        callOpenAI(message.text)
            .then(summary => sendResponse({ summary }))
            .catch(error => sendResponse({ error: error.message }));
        return true; // Necesario para respuestas async
    }
});

