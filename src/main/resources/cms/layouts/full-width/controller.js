var stk = require('stk/stk');

exports.get = handleGet;

function handleGet(req) {

    var component = execute('portal.getComponent');

    var params = {
        component: component,
        leftRegion: component.regions["left"]
    };

    var view = resolve('full-width.html');
    return stk.view.render(view, params);

}