var stk = require('stk/stk');
var util = require('utilities');

exports.get = function(req) {

    var component = execute('portal.getComponent');
    var content = execute('portal.getContent');
    var postAuthor = stk.content.get(content.data.author);
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
        data.gravatar = util.getGravatar(data.email, 40) + '&d=http%3A%2F%2F0.gravatar.com%2Favatar%2Fad516503a11cd5ca435acc9bb6523536%3Fs%3D40&r=G';

        var liClass = 'comment';
        liClass += (i%2 == 0) ? ' even thread-even' : ' odd thread-odd';
        if(data.email == postAuthor.data.email) {
            liClass += ' bypostauthor';
        }
        data.liClass = liClass;

        data.replyClick = "addComment.moveForm('comment-" + comments[i]._id + "', '" + comments[i]._id + "', 'respond', '" + content._id + "')";
        //return addComment.moveForm( 'comment-1', '1', 'respond', '1' )

    }

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
                post: content._id,
                commentParent: p.comment_parent
            }
        });

        if (result._id) {
            contentCreated = true;
            log.info('Content created with id ' + result._id);
        } else {
            stk.log('Something went wrong :( ');
        }

    }

    return {

        redirect: execute('portal.pageUrl', {
            path: content._path + '#comments',
            params: {
                submitted: contentCreated ? 'ok' : null
            }
        })
    }
};