var stk = require('stk/stk');
var menu = require('menu');
var util = require('utilities');

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
        var site = execute('portal.getSite');
        var menuItems = menu.getSiteMenu(3);
        var moduleConfig = site.moduleConfigs[module.name];
        stk.data.deleteEmptyProperties(moduleConfig);

        var facebookConfig = site.moduleConfigs[util.facebookModule] || {};
        //var twitterConfig = site.moduleConfigs[util.twitterModule] || {};
        var disqusConfig = site.moduleConfigs[util.disqusModule] || {};

        var content = execute('portal.getContent');

        // For facebook module
        var facebookAppID = facebookConfig.facebookAppID && facebookConfig.facebookAppID.length > 1 ? facebookConfig.facebookAppID : null; // Hack to prevent empty string
        var facebookApiVersion = facebookConfig.facebookApiVersion && facebookConfig.facebookApiVersion.length > 1 ? facebookConfig.facebookApiVersion : null; // Hack to prevent empty string
        var disqusShortName = disqusConfig.shortname && disqusConfig.shortname.length > 1 ? disqusConfig.shortname : null;
        var userLanguage = 'en_US';
        if(req.headers && req.headers['Accept-Language']) {
            userLanguage = req.headers['Accept-Language'].substring(0, req.headers['Accept-Language'].indexOf(',')); // So Facebook stuff comes out in the right language
        }

        var googleUA = moduleConfig.googleUA && moduleConfig.googleUA.length > 1 ? moduleConfig.googleUA : null;
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
            facebookConfig: facebookConfig,
            facebookAppID: facebookAppID,
            facebookApiVersion: facebookApiVersion,
            //twitterConfig: twitterConfig,
            disqusConfig: disqusConfig,
            disqusShortName: disqusShortName,
            backgroundImage: backgroundImage,
            mainRegion: content.page.regions['main'],
            content: content,
            menuItems: menuItems,
            userLanguage: userLanguage,
            googleUA: googleUA,
            headerStyle: req.mode == 'edit' ? 'position: absolute;' : null
        }

        return model;
    }

    return renderView();
}