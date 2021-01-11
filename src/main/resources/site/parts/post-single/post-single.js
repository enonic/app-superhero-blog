const stk = require('/lib/stk/stk');
const util = require('/lib/utilities');

const contentLib = require('/lib/xp/content');
const portal = require('/lib/xp/portal');

const CONTENTTYPE_POST = app.name + ':post';

exports.get = function(req) {
    const searchPage = util.getSearchPage();
    const content = portal.getContent();

    //stk.log(content);

    const view = resolve('post.html');

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
            contentTypes: [CONTENTTYPE_POST]
        });

        next = contentLib.query({
            start: 0,
            count: 1,
            query: '_parentPath="/content' + folderPath + '" AND createdTime > instant("' + content.createdTime + '")',
            sort: 'createdTime ASC',
            contentTypes: [CONTENTTYPE_POST]
        });
    }
    //End pagination

    const post = content.data;
    const categoriesArray = [];
    const categories = util.getCategories();

    if (content.type === CONTENTTYPE_POST) {
        post.title = content.displayName;
        post.path = content._path;
        post.id = content._id;

        post.author = post.author ? stk.content.get(post.author) : post.author;

        if (content.createdTime) {
            const createdDate = new Date(
                // Recent versions of XP adds decimals at the end of the content creation date string.
                // These decimals are incompatible with "new Date" here (nashorn - although it works in node!) so remove them.
                content.createdTime.replace(/\.\d+(Z?)$/, "$1")
            );

            if (createdDate) {
                post.pubDatetime = JSON.stringify(createdDate);
                post.pubDate = util.getFormattedDate(createdDate);
            }
        }

        post.class = 'post-' + content._id + ' post type-post status-publish format-standard hentry';

        post.category = post.category ? stk.data.forceArray(post.category) : null;

        if(post.category) {
            for(let i = 0; i < post.category.length; i++) {
                if(post.category[i] && stk.content.exists(post.category[i])) {
                    //const category = stk.content.get(data.category[i]);
                    const category = util.getCategory({id: post.category[i]}, categories);
                    categoriesArray.push(category);
                    post.class += ' category-' + category._name + ' ';
                }
            }
        }

        post.categories = categoriesArray.length > 0 ? categoriesArray : null;

        if (post.featuredImage) {
            let scale = 'width(695)';
            if (content.page.regions.main.components[0].descriptor == app.name + ':one-column') {
                scale = 'width(960)';
            }
            const img = stk.content.get(post.featuredImage);
            post.fImageName = img.displayName;
            post.fImageUrl = portal.imageUrl({
                id: post.featuredImage,
                scale: scale,
                format: 'jpeg'
            });
        }

        stk.data.deleteEmptyProperties(post);
    }

    const model = {
        post: post,
        pageTemplate: content.type === 'portal:page-template',
        content: content,
        prev: (prev && prev.hits) ? prev.hits[0] : null,
        next: (next && next.hits) ? next.hits[0] : null,
        searchPage: searchPage,
    };

    return stk.view.render(view, model);
};
