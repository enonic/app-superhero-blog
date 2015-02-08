var stk = require('/cms/lib/stk');

exports.get = function(req) {

    var component = execute('portal.getComponent');
    var urlParams = req.params;

    var params = {
        editMode: req.mode == 'edit' ? true : false,
        component: component
    }

    stk.log(req);

    return {
        body: execute('thymeleaf.render', {
            view: resolve('search-form.html'),
            model: params
        }),
        contentType: 'text/html'
    };
};