const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

let ocrText = ""; // OCR text extracted from the PDF
let currentQuestion = ""; // Current question
let currentChunkIndex = 0; // Keeps track of text chunks processed

// Function to chunk OCR text (optional for large text)
function chunkText(text, chunkSize = 1000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

// Function to call GROQ API and generate a question
async function generateQuestionFromOCR(textChunk) {
  const payload = {
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a professional educator creating multiple-choice questions (MCQs).",
      },
      {
        role: "user",
        content: `Create one MCQ with 4 options from the following content:\n\n${textChunk}\n\nFormat it as:\nQ: <Question>\nA. <Option 1>\nB. <Option 2>\nC. <Option 3>\nD. <Option 4>\nAnswer: <Correct Option>`,
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

// Display generated question and options
function displayQuestion(questionText) {
  const questionContainer = document.getElementById("questionContainer");
  const optionsContainer = document.getElementById("optionsContainer");

  // Parse the question and options from the response
  const lines = questionText.split("\n");
  const question = lines.find(line => line.startsWith("Q:"));
  const options = lines.filter(line => /^[A-D]\./.test(line));

  // Display question
  questionContainer.textContent = question || "No question available.";

  // Display options
  optionsContainer.innerHTML = "";
  options.forEach(option => {
    const optionButton = document.createElement("button");
    optionButton.textContent = option;
    optionButton.className = "option-button";
    optionsContainer.appendChild(optionButton);
  });
}

// Event Listener: Extract OCR Text
document.getElementById("extractText").addEventListener("click", async function () {
  const fileInput = document.getElementById("pdfUpload");
  const textResult = document.getElementById("textResult");
  const generateQuestionButton = document.getElementById("generateQuestion");

  if (!fileInput.files.length) {
    alert("Please upload a PDF file.");
    return;
  }

  const file = fileInput.files[0];
  const pdfText = await extractTextFromPDF(file); // Function to extract text from PDF (assume already implemented)
  const ocrResult = await performOCR(pdfText); // Perform OCR on the PDF (assume already implemented)

  ocrText = ocrResult.trim();

  if (ocrText) {
    textResult.textContent = ocrText;
    generateQuestionButton.disabled = false; // Enable "Generate Question" button
  } else {
    alert("No text extracted from the PDF.");
  }
});

// Event Listener: Generate Question
document.getElementById("generateQuestion").addEventListener("click", async function () {
  const textChunks = chunkText(ocrText);
  if (currentChunkIndex < textChunks.length) {
    const currentChunk = textChunks[currentChunkIndex];
    const question = await generateQuestionFromOCR(currentChunk);
    displayQuestion(question);
    currentChunkIndex++;
  } else {
    alert("All questions have been generated.");
  }
});

// Event Listener: Next Question
document.getElementById("nextQuestion").addEventListener("click", function () {
  document.getElementById("generateQuestion").click(); // Simulate "Generate Question" button click
});
