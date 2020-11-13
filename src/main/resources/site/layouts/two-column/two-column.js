const stk = require('/lib/stk/stk');
const portal = require('/lib/xp/portal');

exports.get = function(req) {

    const component = portal.getComponent();

    const params = {
        component: component,
        leftRegion: component.regions["left"],
        rightRegion: component.regions["right"]
    };

    const view = resolve('two-column.html');
    return stk.view.render(view, params);

}
