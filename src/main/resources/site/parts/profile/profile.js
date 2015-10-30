var stk = require('stk/stk');
var portal = require('/lib/xp/portal');
var auth = require('/lib/xp/auth');
var contentLib = require('/lib/xp/content');
var thymeleaf = require('/lib/xp/auth');


exports.post = handlePost;
exports.get = handleGet;

function handlePost(req) {
    if(req.params.user && req.params.password) {
        var result = auth.login({
            user: req.params.user,
            password: req.params.password
        });

        if(!result.authenticated) {
            var view = resolve('profile.html');
            var model = {loginFail: true};
            thymeleaf.render(view, model);
        }
    }

    return {
        redirect: portal.pageUrl({id: portal.getSite()._id})
    }
}

function handleGet(req) {
    var me = this;

    function renderView() {
        var view = resolve('profile.html');
        var model = createModel();
        return stk.view.render(view, model);
    }

    function createModel() {
        var component = portal.getComponent();
        //var config = component.config;
        //var title = config.title || 'Meta';
        var user = auth.getUser();

        var model = {};

        model.user = user;
        model.postUrl = portal.componentUrl({});


        return model;
    }

    return renderView();
}

