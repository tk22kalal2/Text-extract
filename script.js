document.getElementById('extractText').addEventListener('click', function () {
  const imageUpload = document.getElementById('imageUpload');
  const output = document.getElementById('textResult');
  const loader = document.getElementById('loader');

  if (imageUpload.files.length === 0) {
    alert('Please upload an image first!');
    return;
  }

  loader.style.display = 'block';
  output.textContent = '';

  const file = imageUpload.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    Tesseract.recognize(
      event.target.result, // Image file data
      'eng', // Language code
      {
        logger: (info) => console.log(info), // Optional logging
      }
    )
      .then(({ data: { text } }) => {
        loader.style.display = 'none';
        output.textContent = text || 'No text detected!';
      })
      .catch((error) => {
        loader.style.display = 'none';
        console.error(error);
        output.textContent = 'Error processing the image!';
      });
  };

  reader.readAsDataURL(file);
});
