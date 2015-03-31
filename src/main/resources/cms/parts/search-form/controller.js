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
        var site = execute('portal.getSite');

        var model = {
            site: site,
            title: title
        }

        return model;
    }

    return renderView();
}
