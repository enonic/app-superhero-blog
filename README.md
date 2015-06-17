# Superhero theme for Enonic XP

Create your very own Superhero theme blog to run on Enonic XP.

Theme by [automattic](https://profiles.wordpress.org/automattic/) for [WordPress](https://wordpress.com/themes/)

Adapted for [Enonic XP](https://github.com/enonic/xp) by Michael Lazell

## Work in progress

This is still being developed and is not ready for production yet.

## Requirements

First, Enonic XP must be installed and running. See the [XP installation documentation](https://enonic.com/docs/latest/#installing).

Gradle is required to build this project. From the base of the project, enter "./gradlew" in the terminal or "gradle clean build". On
Windows, double-click the gradlew.bat file.

Move the generated jar file from build/lib into the $XP_HOME/deploy directory.

## Creating a site

If the content folder is empty then sample content will be imported automatically. If you delete this content to create your own then
follow the steps below to create the site.

- In the admin console, create a Site and give it a name. Make it support your new module.
- Create folders called Authors, Categories and Posts under your new site.
- Create a Category and an Author content in their respective folders.
- Create a Post content in the Posts folder and add the Category and Author content.
- When the above steps are done, create a page template using the Page controller, supporting content of type Site, and add the Layout called "Two columns".
- Add the "Posts list" part to the left side of the layout.
- Add the following parts to the right side of the layout: "Search form", "Recent posts", "Recent comments", Categories, "Monthly archive" and "Tag cloud".
- Create another page template called "Post show" using the same controller (Page). Make it support the content type Post. Add the layout "Two columns" and then add the "Post single" part on the left instead of the "Posts list". Add the same parts from the previous step to the right column.
- Done!

## Documentation

Comprehensive documentation for this module is being created.

* TODO: Finish the date meta data in various parts when the CMS date bugs are worked out.
* TODO: Finish the dynamic classes and IDs in various parts.
* TODO: Create the Meta part with login/out and stuff.
* TODO: Finish the RSS page when the CDATA bug is fixed.
* TODO: Make a hidden comment manager page to approve or delete comments.
* TODO: Implement categories "Show hierarchy".
* TODO: Write documentation and insert link
* TODO: Make it possible to have the post-list page not the home page.
* TODO: Calendar portlet
* TODO: Only allowed tags in comments.
