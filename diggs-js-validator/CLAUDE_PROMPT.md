# DIGGS JavaScript Validator Project - Claude Prompt

## Project Overview

I'm building a browser-based DIGGS XML validator that runs entirely client-side using JavaScript, SaxonJS for XSLT processing, and modern web technologies. The goal is to create a standalone HTML file that can validate, extract data from, and work with DIGGS (Data Interchange for Geotechnical and Geoenvironmental Specialists) XML files without requiring server-side processing.

## Current Status

I have a basic project structure with:
- HTML/CSS/JavaScript for the UI
- Key XSLT files for validation from an existing project
- README documentation

## What I Need Help With

I need your guidance and assistance with the following tasks:

1. **Fixing XSLT Path References**: The XSL files have relative path references that need to be updated to work in a client-side browser context.

2. **SaxonJS Integration**: Ensuring that SaxonJS correctly loads and processes the XSLT with proper error handling.

3. **Loading XML Schemas**: Determining the best approach to load and use XML schemas for validation in a browser context.

4. **Whitelist Implementation**: Implementing a secure way to handle the whitelist for schema locations.

5. **UI/UX Improvements**: Enhancing the user interface for better user experience, including:
   - Improved validation result formatting
   - Error location highlighting in XML
   - Filtering and sorting validation results
   - Tree view for XML structure

6. **Data Extraction Features**: Implementing data extraction capabilities from DIGGS files.

7. **Code Optimization**: Ensuring the application is efficient and performs well with large XML files.

8. **Browser Compatibility**: Troubleshooting cross-browser compatibility issues.

## Technical Questions

1. What's the best way to handle the XML schema references in a browser environment?

2. Can SaxonJS effectively validate against XML schemas, or should we use a different approach?

3. How should we structure the app to ensure it works offline once loaded?

4. What's the most effective error reporting format for DIGGS validation?

5. How can we implement progressive loading for large XML files?

## Context for Claude

The DIGGS standard is an XML-based format for exchanging geotechnical and geoenvironmental data. The validation process involves:

1. XML schema validation
2. Schematron-based business rule validation
3. Codelist validation (checking that certain values reference valid terms)

The existing validation system works with a combination of server-side XSLT processing using the Saxon-C library. We want to port this to a browser-based tool using SaxonJS.

## Files in This Project

- `index.html`: Main application HTML
- `css/style.css`: Custom styles
- `js/app.js`: Application logic
- `xsl/`: Directory containing XSLT stylesheets
  - `validation-web.xsl`: Main validation stylesheet
  - `validation-report-html.xsl`: HTML report generator
  - `modules/`: Directory with modular XSLT components
- `README.md`: Project documentation

## Initial Development Steps

I suggest we approach this project in phases:

1. Get basic validation working with SaxonJS
2. Implement HTML report generation
3. Add data extraction features
4. Enhance the UI and user experience
5. Optimize for performance and large files
6. Add offline capabilities and local storage support

Please help me work through these steps, starting with getting the basic validation working correctly using SaxonJS and the existing XSLT files.