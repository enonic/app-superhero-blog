var stk = require('/lib/stk');
var thymeleaf = require('view/thymeleaf');

exports.get = function(req) {

    var component = execute('portal.getComponent');
    var pastXDays = component.config["past-x-days"] || 10;
    var maxPosts = component.config["max-posts"] || 5;

    var params = {
        editMode: req.mode === 'edit' ? true : false,
        component: component,
        pastXDays: pastXDays,
        maxPosts: maxPosts
    }

    //stk.log(params);

    var view = resolve('recent-posts.html');
    var body = thymeleaf.render(view, params);

    return {
        body: body,
        contentType: 'text/html'
    };
};