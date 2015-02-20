var stk = require('stk/stk');

exports.get = function(req) {

    var component = execute('portal.getComponent');
    var content = execute('portal.getContent');
    var pastXDays = component.config["past-x-days"] || 10;
    var maxPosts = component.config["max-posts"] || 5;

    var params = {
        component: component,
        pastXDays: pastXDays,
        maxPosts: maxPosts
    }

    var view = resolve('recent-posts.html');
    return stk.view.render(view, params);
};