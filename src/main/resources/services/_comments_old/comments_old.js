const stk = require('stk/stk');

const auth = require('/lib/xp/auth');
const contentLib = require('/lib/xp/content');
const portal = require('/lib/xp/portal');


exports.post = function(req) {
    const p = req.params;
    let contentCreated = null;
    const commentPost = stk.content.get(p.comment_post_ID);
    const user = auth.getUser();
    let newComment = null;

    // comment vars
    let email = p.email; // Super User doesn't have an email.
    if(user && !email) {
        email = user.email;
    }

    let name = p.author;
    if(user && !name) {
        name = user.displayName;
    }

    const website = p.url;

    const commentText = p.comment;
    let commentParent;
    const body = {};
    let error = '';

    //Make sure somebody doesn't alter the form to create a comment on a post that doesn't allow comments.
    if(commentPost.data && commentPost.data.enableComments == true) {
        let saveLocation;
        let commentsFolder;

        // If it's a reply to a comment, saveLocation is the commentParent. Else check for and/or create a "comments" folder
        if(p.comment_parent && stk.content.exists(p.comment_parent)) {
            commentParent = stk.content.get(p.comment_parent);
            saveLocation = commentParent._path;
        } else {
            //Check for an existing <post>/comments folder. Create one if it does not exist.
            if(stk.content.exists(commentPost._path + '/comments')) {
                saveLocation = commentPost._path + '/comments';
            } else {
                commentsFolder = contentLib.create({
                    name: 'comments',
                    parentPath: commentPost._path,
                    displayName: 'Comments',
                    requireValid: true,
                    contentType: 'base:folder',
                    data: {}
                });
                saveLocation = commentsFolder._path;
            }
        }

        // Check required fields and create content
        if (email && commentText && name) {
            newComment = contentLib.create({
                parentPath: saveLocation,
                displayName: name,
                requireValid: true,
                contentType: app.name + ':comment',
                //branch: 'draft',
                data: {
                    name: name,
                    email: email,
                    website: website,
                    comment: commentText,
                    post: commentPost._id,
                    commentParent: p.comment_parent.length > 2 ? p.comment_parent : null
                }
            });

            if (newComment._id) {
                contentCreated = true;
                log.info('Comment content created with id ' + newComment._id);
            } else {
                stk.log('Something went wrong creating comment for ' + commentPost.displayName);
            }

        } else {
            contentCreated = false;
            let missing = !email ? 'Email is required. ' : '';
            missing += (!user && !p.author) ? 'Name is required. ': '';
            missing += !commentText ? 'Comment text is required. ': '';
            error = missing;
            log.info('Required field missing. ' + missing);
        }
    }

    if (!contentCreated) {
        body.success = false;
        body.error = error;

        return {
            contentType: 'application/json',
            body: body
        }
    }

    let redirectUrl = portal.pageUrl({
        path: commentPost._path,
        params: {
            submitted: contentCreated ? 'ok' : null
        }
    });
    redirectUrl += "#comments";

    return {
        redirect: redirectUrl
    }
}

exports.get = function(req) {
    stk.log('This is the GET!');
}
