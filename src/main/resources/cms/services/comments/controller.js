var stk = require('stk/stk');
var util = require('utilities');

function handlePost(req) {
    var p = req.formParams;
    var contentCreated = null;
    var commentPost = stk.content.get(p.comment_post_ID);

    //Make sure somebody doesn't alter the form to create a comment on a post that doesn't allow comments.
    if(commentPost.data && commentPost.data.enableComments == true) {
        var saveLocation = req.params.commentsFolder;

        // Check required fields and create content
        if (p.author && p.email) {
            var result = execute('content.create', {
                name: 'Comment ' + p.author + '-' + Math.floor((Math.random() * 1000000000) + 1),
                //parentPath: commentPost._path,
                parentPath: saveLocation,
                displayName: p.author,
                draft: true,
                requireValid: true,
                contentType: module.name + ':comment',
                data: {
                    name: p.author,
                    email: p.email,
                    website: p.url,
                    comment: p.comment,
                    post: commentPost._id,
                    commentParent: p.comment_parent.length > 2 ? p.comment_parent : null
                },
                branch: 'draft',
            });

            if (result._id) {
                contentCreated = true;
                log.info('Comment content created with id ' + result._id);
            } else {
                stk.log('Something went wrong creating comment for ' + commentPost.displayName);
            }

        }
    }

    // Make it redirect to the page if it is a landing page.
    var redirectPath;
    var commentPostParentPath = stk.content.getParentPath(commentPost._path);
    var commentPostParent = stk.content.get(commentPostParentPath);
    if(commentPostParent.type == module.name + ':landing-page') {
        redirectPath = commentPostParent._path;
    } else {
        redirectPath = commentPost._path;
    }

    return {

        redirect: execute('portal.pageUrl', {
            path: redirectPath + '#comments',
            params: {
                submitted: contentCreated ? 'ok' : null
            }
        })
    }
}

function handleGet(req) {
    stk.log('This is the GET!');
}

exports.post = handlePost;
exports.get = handleGet;