var stk = require('stk/stk');

exports.get = function(req) {

    var component = execute('portal.getComponent');
    var title = component.config.title != '' ? component.config.title : null;
    var urlParams = req.params;
    var site = execute('portal.getSite');

    var params = {
        site: site,
        component: component,
        title: title
    }

    var view = resolve('search-form.html');
    return stk.view.render(view, params);
};
