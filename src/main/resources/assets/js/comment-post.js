/*Document ready*/
$(function () {


    discussionData.form = $(".startDiscussion").first().clone();
    discussionData.serviceUrl = discussionData.form.attr('action');

    // console.log("discussionData:", discussionData);

    updateAndSetListeners();
});


function updateAndSetListeners() {
    // console.log("Setting listeners");

    var mainForm = $(".startDiscussion");
    mainForm.show();

    //Adding events on document ready
    mainForm.submit(function (event) {
        mainForm.hide();
        sendForm($(this));
        event.preventDefault();
    });

    $('.singleComment .edit').click(function (event) {

        // Get some important target elements
        var editButton = $(this);
        var commentElement = editButton.parent().parent();  // Targets <div class="singleComment" ...
        var commentContainer = commentElement.parent();     // Targets <li class="comment-anchor" ...

        var commentId = editButton.data("key");


        // If a form is already the sibling of the editButton's parent, it means an edit has already been started but not
        // sent (only hidden, which happens on blur), so reuse that form. If not, create an in-memory form to append to the DOM.
        var reusingForm = true;
        var newForm = commentElement.next();
        if (!newForm.is("form")) {
            reusingForm = false;
            newForm = discussionData.form.clone();
        }
        var newInputField = newForm.find(".createComment");

        // Prepare new form's attributes:
        newForm.addClass("editing");
        newForm.data("type", "modify");
        newForm.attr("action", discussionData.serviceUrl);
        newForm.prepend("<input type='hidden' name='modify' value='true'/>");
        newForm.prepend("<input type='hidden' name='id' value='" + commentId + "' />");
        newForm.find(".newCommentHeadline").text(editButton.text());

        // Hide/show elements:
        mainForm.hide();
        commentElement.hide();
        if (reusingForm) {
            newForm.show();
        } else {
            commentContainer.append(newForm);
        }

        // Set focus on the input field, moving the cursor to the end of the text:

        var oldCommentText = (reusingForm)
            ? newInputField.val()
            : commentElement.find(".text").text();
        newInputField.focus();
        newInputField.val("");
        newInputField.val(oldCommentText + "");

        // Add submit click listener. After the form has been sent, the input field is no longer needed, so remove it from the DOM.
        newForm.submit(function (event) {
            sendForm($(this));
            newForm.remove();
            event.preventDefault();
        });

        // Add listener for leaving the input field: on blur (including when submitting), hide it and restore the hidden fields
        newInputField.blur(function(){
            setTimeout(
                function() {
                    commentElement.show();
                    mainForm.show();
                    newForm.hide();
                },
                200
            );
            event.preventDefault();
        });

        event.preventDefault();
    });

    //Handle reply on comments
    $('.singleComment .respond').click(function (event) {
        mainForm.hide();
        console.log("Respond");

        var respond = $(this);
        var form = respond.siblings($('.startDiscussion'));

        console.log("Form:", form);

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
            updateDiscussionTree(form, data);

        } else {
            console.error("Response data was empty, server probably returned null value");
            form.prepend("<div class='error'>Error, got empty response from the server</div>");
        }
    }).fail(function (data) {
        console.error("Error could not submit form ", data);
        form.prepend("<div class='error'>Error could not submit comment</div>");
    });
}



function scrollToComment(commentId){
    var commentElement = $("#comment-" + commentId);
    $('html,body').animate(
        { scrollTop: commentElement.offset().top },
        'slow'
    );
}

function updateDiscussionTree(form, data) {
    // var type = form.data("type") || "top";
    // console.log("data from comment post:", data);
    $.ajax({
        method: "GET",
        url: discussionData.componentUrl,
    }).done(function (componentData) {
        // console.log("data from component:", componentData);
        if (componentData) {

            // console.log("componentData (", typeof componentData, "):", componentData);
            // console.log("$(componentData) (", typeof $(componentData), "):", $(componentData));

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

            var mainInputField = $("#" + discussionData.elementId + " .startDiscussion .createComment");
            mainInputField.val("");
            updateAndSetListeners();

            var newCommentId = data.data._id;
            console.log(newCommentId);
            if (componentData.indexOf(newCommentId) !== -1) {
                scrollToComment(newCommentId);
            }

        } else {
            console.error("Response data from component service was empty - can't update discussion tree.");
            // form.prepend("<div class='error'>Error, got empty response from the server</div>");
        }

    }).fail(function (data) {
        console.error("Error - can't update discussion tree.", data);
    });
}
