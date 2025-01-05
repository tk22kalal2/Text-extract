let extractedText = '';
let questionIndex = 0;
let allQuestions = [];

document.getElementById('extractText').addEventListener('click', async function () {
  const pdfUpload = document.getElementById('pdfUpload');
  const output = document.getElementById('textResult');
  const loader = document.getElementById('loader');
  const generateMCQsButton = document.getElementById('generateMCQs');

  if (pdfUpload.files.length === 0) {
    alert('Please upload a PDF first!');
    return;
  }

  loader.style.display = 'block';
  output.textContent = '';
  generateMCQsButton.style.display = 'none';

  const file = pdfUpload.files[0];
  const fileReader = new FileReader();

  fileReader.onload = async function (event) {
    const typedArray = new Uint8Array(event.target.result);

    try {
      const pdf = await pdfjsLib.getDocument(typedArray).promise;
      extractedText = '';

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        const imageDataURL = canvas.toDataURL();
        const { data: { text } } = await Tesseract.recognize(imageDataURL, 'eng');
        extractedText += `Page ${pageNumber}:\n${text}\n\n`;
      }

      loader.style.display = 'none';
      output.textContent = extractedText || 'No text detected in the PDF!';
      generateMCQsButton.style.display = 'block';

    } catch (error) {
      loader.style.display = 'none';
      console.error('Error:', error);
      output.textContent = 'Error processing the PDF!';
    }
  };

  fileReader.readAsArrayBuffer(file);
});

document.getElementById('generateMCQs').addEventListener('click', async function () {
  const GROQ_API_KEY = "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";
  const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
  const mcqContainer = document.getElementById('mcqContainer');
  const mcqResult = document.getElementById('mcqResult');
  const nextQuestionButton = document.getElementById('nextQuestion');

  if (!extractedText) {
    alert('No extracted text available! Please extract text first.');
    return;
  }

  mcqResult.textContent = 'Generating question...';
  mcqContainer.style.display = 'block';

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-specdec",
        stream: false,
        messages: [
          {
            role: "system",
            content: "You are an AI that generates multiple-choice questions (MCQs) based on the given text."
          },
          {
            role: "user",
            content: `Generate a set of multiple-choice questions based on the following text:\n\n${extractedText}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const mcqs = result.choices[0].message.content;

    // Parse the MCQs into an array
    allQuestions = mcqs.split('\n\n').map((question) => question.trim());
    questionIndex = 0;

    // Display the first question
    displayQuestion(mcqResult, nextQuestionButton);

  } catch (error) {
    mcqResult.textContent = 'Error generating questions!';
    console.error('Error:', error);
  }
});

function displayQuestion(mcqResult, nextQuestionButton) {
  if (questionIndex < allQuestions.length) {
    mcqResult.textContent = allQuestions[questionIndex];
    nextQuestionButton.style.display = 'block';
    nextQuestionButton.onclick = () => {
      questionIndex++;
      displayQuestion(mcqResult, nextQuestionButton);
    };
  } else {
    mcqResult.textContent = 'No more questions available!';
    nextQuestionButton.style.display = 'none';
  }
}
