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
        var postDate = moment(date, 'MM-DD-YYYY'),
            postMonth = postDate.month(),
            postDay = postDate.date(),
            postYear = postDate.year(),
            thisYear = moment().year();
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

  Date.fromISO = (function(){
    var testIso = '2011-11-24T09:00:27+0200';
    // Chrome
    var diso= Date.parse(testIso);
    if(diso===1322118027000) return function(s){
        return new Date(Date.parse(s));
    }
    // JS 1.8 gecko
    var noOffset = function(s) {
      var day= s.slice(0,-5).split(/\D/).map(function(itm){
        return parseInt(itm, 10) || 0;
      });
      day[1]-= 1;
      day= new Date(Date.UTC.apply(Date, day));
      var offsetString = s.slice(-5)
      var offset = parseInt(offsetString,10)/100;
      if (offsetString.slice(0,1)=="+") offset*=-1;
      day.setHours(day.getHours()+offset);
      return day.getTime();
    }
    if (noOffset(testIso)===1322118027000) {
       return noOffset;
    }
    return function(s){ // kennebec@SO + QTax@SO
        var day, tz,
        rx = /^(\d{4}\-\d\d\-\d\d([tT][\d:\.]*)?)([zZ]|([+\-])(\d\d):?(\d\d))?$/,

        p= rx.exec(s) || [];
        if(p[1]){
            day= p[1].split(/\D/).map(function(itm){
                return parseInt(itm, 10) || 0;
            });
            day[1]-= 1;
            day= new Date(Date.UTC.apply(Date, day));
            if(!day.getDate()) return NaN;
            if(p[5]){
                tz= parseInt(p[5], 10)/100*60;
                if(p[6]) tz += parseInt(p[6], 10);
                if(p[4]== "+") tz*= -1;
                if(tz) day.setUTCMinutes(day.getUTCMinutes()+ tz);
            }
            return day;
        }
        return NaN;
    }
})()
}

apos.widgetPlayers.facebook.afterLoad = function($el, posts){
  //You can do whatever you want here.
}
