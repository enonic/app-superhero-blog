var thymeleaf = require('/lib/xp/thymeleaf');
var portal = require('/lib/xp/portal');

var viewGeneric = resolve('error.html');

exports.handle403 = function (err) {

    var siteConfig = portal.getSiteConfig();
    //var redirectPageId = siteConfig && siteconfig.loginPage ? siteConfig.loginPage : portal.getSite()._id;

    return {
        redirect: portal.pageUrl({id: '75f6f354-491d-4102-a2e8-843270b63f23'})
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
