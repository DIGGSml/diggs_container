# DIGGS Validator - JavaScript Edition

A browser-based validation tool for DIGGS (Data Interchange for Geotechnical and Geoenvironmental Specialists) XML files. This tool allows users to validate, view, and extract data from DIGGS files directly in the browser without requiring server-side processing.

## Features

- **Client-side validation**: Process and validate DIGGS files entirely in the browser
- **Detailed error reporting**: Identify schema, schematron, and business rule violations
- **HTML reports**: Generate formatted validation reports
- **Offline capable**: Works without an internet connection once loaded
- **No installation required**: Just open the HTML file in a modern browser

## Technology Stack

- **SaxonJS**: Browser-based XSLT 3.0 processor
- **Bootstrap 5**: Responsive UI framework
- **JavaScript (ES6+)**: Core application logic
- **HTML5/CSS3**: Frontend interface
- **FileSaver.js**: Browser-based file saving

## Getting Started

1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. Upload a DIGGS XML file
4. Click "Validate" to check the file's conformance to DIGGS standards

## Project Structure

```
diggs-js-validator/
├── index.html          # Main application HTML
├── css/
│   └── style.css       # Custom styles
├── js/
│   └── app.js          # Application logic
├── xsl/
│   ├── modules/        # XSLT modules
│   │   ├── schema-check.xsl
│   │   ├── schematron-validation.xsl
│   │   ├── codeSpace-validation.xsl
│   │   ├── diggs-functions.xsl
│   │   ├── schema-validation.xsl
│   │   └── diggs-check.xsl
│   ├── validation-web.xsl        # Main validation stylesheet
│   ├── validation-report-html.xsl # HTML report generator
│   └── whiteList.xml             # Whitelist for external references
└── schemas/            # DIGGS XML schemas for validation
```

## Browser Compatibility

- Chrome 60+
- Firefox 52+
- Edge 79+
- Safari 10.1+

## Development

To extend or modify this tool:

1. Edit the XSLT files in the `xsl/` directory to change validation rules
2. Modify `app.js` to add new features or change behavior
3. Update `style.css` to customize the appearance

## Acknowledgements

This tool uses validation methods and XSL transformations developed by GeoSetta for the DIGGS standard.

## License

[MIT License](LICENSE)