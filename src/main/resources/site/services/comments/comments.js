var stk = require('stk/stk');
var util = require('utilities');

var auth = require('/lib/xp/auth');
var contentLib = require('/lib/xp/content');
var portal = require('/lib/xp/portal');

exports.post = handlePost;
exports.get = handleGet;

function handlePost(req) {
    var me = this;

    var p = req.params;
    var contentCreated = null;
    var commentPost = stk.content.get(p.comment_post_ID);
    var user = auth.getUser();
    var newComment = null;
    // comment vars
    var email = p.email; // Super User doesn't have an email.
    if(user && !email) {
        email = user.email;
    }
    var name = p.author;
    if(user && !name) {
        name = user.displayName;
    }
    var website = p.url;
    var commentText = p.comment;
    var commentParent;
    var body = {};
    var error = '';

    //Make sure somebody doesn't alter the form to create a comment on a post that doesn't allow comments.
    if(commentPost.data && commentPost.data.enableComments == true) {
        var saveLocation;
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
            var missing = !email ? 'Email is required. ' : '';
            missing += (!user && !p.author) ? 'Name is required. ': '';
            missing += !commentText ? 'Comment text is required. ': '';
            error = missing;
            log.info('Required field missing. ' + missing);
        }
    }

    /*var redirectUrl = portal.pageUrl({
        path: commentPost._path,
        params: {
            submitted: contentCreated ? 'ok' : null
        }
    });
    redirectUrl += "#comments";

    return {
        redirect: redirectUrl
    }*/

    if (contentCreated) {
        body = {
           success: true,
           name: name,
           email: email,
           website: website,
           comment: portal.processHtml({value: commentText}),
           commentId: newComment._id,
           postId: commentPost._id,
           commentParent: p.comment_parent.length > 2 ? p.comment_parent : null,
           gravatar: util.getGravatar(email, 40) + '&d=http%3A%2F%2F0.gravatar.com%2Favatar%2Fad516503a11cd5ca435acc9bb6523536%3Fs%3D40&r=G',
           pubDate: util.getFormattedDate(new Date(newComment.createdTime)),
           postUrl: portal.pageUrl({id: newComment.post}),
           replyClick: "return addComment.moveForm('comment-" + newComment._id + "', '" + newComment._id + "', 'respond', '" + commentPost._id + "')"
       };
    } else {
        body.success = false;
        body.error = error;
    }

    return {
        contentType: 'application/json',
        body: body
    }
}

function handleGet(req) {
    stk.log('This is the GET!');
}