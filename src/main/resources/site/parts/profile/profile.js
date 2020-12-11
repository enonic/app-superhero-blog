const portal = require('/lib/xp/portal');
const auth = require('/lib/xp/auth');
const thymeleaf = require('/lib/thymeleaf');
const assetUrlCache = require('/lib/assetUrlCache');

const view = resolve('profile.html');


exports.post = function handlePost(req) {
    if(req.params.user && req.params.password) {
        const result = auth.login({
            user: req.params.user,
            password: req.params.password
        });

        if(!result.authenticated) {
            return {
                redirect: portal.pageUrl({id: portal.getContent()._id, params: {loginFail: 'true'}})
            }
        }
    }

    if(req.params.changePassword) {
        const user = auth.getUser();
        //check login with old password
        const userCheck = auth.login({user: user.login, password: req.params.oldpassword});

        if(req.params.password1 == req.params.password2 && userCheck.authenticated) {
            // If all checks out, change the password and redirect with success param
            auth.changePassword({userKey: user.key, password: req.params.password1});
            return {
                redirect: portal.pageUrl({id: portal.getContent()._id, params: {passwordChanged: 'true'}})
            }
        } else {
            if(!userCheck.authenticated) {
                // Old password is wrong
                return {
                    redirect: portal.pageUrl({id: portal.getContent()._id, params: {oldpassword: 'noMatch'}})
                }
            }
            // New passwords don't match.
            return {
                redirect: portal.pageUrl({id: portal.getContent()._id, params: {passwords: 'noMatch'}})
            }
        }
    }

    return {
        redirect: req.params.redirect_to || portal.pageUrl({id: portal.getSite()._id})
    }
}

exports.get = function handleGet(req) {

    const user = auth.getUser();

    const model = {
        user: user,
        postUrl: portal.componentUrl({params: {debug: 'true'}}),
        redirectTo: req.headers.Referer || portal.pageUrl({id: portal.getSite()._id}),
        noMatch: req.params.passwords == 'noMatch' ? true: false,
        passwordChanged: req.params.passwordChanged ? true: false,
        loginFail: req.params.loginFail == 'true' ? true : false,
        oldPWFail: req.params.oldpassword == 'noMatch' ? true: false,
    };

    const assetUrls = assetUrlCache.getAssetUrls(req.mode, req.branch);

    return {
        body: thymeleaf.render(view, model),
        pageContributions: {
            headEnd: [
                `<link rel="stylesheet" href="${assetUrls.loginCss}" type="text/css" media="all"/>`,
                `<link rel="stylesheet" href="${assetUrls.buttonCss}" type="text/css" media="all"/>`,
                `<link rel="stylesheet" href="${assetUrls.dashiconsCssCss}" type="text/css" media="all"/>`,
            ]
        }
    }
}
