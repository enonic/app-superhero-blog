var thymeleaf = require('view/thymeleaf');
//var utilities = require('utilities');

function getSingleValue(val, def) {
    if (val && (val.length > 0)) {
        if (val[0] != null) {
            return val[0];
        }
    }
    return def;
}

exports.get = function(req) {
    //var site = execute('portal.getSite');
    //var moduleConfig = site.moduleConfigs['com.enonic.wem.modules.theme.wem-superhero-module'];
    //var moduleConfig = site.moduleConfigs[utilities.module];
    //var content = execute('portal.getContent');
    var component = execute('portal.getComponent');
    var pastXDays = component.config["past-x-days"] || [];
    var maxPosts = component.config["max-posts"] || [];

    var params = {
        editMode: req.mode === 'edit' ? true : false,
        component: component,
        pastXDays: pastXDays,
        maxPosts: maxPosts
    }
    log.info('%s: ', JSON.stringify(params, null, 4));

    var view = resolve('../../view/home.html');
    var body = thymeleaf.render(view, params);

    return {
        body: body,
        contentType: 'text/html'
    };
};