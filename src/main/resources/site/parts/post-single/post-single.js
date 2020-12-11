const stk = require('/lib/stk/stk');
const util = require('/lib/utilities');

const auth = require('/lib/xp/auth');
const contentLib = require('/lib/xp/content');
const portal = require('/lib/xp/portal');

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
        pageTemplate: content.type === 'portal:page-template',
        content: content,
        prev: (prev && prev.hits) ? prev.hits[0] : null,
        next: (next && next.hits) ? next.hits[0] : null,
        searchPage: searchPage,
    };
    return stk.view.render(view, params);
};
