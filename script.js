const FORM_URL = CONFIG.FORM_URL;

let isChatOpen = false;

function toggleChat() {
  const panel = document.getElementById("chatPanel");
  const chatIcon = document.getElementById("chatIcon");
  const closeIcon = document.getElementById("closeIcon");

  isChatOpen = !isChatOpen;

  if (isChatOpen) {
    panel.classList.remove("chat-hidden");
    panel.classList.add("chat-visible");
    chatIcon.classList.add("hidden");
    closeIcon.classList.remove("hidden");
    document.getElementById("userInput").focus();
  } else {
    panel.classList.remove("chat-visible");
    panel.classList.add("chat-hidden");
    chatIcon.classList.remove("hidden");
    closeIcon.classList.add("hidden");
  }
}

function appendUserMessage(text) {
  const chatHistory = document.getElementById("chatHistory");
  const html = `
                <div class="flex items-start justify-end">
                    <div class="szabist-navy text-white p-3 rounded-2xl rounded-tr-none max-w-[85%] shadow-2xs leading-relaxed">
                        ${escapeHtml(text)}
                    </div>
                </div>
            `;
  chatHistory.insertAdjacentHTML("beforeend", html);
  scrollToBottom();
}

function appendBotMessage(text) {
  const chatHistory = document.getElementById("chatHistory");

  // Parse Markdown text into styled HTML
  const formattedHtml =
    typeof marked !== "undefined" ? marked.parse(text) : text;

  const html = `
        <div class="flex items-start space-x-2.5">
            <div class="w-7 h-7 rounded-full szabist-navy text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                <i class="fa-solid fa-robot"></i>
            </div>
            <div class="bg-white border border-slate-200 text-slate-700 p-3 rounded-2xl rounded-tl-none max-w-[88%] shadow-2xs leading-relaxed markdown-body">
                ${formattedHtml}
            </div>
        </div>
    `;
  chatHistory.insertAdjacentHTML("beforeend", html);
  scrollToBottom();
}

function appendEscalationCard(deptName) {
  const chatHistory = document.getElementById("chatHistory");
  const FORM_URL = "https://forms.gle/CW1i5joik5YJXDxQA";

  const html = `
        <div class="flex items-start space-x-2.5">
            <div class="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                <i class="fa-solid fa-headset"></i>
            </div>
            <div class="bg-amber-50/90 border border-amber-200 text-amber-900 p-3.5 rounded-2xl rounded-tl-none max-w-[88%] shadow-2xs space-y-2">
                <p class="font-bold text-xs">Department Ticket Required</p>
                <p class="text-[11px] text-amber-800 leading-snug">
                    I cannot process this request directly, but our department staff can help you.
                </p>
                <a href="${FORM_URL}" target="_blank" class="inline-flex items-center justify-center space-x-1.5 w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-3 rounded-xl text-[11px] transition shadow-2xs">
                    <span>Open Support Ticket Form</span>
                    <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
                </a>
                <p class="text-[10px] text-amber-700">Include your <strong>Full Name</strong> and <strong>Student ID</strong> on the form.</p>
            </div>
        </div>
    `;
  chatHistory.insertAdjacentHTML("beforeend", html);
  scrollToBottom();
}
function handleUserSubmit(e) {
  e.preventDefault();
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text) return;

  appendUserMessage(text);
  input.value = "";

  // Simulate Bot Processing
  setTimeout(() => {
    processQuery(text);
  }, 500);
}

function sendQuickQuery(text) {
  if (!isChatOpen) toggleChat();
  document.getElementById("userInput").value = text;
  handleUserSubmit(new Event("submit"));
}

// 1. Paste your n8n Webhook URL here (Test or Production)
// const N8N_WEBHOOK_URL = "https://gowaxev792.app.n8n.cloud/webhook-test/6b2f4177-7797-4ff3-aa27-975e450c5b52";
const N8N_WEBHOOK_URL = CONFIG.N8N_WEBHOOK_URL;

// 2. Updated async query processor connecting frontend to n8n
async function processQuery(query) {
  appendTypingIndicator();
  // Generates or retrieves a unique session ID for the current browser session
  function getSessionId() {
    let sessionId = sessionStorage.getItem("szabist_chat_session");
    if (!sessionId) {
      sessionId = "session_" + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem("szabist_chat_session", sessionId);
    }
    return sessionId;
  }

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: query,
        sessionId: getSessionId(),
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    removeTypingIndicator();

    const replyText = data.reply || data.output || "";
    const formUrl = CONFIG.FORM_URL;

    // Intercept escalation text or link from n8n and render the UI Card
    if (
      replyText.includes("forms.gle") ||
      replyText.includes("Support Form") ||
      data.shouldEscalate
    ) {
      appendEscalationCard("Department Staff");
    } else {
      appendBotMessage(replyText);
    }
  } catch (error) {
    console.error("n8n Connection Error:", error);
    removeTypingIndicator();
    appendBotMessage(
      "I am having trouble reaching the server right now. Please try again.",
    );
  }
}
// 3. Helpers for typing indicator state
function appendTypingIndicator() {
  const chatHistory = document.getElementById("chatHistory");
  const html = `
        <div id="typingIndicator" class="flex items-start space-x-2.5">
            <div class="w-7 h-7 rounded-full szabist-navy text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                <i class="fa-solid fa-robot"></i>
            </div>
            <div class="bg-white border border-slate-200 text-slate-400 p-3 rounded-2xl rounded-tl-none max-w-[85%] shadow-2xs flex items-center space-x-1">
                <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
        </div>
    `;
  chatHistory.insertAdjacentHTML("beforeend", html);
  scrollToBottom();
}

function removeTypingIndicator() {
  const indicator = document.getElementById("typingIndicator");
  if (indicator) indicator.remove();
}

function scrollToBottom() {
  const chatHistory = document.getElementById("chatHistory");
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
