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
        var siteConfig = portal.getSiteConfig();
        stk.data.deleteEmptyProperties(siteConfig);

        var content = portal.getContent();

        var googleUA = siteConfig.googleUA && siteConfig.googleUA.length > 1 ? siteConfig.googleUA : null;
        var bodyClass = '';
        var backgroundImage;
        if (siteConfig.backgroundImage) {
            var bgImageUrl = portal.imageUrl( {
                id: siteConfig.backgroundImage,
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
        if (content.type == app.name + ':post' || content.type == 'portal:page-template') {
            bodyClass += 'single single-post single-format-standard ';
        }
        if (up.author) {
            bodyClass += 'author '
        }

        var model = {
            site: site,
            bodyClass: bodyClass,
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