var stk = require('/lib/stk/stk');
var util = require('/lib/utilities');

var contentLib = require('/lib/xp/content');
var portal = require('/lib/xp/portal');

exports.get = handleGet;

function handleGet(req) {
    var me = this;

    function renderView() {
        var view = resolve('categories.html');
        var model = createModel();
        return stk.view.render(view, model);
    }

    function createModel() {
        var content = portal.getContent();
        var component = portal.getComponent();
        var config = component.config;
        var title = config.title || 'Categories';
        var site = portal.getSite();
        var searchPath = util.getSearchPage();
        var categories = [];

        var result = contentLib.query({
            start: 0,
            count: 1000,
            //query: ,
            sort: 'displayName ASC',
            contentTypes: [
                app.name + ':category'
            ]
        });

        for (var i = 0; i < result.hits.length; i++) {
            var posts = contentLib.query({
                start: 0,
                count: 1000,
                query: 'data.category IN ("' + result.hits[i]._id + '")',
                sort: 'createdTime DESC',
                contentTypes: [
                    app.name + ':post'
                ]
            });

            result.hits[i].data.numPosts = posts.total;

            if (posts.total > 0) {
                categories.push(result.hits[i]);
            }

            stk.data.deleteEmptyProperties(result.hits[i].data);

        }


        var model = {
            categories: categories,
            config: config,
            title: title,
            searchPath: searchPath
        }

        return model;
    }

    return renderView();
}