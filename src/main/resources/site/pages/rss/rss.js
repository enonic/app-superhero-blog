const stk = require('/lib/stk/stk');
const util = require('/lib/utilities');

const contentLib = require('/lib/xp/content');
const portal = require('/lib/xp/portal');
const xslt = require('/lib/xslt');

exports.get = function (req) {

    const content = portal.getContent();
    const site = portal.getSite();
    const folderPath = util.postsFolder();

    const pageUrl = portal.pageUrl({
        path: content._path
    });

    const result = contentLib.query({
        start: 0,
        count: 20,
        query: '_parentPath="/content' + folderPath + '"',
        sort: 'createdTime DESC',
        contentTypes: [
            app.name + ':post'
        ]
    });

    const posts = result.hits;

    // Strip html from the description element
    const tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';
    const tagOrComment = new RegExp(
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
        let oldHtml;
        do {
            oldHtml = html;
            html = html.replace(tagOrComment, '');
        } while (html !== oldHtml);
        return html.replace(/</g, '&lt;');
    }


    for (let i = 0; i < posts.length; i++) {
        const author = stk.content.get(posts[i].data.author);
        posts[i].data.authorName = author.data.name;
        posts[i].data.tags = stk.data.forceArray(posts[i].data.tags);

        posts[i].data.category = stk.data.forceArray(posts[i].data.category);
        posts[i].data.categoryNames = [];
        posts[i].data.description = removeTags(posts[i].data.post);

        if (posts[i].data.category) {
            for (let j = 0; j < posts[i].data.category.length; j++) {
                posts[i].data.categoryNames.push(stk.content.getProperty(posts[i].data.category[j], 'displayName'));
            }
        }

        const comments = contentLib.query({
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

    const params = {
        content: content,
        posts: posts,
        pageUrl: pageUrl,
        site: site
    };

    const view = resolve('rss.xsl');
    //const copy = resolve('copy-of.xsl');

    const body = xslt.render(view, params);

    return {
        contentType: 'text/xml',
        body: body
    };
};
