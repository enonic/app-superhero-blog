var stk = require('stk/stk');


function handleGet(req) {

    var component = execute('portal.getComponent');
    var content = execute('portal.getContent');
    var maxComments = component.config["maxComments"] || 5;
    var comments = new Array();

    var results = execute('content.query', {
        start: 0,
        count: maxComments,
        //query: 'createdTime > (now() - pastXDays),
        sort: 'createdTime DESC',
        contentTypes: [
            module.name + ':comment'
        ]
    });

    //stk.log(results);

    for (var i = 0; i < results.contents.length; i++) {
        stk.data.deleteEmptyProperties(results.contents[i].data);
        results.contents[i].data.key = results.contents[i]._id;

        var post = stk.content.get(results.contents[i].data.post);
        results.contents[i].data.postTitle = post.data.title;
        results.contents[i].data.postPath = post._path;

        comments.push(results.contents[i].data);
    }

    //stk.log(comments);

    var params = {
        comments: comments
    }

    var view = resolve('recent-comments.html');
    return stk.view.render(view, params);

}

exports.get = handleGet;