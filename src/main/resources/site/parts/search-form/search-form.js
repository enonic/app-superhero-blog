var stk = require('/lib/stk/stk');
var util = require('/lib/utilities');
var portal = require('/lib/xp/portal');

exports.get = handleGet;

function handleGet(req) {

    function renderView() {
        var view = resolve('search-form.html');
        var model = createModel();
        return stk.view.render(view, model);
    }

    function createModel() {
        var component = portal.getComponent();
        var title = component.config.title != '' ? component.config.title : null;
        var site = portal.getSite();
        var searchPage = portal.pageUrl({
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
