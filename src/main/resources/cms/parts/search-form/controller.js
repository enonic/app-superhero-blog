var stk = require('stk/stk');

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
        var site = execute('portal.getSite'); //TODO: Site config search page
        var searchPage = execute('portal.pageUrl', {
            path: site._path + '/search'
        });

        var model = {
            title: title,
            searchPage: searchPage
        }

        return model;
    }

    return renderView();
}
