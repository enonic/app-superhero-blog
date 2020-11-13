const stk = require('/lib/stk/stk');
const portal = require('/lib/xp/portal');

exports.get = handleGet;

function handleGet(req) {

    const component = portal.getComponent();

    const params = {
        component: component,
        leftRegion: component.regions["left"]
    };

    const view = resolve('one-column.html');
    return stk.view.render(view, params);

}
