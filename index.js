const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');

(async () => {
  // Launch browser
  const browser = await puppeteer.launch({
    headless: false,    
    defaultViewport: null,     // show full browser window
    userDataDir: './tmp',      // keep cookies & sessions between runs
  });

  const page = await browser.newPage();

  // Go to the first problemset page
  await page.goto('https://leetcode.com/problemset/?page=1', {
    waitUntil: 'networkidle2', // Ajax has finished loading
  });

  // Collect all links (href) and title of problem from the page
  // Use $$eval so we don't carry around ElementHandles
  const problemData = await page.$$eval(
    'a.h-5.hover\\:text-blue-s.dark\\:hover\\:text-dark-blue-s',
    
    (links) => {
      return links.map((el) => {
        return {
          title: el.textContent.trim(),
          href: el.getAttribute('href'),
        };
      });
    }
  );

  console.log(`Found ${problemData.length} problems on this page.`);

  // Create a new Excel workbook & sheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('LeetCode Page 1');
  worksheet.addRow(['Problem Title', 'Difficulty']);

  // Loop through each problem link
  for (let i = 0; i < problemData.length; i++) {
    const { title, href } = problemData[i];
    const problemUrl = `https://leetcode.com${href}`;

    console.log(`Scraping [${i + 1}/${problemData.length}]: ${title} => ${href}`);

    // Navigate to problem's page
    await page.goto(problemUrl, {
      waitUntil: 'networkidle2', // Ajax has finished loading
    });

    // Wait for difficulty element to appear
    // Find a class that tells us the difficulty dynamically
    await page.waitForSelector('div[class*="text-difficulty-"]'); // a div that has the substring "text-difficulty-" in it

    // Scrape difficulty using a new page selector
    const difficulty = await page.$eval(
      'div[class*="text-difficulty-"]',
      (el) => el.textContent.trim() // get the text content of the element
    );

    console.log(`Title: ${title} | Difficulty: ${difficulty}`);

    // Store in Excel
    worksheet.addRow([title, difficulty]);
  }

  await workbook.xlsx.writeFile('LeetCodePage1.xlsx');
  console.log('Data saved to LeetCodePage1.xlsx');

  await browser.close();
})();
