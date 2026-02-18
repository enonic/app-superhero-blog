const thymeleaf = require('/lib/thymeleaf');
const util = require('/lib/utilities');
const portal = require('/lib/xp/portal');

const view = resolve('search-form.html');

exports.get = function (req) {
    const component = portal.getComponent();

    const searchPage = portal.pageUrl({
        path: util.getSearchPage()
    });

    const model = {
        title: component.config.title !== ''
            ? component.config.title
            : null,
        searchPage: searchPage
    }

    return {
        body: thymeleaf.render(view, model)
    };
}
