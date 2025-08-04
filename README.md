# ⛔️ **DEPRECATED** — do not use for new projects

See [our current docs](https://docs.apostrophecms.org/)

# apostrophe-facebook
[![NPM](https://nodei.co/npm/apostrophe-facebook.png?downloads=true&stars=true)](https://nodei.co/npm/apostrophe-facebook/)

<a href="http://apostrophenow.org/"><img src="https://raw.github.com/punkave/jquery-bottomless/master/logos/logo-box-madefor.png" align="right" /></a>
apostrophe-facebook is a widget for the [Apostrophe](http://github.com/punkave/apostrophe) content management system. Apostrophe lets you display an RSS feed for a Facebook Page in any content area.

## Getting Started
### Configuring the Module
In order to run the Apostorphe Facebook app in your Apostrophe project, you'll need to register your app with Facebook through their [developer portal](https://developers.facebook.com/). Once you've registered your app, you'll need both the App ID and the App Secret in order to configure the Apostrophe Facebook module. That configuration happens in the app.js of your project along with the other modules:

```js
modules: {
  apostrophe-facebook: {
    fbAppId: 'xxxxxxxxxxxxxxx',
    fbAppSecret: 'xxxxxxxx',
  }
}
```
### Including the Widget in your Templates
Now that we've got the widget configured, we can simply add it to our template and use the bundled template in the module (we'll override that later). In your template, simply add "apostrophe-facebook" to the controls array in your `aposArea` call:
```js
{{ aposArea(page, 'main', { controls: [ 'style', 'bold', 'italic', 'facebook' ] } ) }}
```

## Customizing the Widget
### Extending the Template
Out of the box, the apostrophe-facebook module depends on a data-attribute driven template to render a Facebook feed on the client side (which allows the widget to load independently of the page). Here's the basic template included in the module itself:

```html
<ul class="apos-facebook-posts" data-apos-facebook-posts>
  <span class="apos-facebook-loader" data-apos-facebook-loader></span>
  <li class="apos-facebook-post apos-template" data-apos-facebook-post>
    <a target="blank" data-apos-facebook-link>
      <h4 class="apos-facebook-title" data-apos-facebook-title></h4>
      <h5 class="apos-facebook-date" data-apos-facebook-date></h5>
      <div class="apos-facebook-photo" data-apos-facebook-photo><img src=""></div>
      <div class="apos-facebook-body" data-apos-facebook-body></div>
      <span class="apos-facebook-icon icon-facebook-sign"></span>
    </a>
  </li>
</ul>
```
Any of the markup in this template can be adapted to your project's needs so long as you include the appropriate data-attributes in this template (you can also omit anything that doesn't fit your needs). Note that the classes in this example are there only for the default styles and therefore should likely be changed in your projects template. To create a project-level template, simply add a file called `facebook.html` in the views folder of your project-level override of the apostrophe-facebook module: `lib > modules > apostrophe-facebooks > views`.
### Dynamic Changes with .afterLoad()
Because the apostrophe-facebook widget is loaded on the client-side, we're taking advantage of the `apos.widgetPlayers` object to load the widget, specifically in the `apos.widgetPlayers.facebook` method. This means that tinkering with the client-side JavaScript could potentially interfere with the widget's default loading behavior. Sometime, though, you just need to run some specific JavaScript and you want it to run everytime the widget is refreshed (that's the real beauty of the `widgetPlayers`). Enter `.afterLoad()`.

`apos.widgetPlayers.facebook.afterLoad()` allows you to add your own custom callback to the widgetPlayer. This function will fire at the conclusion of the load and you have access to `$el` as well as the `posts` object which is the response that our server returns when the widget loads. Here's an example that you might find in a `site.js` file:
```js
apos.widgetPlayers.facebook.afterLoad = function($el, posts){
  //Make the first post in the widget 
  $el.find('[data-apos-post]').eq(0).css('color', 'red');
  //Send the posts object to the console for inspection
  console.log(posts);
}
```

### Disabling the Facebook API Requests
Due to significant changes to the Facebook page API since publishing, you can now disable the Facebook requests by adding the option, `apiDisabled: true` to the module configuration. The initial use case for this was to support legacy users of this module in replacing the widget template with Facebook's own page feed plugin with the existing Facebook page URL data for the Apostrophe widget.

## TO-DO
- [x] Build it
- [x] Publish to NPM
- [x] Switch loader logic to browser-side player (like Twitter)
- [ ] Clean up caching to make sure you get new data on save
- [ ] Build some nice basic styles
- [ ] Write some tests?

<a href="http://punkave.com/"><img src="https://raw.github.com/punkave/jquery-bottomless/master/logos/logo-box-builtby.png" /></a>

**Note:** ESLint config included here is for use with editor linting.