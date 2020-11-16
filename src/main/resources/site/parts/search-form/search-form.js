const stk = require('/lib/stk/stk');
const util = require('/lib/utilities');
const portal = require('/lib/xp/portal');

exports.get = handleGet;

function handleGet(req) {
    function renderView() {
        const view = resolve('search-form.html');
        const model = createModel();
        return stk.view.render(view, model);
    }

    function createModel() {
        const component = portal.getComponent();
        const title = component.config.title != '' ? component.config.title : null;
        const searchPage = portal.pageUrl({
            path: util.getSearchPage()
        });

        const model = {
            title: title,
            searchPage: searchPage
        }

        return model;
    }

    return renderView();
}
