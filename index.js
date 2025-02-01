const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeProblems(page, pageNumber) {
  await page.goto(`https://leetcode.com/problemset/?page=${pageNumber}`, {
    waitUntil: 'networkidle2',
  });

  const problemData = await page.$$eval(
    'a.h-5.hover\\:text-blue-s.dark\\:hover\\:text-dark-blue-s',
    (links) => links.map((el) => ({
      title: el.textContent.trim(),
      href: el.getAttribute('href'),
    }))
  );

  const results = [];
  
  for (const {title, href} of problemData) {
    const problemUrl = `https://leetcode.com${href}`;
    await page.goto(problemUrl, {waitUntil: 'networkidle2'});
    await page.waitForSelector('div[class*="text-difficulty-"]');
    
    const difficulty = await page.$eval(
      'div[class*="text-difficulty-"]',
      (el) => el.textContent.trim()
    );

    results.push({
      title,
      difficulty,
      url: problemUrl
    });
    
    console.log(`Page ${pageNumber} - Title: ${title} | Difficulty: ${difficulty}`);
  }

  return results;
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    userDataDir: './tmp',
  });

  const page = await browser.newPage();
  const allProblems = [];
  
  for (let pageNumber = 1; pageNumber <= 2; pageNumber++) {
    console.log(`Scraping page ${pageNumber}`);
    const pageResults = await scrapeProblems(page, pageNumber);
    allProblems.push(...pageResults);
  }

  fs.writeFileSync('leetcode_problems.json', JSON.stringify(allProblems, null, 2));
  console.log(`Saved ${allProblems.length} problems to leetcode_problems.json`);

  await browser.close();
})();
