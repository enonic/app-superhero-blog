var portal = require('/lib/xp/portal');
var stk = require('stk/stk');
var menu = require('menu');
var util = require('utilities');

var viewGeneric = resolve('error.html');

exports.handle403 = function (err) {

    var siteConfig = portal.getSiteConfig();

    var redirectPageId = siteConfig && siteConfig.loginPage ? siteConfig.loginPage : portal.getSite()._id;
    var redirectPageUrl = portal.pageUrl({id: redirectPageId});

    if(err.request.params.debug == 'true') {
        log.info('Error handle403');
        log.info('The siteConfig is: ');
        stk.log(siteConfig);
        log.info('The redirectPagId is: %s', redirectPageId);
        log.info('The redirectPageUrl is: %s', redirectPageUrl);
    }

    return {
        status: 200,
        redirect: portal.pageUrl({id: redirectPageId})
    }
};


exports.handleError = function (err) {
    var debugMode = err.request.params.debug === 'true';
    if (debugMode && err.request.mode === 'preview') {
        return;
    }

    var me = this;

    function renderView() {
        var model = createModel();
        return stk.view.render(viewGeneric, model);
    }

    function createModel() {

        var up = err.request.params;
        var site = portal.getSite();
        var menuItems = menu.getSiteMenu(3);
        var siteConfig = portal.getSiteConfig();
        stk.data.deleteEmptyProperties(siteConfig);

        var googleUA = siteConfig.googleUA && siteConfig.googleUA.length > 1 ? siteConfig.googleUA : null;
        var bodyClass = 'home blog ';
        var backgroundImage;
        if (siteConfig.backgroundImage) {
            var bgImageUrl = portal.imageUrl({
                id: siteConfig.backgroundImage,
                scale: '(1,1)',
                format: 'jpeg'
            });

            backgroundImage = '<style type="text/css" id="custom-background-css">body.custom-background { background-image: url("' +
                bgImageUrl + '"); background-repeat: repeat; background-position: top left; background-attachment: scroll; }</style>';

            bodyClass += 'custom-background ';
        }

        var footerText = siteConfig.footerText ? portal.processHtml({value: siteConfig.footerText}): 'Configure footer text.';

        var model = {
            site: site,
            bodyClass: bodyClass,
            backgroundImage: backgroundImage,
            menuItems: menuItems,
            googleUA: googleUA,
            footerText: footerText,
            headerStyle: err.request.mode == 'edit' ? 'position: absolute;' : null,
            error: err
        }

        return model;
    }

    return renderView();

};
