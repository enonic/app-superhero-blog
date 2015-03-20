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

    // If it's a single post in the posts folder
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



    var comments = execute('content.query', {
        start: 0,
        count: 1000,
        query: "data.post = '" + content._id + "'",
        sort: 'createdTime DESC',
        contentTypes: [
            module.name + ':comment'
        ]
    });

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
        commentsTotal: comments.total,
        prev: (prev && prev.contents) ? prev.contents[0] : null,
        next: (next && next.contents) ? next.contents[0] : null
    }
    var view = resolve('post.html');
    return stk.view.render(view, params);
};