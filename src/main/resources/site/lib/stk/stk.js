var portal = require('/lib/xp/portal');

exports.data = require('data.js').data;
exports.content = require('content.js').content;
exports.view = require('view.js').view;

exports.log = function (data) {
    log.info('STK log %s', JSON.stringify(data, null, 4));
};

exports.serviceUrl = function (service, params, application) {
    var url;
    if (params && application) {
        url = portal.serviceUrl({
            service: service,
            params: params,
            application: application
        });
    } else if (params) {
        url = portal.serviceUrl({
            service: service,
            params: params
        });
    } else if (application) {
        url = portal.serviceUrl({
            service: service,
            application: application
        });
    } else {
        url = portal.serviceUrl({
            service: service
        });
    }
    return url;
};

exports.isMobile = function(req) {
    if(req.params.amp) {
        return true;
    }
    /*var userAgent = req.headers['User-Agent'] || '';
    if(userAgent.indexOf("Mobile") > -1) {
        return true;
    }*/
    return false;
};

exports.ampCarousel = function() {
    return '<script async custom-element="amp-carousel" src="https://cdn.ampproject.org/v0/amp-carousel-0.1.js"></script>';
};

// For getting the height with proper aspect ratio when scale width is used. Both width and height are required for AMP images.
exports.getImageHeight = function(img, width) {
    if(width != 0 && img && img.x && img.x.media && img.x.media.imageInfo && img.x.media.imageInfo.imageHeight) {
        var oWidth = img.x.media.imageInfo.imageWidth;
        var oHeight = img.x.media.imageInfo.imageHeight;
        var ratio = oWidth / oHeight;
        return Math.round(width / ratio);
    }
    return 0;
};