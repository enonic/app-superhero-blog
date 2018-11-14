( function( $ ) {

	 function pagePadding() {
		var headerHeight = $( '#masthead-wrap' ).height() - 1;
		$( '#page' ).css( 'padding-top', headerHeight );
	 }

	// Call pagePadding() after a page load completely.
	$( window ).on('load', pagePadding );

} )( jQuery );

$(document).ready(function(){

	// Ajax comments
	var form = $('#commentform');
	form.submit(function(e) {
		var formData = $(this).serialize();
		$this = $(this);

		$.ajax({
			type: 'POST',
			url: $('#commentform').data('posturl'),
			data: formData,
			dataType: 'json',
			encode: true
		}).done(function(data) {
			//handle errors and stuff.
			if (!data.success) {
				//console.log('Error!');
				$this.prev().text(data.error).fadeIn().delay(3000).fadeOut();
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
		}).error(function(xhr, status, error) {
			$this.prev().text(error).fadeIn().delay(3000).fadeOut();
		});

		e.preventDefault();
	});

});


$(function() {



	$('.search-result input[type=checkbox]').change(function (e) {
		e.preventDefault();

		var pageUrl = $('.search-result').attr('pageUrl')
		var urlParams = '';

		var searchTermInput = $('.search-result input.search-term');
		urlParams += '?s=' + searchTermInput.val();


		var checkboxes = $('.search-result input[type=checkbox]');
		$.each(checkboxes, function () {

			// see if checked
			if ($(this).is(':checked')) {

				var urlParamName = $(this).attr('name');
				var urlParamValue = $(this).val();

				// append value
				urlParams += '&' + urlParamName + '=' + urlParamValue;
			}
		});

		pageUrl += urlParams;

		window.location = pageUrl;

		//$('.search-result-content').load(pageUrl + ' .search-result-content');



	});
});



/*
$(function() {



	$('.search-result input[type=checkbox]').change(function (e) {
		e.preventDefault();

		var componentUrl = $('.search-result').attr('componenturl')
		var urlParams = '';

		var searchTermInput = $('.search-result input.search-term');
		urlParams += '&s=' + searchTermInput.val();


		var checkboxes = $('.search-result input[type=checkbox]');
		$.each(checkboxes, function () {

			// see if checked
			if ($(this).is(':checked')) {

				var urlParamName = $(this).attr('name');
				var urlParamValue = $(this).val();

				// append value
				urlParams += '&' + urlParamName + '=' + urlParamValue;
			}
		});

		componentUrl += '?ajax=true' + urlParams;


		$('.search-result-content').load(componentUrl + ' .search-result-content');



	});
});*/


