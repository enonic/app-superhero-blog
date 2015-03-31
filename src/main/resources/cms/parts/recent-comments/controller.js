var stk = require('stk/stk');

exports.get = handleGet;

function handleGet(req) {
    var me = this;

    function renderView() {
        var view = resolve('recent-comments.html');
        var model = createModel();
        return stk.view.render(view, model);
    }

    function createModel() {
        var component = execute('portal.getComponent');
        var config = component.config;
        var maxComments = config.maxComments || 5;
        var title = config.title || 'Recent comments';
        var content = execute('portal.getContent');
        var comments = new Array();

        var results = execute('content.query', {
            start: 0,
            count: maxComments,
            //query: ,
            sort: 'createdTime DESC',
            contentTypes: [
                module.name + ':comment'
            ]
        });

        for (var i = 0; i < results.contents.length; i++) {
            stk.data.deleteEmptyProperties(results.contents[i].data);
            results.contents[i].data.key = results.contents[i]._id;

            var post = stk.content.get(results.contents[i].data.post);
            results.contents[i].data.postTitle = post.data.title;
            results.contents[i].data.postPath = post._path;

            comments.push(results.contents[i].data);
        }

        var model = {
            comments: comments,
            title: title
        }

        return model;
    }

    return renderView();
}

