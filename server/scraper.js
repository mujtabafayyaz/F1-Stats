const e = require('express');
const puppeteer = require('puppeteer');

// finds the first image element on the wikipedia page that has a source attribute then returns it
async function getImageURL(url)
{
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    
    const [el] = await page.$x('/html/body/div[3]/div[3]/div[5]/div[1]/table[1]/tbody/tr[1]/td/a/img')
    const [el2] = await page.$x('//*[@id="mw-content-text"]/div[1]/table[1]/tbody/tr[1]/td/a/img');
    const [el3] = await page.$x('//*[@id="mw-content-text"]/div[1]/table[1]/tbody/tr[2]/td/a/img');
    const [el4] = await page.$x('//*[@id="mw-content-text"]/div[1]/table[2]/tbody/tr[1]/td/a/img');
    const [el5] = await page.$x('//*[@id="mw-content-text"]/div[1]/table[2]/tbody/tr[2]/td/a/img');
    

    const elements = [el, el2, el3, el4, el5];


    for(const element of elements) 
    {
        if(element != undefined)
        {
            var src = await element.getProperty('src');
            var imageURL = await src.jsonValue();
            browser.close();
            return imageURL;
        }
    }


}

module.exports = { getImageURL }