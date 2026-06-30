const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const quickButtons = document.querySelectorAll(".quick-actions button");

const knowledgeBase = [
  {
    keywords: ["red", "urgent", "alarm", "danger"],
    answer:
      "A red warning light usually means the filter needs urgent attention. Please check whether the cartridge is blocked, the water flow is restricted, or the sensor is covered by debris. If fish are gasping or water is cloudy, move this to urgent support."
  },
  {
    keywords: ["amber", "orange", "yellow"],
    answer:
      "An amber warning light usually means the filter needs maintenance soon. Try rinsing the intake guard, checking the cartridge date, and making sure the tank size setting is correct. If the amber light stays on after 30 minutes, contact support."
  },
  {
    keywords: ["cartridge", "replace", "replacement"],
    answer:
      "Most cartridges should be replaced based on your tank size and fish load. Open the filter lid, remove the old cartridge, insert the new one with the flow arrow facing forward, then reset the filter indicator for five seconds."
  },
  {
    keywords: ["flow", "slow", "weak", "blocked", "water"],
    answer:
      "Low water flow is often caused by a blocked intake, clogged cartridge, or trapped air. Switch the unit off, check the intake guard, rinse visible debris using tank water, then restart the filter."
  },
  {
    keywords: ["sensor", "clean", "dirty"],
    answer:
      "To clean the sensor, switch off the filter, remove the sensor cover, and gently wipe the sensor with a soft damp cloth. Do not use soap or chemicals, as residue can harm aquarium water quality."
  },
  {
    keywords: ["human", "agent", "support", "escalate", "staff"],
    answer:
      "I can escalate this to AquaNest support. Please include your filter model, tank size, warning light colour, when the issue started, and whether fish are showing signs of stress."
  }
];

function addMessage(text, sender) {
  const message = document.createElement("div");
  message.className = `message ${sender}`;
  message.textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function getBotResponse(question) {
  const lowerQuestion = question.toLowerCase();
  const match = knowledgeBase.find(item =>
    item.keywords.some(keyword => lowerQuestion.includes(keyword))
  );

  if (match) {
    return match.answer;
  }

  return "I’m not fully sure from that description. Please tell me the warning light colour, your tank size, filter model, and whether the water flow has changed. For urgent fish health concerns, contact AquaNest support directly.";
}

function handleQuestion(question) {
  const cleanedQuestion = question.trim();

  if (!cleanedQuestion) {
    return;
  }

  addMessage(cleanedQuestion, "user");

  setTimeout(() => {
    addMessage(getBotResponse(cleanedQuestion), "bot");
  }, 400);
}

chatForm.addEventListener("submit", event => {
  event.preventDefault();
  handleQuestion(userInput.value);
  userInput.value = "";
});

quickButtons.forEach(button => {
  button.addEventListener("click", () => {
    handleQuestion(button.dataset.question);
  });
});
