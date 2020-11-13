const portal = require('/lib/xp/portal');
const stk = require('/lib/stk/stk');

const viewGeneric = resolve('error.html');

exports.handle403 = function (err) {

    const siteConfig = portal.getSiteConfig();

    //const redirectPageId = siteConfig && siteConfig.loginPage ? siteConfig.loginPage : portal.getSite()._id;
    const redirectPageId = portal.getSite()._id;
    const redirectPageUrl = portal.pageUrl({id: redirectPageId});

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
    const debugMode = err.request.params.debug === 'true';
    if (debugMode && err.request.mode === 'preview') {
        return;
    }

    const me = this;

    function renderView() {
        const model = createModel();
        return stk.view.render(viewGeneric, model);
    }

    function createModel() {

        const site = portal.getSite();
        const siteConfig = portal.getSiteConfig();
        stk.data.deleteEmptyProperties(siteConfig);

        const googleUA = siteConfig.googleUA && siteConfig.googleUA.trim().length > 1 ? siteConfig.googleUA.trim() : null;
        const footerText = siteConfig.footerText ? portal.processHtml({value: siteConfig.footerText}): 'Configure footer text.';

        const model = {
            site: site,
            googleUA: googleUA,
            footerText: footerText,
            error: err
        }

        return model;
    }

    return renderView();
};
