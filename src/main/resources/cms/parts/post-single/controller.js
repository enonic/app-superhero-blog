var stk = require('stk/stk');
var util = require('utilities');

exports.get = function(req) {

    var component = execute('portal.getComponent');
    var up = req.params;
    var site = execute('portal.getSite');
    var content = util.getPost(); //Get the child content if it's a landing page.

    //For pagination
    var moduleConfig = site.moduleConfigs[module.name];
    var folderPath = moduleConfig.postsFolder ? stk.content.getPath(moduleConfig.postsFolder) : site._path + '/posts';
    var prev, next;

    // Pagination if it's a single post in the posts folder
    if(stk.content.getParentPath(content._path) == folderPath) {
        prev = execute('content.query', {
            start: 0,
            count: 1,
            query: '_parentPath="/content' + folderPath + '" AND createdTime < instant("' + content.createdTime + '")',
            sort: 'createdTime DESC',
            contentTypes: [module.name + ':post']
        });

        next = execute('content.query', {
            start: 0,
            count: 1,
            query: '_parentPath="/content' + folderPath + '" AND createdTime > instant("' + content.createdTime + '")',
            sort: 'createdTime ASC',
            contentTypes: [module.name + ':post']
        });
    }
    //End pagination

    //for comments
    var postUrl = execute('portal.serviceUrl', {
          service: 'comments'
      });

    var postAuthor = stk.content.get(content.data.author);
    var allowedTags = '<a href="" title=""> <abbr title=""> <acronym title=""> <b> <blockquote cite=""> <cite> <code> <del datetime=""> <em> <i> <q cite=""> <strike> <strong> ';

    //get comments TODO: Get only the first level comments here.
    var result = execute('content.query', {
        start: 0,
        count: 1000,
        query: "data.post = '" + content._id + "'",
        sort: 'createdTime DESC',
        contentTypes: [
            module.name + ':comment'
        ]
    });
    var commentsTotal = result.total;
    var comments = result.contents;

    //TODO: Get all the child comments here so they can be properly nested.
    for (var i = 0; i < comments.length; i++) {
        var data = comments[i].data;

        var date = util.getFormattedDate(new Date(comments[i].createdTime));
        date += ' at ' + comments[i].createdTime.substring(11, 16);
        data.pubDate = date;
        data.gravatar = util.getGravatar(data.email, 40) + '&d=http%3A%2F%2F0.gravatar.com%2Favatar%2Fad516503a11cd5ca435acc9bb6523536%3Fs%3D40&r=G';

        var liClass = 'comment';
        liClass += (i%2 == 0) ? ' even thread-even' : ' odd thread-odd';
        if(data.email == postAuthor.data.email) {
            liClass += ' bypostauthor';
        }
        data.liClass = liClass;

        data.replyClick = "addComment.moveForm('comment-" + comments[i]._id + "', '" + comments[i]._id + "', 'respond', '" + content._id + "')";
        //return addComment.moveForm( 'comment-1', '1', 'respond', '1' )

    }
    //end comments

    var data = content.data;
    var categoriesArray = new Array();
    var categories = util.getCategories();

    if (content.type == module.name + ':post') {

        data.path = content._path;
        data.id = content._id;
        data.createdTime = content.createdTime;
        data.author = data.author ? stk.content.get(data.author) : data.author;
        data.pubDate = util.getFormattedDate(new Date(content.createdTime));

        data.class = 'post-' + content._id + ' post type-post status-publish format-standard hentry';

        data.category = data.category ? stk.data.forceArray(data.category) : null;

        if(data.category) {
            for(var i = 0; i < data.category.length; i++) {
                if(data.category[i]) {
                    //var category = stk.content.get(data.category[i]);
                    var category = util.getCategory({id: data.category[i]}, categories);
                    categoriesArray.push(category);
                    data.class += ' category-' + category._name + ' ';
                }
            }
        }

        data.categories = categoriesArray.length > 0 ? categoriesArray : null

        if (data.featuredImage) {
            var img = stk.content.get(data.featuredImage);
            data.fImageName = img.displayName;
            data.fImageUrl = execute('portal.imageUrl', {
                id: data.featuredImage,
                filter: 'scalewidth(695)',
                format: 'jpeg'
            });
        }

        stk.data.deleteEmptyProperties(content.data);
    }
    //stk.log(content);
    var params = {
        post: content.data,
        pageTemplate: content.type == 'portal:page-template' ? true : false,
        site: site,
        content: content,
        prev: (prev && prev.contents) ? prev.contents[0] : null,
        next: (next && next.contents) ? next.contents[0] : null,
        allowedTags: allowedTags,
        postUrl: postUrl,
        commentsTotal: commentsTotal,
        comments: comments
    }
    var view = resolve('post.html');
    return stk.view.render(view, params);
};