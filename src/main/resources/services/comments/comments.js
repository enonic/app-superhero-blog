const commentLib = require("/lib/comments");
//const tools = require("/lib/tools");

exports.post = function(req) {
    const params = req.params;

    let comment = null;
    if (params.parent) {
        comment = commentLib.createComment(params.comment, params.content, params.parent);
    }
    else if (params.modify) {
        comment = commentLib.modifyComment(params.id, params.comment);
    }
    else if (params.comment && params.comment.length > 0) {
        comment = commentLib.createComment(params.comment, params.content);
    }
    if (!comment) {
        log.warning("Could not create new comment. Request: " + JSON.stringify(req));
        return {
            status: 500,
            body: "Comment not created. Error is logged on server."
        };
    }

    const nodeData = commentLib.getNodeData(comment);
    return {
        body: {
            data: nodeData,
        },
        contentType: 'application/json'
    };
}
