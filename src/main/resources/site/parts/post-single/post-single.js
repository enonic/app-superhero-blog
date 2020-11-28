const stk = require('/lib/stk/stk');
const util = require('/lib/utilities');

const auth = require('/lib/xp/auth');
const contentLib = require('/lib/xp/content');
const portal = require('/lib/xp/portal');

exports.get = function(req) {
    const site = portal.getSite();
    const searchPage = util.getSearchPage();
    const content = portal.getContent();
    const siteConfig = portal.getSiteConfig();
    const user = auth.getUser();

    //stk.log(content);

    const view = resolve('post.html');
    const childFragment = resolve('comment-fragment.html');

    //For pagination
    const folderPath = util.postsFolder();
    let prev, next;

    // Pagination if it's a single post in the posts folder
    if(stk.content.getParentPath(content._path) == folderPath) {
        prev = contentLib.query({
            start: 0,
            count: 1,
            query: '_parentPath="/content' + folderPath + '" AND createdTime < instant("' + content.createdTime + '")',
            sort: 'createdTime DESC',
            contentTypes: [app.name + ':post']
        });

        next = contentLib.query({
            start: 0,
            count: 1,
            query: '_parentPath="/content' + folderPath + '" AND createdTime > instant("' + content.createdTime + '")',
            sort: 'createdTime ASC',
            contentTypes: [app.name + ':post']
        });
    }
    //End pagination

    //for comments
    const postUrl = stk.serviceUrl('comments', {});
    const postAuthor = stk.content.get(content.data.author);

    //TODO: Make sure only allowed tags can be used.
    const allowedTags = '<a href="" title=""> <abbr title=""> <acronym title=""> <b> <blockquote cite=""> <cite> <code> <del datetime=""> <em> <i> <q cite=""> <strike> <strong> ';

    const result = contentLib.query({
        start: 0,
        count: 0,
        query: "data.post = '" + content._id + "'",
        contentTypes: [
            app.name + ':comment'
        ]
    });

    const dashedAppName = app.name.replace(/\./g, "-");
    const siteCommon = site.x[dashedAppName].siteCommon;

    const commentsTotal = result.total;
    //const comments = getPostComments(content, siteConfig, postAuthor, 1, null);
    const comments = getComments(content, siteConfig, siteCommon, postAuthor, 1, null);
    //end comments

    const data = content.data;
    const categoriesArray = [];
    const categories = util.getCategories();

    if (content.type == app.name + ':post') {

        data.title = content.displayName;
        data.path = content._path;
        data.id = content._id;
        data.createdTime = content.createdTime;
        data.author = data.author ? stk.content.get(data.author) : data.author;
        data.pubDate = util.getFormattedDate(new Date(content.createdTime));

        data.class = 'post-' + content._id + ' post type-post status-publish format-standard hentry';

        data.category = data.category ? stk.data.forceArray(data.category) : null;

        if(data.category) {
            for(let i = 0; i < data.category.length; i++) {
                if(data.category[i] && stk.content.exists(data.category[i])) {
                    //const category = stk.content.get(data.category[i]);
                    const category = util.getCategory({id: data.category[i]}, categories);
                    categoriesArray.push(category);
                    data.class += ' category-' + category._name + ' ';
                }
            }
        }

        data.categories = categoriesArray.length > 0 ? categoriesArray : null;

        if (data.featuredImage) {
            let scale = 'width(695)';
            if (content.page.regions.main.components[0].descriptor == app.name + ':one-column') {
                scale = 'width(960)';
            }
            const img = stk.content.get(data.featuredImage);
            data.fImageName = img.displayName;
            data.fImageUrl = portal.imageUrl({
                id: data.featuredImage,
                scale: scale,
                format: 'jpeg'
            });
        }

        stk.data.deleteEmptyProperties(content.data);
    }

    const params = {
        post: content.data,
        pageTemplate: content.type == 'portal:page-template' ? true : false,
        content: content,
        prev: (prev && prev.hits) ? prev.hits[0] : null,
        next: (next && next.hits) ? next.hits[0] : null,
        allowedTags: allowedTags,
        postUrl: postUrl,
        searchPage: searchPage,
        commentsTotal: commentsTotal,
        comments: comments,
        childFragment: childFragment,
        user: user,
        profilePage: portal.idProviderUrl()
    };
    return stk.view.render(view, params);
};

function getComments(post, siteConfig, siteCommon, postAuthor, depth, commentId) {
    const comments = [];
    const key = depth == 1 ? post._path + '/comments' : commentId;

    const result = contentLib.getChildren({
        key: key,
        start: 0,
        count: 1000,
        sort: 'createdTime ' + siteCommon.commentSort ? siteCommon.commentSort : 'ASC'
    });

    const contents = result.hits;

    for (let i = 0; i < contents.length; i++) {
        contents[i].data.liClass = 'comment ' + 'depth-' + depth + ' ';
        if(postAuthor && postAuthor.data.email == contents[i].data.email) {
            contents[i].data.liClass += 'bypostauthor ';
        }

        contents[i].data.liClass += (i%2 == 0) ? 'even ' : 'odd ';
        if(depth = 1) {
            contents[i].data.liClass += (i%2 == 0) ? 'even thread-even ' : 'odd thread-odd ';
        }

        let date = util.getFormattedStringDate(contents[i].createdTime);

        date += ' at ' + contents[i].createdTime.substring(11, 16);
        contents[i].data.pubDate = date;
        contents[i].data.gravatar = util.getGravatar(contents[i].data.email, 40) + '&d=http%3A%2F%2F0.gravatar.com%2Favatar%2Fad516503a11cd5ca435acc9bb6523536%3Fs%3D40&r=G';

        contents[i].data.replyClick = "return addComment.moveForm('comment-" + contents[i]._id + "', '" + contents[i]._id + "', 'respond', '" + post._id + "')";

        contents[i].data.children = getComments(post, siteConfig, siteCommon, postAuthor, depth + 1, contents[i]._id);

        comments.push(contents[i]);
    }
    return comments.length > 0 ? comments : null;
}
