var auth = require('/lib/xp/auth');
var portal = require('/lib/xp/portal');

exports.post = handlePost;
exports.get = handleGet;

function handlePost(req) {

    auth.logout();

    return {
        redirect: getRedirect(req)
    }
}

function handleGet(req) {

    auth.logout();

    return {
        redirect: getRedirect(req)
    }
}

function getRedirect(req) {

    var params = req.params;
    var redirect;
    if (params.redirectPageKey) {
        redirect = portal.pageUrl({id: params.redirectPageKey});
    } else if (params.redirect) {
        redirect = params.redirect;
    } else {
        redirect = portal.pageUrl({id: portal.getSite()._id})
    }

    return redirect;
}