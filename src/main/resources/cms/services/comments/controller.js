var stk = require('stk/stk');
var util = require('utilities');

exports.post = handlePost;
exports.get = handleGet;

function handlePost(req) {
    var me = this;

    var p = req.formParams;
    var contentCreated = null;
    var commentPost = stk.content.get(p.comment_post_ID);

    //Make sure somebody doesn't alter the form to create a comment on a post that doesn't allow comments.
    if(commentPost.data && commentPost.data.enableComments == true) {
        var saveLocation;
        var commentParent;
        var commentsFolder;

        // If it's a reply to a comment, saveLocation is the commentParent. Else check for and/or create a "comments" folder
        if(p.comment_parent && stk.content.exists(p.comment_parent)) {
            commentParent = stk.content.get(p.comment_parent);
            saveLocation = commentParent._path;
        } else {
            //Check for an existing <post>/comments folder. Create one if it does not exist.
            if(stk.content.exists(commentPost._path + '/comments')) {
                saveLocation = commentPost._path + '/comments';
            } else {
                commentsFolder = execute('content.create', {
                    name: 'comments',
                    parentPath: commentPost._path,
                    displayName: 'Comments',
                    draft: true,
                    requireValid: true,
                    contentType: 'base:folder',
                    data: {}
                });
                saveLocation = commentsFolder._path;
            }
        }


        //change this to the post/comments folder
        //saveLocation = req.params.commentsFolder;

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

    // No longer needed now that there are no posts as a child of a landing page.
    // Make it redirect to the page if it is a landing page.
    /*var redirectPath;
    var commentPostParent = stk.content.getParent(commentPost._path);
    if(commentPostParent.type == module.name + ':landing-page') {
        redirectPath = commentPostParent._path;
    } else {
        redirectPath = commentPost._path;
    }*/

    return {

        redirect: execute('portal.pageUrl', {
            path: commentPost._path + '#comments',
            params: {
                submitted: contentCreated ? 'ok' : null
            }
        })
    }
}

function handleGet(req) {
    stk.log('This is the GET!');
}