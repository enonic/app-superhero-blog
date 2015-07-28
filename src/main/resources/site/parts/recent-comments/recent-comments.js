var stk = require('stk/stk');
var portal = require('/lib/xp/portal');

var contentSvc = require('/lib/xp/content');

exports.get = handleGet;

function handleGet(req) {
    var me = this;

    function renderView() {
        var view = resolve('recent-comments.html');
        var model = createModel();
        return stk.view.render(view, model);
    }

    function createModel() {
        var component = portal.getComponent();
        var config = component.config;
        var maxComments = config.maxComments || 5;
        var title = config.title || 'Recent comments';
        var content = portal.getContent();
        var comments = new Array();

        var results = contentSvc.query( {
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
            results.contents[i].data.postTitle = post.displayName;
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

