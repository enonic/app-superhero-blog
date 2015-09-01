# Superhero theme for Enonic XP

Create your very own Superhero theme blog to run on Enonic XP.

Theme by [automattic](https://profiles.wordpress.org/automattic/) for [WordPress](https://wordpress.com/themes/)

Adapted for [Enonic XP](https://github.com/enonic/xp) by Michael Lazell

## Work in progress

This is still being developed and is not ready for production yet.

## Requirements

First, Enonic XP 6.0 must be installed and running. See the [XP installation documentation](http://xp.readthedocs.org/en/latest/getting-started/installation.html).

Gradle is required to build this project. Set the $XP_HOME environment variable and then, from the root of the project, enter "./gradlew deploy" in the terminal or "gradle clean deploy". On
Windows, double-click the gradlew.bat file.

If $XP_HOME is not set, use ".gradlew build" in the terminal and then move the generated jar file from build/lib into the $XP_INSTALL/home/deploy directory.

## Creating a site

If the content folder is empty then sample content will be imported automatically. If you delete this content to create your own then
follow the steps below to recreate the site.

- In the admin console, create a Site and give it a name. Add the Superhero app as a supported application.
- Create folders called Authors, Categories and Posts under your new site.
- Create a Category and an Author content in their respective folders.
- Create a Post content in the Posts folder and add the Category and Author content.
- When the above steps are done, create a page template using the Page controller, supporting content of type Site, and add the Layout called "Two columns".
- Add the "Posts list" part to the left region of the layout.
- Add the following parts to the right region of the layout: "Search form", "Recent posts", "Recent comments", Categories, "Monthly archive" and "Tag cloud".
- Create another page template called "Post show" using the same controller (Page). Make it support the content type Post. Add the layout "Two columns" and then add the "Post single" part on the left instead of the "Posts list". Add the same parts from the previous step to the right column.
- Done!

## Documentation

For help with this app, use the [Enonic Forum](https://discuss.enonic.com/).

* TODO: Finish the date meta data in various parts.
* TODO: Finish the dynamic classes and IDs in various parts.
* TODO: Create the Meta part with login/out and stuff.
* TODO: Make a hidden comment manager page to approve or delete comments.
* TODO: Make comments work with Ajax.
* TODO: Implement categories "Show hierarchy".
* TODO: Write documentation and insert link.
* TODO: Make it possible to have the post-list page not the home page.
* TODO: Calendar portlet.
* TODO: Only allowed tags in comments.
