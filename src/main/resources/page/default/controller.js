var stk = require('/lib/stk.js');
var menu = require('/lib/menu.js');
//var utilities = require('utilities');



function handleGet(req) {

    var site = execute('portal.getSite');
    var menuItems = menu.getSiteMenu(3);
    var moduleConfig = site.moduleConfigs['com.enonic.theme.superhero'];
    //var moduleConfig = site.moduleConfigs[utilities.module];
    var content = execute('portal.getContent');

    var params = {
        moduleConfig: moduleConfig,
        mainRegion: content.page.regions['main'],
        content: content,
        menuItems: menuItems,
        editMode: req.mode == 'edit' ? true : false
    }

    var view = resolve('home.html');

    return {
        contentType: 'text/html',

        body: execute('thymeleaf.render', {
            view: view,
            model: params
        })
    };
}

exports.get = handleGet;