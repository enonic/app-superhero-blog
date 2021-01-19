/*Document ready*/
$(function () {

    discussionData.form = $(".startDiscussion").first().clone();
    discussionData.serviceUrl = discussionData.form.attr('action');

    // console.log("discussionData:", discussionData);

    setListeners();
});



function setListeners() {
    // console.log("Setting listeners");

    //Adding events on document ready
    $(".startDiscussion").submit(function (event) {
        sendForm($(this));
        event.preventDefault();
    });

    $('.singleComment .edit').click(function (event) {
        console.log("Edit");

        var edit = $(this);
        var id = edit.data("key");
        var oldComment = edit.parent().siblings(".text").text();

        var form;
        var formCheck = edit.parent().next();
        if (formCheck.is("form")) {
            form = formCheck;
        } else {
            form = discussionData.form.clone();
        }

        //var show = edit.data("show");
        //if (show === undefined) {
        form.data("type", "modify");
        //I would prefer adding properties to the json ajax object directly.
        //form.find(".headline").text("Edit comment");
        form.find(".headline").remove();
        form.find(".createComment").text(oldComment + "");
        form.prepend("<input type='hidden' name='modify' value='true'/>");
        form.prepend("<input type='hidden' name='id' value='" + id + "' />");
        form.submit(function (event) {
            sendForm($(this));
            event.preventDefault();
        });

        /* } else {
            form.remove();
            edit.removeData("exist");
        }*/

        event.preventDefault();
    });

    //Handle reply on comments
    $('.singleComment .respond').click(function (event) {
        console.log("Respond");

        var respond = $(this);
        var show = respond.data("showForm");
        var form = respond.siblings($('.startDiscussion'));

        //Toggle show on button press
        /*if (show === "show") {
            form.css("display", "none");
            respond.data("showForm", "hide");
        } else { */
        //Check if it has the form under it or not
        if (form.length == 1) {
            var parent = respond.data("parent");

            var newForm = discussionData.form.clone();
            newForm.prepend("<input type='hidden' name='parent' value='" + parent + "' />");
            newForm.submit(function (event) {
                sendForm($(this));
                event.preventDefault(); // avoid to execute the actual submit of the form.
            });
            //form = newForm;
            respond.parent().append(newForm);
        }

        /*
        form.css("display", "");
        form.data("type", "reply");
        respond.data("showForm", "show");
    } */

        event.preventDefault(); //*shrug* Button could do strange things
    });
}


//Submit action on the form elements
function sendForm(form) {
    //$(form).replaceWith('<div class="kinda-sorta-spinner">(Posting...)</div>');


    $.ajax({
        method: "POST",
        url: discussionData.serviceUrl,
        data: form.serialize(), // serializes the form's elements.
        datatype: "application/json",
    }).done(function (data) {
        if (data) {
            // console.log("Posted new comment. Updating DOM...");
            updateDiscussionTree(form, data, 6);

        } else {
            console.error("Response data was empty, server probably returned null value");
            form.prepend("<div class='error'>Error, got empty response from the server</div>");
        }
    }).fail(function (data) {
        console.error("Error could not submit form ", data);
        form.prepend("<div class='error'>Error could not submit comment</div>");
    });
}


function updateDiscussionTree(form, data, allowedRetriesLeft) {
    // var type = form.data("type") || "top";
    // console.log("data from comment post:", data);
    var targetId = "comment-" + data.data._id;

    $.ajax({
        method: "GET",
        url: discussionData.componentUrl,
    }).done(function (componentData) {
        // console.log("data from component:", componentData);
        if (componentData) {

            // console.log("componentData (", typeof componentData, "):", componentData);
            // console.log("$(componentData) (", typeof $(componentData), "):", $(componentData));

            // Repeating the attempt to read and update the discussion tree, a certain number of times, if the comment's
            // ID isn't in the returned HTML (which happens if this GET request reaches the server before elasticsearch
            // has had time to update after the POST of the comment).
            if (componentData.indexOf(targetId) === -1) {
                if (allowedRetriesLeft > 0) {
                    // console.log("Target ID", targetId, "not found. Trying again...");
                    setTimeout(
                        function() { updateDiscussionTree(form, data, allowedRetriesLeft - 1); },
                        500
                    );

                } else {
                    console.warn("Target ID", targetId, "not found.");
                }

            } else {
                // console.log("Target ID", targetId, "found! Populating...");
                //console.log("Updating component tree with data (", typeof data, ")\n", data);
                //insertComment(form, data);

                // Replace the current discussion tree in the DOM (all comments in the part) with the parsed
                // HTML from the incoming data (that is, select the ".discussionTree" class in both):
                var discussionTreeInDom = $("#" + discussionData.elementId + " .discussionTree")[0];
                var incomingDiscussion = $(componentData)[0];
                var replacementDiscussionTree = incomingDiscussion.querySelector(".discussionTree");
                discussionTreeInDom.replaceWith(replacementDiscussionTree);
                // console.log("Done");
            }



        } else {
            console.error("Response data from component service was empty - can't update discussion tree.");
            // form.prepend("<div class='error'>Error, got empty response from the server</div>");
        }

        setListeners();
    }).fail(function (data) {
        console.error("Error - can't update discussion tree.", data);
    });
}
