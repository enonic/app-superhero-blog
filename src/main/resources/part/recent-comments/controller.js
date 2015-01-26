var thymeleaf = require('view/thymeleaf');
var stk = require('/lib/stk');

function getSingleValue(val, def) {
    if (val && (val.length > 0)) {
        if (val[0] != null) {
            return val[0];
        }
    }
    return def;
}

function handleGet(req) {
    //var site = execute('portal.getSite');
    //var moduleConfig = site.moduleConfigs['com.enonic.wem.modules.theme.wem-superhero-module'];
    //var moduleConfig = site.moduleConfigs[utilities.module];
    //var content = execute('portal.getContent');
    var component = execute('portal.getComponent');

    var params = {
        editMode: req.mode === 'edit' ? true : false,
        component: component
    }

    var view = resolve('recent-comments.html');
    var body = thymeleaf.render(view, params);

    return {
        body: body,
        contentType: 'text/html'
    };

}

exports.get = handleGet;