<?xml version="1.0"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:portal="urn:enonic:xp:portal:1.0"
                xmlns:content="http://purl.org/rss/1.0/modules/content/"
                xmlns:wfw="http://wellformedweb.org/CommentAPI/"
                xmlns:dc="http://purl.org/dc/elements/1.1/"
                xmlns:atom="http://www.w3.org/2005/Atom"
                xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
                xmlns:slash="http://purl.org/rss/1.0/modules/slash/"
                exclude-result-prefixes="portal">

  <xsl:output method="xml" omit-xml-declaration="no"/>

  <xsl:template match="/">
    <!--<rss version="2.0">
      <channel>
        <title><xsl:value-of select="/root/site/displayName"/></title>
        &lt;!&ndash;<atom:link href="{portal:pageUrl(concat('_path=',root/content._path))}" rel="self" type="application/rss+xml"/>&ndash;&gt;
        &lt;!&ndash;<atom:link href="{portal:pageUrl(root/content/_path)}" rel="self" type="application/rss+xml"/>&ndash;&gt;
        <atom:link href="{root/pageUrl}" rel="self" type="application/rss+xml"/>
        <link>
          <xsl:value-of select="portal:pageUrl()"/>
        </link>
        <description><xsl:value-of select="/root/site/displayName"/></description>

        <xsl:apply-templates select="/root/fruits/item"/>
      </channel>
    </rss>-->

    <xsl:copy-of select="/"/>
  </xsl:template>

  <xsl:template match="/root/fruits/item">
    <item>
      <title>
        <xsl:value-of select="name"/>
      </title>
      <link>
        <xsl:value-of select="link"/>
      </link>
      <description>
        <xsl:value-of select="description"/>
      </description>
    </item>
  </xsl:template>

</xsl:stylesheet>