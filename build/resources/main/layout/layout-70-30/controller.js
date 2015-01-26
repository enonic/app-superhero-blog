var thymeleaf = require('/lib/view/thymeleaf');
var stk = require('/lib/stk');

function handleGet(req) {

    var component = execute('portal.getComponent');


    var params = {
        editMode: req.mode === 'edit' ? true : false,
        component: component,
        leftRegion: component.regions["left"],
        rightRegion: component.regions["right"]
    };

    var view = resolve('layout-70-30.html');
    var body = thymeleaf.render(view, params);

    return {
        body: body,
        contentType: 'text/html'
    };

}

exports.get = handleGet;