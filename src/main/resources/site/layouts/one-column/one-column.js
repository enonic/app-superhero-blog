const thymeleaf = require('/lib/thymeleaf');
const portal = require('/lib/xp/portal');

const view = resolve('one-column.html');

exports.get = function(req) {

    const component = portal.getComponent();

    const model = {
        component: component,
        leftRegion: component.regions["left"]
    };

    return {
        body: thymeleaf.render(view, model)
    };

}
