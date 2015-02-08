var stk = require('/cms/lib/stk');

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

    return {
        body: execute('thymeleaf.render', {
            view: resolve('recent-posts.html'),
            model: params
        }),
        contentType: 'text/html'
    };
};