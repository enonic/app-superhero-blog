var stk = require('/lib/stk/stk');
var util = require('/lib/utilities');

var contentLib = require('/lib/xp/content');
var portal = require('/lib/xp/portal');
var xslt = require('/lib/xslt');

exports.get = function (req) {

    var content = portal.getContent();
    var site = portal.getSite();
    var folderPath = util.postsFolder();

    var pageUrl = portal.pageUrl({
        path: content._path
    });

    var result = contentLib.query({
        start: 0,
        count: 20,
        query: '_parentPath="/content' + folderPath + '"',
        sort: 'createdTime DESC',
        contentTypes: [
            app.name + ':post'
        ]
    });

    var posts = result.hits;

    // Strip html from the description element
    var tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';
    var tagOrComment = new RegExp(
        '<(?:'
        // Comment body.
        + '!--(?:(?:-*[^->])*--+|-?)'
        // Special "raw text" elements whose content should be elided.
        + '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
        + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
        // Regular name
        + '|/?[a-z]'
        + tagBody
        + ')>',
        'gi');

    function removeTags(html) {
        var oldHtml;
        do {
            oldHtml = html;
            html = html.replace(tagOrComment, '');
        } while (html !== oldHtml);
        return html.replace(/</g, '&lt;');
    }


    for (var i = 0; i < posts.length; i++) {
        var author = stk.content.get(posts[i].data.author);
        posts[i].data.authorName = author.data.name;
        posts[i].data.tags = stk.data.forceArray(posts[i].data.tags);

        posts[i].data.category = stk.data.forceArray(posts[i].data.category);
        posts[i].data.categoryNames = [];
        posts[i].data.description = removeTags(posts[i].data.post);

        if (posts[i].data.category) {
            for (var j = 0; j < posts[i].data.category.length; j++) {
                posts[i].data.categoryNames.push(stk.content.getProperty(posts[i].data.category[j], 'displayName'));
            }
        }

        var comments = contentLib.query({
            start: 0,
            count: 1000,
            query: "data.post = '" + posts[i]._id + "'",
            sort: 'createdTime DESC',
            contentTypes: [
                app.name + ':comment'
            ]
        });

        posts[i].data.numComments = comments.total;

    }

    var params = {
        content: content,
        posts: posts,
        pageUrl: pageUrl,
        site: site
    };

    var view = resolve('rss.xsl');
    //var copy = resolve('copy-of.xsl');

    var body = xslt.render(view, params);

    return {
        contentType: 'text/xml',
        body: body
    };
};