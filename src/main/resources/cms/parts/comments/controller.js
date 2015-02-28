var stk = require('stk/stk');
var util = require('utilities');

exports.get = function(req) {

    var component = execute('portal.getComponent');
    var content = execute('portal.getContent');
    var site = execute('portal.getSite');

    var allowedTags = '<a href="" title=""> <abbr title=""> <acronym title=""> <b> <blockquote cite=""> <cite> <code> <del datetime=""> <em> <i> <q cite=""> <strike> <strong> ';

    var postUrl = execute('portal.componentUrl', {
        component: component.path
    });

    var result = execute('content.query', {
        start: 0,
        count: 1000,
        query: 'data.post LIKE "' + content._id + '"',
        sort: 'createdTime ASC',
        contentTypes: [module.name + ':comment']
    });

    var numComments = result.total;
    var comments = result.contents;

    for (var i = 0; i < comments.length; i++) {
        var data = comments[i].data;

        var date = util.getFormattedDate(new Date(comments[i].createdTime));
        date += ' at ' + comments[i].createdTime.substring(11, 16);
        data.pubDate = date;
    }

    //stk.log(content);
    //stk.log(result.contents);
    //stk.log(component);

    var params = {
        postUrl: postUrl,
        content: content,
        site: site,
        allowedTags: allowedTags,
        numComments: numComments,
        comments: result.contents
    }

    var view = resolve('comments.html');
    return stk.view.render(view, params);
};

exports.post = function(req) {
    var p = req.formParams;
    //stk.log(req);
    var contentCreated = null;
    var content = execute('portal.getContent');
    var component = execute('portal.getComponent');
    var folderKey = component.config['saveFolder'] || null;
    var saveLocation = stk.content.getPath(folderKey);

    // Check required fields and create content
    if (p.author && p.email) {
        var result = execute('content.create', {
            name: 'Comment ' + p.author + '-' + Math.floor((Math.random() * 1000000000) + 1),
            //parentPath: content._path,
            parentPath: saveLocation,
            displayName: p.author,
            branch: 'draft',
            contentType: module.name + ':comment',
            data: {
                name: p.author,
                email: p.email,
                website: p.url,
                comment: p.comment,
                post: content._id
            }
        });

        if (result._id) {
            contentCreated = true;
            log.info('Content created with id ' + result._id);
        } else {
            stk.log('Something went wrong :( ');
            stk.log(result);
        }

    }

    return {

        redirect: execute('portal.pageUrl', {
            path: content._path + '#comments',
            params: {
                submitted: contentCreated ? 'ok' : null
            }
        })

        /*contentType: 'text/json',
        body: {
            content: contentCreated ? 'ok' : 'false'
        }*/
    }
};