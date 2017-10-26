// Dependencies
var express = require('express');
var mongojs = require('mongojs');

// Scraping tools
var request = require('request');
var cheerio = require('cheerio');

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Database Configuration
var databaseUrl = 'mmaScraper';
var collections = ['scrapedNews'];

// Hook MongoJS configuration to the database variable
var db = mongojs(databaseUrl, collections);
db.on('error', function(error) {
  console.log('Database Error: ', error);
});

// Main route
app.get('/', function(req, res) {
  res.send('MMA News Scraper');
});

// Retrieve data from the database
app.get('/all', function(req, res) {
  db.scrapedNews.find({}, function(error, found) {
    if (error) {
      console.log(error);
    } else {
      res.json(found);
    }
  });
});

// Scrape data from one site and place it into the mongodb db
app.get('/scrape', function(req, res) {
  // Make a request for the news section of mmajunkie
  request('https://www.mmafighting.com/latest-news', function(error, response, html) {
    // Load the html body from request into cheerio
    var $ = cheerio.load(html);
    // For each element with a 'title' class
    $('.c-entry-box--compact__title').each(function(i, element) {
      // Save the text and href of each link enclosed in the current element
      var title = $(element).children('a').text();
      var link = $(element).children('a').attr('href');
      // If this found element had both a title and a link, insert the data in the scrapedNews db
      if (title && link) {
        db.scrapedNews.insert({
            title: title,
            link: link
          },
          function(err, inserted) {
            if (err) {
              console.log(err);
            } else {
              console.log(inserted);
            }
          });
      }
    });
  });
  // Send a "Scrape Complete" message to the browser
  res.send('MMA Scrape Complete');
});

app.listen(PORT, function() {
  console.log('App running on port ' + PORT);
});