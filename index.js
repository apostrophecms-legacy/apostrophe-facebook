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
  var self = this;
  self._apos = apos;
  self._app = app;
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
  self.pushAsset('stylesheet', 'content', { when: 'always' });

  self.widget = true;
  self.label = options.label || 'Facebook Feed';
  self.css = options.css || 'facebook';
  self.icon = options.icon || 'icon-facebook';

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

    return function() {
      fb.setAccessToken(access_token);
      fb.api(item._name, { fields: ['posts', 'picture']} , function (res) {
      if(res.err) {
        console.log(chalk.red('[Apostrophe Facebook] ') + 'The error is', res.err)
        return callback(res.err);
      }
      var posts = res.posts.data.slice(0, item.limit);

      item._entries = posts.map(function(post) {
        if (post.picture) {
          post.picture = post.picture.replace('_s.jpg', '_n.jpg'); //Get the bigger photo url.
        }
        return {
          id: post.id,
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
      cache[key] = { when: now.getTime(), data: item._entries };
        return callback();
      });
    }();
  };

  self._apos.addWidgetType('facebook', self);

  return setImmediate(function() { return callback(null); });
}
