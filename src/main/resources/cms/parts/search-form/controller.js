var stk = require('stk/stk');

exports.get = function(req) {

    var component = execute('portal.getComponent');
    var urlParams = req.params;

    var params = {
        editMode: req.mode == 'edit' ? true : false,
        component: component
    }

    stk.log(req);

    var view = resolve('search-form.html');
    return stk.view.render(view, params);
};