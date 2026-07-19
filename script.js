const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const quickButtons = document.querySelectorAll(
  ".quick-actions button"
);
const sendButton = chatForm.querySelector(
  'button[type="submit"]'
);

const API_URL =
  "https://aquanest-chatbot.vercel.app/api/chat";

const conversationHistory = [];

function addMessage(text, sender) {
  const message = document.createElement("div");

  message.className = `message ${sender}`;
  message.textContent = text;

  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  return message;
}

function setLoading(isLoading) {
  userInput.disabled = isLoading;
  sendButton.disabled = isLoading;

  quickButtons.forEach(button => {
    button.disabled = isLoading;
  });

  sendButton.textContent = isLoading
    ? "Thinking..."
    : "Send";
}

async function getBotResponse(question) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: question,
      history: conversationHistory
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "The assistant could not respond."
    );
  }

  return data.answer;
}

async function handleQuestion(question) {
  const cleanedQuestion = question.trim();

  if (!cleanedQuestion) {
    return;
  }

  addMessage(cleanedQuestion, "user");
  setLoading(true);

  try {
    const answer = await getBotResponse(
      cleanedQuestion
    );

    addMessage(answer, "bot");

    conversationHistory.push({
      user: cleanedQuestion,
      assistant: answer
    });

    if (conversationHistory.length > 10) {
      conversationHistory.shift();
    }
  } catch (error) {
    console.error(error);

    addMessage(
      error.message ||
        "The assistant could not respond just now. Please try again.",
      "bot"
    );
  } finally {
    setLoading(false);
    userInput.focus();
  }
}

chatForm.addEventListener("submit", event => {
  event.preventDefault();

  const question = userInput.value;
  userInput.value = "";

  handleQuestion(question);
});

quickButtons.forEach(button => {
  button.addEventListener("click", () => {
    handleQuestion(button.dataset.question);
  });
});
