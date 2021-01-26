/*Document ready*/
$(function () {
    var mainForm = $(".startDiscussion").first();
    discussionData.componentUrl = mainForm.attr('action');
    discussionData.form = mainForm.clone();

    updateAndSetListeners(true);
});

var EDITING = "editing";
var REPLYING = "replying";

//Adding events (on document ready)
function updateAndSetListeners(setMainFormListener) {

    var mainForm = $(".startDiscussion").first();
    mainForm.show();

    if (setMainFormListener) {
        // Submitting a new comment (the main field):
        mainForm.submit(function (event) {
            mainForm.hide();
            sendForm($(this));
            event.preventDefault();
        });
    }


    // Submitting an edited comment (clicked "Edit"):
    $('.singleComment .edit').click(function (event) {

        // Get some important target elements
        var editButton = $(this);
        var commentElement = editButton.parent().parent();  // Targets <div class="singleComment" ...
        var commentContainer = commentElement.parent();     // Targets <li class="comment-anchor" ...

        var obj = prepareNewForm(commentContainer, editButton, EDITING);
        var newForm = obj.newForm;
        var reusingForm = obj.reusingForm;

        swapHiddenAndVisible(mainForm, newForm, commentContainer, reusingForm, commentElement);

        if (!reusingForm) {
            setCancelListener(newForm, commentElement, mainForm, true);
            setSubmitListener(newForm, commentElement, mainForm, true);
        }

        setInputTextAndFocus(newForm, reusingForm, commentElement.find(".text").text());

        event.preventDefault();
    });



    // Submitting a response comment (clicked "Reply"):
    $('.singleComment .respond').click(function (event) {
        // Get some important target elements
        var replyButton = $(this);
        var commentElement = replyButton.parent().parent();  // Targets <div class="singleComment" ...
        var commentContainer = commentElement.parent();     // Targets <li class="comment-anchor" ...

        var obj = prepareNewForm(commentContainer, replyButton, REPLYING);
        var newForm = obj.newForm;
        var reusingForm = obj.reusingForm;

        swapHiddenAndVisible(mainForm, newForm, commentContainer, reusingForm);

        if (!reusingForm) {
            setSubmitListener(newForm, commentElement, mainForm, false);
            setCancelListener(newForm, commentElement, mainForm, false);
        }

        setInputTextAndFocus(newForm, reusingForm, "");

        event.preventDefault();
    });
}


// Set focus on the input field in newForm, set its text, and move the cursor to the end of the text:
function setInputTextAndFocus(newForm, reusingForm, inputText) {
    var newInputField = newForm.find(".createComment");
    var prevVal = newInputField.val();
    newInputField.focus();
    newInputField.val("");
    newInputField.val(reusingForm ? prevVal : inputText);
}


// Prepare a new form to insert below/instead of a comment, for replying/editing.
// Returns an object where:
//     .newForm is the created or re-used (jquery format) form, and
//     .reusingForm is true if an existing form in the DOM is recycled, or false if .newForm was created as a new element.
function prepareNewForm(commentContainer, button, commentContainerClass) {
    // If a form with the right classes is already in the commnt container, it means an edit has already been started but not
    // sent (only hidden: "close" was clicked (or there was an error)). So reuse that form...
    var reusingForm = true;
    var newForm = commentContainer.find(".startDiscussion." + commentContainerClass);
    if (!newForm.is("form")) {
        // ...but if not, create an in-memory form to append to the DOM:
        reusingForm = false;
        newForm = discussionData.form.clone();
        newForm.addClass(commentContainerClass);

        // Prepare new form's attributes and looks...
        newForm.attr("action", discussionData.componentUrl);
        newForm.find(".newCommentHeadline").text(button.text());

        // ...depending on what button was clicked --> what functionality th
        if (commentContainerClass === EDITING) {
            var commentId = button.data("key");
            newForm.data("type", "modify");
            newForm.prepend("<input type='hidden' name='modify' value='true'/>");
            newForm.prepend("<input type='hidden' name='id' value='" + commentId + "' />");

        } else if (commentContainerClass === REPLYING) {
            var parent = button.data("parent");
            newForm.prepend("<input type='hidden' name='parent' value='" + parent + "' />");

        } else {
            throw Error();
        }
    }

    return {
        newForm: newForm,
        reusingForm: reusingForm
    }
}

