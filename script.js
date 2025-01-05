const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

let ocrText = ""; // Full OCR text extracted from the PDF
let textChunks = []; // Chunks of the OCR text
let currentChunkIndex = 0; // Current chunk being processed
let currentQuestion = ""; // Current question displayed

// Function to chunk the OCR text
function chunkText(text, chunkSize = 1000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

// Function to call GROQ API and generate a question
async function generateQuestion(chunk) {
  const payload = {
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a professional educator creating multiple-choice questions (MCQs).",
      },
      {
        role: "user",
        content: `Generate one multiple-choice question (MCQ) with 4 options from this content:\n\n${chunk}\n\nEnsure one option is correct and clearly mark it. Format it as:\nQ: <Question>\nA. <Option 1>\nB. <Option 2>\nC. <Option 3>\nD. <Option 4>\nAnswer: <Correct Option>`,
      },
    ],
    temperature: 0.7,
    max_tokens: 300,
  };

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error generating question:", error);
    return "Error: Unable to generate question.";
  }
}

// Function to display the current question
function displayQuestion(question) {
  const questionContainer = document.getElementById("questionContainer");
  questionContainer.textContent = question || "No question available.";
}

// Function to handle "Next Question" button
async function handleNextQuestion() {
  if (currentChunkIndex < textChunks.length) {
    const chunk = textChunks[currentChunkIndex];
    currentQuestion = await generateQuestion(chunk);
    displayQuestion(currentQuestion);
    currentChunkIndex++;
  } else {
    displayQuestion("No more questions available!");
  }
}

// Extract OCR Text and prepare chunks
document.getElementById("extractText").addEventListener("click", async function () {
  // Assuming OCR process is already complete and stored in `ocrText`
  ocrText = document.getElementById("textResult").textContent;

  if (!ocrText.trim()) {
    alert("No text available to process. Perform OCR first.");
    return;
  }

  alert("Chunking text for question generation...");
  textChunks = chunkText(ocrText);
  currentChunkIndex = 0;

  alert(`Text chunked into ${textChunks.length} parts. Ready to generate questions.`);
  handleNextQuestion(); // Generate the first question
});

// Handle "Next Question" button click
document.getElementById("nextQuestion").addEventListener("click", handleNextQuestion);
