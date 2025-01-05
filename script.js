document.getElementById('extractText').addEventListener('click', async function () {
  const pdfUpload = document.getElementById('pdfUpload');
  const output = document.getElementById('textResult');
  const loader = document.getElementById('loader');

  // Step 1: Check if a PDF is uploaded
  if (pdfUpload.files.length === 0) {
    alert('Please upload a PDF first!');
    console.error('Error: No file uploaded.');
    return;
  }

  alert('Step 1: PDF uploaded successfully.');
  loader.style.display = 'block';
  output.textContent = '';

  const file = pdfUpload.files[0];
  const fileReader = new FileReader();

  fileReader.onload = async function (event) {
    const typedArray = new Uint8Array(event.target.result);

    try {
      // Step 2: Load PDF using pdf.js
      const pdf = await pdfjsLib.getDocument(typedArray).promise;
      alert(`Step 2: PDF loaded successfully. Total pages: ${pdf.numPages}`);
      console.log('PDF loaded:', pdf);

      let extractedText = '';

      // Step 3: Loop through each page and extract text
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        alert(`Processing page ${pageNumber}/${pdf.numPages}`);
        console.log(`Processing page ${pageNumber}`);

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

        // Step 4: Convert the canvas to an image and pass it to Tesseract
        const imageDataURL = canvas.toDataURL();
        const { data: { text } } = await Tesseract.recognize(imageDataURL, 'eng', {
          logger: (info) => console.log('Tesseract progress:', info),
        });

        extractedText += `Page ${pageNumber}:\n${text}\n\n`;
        console.log(`Extracted text from page ${pageNumber}:`, text);
      }

      // Step 5: Display the extracted text
      loader.style.display = 'none';
      output.textContent = extractedText || 'No text detected in the PDF!';
      alert('Step 5: Text extraction completed successfully.');

      // Step 6: Save and send the extracted text to GROQ AI API
      generateMCQsFromText(extractedText);

    } catch (error) {
      loader.style.display = 'none';
      alert('Error processing the PDF!');
      console.error('Error:', error);
      output.textContent = 'Error processing the PDF!';
    }
  };

  fileReader.onerror = function () {
    alert('Error reading the PDF file!');
    console.error('FileReader error:', fileReader.error);
    loader.style.display = 'none';
  };

  fileReader.readAsArrayBuffer(file);
});

// Function to generate MCQs using the GROQ AI API
async function generateMCQsFromText(extractedText) {
  const GROQ_API_KEY = "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";
  const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4", // Replace with the required model name
        messages: [
          {
            role: "system",
            content: "You are an AI that generates multiple-choice questions (MCQs) based on the given text."
          },
          {
            role: "user",
            content: `Generate multiple-choice questions based on the following text:\n\n${extractedText}`
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

    // Display the MCQs in the output section
    const output = document.getElementById('textResult');
    output.textContent = `Extracted Text:\n\n${extractedText}\n\nGenerated MCQs:\n\n${mcqs}`;
    alert('MCQs generated successfully!');

    console.log('Generated MCQs:', mcqs);

  } catch (error) {
    alert('Error generating MCQs!');
    console.error('GROQ AI API error:', error);
  }
}