// Hide bottom input field (and maybe the comment we're editing), show the newForm:
function swapHiddenAndVisible(mainForm, newForm, commentContainer, reusingForm, commentElement) {
    mainForm.hide();
    if (commentElement) {
        commentElement.hide();
    }
    if (reusingForm) {
        newForm.show();
    } else {
        commentContainer.append(newForm);
    }
}




// Add submit click listener. After the form has been sent, the input field is no longer needed, so remove it from the DOM.
function setSubmitListener(newForm, commentElement, mainForm, showCommentElement) {
    newForm.submit(function (event) {
        sendForm($(this), newForm, commentElement);
        if (showCommentElement) {
            commentElement.show();
        }
        mainForm.show();
        newForm.hide();
        event.preventDefault();
    });
}

// Add listener for the cancel button: hide the input field (but leave it in the DOM) and restore the hidden fields
function setCancelListener(newForm, commentElement, mainForm, showCommentElement) {
    var cancelButton = newForm.find(".close");
    cancelButton.click(function(event){
        if (showCommentElement) {
            commentElement.show();
        }
        mainForm.show();
        newForm.hide();
        event.preventDefault();
    });
}



// -------------------------------------------  SUBMITTING:

//Submit action on the form elements
function sendForm(form, formToRemove, commentElement) {
    $.ajax({
        method: "POST",
        url: discussionData.componentUrl,
        data: form.serialize(), // serializes the form's elements.
        datatype: "application/json",

    }).done(function (data, status, xhr) {
        var contentType = xhr.getResponseHeader("content-type") || "";

        // Valid response: got some data in HTML format
        if (data && contentType.indexOf('html') !== -1) {
            handleResponseUpdateDiscussion(data, form, formToRemove, commentElement);

        } else {
            reportError("Problematic response from server when trying to add/edit comment. Status:" + status + ",", data || "(empty response)", "Problem submitting the comment or refreshing the discussion. Refresh page/try again.", form, commentElement, formToRemove);
        }

    }).fail(function (data) {
        var contentType = data.getResponseHeader("content-type") || "";
        const printableData = (data && contentType.indexOf('text/plain') !== -1)
            ? data.responseText
            : data
        reportError("Couldn't submit form.", printableData, "Couldn't submit comment.", form, commentElement, formToRemove);
    });
}



// -------------------------------------------  HANDLING/UPDATING:

function handleResponseUpdateDiscussion(data, form, formToRemove, commentElement) {
    const componentData = (typeof data === 'string')
        ? data.trim()
        : undefined;
    if (componentData) {
        // Replace the current discussion tree in the DOM (all comments in the part) with the parsed
        // HTML from the incoming data (that is, select the ".discussionTree" class in both):
        var discussionTreeInDom = $("#" + discussionData.elementId + " .discussionTree")[0];
        var incomingDiscussion = $(componentData)[0];
        var replacementDiscussionTree = incomingDiscussion.querySelector(".discussionTree");
        discussionTreeInDom.replaceWith(replacementDiscussionTree);

        var mainInputField = $("#" + discussionData.elementId + " .startDiscussion .createComment");
        mainInputField.val("");
        updateAndSetListeners();

        if (formToRemove) {
            formToRemove.remove();
        }

    } else {
        reportError("Server responded with empty or invalid data:", data, "Problem submitting the comment or refreshing the discussion. Refresh page/try again.", form, commentElement, formToRemove);
    }
}


// Global-namespace availble: called by the HTML returned
function markNewComment(commentId){
    var commentElement = $("#comment-" + commentId);
    $('html,body').animate(
        { scrollTop: commentElement.offset().top }
    );
    // commentElement.find(".singleComment").addClass("new");   // Mark a new comment in light grey?
}



function reportError(consoleMessage, data, visibleMessage, form, commentElement, formToRemove) {
    console.error(consoleMessage, data);
    form.prepend("<div class='error'>Error: " + visibleMessage + "</div>");
    setTimeout(
        function() {
            if (commentElement) {
                commentElement.hide();
            }
            if (formToRemove) {
                formToRemove.show();
            }
            if (!formToRemove) {
                form.show();
            }
        },
        200
    );
}
