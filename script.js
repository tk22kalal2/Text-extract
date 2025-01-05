const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

let ocrText = ""; // Aggregated OCR text

// Extract Text from PDF by converting pages to images
async function extractTextFromPDF(file) {
  const pdfjsLib = window["pdfjs-dist/build/pdf"];
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js";

  const fileReader = new FileReader();
  return new Promise((resolve, reject) => {
    fileReader.onload = async function () {
      const typedArray = new Uint8Array(this.result);
      const pdf = await pdfjsLib.getDocument(typedArray).promise;

      console.log(`PDF loaded: ${pdf.numPages} pages found.`);

      const textArray = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        console.log(`Processing page ${i}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        await page.render(renderContext).promise;

        // Perform OCR on the canvas image
        const imageData = canvas.toDataURL("image/png");
        const ocrResult = await performOCR(imageData);

        if (ocrResult) {
          console.log(`Text extracted from page ${i}:`, ocrResult);
          textArray.push(ocrResult);
        } else {
          console.warn(`No text found on page ${i}.`);
        }
      }

      // Combine text from all pages
      const fullText = textArray.join("\n");
      resolve(fullText);
    };

    fileReader.onerror = function () {
      reject(new Error("Failed to read the PDF file."));
    };

    fileReader.readAsArrayBuffer(file);
  });
}

// Perform OCR on an Image (using Tesseract.js)
async function performOCR(imageData) {
  try {
    console.log("Performing OCR on the image...");
    const result = await Tesseract.recognize(imageData, "eng", {
      logger: (info) => console.log(info),
    });
    console.log("OCR Result:", result.data.text);
    return result.data.text.trim();
  } catch (error) {
    console.error("OCR error:", error);
    return null;
  }
}

// Event Listener: Extract OCR Text
document.getElementById("extractText").addEventListener("click", async function () {
  const fileInput = document.getElementById("pdfUpload");
  const textResult = document.getElementById("textResult");
  const generateQuestionButton = document.getElementById("generateQuestion");
  const loader = document.getElementById("loader");

  if (!fileInput.files.length) {
    alert("Please upload a PDF file.");
    return;
  }

  const file = fileInput.files[0];
  textResult.textContent = ""; // Clear previous text
  loader.style.display = "block"; // Show loader

  try {
    ocrText = await extractTextFromPDF(file);
    loader.style.display = "none"; // Hide loader

    if (ocrText) {
      console.log("Final Extracted OCR Text:", ocrText);
      textResult.textContent = ocrText;
      generateQuestionButton.disabled = false; // Enable "Generate Question" button
    } else {
      alert("No text extracted from the PDF.");
      textResult.textContent = "No text available to process.";
    }
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    alert("Failed to process the PDF. Please try again.");
    loader.style.display = "none"; // Hide loader
  }
});
