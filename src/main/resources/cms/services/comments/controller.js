var stk = require('stk/stk');

exports.post = function(req) {
    var p = req.formParams;
    var contentCreated = null;
    var content = stk.content.get(p.comment_post_ID);

    //Make sure somebody doesn't alter the form to create a comment on a post that doesn't allow comments.
    if(content.data && content.data.enableComments == true) {
        var saveLocation;

        if(p.comment_parent.length > 2) {
            saveLocation = stk.content.getPath(p.comment_parent);
        } else {
            saveLocation = content._path;
        }

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
                log.info('Comment content created with id ' + result._id);
            } else {
                stk.log('Something went wrong creating comment for ' + content.displayName);
            }

        }
    }

    //TODO: Make it redirect to the page if it is a landing page.


    return {

        redirect: execute('portal.pageUrl', {
            path: content._path + '#comments',
            params: {
                submitted: contentCreated ? 'ok' : null
            }
        })
    }
};
exports.get = function(req) {
    stk.log('This is the GET!');
};