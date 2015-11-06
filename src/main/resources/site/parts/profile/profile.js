var stk = require('stk/stk');
var portal = require('/lib/xp/portal');
var auth = require('/lib/xp/auth');
var contentLib = require('/lib/xp/content');
var thymeleaf = require('/lib/xp/thymeleaf');


exports.post = handlePost;
exports.get = handleGet;

function handlePost(req) {

    if(req.params.user && req.params.password) {
        var result = auth.login({
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
        var user = auth.getUser();
        //check login with old password
        var userCheck = auth.login({user: user.login, password: req.params.oldpassword});

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

function handleGet(req) {
    var me = this;

    function createModel() {
        var component = portal.getComponent();
        var user = auth.getUser();

        var model = {};

        model.user = user;
        model.postUrl = portal.componentUrl({params: {debug: 'true'}});
        model.redirectTo = req.headers.Referer || portal.pageUrl({id: portal.getSite()._id});
        model.noMatch = req.params.passwords == 'noMatch' ? true: false;
        model.passwordChanged = req.params.passwordChanged ? true: false;
        model.loginFail = req.params.loginFail == 'true' ? true : false;
        model.oldPWFail = req.params.oldpassword == 'noMatch' ? true: false;

        return model;
    }

    var view = resolve('profile.html');
    var model = createModel();
    return {
        body: thymeleaf.render(view, model),
        pageContributions: {
            headEnd: '<link rel="stylesheet" href="' + portal.assetUrl({path: "css/login.min.css"}) + '" type="text/css" media="all"/>' +
            '<link rel="stylesheet" href="' + portal.assetUrl({path: "css/buttons.min.css"}) + '" type="text/css" media="all"/>' +
            '<link rel="stylesheet" href="' + portal.assetUrl({path: "css/dashicons.min.css"}) + '" type="text/css" media="all"/>'
        }
    }
}

