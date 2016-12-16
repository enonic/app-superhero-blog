# Superhero theme for Enonic XP

Create your very own Superhero theme blog to run on Enonic XP.

Theme by [automattic](https://profiles.wordpress.org/automattic/) for [WordPress](https://wordpress.com/themes/)

Adapted for [Enonic XP](https://github.com/enonic/xp) by Michael Lazell

## Installation

Open your XP installation's Applications tool and click the "Install" button in the toolbar. Find 
the Superhero Blog app in the Enonic Market tab and click "Install". 

Watch the [YouTube video](https://www.youtube.com/watch?v=YBOghlzIHDg) to understand the basics. 

This is still being developed and is mostly used for demos and experimenting with XP features. Use it at your own risk.

## Releases and Compatibility


| Version        | XP version |
| ------------- | ------------- |
| 1.7.0 | 6.7.0 |
| 1.6.0 | 6.7.0 |
| 1.5.0 | 6.5.0 |
| 1.4.0 | 6.5.0 |
| 1.3.0 | 6.4.1 |
| 1.2.0 | 6.3.0 |
| 1.1.0 | 6.2.0 |
| 1.0.0 | 6.0.0 |
| 0.1.0 | 5.3.0 |

### Change log

Version 1.7.0

* New faceted search
* Replaced custom profile/login functionality with standard idprovider check / usage (try it with the simple id provider app on Enonic Market for example)
* Replaced RSS menu item with RSS url mapping

Version 1.6.0

* Added application icon and descriptor
* Updated controller mappings for 6.7

Version 1.5.0

* Remove option to override the default posts folder from the Featured images part.
* Add ability to manually add posts to the featured images carousel in the part config. Manually added posts will override those chosen with the Slideshow checkbox and posts that have "Slideshwow" checked will not appear in the post list.
* Add three column layout

Version 1.4.0

* Now supports fragments
* Minor updates to import content
* Update gradle wrapper

Version 1.3.0

* Added author meta tag (used on CMS-projects)
* Added robots flag to prevent bad open directory listing
* Fixed clickable links in edit mode
* Fixed issue with content initializing
* Prevent deleted categories from breaking pages with posts that were using the category

Version 1.2.0

* Changed the app name to com.enonic.app.superhero. 
* Updated to use XP 6.3.0 libraries.
* Added path filters for post content to avoid selecting authors and categories from other sites.

Version 1.1.0

* Added x-data menu mixin to the Post content type so an individual post can be added as a page in the menu.
* Fixed a fieldset label for the Author content type.
* Changed the demo content "Owner" to the Super User and other minor changes to the way the demo content is imported. 
* Updated the gradle wrapper to version 2.8.
* Added a gradle.properties file.
* Added meta part with login link and configuration for adding other links.
* Added login page and "change password" page.
* Added custom error page.
* Replaced external JavaScript and CSS from CDN to local files. 
* Changed the way comment contents are named.
* Comments are now created with Ajax.
* Removed Google Tag code (to be replaced with the Google Tag Manager app)


## Requirements

Enonic XP must be installed and running. See the [XP installation documentation](http://xp.readthedocs.org/en/stable/getstarted/index.html).

Java 8 JDK update 40 or higher is required to build this app.

## Building and deploying

If you want to explore the code and build it yourself then feel free to clone or fork this repo. You can also rip the project with 
the XP [CLI tool](http://xp.readthedocs.org/en/stable/reference/toolbox/init-project.html).

Build this application from the command line. Go to the root of the project and enter:

    ./gradlew clean build

Then move the jar file from build/libs to your $XP_HOME/deploy folder, or upload it with the Applications tool. 

If the $XP_HOME environment variable is set then you can build and deploy with one step:

    ./gradlew deploy

## Documentation

Watch the [YouTube video](https://www.youtube.com/watch?v=YBOghlzIHDg). For help with this app, use the [Enonic Forum](https://discuss.enonic.com/).

* TODO: Finish the date meta data in various parts.
* TODO: Finish the dynamic classes and IDs in various parts.
* TODO: Make an admin comment manager page to approve or delete comments.
* TODO: Implement categories "Show hierarchy".
* TODO: Make it possible to have the post-list on a page other than the home page.
* TODO: Calendar part.
* TODO: Only allowed tags in comments.
