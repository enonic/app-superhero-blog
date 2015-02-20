var stk = require('stk/stk');


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
    return stk.view.render(view, params);

}

exports.get = handleGet;