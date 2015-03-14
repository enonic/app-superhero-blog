var stk = require('stk/stk');

function handleGet(req) {

    var component = execute('portal.getComponent');


    var params = {
        editMode: req.mode === 'edit' ? true : false,
        component: component,
        leftRegion: component.regions["left"],
        rightRegion: component.regions["right"]
    };

    var view = resolve('layout-70-30.html');
    return stk.view.render(view, params);

}

exports.get = handleGet;