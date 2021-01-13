const util = require('/lib/utilities');
const contentLib = require('/lib/xp/content');
const portal = require('/lib/xp/portal');
var thymeleaf = require('/lib/thymeleaf');

const view = resolve('archive.html');

exports.get = function handleGet(req) {
    const component = portal.getComponent();
    const config = component.config;
    const title = config.title || 'Archives';
    const site = portal.getSite();
    const folderPath = util.postsFolder(config.contentFolder);

    const monthsArray = [];
    const monthsGroup = {};

    const result = contentLib.query({
        start: 0,
        count: 1000,
        query: '_parentPath="/content' + folderPath + '"',
        sort: 'createdTime DESC',
        contentTypes: [
            app.name + ':post'
        ]
    });

    for (let i = 0; i < result.hits.length; i++) {
        const content = result.hits[i];
        const date = new Date(
            // Recent versions of XP adds decimals at the end of the content creation date string.
            // These decimals are incompatible with "new Date" here (in nashorn - although it works in node!) so remove them.
            content.createdTime.replace(/\.\d+(Z?)$/, "$1")
        );
        const year = date.getFullYear();
        const monthName = util.getMonthName(date);

        const linkParam = year + content.createdTime.substring(5,7).toString();
        const linkText = monthName + ' ' + year;
        const linkUrl = portal.pageUrl({
            path: util.getSearchPage(),
            params: {m: linkParam}
        });

        if(linkParam in monthsGroup) {
            //monthsGroup[linkParam].data.count += 1; // Does not work due to ThymeLeaf turning integers into decimals, 2.0 instead of 2
            monthsGroup[linkParam].data.count = parseInt(monthsGroup[linkParam].data.count) + 1;
            monthsGroup[linkParam].data.count = monthsGroup[linkParam].data.count.toString();
        } else {
            const linkData = {linkParam: linkParam, data: {linkText: linkText, linkUrl: linkUrl, count: '1'}};
            monthsGroup[linkParam] = linkData;
        }

    }

    for (const linkParamKey in monthsGroup) {
        monthsArray.push(monthsGroup[linkParamKey]);
    }

    monthsArray.sort(function (item1, item2) {
        const param1 = parseInt(item1.linkParam);
        const param2 = parseInt(item2.linkParam);
        return param2 - param1;
    });

    const model = {
        months: monthsArray,
        site: site,
        config: config,
        title: title
    }

    return {
        body: thymeleaf.render(view, model)
    };
}
