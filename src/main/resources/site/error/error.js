var portal = require('/lib/xp/portal');
var stk = require('stk/stk');

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
        redirect: redirectPageUrl
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

        var site = portal.getSite();
        var siteConfig = portal.getSiteConfig();
        stk.data.deleteEmptyProperties(siteConfig);

        var googleUA = siteConfig.googleUA && siteConfig.googleUA.trim().length > 1 ? siteConfig.googleUA.trim() : null;
        var footerText = siteConfig.footerText ? portal.processHtml({value: siteConfig.footerText}): 'Configure footer text.';

        var model = {
            site: site,
            googleUA: googleUA,
            footerText: footerText,
            error: err
        }

        return model;
    }

    return renderView();

};
