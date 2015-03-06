var stk = require('stk/stk');
var util = require('utilities');

exports.get = function(req) {

    var component = execute('portal.getComponent');
    var up = req.params;
    var content = execute('portal.getContent');
    var site = execute('portal.getSite');

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
    var categories = new Array();

    if (content.type == module.name + ':post') {

        data.path = content._path;
        data.id = content._id;
        data.createdTime = content.createdTime;
        data.author = data.author ? stk.content.get(data.author) : data.author;
        data.pubDate = util.getFormattedDate(new Date(content.createdTime));

        data.category = data.category ? stk.data.forceArray(data.category) : null;

        if(data.category) {
            for(var i = 0; i < data.category.length; i++) {
                if(data.category[i]) {
                    var category = stk.content.get(data.category[i]);
                    categories.push(category);
                }
            }
        }

        data.categories = categories.length > 0 ? categories : null

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
        site: site,
        commentsTotal: comments.total
    }
    var view = resolve('post.html');
    return stk.view.render(view, params);
};