const portal = require('/lib/xp/portal');
const stk = require('/lib/stk/stk');

const viewGeneric = resolve('error.html');

exports.handle403 = function (err) {

    const siteConfig = portal.getSiteConfig();

    const redirectPageId = portal.getSite()._id;
    const redirectPageUrl = portal.pageUrl({id: redirectPageId});

    if(err.request.params.debug == 'true') {
        log.info('Error handle403');
        log.info('siteConfig: ' + JSON.stringify(siteConfig));
        log.info('redirectPagId: %s', redirectPageId);
        log.info('redirectPageUrlx: %s', redirectPageUrl);
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

    function renderView() {
        const model = createModel();
        return stk.view.render(viewGeneric, model);
    }

    function createModel() {

        const site = portal.getSite();
        const siteConfig = portal.getSiteConfig();
        stk.data.deleteEmptyProperties(siteConfig);

        const googleUA = siteConfig.googleUA && siteConfig.googleUA.trim().length > 1 ? siteConfig.googleUA.trim() : null;

        const model = {
            site: site,
            googleUA: googleUA,
            footerText: '',
            error: err
        }

        return model;
    }

    return renderView();
};
