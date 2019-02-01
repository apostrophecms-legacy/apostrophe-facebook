/* eslint-disable camelcase */
/* eslint-disable no-var */
var _ = require('lodash');
var request = require('request');
var chalk = require('chalk');
var moment = require('moment');

module.exports = function (options, callback) {
  return new Construct(options, callback);
};

module.exports.Construct = Construct;

function Construct (options, callback) {
  var apos = options.apos;
  var app = options.app;

  if ((!options.fbAppId || !options.fbAppSecret) && !options.apiDisabled) {
    console.error('WARNING: you must configure the fbAppId and fbAppSecret options to use the Facebook widget.');
  }

  var self = this;
  self._apos = apos;
  self._app = app;
  var lifetime = options.lifetime ? options.lifetime : 60000;

  var access_token = options.fbAppId + '|' + options.fbAppSecret;

  self._apos.mixinModuleAssets(self, 'facebook', __dirname, options);

  // This widget should be part of the default set of widgets for areas
  // (this isn't mandatory)
  apos.defaultControls.push('facebook');

  // Include our editor template in the markup when aposTemplates is called
  self.pushAsset('template', 'facebookEditor', { when: 'user' });

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

  self.sanitize = function (item) {
    // eslint-disable-next-line no-useless-escape
    if (!item.pageUrl.match(/^https?\:\/\//)) {
      item.pageUrl = 'http://' + item.pageUrl;
    }
    item.limit = parseInt(item.limit, 10);
  };

  var facebookCache = {};

  self.sanitizeDate = function (date) {
    var postDate = moment(date, 'MM-DD-YYYY');
    var postMonth = postDate.month() + 1;
    var postDay = postDate.date();
    var postYear = postDate.year();
    var thisYear = moment().year();

    // eslint-disable-next-line eqeqeq
    return ((postYear != thisYear) ? postMonth + '/' + postDay + '/' + postYear : postMonth + '/' + postDay);
  };

  if (!options.apiDisabled) {
    // This needs to return a better image.
    app.get('/apos-facebook/photo', function (req, res) {
      // Grab the post ID and build out a request URL.
      var postId = req.query.id;
      var requestUrl = 'https://graph.facebook.com/' + postId + '?access_token=' +
      access_token + '&fields=source,name,created_time';

      request(requestUrl, function (err, response, body) {
        if (err) {
          res.send(404);
          return console.error(chalk.red('[Apostrophe Facebook] ') + 'The error is: ', err);
        }
        if (response.statusCode === 200) {
          // Let's parse and send the image's URL.
          var postObj = JSON.parse(body);
          return res.json(postObj);
        }
      });
    });

    app.get('/apos-facebook/feed', function (req, res) {
      var pageUrl = apos.sanitizeString(req.query.pageUrl);
      var limit = apos.sanitizeString(req.query.limit);
      var cacheKey = pageUrl + limit;

      if (!pageUrl.length) {
        res.statusCode = 404;
        console.error(chalk.red('[Apostrophe Facebook] ') + 'It looks like you forgot to enter a URL');
        return res.send('not found');
      }

      if (_.has(facebookCache, cacheKey)) {
        var cache = facebookCache[cacheKey];
        var now = (new Date()).getTime();
        if (now - cache.when > lifetime * 1000) {
          delete facebookCache[cacheKey];
        } else {
          return res.send(cache.results);
        }
      }

      if (self._apos._aposLocals.offline) {
        res.statusCode = 404;
        return res.send('offline');
      }

      var parsed = require('url').parse(pageUrl); // eslint-disable-line
      var nameString = require('path').basename(parsed.pathname);
      if (!nameString) {
        res.statusCode = 404;
        console.error(chalk.red('[Apostrophe Facebook] ') + 'The url seems to be incorrect: ', pageUrl);
        return res.send('incorrect url');
      }

      var requestUrl = 'https://graph.facebook.com/' + nameString +
      '/posts?access_token=' + access_token +
      '&fields=message,picture,link,object_id,updated_time,type,name,caption,description';

      return request(requestUrl, function (err, response, body) {
        if (err) {
          console.error(chalk.red('[Apostrophe Facebook] ') + 'The error is', response.error);
          return callback(response.error);
        }
        if (response.statusCode !== 200) {
          console.error(response.statusCode);
          console.error(body);
          return res.send('error from facebook');
        }
        var parsedBody = JSON.parse(body);

        // Unfortunately, we need to filter out trivial statuses on our end.
        var filteredPosts = _.filter(parsedBody.data, function (post) {
          return post.message;
        });
        var posts = filteredPosts.slice(0, limit) || [];

        var results = posts.map(function (post) {
          return {
            id: post.id,
            object_id: post.object_id,
            photo: post.picture,
            body: post.message,
            date: self.sanitizeDate(moment(post.updated_time).format('MM/DD/YYYY')),
            link: post.link,
            type: post.type,
            name: post.name,
            caption: post.caption,
            description: post.description
          };
        });

        facebookCache[cacheKey] = {
          when: (new Date()).getTime(),
          results: results
        };

        return res.send(results);
      });
    });
  }

  self.renderWidget = function (data) {
    return self.render('facebook', data);
  };

  self._apos.addWidgetType('facebook', self);

  return setImmediate(function () { return callback(null); });
}
