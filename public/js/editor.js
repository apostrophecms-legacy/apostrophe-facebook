// @class Editor for Facebook widgets

function AposFacebookWidgetEditor(options) {
  var self = this;

  if (!options.messages) {
    options.messages = {};
  }
  if (!options.messages.missing) {
    options.messages.missing = 'Paste in a URL for your Facebook first.';
  }
  if (!options.messages.incorrect) {
    options.messages.incorrect = 'The URL that you pasted is not a valid Facebook.';
  }

  self.type = 'facebook';
  options.template = '.apos-facebook-editor';

  AposWidgetEditor.call(self, options);

  // What are these doing?
  self.preSave = getPosts;

  self.afterCreatingEl = function() {
    self.$pageUrl = self.$el.find('[name="facebookUrl"]');
    self.$pageUrl.val(self.data.pageUrl);
    self.$limit = self.$el.find('[name="facebookLimit"]');
    // N.B. Facebook has a set limit of 10 posts on their RSS feed.
    // We live in a world of useful constraints. --Joel
    self.$limit.val(self.data.limit || 10);
    setTimeout(function() {
      self.$pageUrl.focus();
      //self.$pageUrl.setSelection(0, 0);
    }, 500);
  };


  function getPosts(callback) {
    self.exists = !!self.$pageUrl.val();
    if (self.exists) {
      self.data.pageUrl = self.$pageUrl.val();
      self.data.limit = self.$limit.val();
    }
    if (!self.$pageUrl.val().match(/facebook.com/)) {
      return alert(options.messages.incorrect);
    }
    return callback();
  }
}

AposFacebookWidgetEditor.label = 'Facebook Feed';

apos.addWidgetType('facebook');
