var stk = require('stk/stk');
var util = require('utilities');

exports.get = function(req) {

    var component = execute('portal.getComponent');
    var up = req.params;
    var site = execute('portal.getSite');
    var searchPage = util.getSearchPage();
    var content = execute('portal.getContent');
    var moduleConfig = site.moduleConfigs[module.name];

    var view = resolve('post.html');
    var childFragment = resolve('comment-fragment.html');

    //For pagination
    var folderPath = util.postsFolder();
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
    //var postUrl = stk.serviceUrl('comments', {commentsFolder: util.commentsFolder()});
    var postUrl = stk.serviceUrl('comments', {});
    var postAuthor = stk.content.get(content.data.author);

    //TODO: Make sure only allowed tags can be used.
    var allowedTags = '<a href="" title=""> <abbr title=""> <acronym title=""> <b> <blockquote cite=""> <cite> <code> <del datetime=""> <em> <i> <q cite=""> <strike> <strong> ';

    var result = execute('content.query', {
        start: 0,
        count: 0,
        query: "data.post = '" + content._id + "'",
        contentTypes: [
            module.name + ':comment'
        ]
    });

    var commentsTotal = result.total;
    //var comments = getPostComments(content, moduleConfig, postAuthor, 1, null);
    var comments = getComments(content, moduleConfig, postAuthor, 1, null);
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

    var params = {
        post: content.data,
        pageTemplate: content.type == 'portal:page-template' ? true : false,
        site: site,
        content: content,
        prev: (prev && prev.contents) ? prev.contents[0] : null,
        next: (next && next.contents) ? next.contents[0] : null,
        allowedTags: allowedTags,
        postUrl: postUrl,
        searchPage: searchPage,
        commentsTotal: commentsTotal,
        comments: comments,
        childFragment: childFragment
    }
    return stk.view.render(view, params);
};

function getComments(post, moduleConfig, postAuthor, depth, commentId) {
    var comments = [];
    var key = depth == 1 ? post._path + '/comments' : commentId;

    var result = execute('content.getChildren', {
        key: key,
        start: 0,
        count: 1000,
        sort: 'createdTime ' + moduleConfig.commentSort? moduleConfig.commentSort : 'ASC'
    });

    var contents = result.contents;

    for (var i = 0; i < contents.length; i++) {
        contents[i].data.liClass = 'comment ' + 'depth-' + depth + ' ';
        if(postAuthor && postAuthor.data.email == contents[i].data.email) {
            contents[i].data.liClass += 'bypostauthor ';
        }

        contents[i].data.liClass += (i%2 == 0) ? 'even ' : 'odd ';
        if(depth = 1) {
            contents[i].data.liClass += (i%2 == 0) ? 'even thread-even ' : 'odd thread-odd ';
        }

        var date = util.getFormattedDate(new Date(contents[i].createdTime));
        date += ' at ' + contents[i].createdTime.substring(11, 16);
        contents[i].data.pubDate = date;
        contents[i].data.gravatar = util.getGravatar(contents[i].data.email, 40) + '&d=http%3A%2F%2F0.gravatar.com%2Favatar%2Fad516503a11cd5ca435acc9bb6523536%3Fs%3D40&r=G';

        contents[i].data.replyClick = "return addComment.moveForm('comment-" + contents[i]._id + "', '" + contents[i]._id + "', 'respond', '" + post._id + "')";

        contents[i].data.children = getComments(post, moduleConfig, postAuthor, depth + 1, contents[i]._id);

        comments.push(contents[i]);
    }
    return comments.length > 0 ? comments : null;
}