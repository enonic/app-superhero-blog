var stk = require('stk/stk');

exports.get = function(req) {

    var component = execute('portal.getComponent');
    var content = execute('portal.getContent');
    var site = execute('portal.getSite');
    var moduleConfig = site.moduleConfigs[module.name];
    var folderPath = moduleConfig.postsFolder ? stk.content.getPath(moduleConfig.postsFolder) : site._path + '/posts';
    var prev, next;

    // If it's a single post in the posts folder
    if(stk.content.getParentPath(content._path) == folderPath) {
        prev = execute('content.query', {
            start: 0,
            count: 1,
            query: '_parentPath="/content' + folderPath + '" AND createdTime < instant("' + content.createdTime + '")',
            sort: 'createdTime DESC',
            contentTypes: [module.name + ':post']
        });

        next = execute('content.query', {
            start: 0,
            count: 1,
            query: '_parentPath="/content' + folderPath + '" AND createdTime > instant("' + content.createdTime + '")',
            sort: 'createdTime ASC',
            contentTypes: [module.name + ':post']
        });
    }

    var params = {
        content: content,
        site: site,
        prev: (prev && prev.contents) ? prev.contents[0] : null,
        next: (next && next.contents) ? next.contents[0] : null
    }

    var view = resolve('post-nav.html');
    return stk.view.render(view, params);
};