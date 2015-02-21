var stk = require('stk/stk');

exports.get = function(req) {

    var component = execute('portal.getComponent');
    var config = component.config;
    var up = req.params;
    var content = execute('portal.getContent');
    var posts = new Array();
    var folderPath = stk.content.getPath(config.contentFolder);

    if (content.type == module.name + ':post') {
        content.data.path = content._path;
        content.data.id = content._id;
        content.data.createdTime = content.createdTime;
        stk.data.deleteEmptyProperties(content.data);
        posts.push(content.data);
    } else {
        var results = execute('content.query', {
            start: 0,
            count: 20,
            query: '_parentPath="/content' + folderPath + '"',
            sort: 'createdTime DESC',
            contentTypes: [
                module.name + ':post'
            ]
        });
        //stk.log(results);
        for (var i = 0; i < results.contents.length; i++) {
            results.contents[i].data.path = results.contents[i]._path;
            results.contents[i].data.createdTime = results.contents[i].createdTime;
            stk.data.deleteEmptyProperties(results.contents[i].data);
            posts.push(results.contents[i].data);
        }
    }
    stk.log(posts);
    var params = {
        posts: posts
    }
    var view = resolve('post-list.html');
    return stk.view.render(view, params);
};