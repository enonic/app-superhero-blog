<xsl:stylesheet version="2.0" exclude-result-prefixes="#all"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:portal="urn:enonic:xp:portal:1.0">
  <xsl:output method="xml" omit-xml-declaration="yes" indent="yes"/>
  <xsl:strip-space elements="*"/>

  <!--<xsl:template match="/">
    <xsl:copy-of select="/"/>
  </xsl:template>-->

  <xsl:template match="/">
    <xsl:apply-templates select="/root/code" />
  </xsl:template>

  <!--<xsl:template match="img">
    <div>TESTING</div>
  </xsl:template>

  <xsl:template match="p">
    <div>TESTING</div>
  </xsl:template>-->
  <xsl:template match="code">
    <xsl:apply-templates select="figure" /> <!--This has no effect-->
    <xsl:apply-templates select="div" />  <!--This has no effect-->
    <xsl:apply-templates /> <!--Without this, nothing renders-->
  </xsl:template>

  <xsl:template match="div">
    <b>TESTING div</b>
    <xsl:apply-templates />
  </xsl:template>

  <xsl:template match="figure">
    <em>In Figure</em>
    <xsl:apply-templates select="img"/>
  </xsl:template>


  <xsl:template match="node()|@*">
    <xsl:copy>
      <xsl:apply-templates select="node()|@*"/>
    </xsl:copy>
  </xsl:template>

  <xsl:template match="img">
    <amp-img></amp-img>
    <xsl:element name="amp-img">
      <xsl:text>Testing</xsl:text>
    </xsl:element>
  </xsl:template>

</xsl:stylesheet>