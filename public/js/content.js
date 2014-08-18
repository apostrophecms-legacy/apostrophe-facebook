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

      function getImageUrl(postId, callback){
        var id = postId;
        $.getJSON(
          '/apos-facebook/photo',
          { id: id},
          function(response) {
            return callback(response);
          }
        );
      }

      function getFacebookDate(date){
        var postDate = new Date(date),
            postMonth = postDate.getMonth() + 1,
            postDay = postDate.getDate(),
            postYear = postDate.getFullYear(),
            thisYear = new Date().getFullYear();

        return ((postYear != thisYear ) ? postMonth +"/"+postDay+"/"+postYear: postMonth +"/"+postDay);
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
            var postDate = getFacebookDate(post.date);
            $post.$date.text(postDate || '');
          } else {
            $post.$date.remove();
          }

          //Add Photo based on type
          if (post.type === "photo"){
            getImageUrl(post.object_id, function(result){
              $post.$photo.find('img').attr('src', result);
            });
          } else if(post.photo){
            $post.$photo.find('img').attr('src', post.photo);
          }

          //Add Body
          if(post.body){
            $post.$body.html(post.body);
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
