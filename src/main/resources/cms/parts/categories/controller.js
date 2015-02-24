var stk = require('stk/stk');

exports.get = function(req) {

    var content = execute('portal.getContent');
    var component = execute('portal.getComponent');
    var config = component.config;
    var title = config.title || 'Categories';
    var site = execute('portal.getSite');
    var categories = new Array();

    var result = execute('content.query', {
        start: 0,
        count: 1000,
        //query: ,
        sort: 'displayName ASC',
        contentTypes: [
            module.name + ':category'
        ]
    });

    for (var i = 0; i < result.contents.length; i++) {
        var posts = execute('content.query', {
            start: 0,
            count: 1000,
            query: 'data.category IN ("' + result.contents[i]._id + '")',
            sort: 'createdTime DESC',
            contentTypes: [
                module.name + ':post'
            ]
        });

        result.contents[i].data.numPosts = posts.total;

        if (posts.total > 0) {
            categories.push(result.contents[i]);
        }

        stk.data.deleteEmptyProperties(result.contents[i].data);

    }

    var params = {
        categories: categories,
        site: site,
        config: config,
        title: title
    }

    var view = resolve('categories.html');
    return stk.view.render(view, params);
};