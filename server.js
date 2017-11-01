// Dependencies
var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');

// Scraping tools
var axios = require('axios');
var cheerio = require('cheerio');

// Require models
var db = require('./models');

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: false }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));


// Connect to MongoDB
mongoose.Promise = Promise;
// mongoose.connect("mongodb://localhost/mmaScraper", {
//   useMongoClient: true
mongoose.connect("mongodb://heroku_rr9mt9w0:r7hanmh4fgkrr2kdmm78lro9h0@ds125565.mlab.com:25565/heroku_rr9mt9w0", {
  useMongoClient: true
});


var database = mongoose.connection;
// Show any mongoose errors
database.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});
database.once("open", function() {
  console.log("Mongoose connection successful.");
});


// Main route
app.get('/', function(req, res) {
  res.send('MMA News Scraper');
});

// Retrieve data from the database
app.get("/articles", function(req, res) {
  db.Article
    .find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// GET route for scraping
app.get('/scrape', function(req, res) {
  // Make a request for the news
  axios.get('https://www.mmafighting.com/latest-news').then(function(response) {
    // Load the html body from request into cheerio
    var $ = cheerio.load(response.data);

    // For each element with a 'title' class
    $('.c-entry-box--compact__title').each(function(i, element) {

      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children('a')
        .text();
      result.link = $(this)
        .children('a')
        .attr('href');

        console.log(result);

      // Create a new Article using the `result` object built from scraping
      db.Article
        .create(result)
        .then(function(dbArticle) {
          res.send("MMA Scrape Complete"+ dbArticle );
        })
        .catch(function(err) {
          res.json(err);
        });
    });
  }); // end each loop

  res.send("MMA Scrape Complete" );
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  db.Article
    .findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note
    .create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.listen(PORT, function() {
  console.log('App running on port ' + PORT);
});