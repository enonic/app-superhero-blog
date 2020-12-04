/*Document ready*/
$(function () {
    window.discussion = {
        comment: $('<li><div class="singleComment">' +
            '<div class="top">' +
            '<span class="name"></span>\n' +
            '<time class="time"></time>' +
            '</div>' +
            '<p class="text"></p>' +
            '<div class="bottom">' +
            '</div>' +
            '</div></li>'),
        form: $(".startDiscussion").first().clone(),
    };

    //Adding events on document ready
    $(".startDiscussion").submit(function (event) {
        sendForm( $(this) );
        event.preventDefault();
    });

    $('.singleComment .edit').click(function (event) {
        var edit = $(this);
        var id = edit.data("key");
        var oldComment = edit.parent().siblings(".text").text();

        var form;
        var formCheck = edit.parent().next();
        if (formCheck.is("form")) {
            form = formCheck;
        } else {
            form = discussion.form.clone();
        }

        var show = edit.data("show");
        if (show === undefined) {
            form.data("type", "modify");
            //I would prefer adding properties to the json ajax object directly.
            //form.find(".headline").text("Edit comment");
            form.find(".headline").remove();
            form.find(".createComment").text(oldComment + "");
            form.prepend("<input type='hidden' name='modify' value='true'/>");
            form.prepend("<input type='hidden' name='id' value='" + id + "' />");
            form.submit(function(event) {
                sendForm( $(this) );
                event.preventDefault();
            });

            edit.data("exist", true);

            edit.parent().siblings(".text").css("display", "none");

            edit.parent().after(form);
        }
        else {
            form.remove();
            edit.removeData("exist");
        }


        event.preventDefault();
    });

    //Handle reply on comments
    $('.singleComment .respond').click(function (event) {
        var respond = $(this);
        var show = respond.data("showForm");
        var form = respond.siblings($('.startDiscussion'));

        console.log(JSON.stringify(form, null, 2));

        //Toggle show on button press
        if (show === "show") {
            form.css("display", "none");
            respond.data("showForm", "hide");
        } else {
            //Check if it has the form under it or not
            if (form.length == 0) {
                var parent = respond.data("parent");

                var newForm = discussion.form.clone();
                newForm.prepend("<input type='hidden' name='parent' value='" + parent + "' />");
                newForm.submit(function(event) {
                    sendForm( $(this) );
                    event.preventDefault(); // avoid to execute the actual submit of the form.
                });
                form = newForm;
                respond.parent().append(newForm);
            }

            form.css("display", "");
            form.data("type", "reply");
            respond.data("showForm", "show");
        }

        event.preventDefault(); //*shrug* Button could do strange things
    });

});
//Submit action on the form elements
function sendForm(form) {
    var url = form.attr('action');

    $.ajax({
        method: "POST",
        url: url,
        data: form.serialize(), // serializes the form's elements.
        datatype: "application/json",
    }).done(function (data) {
        if (data) {
            console.log("posted new comment");
            insertComment(form, data);
        } else {
            console.log("Response data was empty, server probably returned null value");
            form.prepend("<div class='error'>Error, got empty response from the server</div>");
        }
    }).fail(function (data) {
        console.log("Error could not submit form ", data);
        form.prepend("<div class='error'>Error could not submit comment</div>");
    });
}

//Handle the different comment types: Reply, modify and type
function insertComment(form, data) {
    var type = form.data("type") || "top";
    createComment(form, data, type);
}

//Create a "fake" comment so it looks like they posted it
function createComment(form, jsonResponse, type) {
    var postData = jsonResponse.data;
    form.siblings(".respond").trigger("click"); //Cheat way to show hide reply field

    var singleComment = discussion.comment.clone();

    singleComment.find(".text").text(postData.text);
    singleComment.find(".name").text(postData.userName);
    singleComment.find(".time").text(postData.time);
    //singleComment.find('.bottom').html('<button class="respond">reply</button>');

    if (type === "reply") {
        var listItem = form.closest("li");
        var childList = listItem.next();

        if (childList.is("ol")) {
            childList.append(singleComment);
        } else {
            var commentContainer = $("<ol></ol>");
            commentContainer.append(singleComment);
            listItem.after(commentContainer);
        }
    }
    else if (type === "modify") {
        var comment = form.siblings(".text");
        comment.text(postData.text);
        comment.css("display", "");
        form.remove();

    }
    else if (type === "top") {
        $(".top-level").append(singleComment);
    }
}

//Handle all edit/modify a comment
