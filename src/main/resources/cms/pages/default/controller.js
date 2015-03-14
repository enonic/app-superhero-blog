var stk = require('stk/stk');
var menu = require('menu');
var util = require('utilities');

function handleGet(req) {
    var up = req.params;
    var site = execute('portal.getSite');
    var menuItems = menu.getSiteMenu(3);
    var moduleConfig = site.moduleConfigs[module.name];
    var content = execute('portal.getContent');
    var facebookAppID = moduleConfig.facebookAppID.length > 1 ? moduleConfig.facebookAppID : null; // Hack to prevent empty string
    var googleUA = moduleConfig.googleUA.length > 1 ? moduleConfig.googleUA : null;
    var bodyClass = '';
    var backgroundImage;
    if (moduleConfig.backgroundImage) {
        var bgImageUrl = execute('portal.imageUrl', {
            id: moduleConfig.backgroundImage,
            format: 'jpeg'
        });

        backgroundImage = '<style type="text/css" id="custom-background-css">body.custom-background { background-image: url("' +
            bgImageUrl + '"); background-repeat: repeat; background-position: top left; background-attachment: scroll; }</style>';

        bodyClass += 'custom-background ';
    }
    if ((content._path == site._path) && stk.data.isEmpty(up)) {
        bodyClass += 'home blog ';
    }
    if (up.cat || up.tag || up.author) {
        bodyClass += ' archive ';
    }
    if (content.type == module.name + ':post') {
        bodyClass += 'single single-post single-format-standard ';
    }
    if (up.author) {
        bodyClass += 'author '
    }

    var params = {
        site: site,
        bodyClass: bodyClass,
        moduleConfig: moduleConfig,
        backgroundImage: backgroundImage,
        mainRegion: content.page.regions['main'],
        content: content,
        menuItems: menuItems,
        facebookAppID: facebookAppID,
        googleUA: googleUA
    }

    var view = resolve('home.html');
    return stk.view.render(view, params);
}

exports.get = handleGet;