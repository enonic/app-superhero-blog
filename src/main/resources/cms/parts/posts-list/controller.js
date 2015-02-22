var stk = require('stk/stk');

exports.get = function(req) {

    var component = execute('portal.getComponent');
    var config = component.config;
    var up = req.params; // URL params TODO: list all posts by author
    var content = execute('portal.getContent');
    var site = execute('portal.getSite');
    var posts = new Array();
    var folderPath = stk.content.getPath(config.contentFolder);


    var results = execute('content.query', {
        start: stk.data.isInt(up.index) ? up.index : 0,
        count: 20,
        query: '_parentPath="/content' + folderPath + '"',
        sort: 'createdTime DESC',
        contentTypes: [
            module.name + ':post'
        ]
    });
    //stk.log(results);
    for (var i = 0; i < results.contents.length; i++) {
        var data = results.contents[i].data;
        data.path = results.contents[i]._path;
        data.createdTime = results.contents[i].createdTime;
        data.comments = execute('content.query', {
            start: 0,
            count: 1000,
            query: "data.post = '" + results.contents[i]._id + "'",
            sort: 'createdTime DESC',
            contentTypes: [
                module.name + ':comment'
            ]
        });

        data.commentsText = data.comments.total == 0 ? 'Leave a comment' : data.comments.total + ' comment' + (+ data.comments.total > 1 ? 's' : '');

        data.author = stk.content.get(data.author);

        stk.data.deleteEmptyProperties(data);
        posts.push(data);
    }

    //stk.log(posts);
    var params = {
        posts: posts,
        site: site
    }
    var view = resolve('post-list.html');
    return stk.view.render(view, params);
};