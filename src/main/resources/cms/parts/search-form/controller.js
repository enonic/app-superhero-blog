var stk = require('stk/stk');

exports.get = function(req) {

    var component = execute('portal.getComponent');
    var urlParams = req.params;

    var params = {
        component: component
    }

    var view = resolve('search-form.html');
    return stk.view.render(view, params);
};