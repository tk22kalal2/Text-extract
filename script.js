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

      // Step 3: Loop through each page and convert it to an image
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
