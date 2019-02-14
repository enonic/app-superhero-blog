var stk = require('/lib/stk/stk');
var portal = require('/lib/xp/portal');

exports.get = handleGet;

function handleGet(req) {

    var component = portal.getComponent();

    var params = {
        component: component,
        leftRegion: component.regions["left"],
        middleRegion: component.regions["middle"],
        rightRegion: component.regions["right"]
    };

    var view = resolve('three-column.html');
    return stk.view.render(view, params);

}