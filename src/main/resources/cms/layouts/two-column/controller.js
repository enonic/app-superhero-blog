var stk = require('stk/stk');

exports.get = handleGet;

function handleGet(req) {

    var component = execute('portal.getComponent');

    var params = {
        component: component,
        leftRegion: component.regions["left"],
        rightRegion: component.regions["right"]
    };

    var view = resolve('two-column.html');
    return stk.view.render(view, params);

}