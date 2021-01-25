const thymeleaf = require('/lib/thymeleaf');
const portal = require('/lib/xp/portal');

const view = resolve('three-column.html');

exports.get = function(req) {

    const component = portal.getComponent();

    const model = {
        component: component,
        leftRegion: component.regions["left"],
        middleRegion: component.regions["middle"],
        rightRegion: component.regions["right"]
    };

    return {
        body: thymeleaf.render(view, model)
    };
}
