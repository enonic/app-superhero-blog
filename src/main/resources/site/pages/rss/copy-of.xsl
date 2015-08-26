<?xml version="1.0"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:portal="urn:enonic:xp:portal:1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    exclude-result-prefixes="#all">

  <xsl:output method="xml" omit-xml-declaration="no"/>

  <xsl:template match="/">
    <xsl:copy-of select="/"/>
  </xsl:template>

</xsl:stylesheet>