# Superhero theme for Enonic XP

Create your very own Superhero theme blog to run on Enonic XP.

Theme by [automattic](https://profiles.wordpress.org/automattic/) for [WordPress](https://wordpress.com/themes/)

Adapted for [Enonic XP](https://github.com/enonic/xp) by Michael Lazell

You can download WordPress and Superhero and use MAMP to run it and see how it looks and works in WordPress.

## Work in progress

This is still being developed and is not ready for production yet.

## Building

Gradle is required to build the project. From the base of the project, enter ./gradlew in the terminal or on Windows, double-click the
gradlew.bat file.

Put the jar file from build/lib into the XP_HOME/deploy directory.

## Creating a site

If the content folder is empty then sample content will be imported automatically. If you delete this content to create your own then
follow the steps below to create the site.

- In the admin console, create a site and give it a name.
- Create folders called Authors, Categories, Comments and Posts.
- Create a Category and an Author content in their respective folders.
- Create a Post content in the Posts folder and add the Category and Author content.
- When the above steps are done, create a page template and add the 70-30 Layout.
- Add the "Header" and "Posts list" parts to the left side of the layout.
- Add the following parts to the right side of the layout: Search form, Recent posts, Recent comments, Archives, Categories and Tags.
- Make this page template support the Site content type.
- Create another page template called "Post show". Add the "Post single" part in the left instead of the "Posts list" and also
add the Comments part. Add the same parts from the previous step to the right column.
- Make the Post show template support the Post content type.

## Documentation

Comprehensive documentation for this module is being created.

* TODO: Write documentation and insert link
* TODO: Finish the date meta data in various parts when the CMS date bugs are worked out.
* TODO: Finish the dynamic classes and IDs in various parts.
* TODO: Create the Meta part with login/out and stuff.
* TODO: Finish the RSS page when the CDATA bug is fixed.
* TODO: Finish the comments part. (Reply to comment)
* TODO: Make a hidden comment manager page to approve or delete comments.
* TODO: Consider merging post-list and post-show into the same part. I had it this way to start with but it got quite complicated so I
separated them and now I think that maybe I should merge them back together.
* TODO: Implement categories "Show hierarchy".
