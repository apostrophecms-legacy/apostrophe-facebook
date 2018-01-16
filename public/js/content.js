apos.widgetPlayers.facebook = function($el) {
  // N.B. Even though this is a player, it's not getting refreshed
  // once it's been created. Hrmmm.

  var data = apos.getWidgetData($el),
      pageUrl = data.pageUrl;

  $.getJSON(
    '/apos-facebook/feed',
    {
      limit: (data.limit || 5),
      pageUrl: pageUrl,
    },
    function(posts) {

      //Define our posts object as well as the template and loader.
      var $posts = $el.find('[data-apos-facebook-posts]'),
          $postTemplate = $posts.find('[data-apos-facebook-post].apos-template'),
          $loader = $posts.find('[data-apos-facebook-loader]');

      if (!posts.length) {
        $el.trigger('aposFacebookNull');
        return;
      }

      function init(){
        removePlaceholder();
        generatePostMarkup(posts);
      }

      function removePlaceholder(){
        $posts.find('[data-apos-facebook-placeholder]').remove();
      }

      function removeTemplate(){
        $postTemplate.remove();
      };


      function buildTemplate($template){
        $template.$title = $template.find('[data-apos-facebook-title]');
        $template.$link = $template.find('[data-apos-facebook-link]');
        $template.$date = $template.find('[data-apos-facebook-date]');
        $template.$photo = $template.find('[data-apos-facebook-photo]');
        $template.$body = $template.find('[data-apos-facebook-body]');
        return $template;
      }

      function cloneTemplate($obj){
        $clone = $obj.clone();
        $clone.removeClass('apos-template');
        clone = buildTemplate($clone);
        return clone;
      }

      function getImage (postId, callback) {
        var id = postId;
        $.getJSON(
          '/apos-facebook/photo',
          { id: id},
          function(response) {
            return callback(response);
          }
        );
      }

      function stripLinks(text){
        text = text.replace(/^(\[url=)?(https?:\/\/)?(www\.|\S+?\.)(\S+?\.)?\S+$\s*/mg, '');
        return text;
      }

      function generatePostMarkup(posts){
        _.each(posts, function(post){
          //Clone our Template
          var $post = cloneTemplate($postTemplate);
          //console.log("The post should be:", $post);
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

          //Add Date
          if(post.date){
            $post.$date.text(post.date || '');
          } else {
            $post.$date.remove();
          }
          //Add Photo based on type
          if (post.type === "photo"){
            getImage(post.object_id, function (result) {
              $post.$photo.find('img').attr('src', result.source);
              $post.$photo.find('img').attr('alt', result.name);
            });
          } else if(post.photo){
            $post.$photo.find('img').attr('src', post.photo);
          }

          //Add Body
          if(post.body){
            if (post.type === 'link' || post.type ==='video') {
              $post.$body.html(stripLinks(post.body));
            } else {
              $post.$body.html(post.body);
            }
          } else {
            $post.$body.remove();
          }

          //Add Type --> Arguably, this could add a class as well.
          $post.attr('data-post-type', post.type || '');

          //If there's still a loader, kill it.
          $loader.remove();

          //Add That to the List

          $posts.append($post);
        });
        removeTemplate();
        apos.widgetPlayers.facebook.afterLoad($el, posts);
      };

      init();
    }
  );
}

apos.widgetPlayers.facebook.afterLoad = function($el, posts){
  //You can do whatever you want here.
}
