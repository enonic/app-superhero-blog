var stk = require('stk/stk');

exports.get = function(req) {

    var component = execute('portal.getComponent');
    var config = component.config;
    var content = execute('portal.getContent');
    var title = config.title || 'Recent posts'
    var maxPosts = config.maxPosts || 5;
    var posts = new Array();

    var results = execute('content.query', {
        start: 0,
        count: maxPosts,
        //query: ,
        sort: 'createdTime DESC',
        contentTypes: [
            module.name + ':post'
        ]
    });

    for (var i = 0; i < results.contents.length; i++) {
        stk.data.deleteEmptyProperties(results.contents[i].data);
        results.contents[i].data.path = results.contents[i]._path;
        posts.push(results.contents[i].data);
    }

    var params = {
        posts: posts,
        title: title
    }

    var view = resolve('recent-posts.html');
    return stk.view.render(view, params);
};