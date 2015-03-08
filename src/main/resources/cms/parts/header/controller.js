var stk = require('stk/stk');
var util = require('utilities');

exports.get = function(req) {

    var content = execute('portal.getContent');
    var site = execute('portal.getSite');
    var up = req.params;

    var headerText;

    if (up.cat) {
        var categories = util.getCategories();
        var cat = util.getCategory({name: up.cat}, categories)
        headerText = 'Category Archives: ' + cat.displayName;
    }

    if (up.tag) {
        headerText = 'Tag Archives: ' + up.tag;
    }

    if (up.s) {
        headerText = 'Search Results for: ' + up.s;
    }

    if (up.author) {
        headerText = 'Author Archives: ';
        var authorContent;
        if (stk.content.exists(up.author)) {
            authorContent = stk.content.get(up.author);
            var url = execute('portal.pageUrl', {
                path: stk.content.getPath(site._path),
                params: { author: up.author }
            });

            headerText += '<a href="' + url + '">' + authorContent.data.name + '</a>';
        }
    }

    if (up.m && stk.data.isInt(up.m) && up.m.length == 6) {

        var year = up.m.substring(0,4);
        var month = up.m.substring(4,6);
        var date = new Date(year, month -1, 15);
        var monthName = util.getMonthName(date);

        headerText = 'Monthly Archives: ' + monthName + ' ' + year;
    }

    if (up.post_format) {
        switch(up.post_format) {
            case 'image':
                headerText = 'Images';
                break;

        }

    }


    var params = {
        site: site,
        headerText: headerText
    }

    var view = resolve('header.html');
    return stk.view.render(view, params);
};