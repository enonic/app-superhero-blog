const thymeleaf = require('/lib/thymeleaf');
const portal = require('/lib/xp/portal');

const view = resolve('two-column.html');

exports.get = function(req) {

    const component = portal.getComponent();

    const model = {
        component: component,
        leftRegion: component.regions["left"],
        rightRegion: component.regions["right"]
    };

    return {
        body: thymeleaf.render(view, model)
    };

}
