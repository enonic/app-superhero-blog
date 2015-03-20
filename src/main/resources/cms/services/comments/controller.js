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
            stk.log('Something went wrong creating comment for ' + content.displayName);
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