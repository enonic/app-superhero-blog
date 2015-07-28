var stk = require('stk/stk');
var menu = require('menu');
var util = require('utilities');

var portal = require('/lib/xp/portal');

exports.get = handleGet;

function handleGet(req) {
    var me = this;

    function renderView() {
        var view = resolve('home.html');
        var model = createModel();
        return stk.view.render(view, model);
    }

    function createModel() {

        var up = req.params;
        var site = portal.getSite();
        var menuItems = menu.getSiteMenu(3);
        var moduleConfig = site.siteConfigs[module.name];
        stk.data.deleteEmptyProperties(moduleConfig);

        var content = portal.getContent();

        var googleUA = moduleConfig.googleUA && moduleConfig.googleUA.length > 1 ? moduleConfig.googleUA : null;
        var bodyClass = '';
        var backgroundImage;
        if (moduleConfig.backgroundImage) {
            var bgImageUrl = portal.imageUrl( {
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
        if (content.type == module.name + ':post' || content.type == 'portal:page-template') {
            bodyClass += 'single single-post single-format-standard ';
        }
        if (up.author) {
            bodyClass += 'author '
        }

        var model = {
            site: site,
            bodyClass: bodyClass,
            moduleConfig: moduleConfig,
            backgroundImage: backgroundImage,
            mainRegion: content.page.regions['main'],
            content: content,
            menuItems: menuItems,
            googleUA: googleUA,
            headerStyle: req.mode == 'edit' ? 'position: absolute;' : null
        }

        return model;
    }

    return renderView();
}