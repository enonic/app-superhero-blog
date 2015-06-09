( function( $ ) {

	 function pagePadding() {
		var headerHeight = $( '#masthead-wrap' ).height() - 1;
		$( '#page' ).css( 'padding-top', headerHeight );
	 }

	// Call pagePadding() after a page load completely.
	$( window ).load( pagePadding );

	/*$('.comment-reply-link').click( function(e) {
	    console.log('clicked');
	    e.preventDefault();
	});*/

} )( jQuery );