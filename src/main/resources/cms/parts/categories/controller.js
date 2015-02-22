var stk = require('stk/stk');

exports.get = function(req) {

    var content = execute('portal.getContent');
    var site = execute('portal.getSite');

    var result = execute('content.query', {
        start: 0,
        count: 1000,
        //query: ,
        sort: 'createdTime DESC',
        contentTypes: [
            module.name + ':category'
        ]
    });

    for (var i = 0; i < result.contents.length; i++) {
        stk.data.deleteEmptyProperties(result.contents[i].data);
    }

    var params = {
        categories: result.contents,
        sitePath: site._path
    }

    var view = resolve('categories.html');
    return stk.view.render(view, params);
};