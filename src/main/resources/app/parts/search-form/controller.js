var stk = require('stk/stk');
var util = require('utilities');

exports.get = handleGet;

function handleGet(req) {

    function renderView() {
        var view = resolve('search-form.html');
        var model = createModel();
        return stk.view.render(view, model);
    }

    function createModel() {
        var component = execute('portal.getComponent');
        var title = component.config.title != '' ? component.config.title : null;
        var site = execute('portal.getSite');
        var searchPage = execute('portal.pageUrl', {
            path: util.getSearchPage()
        });

        var model = {
            title: title,
            searchPage: searchPage
        }

        return model;
    }

    return renderView();
}
