var feedparser = require('feedparser');
var fb = require('fbgraph');
var extend = require('extend');
var _ = require('lodash');
var cache = {};

module.exports = function(options, callback) {
  return new Construct(options, callback);
};

module.exports.Construct = Construct;

function Construct(options, callback) {
  var apos = options.apos;
  var app = options.app;
  var self = this;
  self._apos = apos;
  self._app = app;
  var lifetime = options.lifetime ? options.lifetime : 60000;

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
  self.pushAsset('stylesheet', 'content', { when: 'always' });

  self.widget = true;
  self.label = options.label || 'Facebook Feed';
  self.css = options.css || 'facebook';
  self.icon = options.icon || 'facebook';

  self.sanitize = function(item) {
    if (!item.pageUrl.match(/^https?\:\/\//)) {
      item.pageUrl = 'http://' + item.pageUrl;
    }
    item.limit = parseInt(item.limit, 10);
  };

  self.renderWidget = function(data) {
    return self.render('facebook', data);
  };

  self.load = function(req, item, callback) {

    var now = new Date();
    // Take all properties into account, not just the feed, so the cache
    // doesn't prevent us from seeing a change in the limit property right away
    var key = JSON.stringify({ feed: item.pageUrl, limit: item.limit });
    if (cache.hasOwnProperty(key) && ((cache[key].when + lifetime) > now.getTime())) {
      item._entries = cache[key].data;
      return callback();
    }

    item._entries = [];
    item._pageId = "";
    var nameString = item.pageUrl.match(/facebook.com\/(\w+)/);
    item._name = nameString[1];

    // This is just a test for now to see how this works.
    (function() {
      fb.get(item._name, function(err, res) {
        item._pageId = res.id;
        item._rssUrl = "http://www.facebook.com/feeds/page.php?format=rss20&id="+item._pageId;
        // Now that we've got the right data, let's get the RSS feed.
        self.getFacebookFeed();
      });
    })();

    //This is a callback to fetching the data from Facebook.
    self.getFacebookFeed = function(){

      //N.B. Despite the claims in this issue (https://github.com/danmactough/node-feedparser/issues/39),
      // one still needs to pass headers to parseUrl for Facebook's RSS feed, which is finicky. In an ideal
      // future with ponies and free lunch, we'll just hit the Graph API. --Joel
      feedparser.parseUrl({ uri: item._rssUrl, headers:{'user-agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.95 Safari/537.11'}}).on('complete', function(meta, articles) {
        articles = articles.slice(0, item.limit);
        // map is native in node
        item._entries = articles.map(function(article) {

          return {
            title: article.title,
            body: article.description,
            date: article.pubDate,
            link: article.link
          };
        });
        // Cache for fast access later
        cache[key] = { when: now.getTime(), data: item._entries };
        return callback();
      }).on('error', function(error) {
        item._failed = true;
        return callback();
      });
    }
  };

  self._apos.addWidgetType('facebook', self);

  return setImmediate(function() { return callback(null); });
}
