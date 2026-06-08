#!/bin/bash

# Argument 1: URL, Argument 2: timeout in milliseconds, default 60000 (1 minute)
url=${1:-"https://dw-dengwei.github.io/daily-arXiv-ai-enhanced/?category=cs.CV"}
timeout=${2:-60000}

# Check whether node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js first: https://nodejs.org/"
    exit 1
fi

# Check whether puppeteer is installed (slightly more robust approach)
if ! node -e "require('puppeteer')" &> /dev/null; then
    echo "Warning: puppeteer is not installed"
    echo "Installing puppeteer..."
    npm install puppeteer
    if [ $? -ne 0 ]; then
        echo "Error: puppeteer installation failed"
        exit 1
    fi
    echo "puppeteer installed successfully"
fi

# Run the fetch
node -e "
const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    await page.goto('$url', {
      waitUntil: 'networkidle0',
      timeout: $timeout
    });

    const content = await page.evaluate(() => document.body.innerText);

    console.log(content);

    await browser.close();
  } catch (err) {
    console.error('❌ Puppeteer execution failed:');
    console.error(err);
    process.exit(1);
  }
})();
"