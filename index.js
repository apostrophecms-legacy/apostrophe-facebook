var feedparser = require('feedparser');
var fb = require('fb');
var extend = require('extend');
var _ = require('lodash');
var request = require('request');
var chalk = require('chalk');
var cache = {};

module.exports = function(options, callback) {
  return new Construct(options, callback);
};

module.exports.Construct = Construct;

function Construct(options, callback) {
  var apos = options.apos;
  var app = options.app;

  if (!options.fbAppId || !options.fbAppSecret) {
    console.error('WARNING: you must configure the fbAppId and fbAppSecret options to use the Facebook widget.');
  }
  var cacheLifetime = options.cacheLifetime || 30;
  var self = this;
  self._apos = apos;
  self._app = app;
  var limit;
  var lifetime = options.lifetime ? options.lifetime : 60000;

  var access_token = options.fbAppId+'|'+options.fbAppSecret;

  self._apos.mixinModuleAssets(self, 'facebook', __dirname, options);

  // This widget should be part of the default set of widgets for areas
  // (this isn't mandatory)
  apos.defaultControls.push('facebook');

  // Include our editor template in the markup when aposTemplates is called
  self.pushAsset('template', 'facebookEditor', { when: 'user' });
  //self.pushAsset('template', 'facebook', { when: 'always' });

  // Make sure that aposScripts and aposStylesheets summon our assets

  // We need the editor for RSS feeds. (TODO: consider separate script lists for
  // resources needed also by non-editing users.)
  self.pushAsset('script', 'editor', { when: 'user' });
  self.pushAsset('script', 'content', { when: 'always' });
  self.pushAsset('stylesheet', 'content', { when: 'always' });

  self.widget = true;
  self.label = options.label || 'Facebook';
  self.css = options.css || 'facebook';
  self.icon = options.icon || 'icon-facebook';

  self.sanitize = function(item) {
    if (!item.pageUrl.match(/^https?\:\/\//)) {
      item.pageUrl = 'http://' + item.pageUrl;
    }
    item.limit = parseInt(item.limit, 10);
  };

  var facebookCache = {};
  var pageUrl;


  //This needs to return a better image.
  app.get('/apos-facebook/photo', function(req, res){
    //Grab the post ID and build out a request URL.
    var postId = req.query.id,
        requestUrl = 'https://graph.facebook.com/'+postId+'?access_token='+access_token;

    request(requestUrl, function(err, response, body){
      if (err) {
        res.send(404);
        return console.log("The error is", err);
      }
      if(response.statusCode === 200){
        //Let's parse and send the image's URL.
        var postObj = JSON.parse(body);
        return res.json(postObj.source);
      }
    })

  });

  app.get('/apos-facebook/feed', function(req, res) {
    var pageUrl = apos.sanitizeString(req.query.pageUrl);
    var limit = apos.sanitizeString(req.query.limit);

    if (!pageUrl.length) {
      res.statusCode = 404;
      console.log(chalk.red('[Apostrophe Facebook] ') + 'It looks like you forgot to enter a URL');
      return res.send('not found');
    }

    if (_.has(facebookCache, pageUrl)) {
      var cache = facebookCache[pageUrl];
      var now = (new Date()).getTime();
      if (now - cache.when > lifetime * 1000) {
        delete facebookCache[pageUrl];
      } else {
        return res.send(cache.results);
      }
    }

    if (self._apos._aposLocals.offline) {
      res.statusCode = 404;
      return res.send('offline');
    }

    var nameString = pageUrl.match(/facebook.com\/(\w+)/);
    if (!nameString) {
      res.statusCode = 404;
      console.log(chalk.red('[Apostrophe Facebook] ') + 'The url seems to be incorrect: ', pageUrl);
      return res.send('incorrect url');
    }

    // Let's try redefining the URL scheme here.
    var pageName = nameString[1];
    //console.log(pageName);

    return function(item) {
      //fb.setAccessToken(access_token);

      var requestUrl = 'https://graph.facebook.com/'+pageName+'/posts?access_token='+access_token;

      request(requestUrl, function(err, response, body){
        if (err) {
          item._failed = true;
          console.log(chalk.red('[Apostrophe Facebook] ') + 'The error is', response.error);
          return callback(response.error);
        }
        if(response.statusCode === 200){

          var parsedBody = JSON.parse(body),
              // Unfortunately, we need to filter out trivial statuses on our end.
              filteredPosts = _.filter(parsedBody.data, function(post){
                return post.message;
                //return post.type !== "status";
              });
              posts = filteredPosts.slice(0, limit) || [];

          var results = posts.map(function(post) {
            return {
              id: post.id,
              object_id: post.object_id,
              photo: post.picture,
              body: post.message,
              date: post.updated_time,
              link: post.link,
              type: post.type,
              name: post.name,
              caption: post.caption,
              description: post.description
            };
          });
          facebookCache[pageUrl] = { when: (new Date()).getTime(),  results: results };
          return res.send(results);
        }
      });
    }();
  });

  self.renderWidget = function(data) {
    return self.render('facebook', data);
  };

  self._apos.addWidgetType('facebook', self);

  return setImmediate(function() { return callback(null); });
}
