var thymeleaf = require('/lib/xp/thymeleaf');
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
        redirect: portal.pageUrl({id: redirectPageId})
    }
};

/*
exports.handleError = function (err) {
    var debugMode = err.request.params.debug === 'true';
    if (debugMode && err.request.mode === 'preview') {
        return;
    }

    var params = {
        errorCode: err.status
    };
    var body = thymeleaf.render(viewGeneric, params);

    return {
        contentType: 'text/html',
        body: body
    }
};*/
