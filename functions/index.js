// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

// The Puppeteer for crawling the web page.
const puppeteer = require('puppeteer');

exports.getExchangeList = functions
    .region('asia-northeast1')
    .https.onRequest(async (req, res) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.goto('https://finance.naver.com/marketindex/', {waitUntil: 'networkidle2'});
    var exchangeList = await page.evaluate(() => {
      const infoNodes = document.querySelector("#exchangeList > li.on > div").children;
      const usdNodes = document.querySelector("#exchangeList > li.on > a.head.usd > div").children;
      const jpyNodes = document.querySelector("#exchangeList > li > a.head.jpy > div").children;
      const eurNodes = document.querySelector("#exchangeList > li > a.head.eur > div").children;
      const cnyNodes = document.querySelector("#exchangeList > li > a.head.cny > div").children;
      
      const scrappedData = {
        time: infoNodes[0].textContent,
        source: infoNodes[1].textContent,
        count: infoNodes[2].textContent,
        usd: {
          value: Number(usdNodes[0].textContent.replace(/[^0-9.-]+/g,"")).toFixed(2),
          change: Number(usdNodes[2].textContent.replace(/[^0-9.-]+/g,"")).toFixed(2),
          blind: usdNodes[3].textContent.replace(/[\s]/g,"")
        },
        jpy: {
          value: Number(jpyNodes[0].textContent.replace(/[^0-9.-]+/g,"")).toFixed(2),
          change: Number(jpyNodes[2].textContent.replace(/[^0-9.-]+/g,"")).toFixed(2),
          blind: jpyNodes[3].textContent.replace(/[\s]/g,"")
        },
        eur: {
          value: Number(eurNodes[0].textContent.replace(/[^0-9.-]+/g,"")).toFixed(2),
          change: Number(eurNodes[2].textContent.replace(/[^0-9.-]+/g,"")).toFixed(2),
          blind: eurNodes[3].textContent.replace(/[\s]/g,"")
        },
        cny: {
          value: Number(cnyNodes[0].textContent.replace(/[^0-9.-]+/g,"")).toFixed(2),
          change: Number(cnyNodes[2].textContent.replace(/[^0-9.-]+/g,"")).toFixed(2),
          blind: cnyNodes[3].textContent.replace(/[\s]/g,"")
        }
      };
  
      return scrappedData;
    });

    const snapshot = await admin.database().ref('currencies/' + Date.now()).set(exchangeList);

    await browser.close();

    res.status(200).json({
        message: "The batch is completed"
    });
});