var stk = require('stk/stk');
var util = require('utilities');

exports.get = function (req) {

    var content = execute('portal.getContent');
    var site = execute('portal.getSite');
    var folderPath = util.postsFolder();

    var pageUrl = execute('portal.pageUrl', {
        path: content._path
    });

    var result = execute('content.query', {
        start: 0,
        count: 20,
        query: '_parentPath="/content' + folderPath + '"',
        sort: 'createdTime DESC',
        contentTypes: [
            module.name + ':post'
        ]
    });

    var posts = result.contents;

    for(var i = 0; i < posts.length; i++) {
        var author = stk.content.get(posts[i].data.author);
        posts[i].data.authorName = author.data.name;
        posts[i].data.tags = stk.data.forceArray(posts[i].data.tags);

        posts[i].data.category = stk.data.forceArray(posts[i].data.category);
        posts[i].data.categoryNames = new Array();

        if(posts[i].data.category) {
            for(var j = 0; j < posts[i].data.category.length; j++) {
                posts[i].data.categoryNames.push(stk.content.getProperty(posts[i].data.category[j], 'displayName'));
            }
        }

        var comments = execute('content.query', {
            start: 0,
            count: 1000,
            query: "data.post = '" + posts[i]._id + "'",
            sort: 'createdTime DESC',
            contentTypes: [
                module.name + ':comment'
            ]
        });

        posts[i].data.numComments = comments.total;

    }

    var params = {
        content: content,
        posts: posts,
        pageUrl: execute('portal.pageUrl', {path: content._path}),
        site: site
    };

    var view = resolve('./rss.xsl');
    //var copy = resolve('./copy-of.xsl');
    var body = execute('xslt.render', {
        view: view,
        model: params
    });

    return {
        contentType: 'text/xml',
        body: body
    };
};