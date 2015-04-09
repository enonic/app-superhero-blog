var stk = require('stk/stk');
var util = require('utilities');

exports.get = handleGet;

function handleGet(req) {
    var me = this;

    function renderView() {
        var view = resolve('archive.html');
        var model = createModel();
        return stk.view.render(view, model);
    }

    function createModel() {
        var content = execute('portal.getContent');
        var component = execute('portal.getComponent');
        var config = component.config;
        var title = config.title || 'Archives';
        var site = execute('portal.getSite');
        var folderPath = util.postsFolder(config.contentFolder);

        var monthsArray = [];
        var monthsGroup = {};

        var result = execute('content.query', {
            start: 0,
            count: 1000,
            query: '_parentPath="/content' + folderPath + '"',
            sort: 'createdTime DESC',
            contentTypes: [
                module.name + ':post'
            ]
        });

        for (var i = 0; i < result.contents.length; i++) {

            var content = result.contents[i];
            var date = new Date(content.createdTime);
            var year = date.getFullYear();
            var monthName = util.getMonthName(date);

            var linkParam = year + content.createdTime.substring(5,7).toString();
            var linkText = monthName + ' ' + year;
            var linkUrl = execute('portal.pageUrl', {
                path: util.getSearchPage(),
                params: {m: linkParam}
            });

            if(linkParam in monthsGroup) {
                monthsGroup[linkParam].data.count += 1;
            } else {
                var linkData = {linkParam: linkParam, data: {linkText: linkText, linkUrl: linkUrl, count: 1}};
                monthsGroup[linkParam] = linkData;
            }

        }

        for (var linkParamKey in monthsGroup) {
            monthsArray.push(monthsGroup[linkParamKey]);
        }

        monthsArray.sort(function (item1, item2) {
            var param1 = parseInt(item1.linkParam);
            var param2 = parseInt(item2.linkParam);
            return param2 - param1;
        });

        var model = {
            months: monthsArray,
            site: site,
            config: config,
            title: title
        }

        return model;
    }

    return renderView();
}