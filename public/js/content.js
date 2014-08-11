apos.widgetPlayers.facebook = function($el) {
  var data = apos.getWidgetData($el);
  var pageUrl = data.pageUrl;
  //var limit = data.limit;

  $.getJSON(
    // Note the trailing ? is significant. It tells jQuery to automatically
    // create a JSONP callback function and obtain the result via a cross-domain
    // script tag so we can talk to twitter in older browsers without a
    // security error
    '/apos-facebook/feed',
    {
      limit: (data.limit || 5),
      pageUrl: pageUrl,
    },
    function(posts) {

      var $posts = $el.find('[data-apos-facebook-posts]'),
          $template = $posts.find('[data-apos-facebook-post].apos-template');

      if (!posts.length) {
        $el.trigger('aposFacebookNull');
        return;
      }

      function init(){
        removePlaceholder();
        //buildTemplate();
        generatePostMarkup(posts);
      }

      function removePlaceholder(){
        $posts.find('[data-apos-facebook-placeholder]').remove();
      }

      function buildTemplate($template){
        $template.$title = $template.find('[data-apos-facebook-title]');
        $template.$link = $template.find('[data-apos-facebook-link]');
        $template.$date = $template.find('[data-apos-facebook-date]');
        $template.$photo = $template.find('[data-apos-facebook-photo]');
        $template.$body = $template.find('[data-apos-facebook-body]');
        return $template;
      }

      function cloneTemplate($obj){
        $obj.removeClass('apos-template');
        $clone = $obj.clone();
        buildTemplate($clone);
        console.log("Now the clone is: ", $clone);
        return $clone;
      }

      function generatePostMarkup(posts){
        console.log(posts);
        _.each(posts, function(post){
          console.log("You're currently processing: ", post);
          //Clone our Template
          var $post = cloneTemplate($template);

          //Add Title
          if(post.name){
            $post.$title.text(post.name);
          } else {
            $post.$title.remove();
          }

          //Add Link href
          if(post.link){
            $post.$link.attr('href', post.link);
          }

          //Add Date --> Need to parse this.
          if(post.date){
            $post.$date.text(post.date || '');
          } else {
            $post.$date.remove();
          }

          //Add Photo
          if(post.photo){
            $post.$photo.find('img').attr('src', '/apos-facebook/photo/'+post.id);
          }

          //Add Body
          if(post.body){
            $post.$body.html(post.body);
          } else {
            $post.$body.remove();
          }

          //Add Type
          $post.data('post-type', post.type || '');
          //Add That to the List
          $posts.append($post);
        });
      };

      init();
    }
  );
}
