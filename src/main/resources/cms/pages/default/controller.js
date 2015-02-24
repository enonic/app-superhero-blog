var stk = require('stk/stk');
var menu = require('menu');
var utilities = require('utilities');

function handleGet(req) {

    var site = execute('portal.getSite');
    var menuItems = menu.getSiteMenu(3);
    var moduleConfig = site.data.moduleConfig;
    var content = execute('portal.getContent');

    var params = {
        site: site,
        moduleConfig: moduleConfig,
        mainRegion: content.page.regions['main'],
        content: content,
        menuItems: menuItems
    }

    var view = resolve('home.html');
    return stk.view.render(view, params);
}

exports.get = handleGet;