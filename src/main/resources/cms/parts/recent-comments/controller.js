var thymeleaf = require('view/thymeleaf');
var stk = require('/cms/lib/stk');


function handleGet(req) {
    //var site = execute('portal.getSite');
    //var moduleConfig = site.moduleConfigs['com.enonic.theme.superhero'];
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