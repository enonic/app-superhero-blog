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

    return {
        body: execute('thymeleaf.render', {
            view: resolve('recent-comments.html'),
            model: params
        }),
        contentType: 'text/html'
    };

}

exports.get = handleGet;