( function( $ ) {

	 function pagePadding() {
		var headerHeight = $( '#masthead-wrap' ).height() - 1;
		$( '#page' ).css( 'padding-top', headerHeight );
	 }

	// Call pagePadding() after a page load completely.
	$( window ).load( pagePadding );

} )( jQuery );

$(document).ready(function(){

	// Ajax comments
	$('#commentform').submit(function(e) {
		var formData = $(this).serialize();

		$.ajax({
			type: 'POST',
			url: $('#commentform').data('posturl'),
			data: formData,
			dataType: 'json',
			encode: true
		}).done(function(data) {
			//handle errors and stuff.
			if (!data.success) {
				//TODO: Error. Show error message somewhere.
				//console.log('Error!');
			} else {
				var comments = $('#comments');
				var commentlist = comments.find('ol.commentlist');

				var li = $('<li class="comment">');
				li.attr('id', 'li-comment-' + data.commentId);
				li.attr('style', 'display:none;');

				var article = $('<article>').addClass('comment');
				article.attr('id', 'comment-' + data.commentId);

				var footer = $('<footer>');
				var footerDiv1 = $('<div>').addClass('comment-author vcard');
				footerDiv1.append($('<img class="avatar avatar-40 photo avatar-default">').attr('width', 40).attr('src', data.gravatar));

				var cite = $('<cite class="fn">');
				if(data.website) {
					cite.append( $('<a class="url" rel="external nofollow">').attr('href', data.website).html(data.name) );
				} else {
					cite.html( data.name );
				}

				footerDiv1.append(cite);
				footerDiv1.append( $('<span class="says">').html(' says:') );

				var footerDiv2 = $('<div>').addClass('comment-meta commentmetadata');
				//TODO add the link with the time element with comment.data.pubDate
				var timeLink = $('<a>').attr('href', data.postUrl + '#comment-' + data.commentId);
				timeLink.append( $('<time>').html(data.pubDate) );
				footerDiv2.append(timeLink);


				var divReply = $('<div class="reply">');
				var replyLink = $('<a class="comment-reply-link">');
				replyLink.attr('aria-label', 'Reply to ' + data.name);
				replyLink.attr('onclick', data.replyClick);
				replyLink.attr('href', '?replytocom=' + data.commentId);
				replyLink.html('Reply');
				divReply.append(replyLink);

				footer.append(footerDiv1);
				footer.append(footerDiv2);

				article.append(footer);
				article.append($('<div class="comment-content">').html(data.comment));
				article.append(divReply);

				li.append(article);

				if(data.commentParent) {
					var parentLi = $('#li-comment-' + data.commentParent);
					var childrenUl = parentLi.children('ul.children');
					if(childrenUl.length == 0) {
						childrenUl = $('<ul class="children">');
						$('#respond').before(childrenUl);
					}
					childrenUl.prepend(li);
				} else {
					commentlist.append( li );
				}


				li.show(500);

			}
		});

		e.preventDefault();
	});


	function makeCommentLi(commentList, commentId, depth) {

	}

});

/*

            <ol class="commentlist">

                <li data-th-id="'li-comment-' + ${comment._id}" data-th-class="${comment.data.liClass}">
                    <article data-th-id="'comment-' + ${comment._id}" class="comment">
                        <footer>
                            <div class="comment-author vcard">
                                <img class="avatar avatar-40 photo avatar-default" width="40" height="40" data-th-src="${comment.data.gravatar}" src="http://0.gravatar.com/avatar/ad516503a11cd5ca435acc9bb6523536?s=40" alt=""/>
                                <cite class="fn">
                                    <a data-th-if="${comment.data.website}" class="url" rel="external nofollow" data-th-href="${comment.data.website}"
                                       href="#" data-th-text="${comment.data.name}">Mr WordPress</a>
                                    <span data-th-if="${!comment.data.website}" data-th-text="${comment.data.name}" data-th-remove="tag"></span>
                                </cite>
                                <span class="says">says:</span>
                            </div>
                            <div class="comment-meta commentmetadata"><!-- TODO: fix the datetime attribute -->
                                <a href="#" data-th-href="${portal.pageUrl({'_id=' + post.id})} + '#comment-' + ${comment._id}">
                                    <time datetime="2014-11-17T01:52:00+00:00" data-th-text="${comment.data.pubDate}"> November 17, 2014 at 01:52 </time>
                                </a>
                            </div>
                        </footer>
                        <div class="comment-content" data-th-utext="${portal.processHtml({'_value=' + comment.data.comment})}">
                            <p>
                                Hi, this is a comment.
                                <br/>
                                To delete a comment, just log in and view the post's comments. There you will have the option to edit or delete them.
                            </p>
                        </div>
                        <div class="reply">
                            <a class="comment-reply-link" aria-label="Reply to Mr WordPress" data-th-onclick="${comment.data.replyClick}"
                               onclick="return addComment.moveForm( 'comment-1', '1', 'respond', '1' )"
                               data-th-href="'?replytocom=' + ${comment._id } + '#respond'" href="/?p=1&amp;replytocom=1#respond">Reply</a>
                        </div>
                    </article>
                </li>

			</ol>

			*/
