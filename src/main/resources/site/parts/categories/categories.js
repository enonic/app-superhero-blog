var stk = require('stk/stk');
var util = require('utilities');

var contentSvc = require('/lib/xp/content');
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
        var categories = new Array();

        var result = contentSvc.query( {
            start: 0,
            count: 1000,
            //query: ,
            sort: 'displayName ASC',
            contentTypes: [
                app.name + ':category'
            ]
        });

        for (var i = 0; i < result.contents.length; i++) {
            var posts = contentSvc.query( {
                start: 0,
                count: 1000,
                query: 'data.category IN ("' + result.contents[i]._id + '")',
                sort: 'createdTime DESC',
                contentTypes: [
                    app.name + ':post'
                ]
            });

            result.contents[i].data.numPosts = posts.total;

            if (posts.total > 0) {
                categories.push(result.contents[i]);
            }

            stk.data.deleteEmptyProperties(result.contents[i].data);

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