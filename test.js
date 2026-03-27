// test-robo-analyse.js
// Node.js script to test the /api/robo-analyse endpoint

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Change this to your actual API endpoint
const API_URL = 'http://localhost:3000/api/robo-analyse';

// Path to a sample image (jpg file)
const SAMPLE_IMAGE_PATH = path.join(__dirname, 'test.png');

async function main() {

  let base64Image;
  try {
    const imgBuffer = fs.readFileSync(SAMPLE_IMAGE_PATH);
    base64Image = imgBuffer.toString('base64');
  } catch (err) {
    console.error('Could not read sample image file:', err.message);
    process.exit(1);
  }

  const payload = { imageData: base64Image };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    console.log('API response:', data);
  } catch (err) {
    console.error('API request failed:', err.message);
  }
}

main();
