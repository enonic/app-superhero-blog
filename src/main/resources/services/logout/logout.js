const auth = require('/lib/xp/auth');
const portal = require('/lib/xp/portal');

exports.post = function(req) {

    auth.logout();

    return {
        redirect: getRedirect(req)
    }
}

exports.get = function(req) {

    auth.logout();

    return {
        redirect: getRedirect(req)
    }
}

function getRedirect(req) {

    const params = req.params;
    let redirect;
    if (params.redirectPageKey) {
        redirect = portal.pageUrl({id: params.redirectPageKey});
    } else if (params.redirect) {
        redirect = params.redirect;
    } else {
        redirect = portal.pageUrl({id: portal.getSite()._id})
    }

    return redirect;
}
