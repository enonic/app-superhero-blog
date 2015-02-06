var stk = require('/cms/lib/stk');
var thymeleaf = require('view/thymeleaf');

exports.get = function(req) {

    var component = execute('portal.getComponent');
    var urlParams = req.params;

    var params = {
        editMode: req.mode == 'edit' ? true : false,
        component: component
    }

    //stk.log(req);

    var view = resolve('post-list.html');
    var body = thymeleaf.render(view, params);

    return {
        body: body,
        contentType: 'text/html'
    };
};