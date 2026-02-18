const portal = require('/lib/xp/portal');
const assetLib = require('/lib/enonic/asset');
const thymeleaf = require('/lib/thymeleaf');
const dataUtils = require('/lib/data');

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

    const assetUrlPrefix = assetLib.assetUrl({path: ''});
    const site = portal.getSite();
    const siteConfig = portal.getSiteConfig();
    dataUtils.deleteEmptyProperties(siteConfig);

    const googleUA = siteConfig.googleUA && siteConfig.googleUA.trim().length > 1 ? siteConfig.googleUA.trim() : null;

    const model = {
        site: site,
        assetUrlPrefix,
        googleUA: googleUA,
        footerText: '',
        error: err
    }

    return {
        body: thymeleaf.render(viewGeneric, model)
    };
};
