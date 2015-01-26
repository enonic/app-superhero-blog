var thymeleaf = require('view/thymeleaf');
var stk = require('/lib/stk');
//var utilities = require('utilities');



function handleGet(req) {

    var site = execute('portal.getSite');
    var moduleConfig = site.moduleConfigs['com.enonic.wem.modules.theme.wem-superhero-module'];
    //var moduleConfig = site.moduleConfigs[utilities.module];
    var content = execute('portal.getContent');

    var params = {
        moduleConfig: moduleConfig,
        mainRegion: content.page.regions['main'],
        content: content
    }

    var view = resolve('home.html');
    var body = thymeleaf.render(view, params);

    return {
        body: body,
        contentType: 'text/html'
    };
}

exports.get = handleGet;