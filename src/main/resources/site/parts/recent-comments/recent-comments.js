var stk = require('/lib/stk/stk');
var portal = require('/lib/xp/portal');

var contentLib = require('/lib/xp/content');

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
        var comments = [];

        var results = contentLib.query({
            start: 0,
            count: maxComments,
            //query: ,
            sort: 'createdTime DESC',
            contentTypes: [
                app.name + ':comment'
            ]
        });

        for (var i = 0; i < results.hits.length; i++) {
            stk.data.deleteEmptyProperties(results.hits[i].data);
            results.hits[i].data.key = results.hits[i]._id;

            var post = stk.content.get(results.hits[i].data.post);
            results.hits[i].data.postTitle = post.displayName;
            results.hits[i].data.postPath = post._path;

            comments.push(results.hits[i].data);
        }

        var model = {
            comments: comments,
            title: title
        }

        return model;
    }

    return renderView();
}

