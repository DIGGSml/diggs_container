<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="3.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:map="http://www.w3.org/2005/xpath-functions/map"
    xmlns:diggs="http://diggsml.org/schema-dev"
    xmlns:gml="http://www.opengis.net/gml/3.2"
    exclude-result-prefixes="xs map diggs gml">
    
    
    <!-- Master stylesheet for DIGGS context validation -->
    
    <!-- Output method -->
    <xsl:output method="xml" indent="yes"/>
    
    <!-- Parameters -->
    <xsl:param name="whiteListFile" select="'whiteList.xml'"/>
    
    <!-- Global variables -->
    <xsl:variable name="whiteList" select="if (doc-available($whiteListFile)) then doc($whiteListFile) else ()"/>
    
    <!-- Store the original XML document -->
    <xsl:variable name="originalXml" select="/"/>
    
    <!-- Convert the XML to a string -->
    <xsl:variable name="originalXmlString">
        <xsl:value-of select="serialize($originalXml)"/>
    </xsl:variable>
    
    <!-- Import function module first -->
    <xsl:import href="https://diggsml.org/def/validation/modules/diggs-functions.xsl"/>
    
    <!-- Initialize whitelist (this call is preserved but not actually needed) -->
    <xsl:variable name="_" select="diggs:setWhiteList($whiteList)"/>
    
    <!-- Import DIGGS structure check module -->
    <xsl:import href="https://diggsml.org/def/validation/modules/diggs-check.xsl"/>
    
    <!-- Import schema validation module -->
    <xsl:import href="https://diggsml.org/def/validation/modules/schema-check.xsl"/>
    
    <!-- Import codeSpace validation module -->
    <xsl:import href="https://diggsml.org/def/validation/modules/codeSpace-validation.xsl"/>
    
    <!-- Import other modules here once they are developed -->
    
    <!-- Main template -->
    <xsl:template match="/">
        <validationReport>
            <timestamp><xsl:value-of select="current-dateTime()"/></timestamp>
            <!-- In browser context, document-uri(/) returns empty, so use a fallback -->
            <fileName><xsl:value-of select="if (document-uri(/) != '') then tokenize(document-uri(/), '/')[last()] else 'uploaded-file.xml'"/></fileName>
            <originalXml><xsl:value-of select="$originalXmlString"/></originalXml>
            
            <!-- Run DIGGS structure check first -->
            <xsl:variable name="diggsCheckResults">
                <xsl:call-template name="diggsCheck"/>
            </xsl:variable>
            
            <!-- Include DIGGS structure check results in the report -->
            <xsl:copy-of select="$diggsCheckResults"/>
            
            <!-- Only proceed with other validations if DIGGS structure check allows continuation -->
            <xsl:if test="$diggsCheckResults/messageSet/continuable = 'true'">
                
                <!-- Run schema validation, passing the whitelist -->
                <xsl:variable name="schemaCheckResults">
                    <xsl:call-template name="schemaCheck">
                        <xsl:with-param name="whiteList" select="$whiteList"/>
                    </xsl:call-template>
                </xsl:variable>
                
                <!-- Include schema validation results in the report -->
                <xsl:copy-of select="$schemaCheckResults"/>
                
                <!-- Only proceed with other validations if schema validation allows continuation -->
                <xsl:if test="$schemaCheckResults/messageSet/continuable = 'true'">
                    
                    <!-- Run codeSpace validation, passing the whitelist -->
                    <xsl:call-template name="codeSpaceValidation">
                        <xsl:with-param name="whiteList" select="$whiteList"/>
                    </xsl:call-template>
                    
                    <!-- Other validation modules will be called here as they are developed -->
                </xsl:if>
            </xsl:if>
        </validationReport>
    </xsl:template>
</xsl:stylesheet>