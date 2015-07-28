var stk = require('stk/stk');
var portal = require('/lib/xp/portal');

exports.get = handleGet;

function handleGet(req) {

    var component = portal.getComponent();

    var params = {
        component: component,
        leftRegion: component.regions["left"]
    };

    var view = resolve('one-column.html');
    return stk.view.render(view, params);

}