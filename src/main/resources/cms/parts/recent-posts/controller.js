var stk = require('stk/stk');
var util = require('utilities');

exports.get = handleGet;

function handleGet(req) {
    var me = this;

    function renderView() {
        var view = resolve('recent-posts.html');
        var model = createModel();
        return stk.view.render(view, model);
    }

    function createModel() {
        var component = execute('portal.getComponent');
        var config = component.config;
        var title = config.title || 'Recent posts';
        var maxPosts = config.maxPosts || 5;
        var folderPath = util.postsFolder(config.contentFolder);

        var posts = new Array();

        var results = execute('content.query', {
            start: 0,
            count: maxPosts,
            query: '_parentPath="/content' + folderPath + '"',
            sort: 'createdTime DESC',
            contentTypes: [
                module.name + ':post'
            ]
        });

        for (var i = 0; i < results.contents.length; i++) {
            stk.data.deleteEmptyProperties(results.contents[i].data);
            results.contents[i].data.path = results.contents[i]._path;
            results.contents[i].data.title = results.contents[i].displayName
            posts.push(results.contents[i].data);
        }

        var model = {
            posts: posts,
            title: title
        }

        return model;
    }

    return renderView();
}