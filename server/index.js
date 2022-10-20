const { application } = require('express');
const express = require('express');
const bodyParser = require('body-parser');
const scraper = require('./scraper');
const app = express();
const port = 3000;

app.use(bodyParser.json())
app.use(function(req, res, next) 
{
    // specify parameters for the response data
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
});

app.post('/images', async (req, res) => {
    // call script function
    // send response back to client
    const retImageURL = await scraper.getImageURL(req.body.url);
    console.log("Sending image URL: " + retImageURL);
    res.send(retImageURL);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})