/**
 * DIGGS Validator - JavaScript Edition
 * A browser-based validation tool for DIGGS XML files
 */

// Global variables
let currentXmlFile = null;
let currentXmlContent = null;
let validationResult = null;
let htmlReport = null;

// DOM Elements
const xmlFileInput = document.getElementById('xmlFileInput');
const validateButton = document.getElementById('validateButton');
const validationResultSection = document.getElementById('validationResultSection');
const validationResultContainer = document.getElementById('validationResultContainer');
const validationStatus = document.getElementById('validationStatus');
const downloadReportButton = document.getElementById('downloadReportButton');
const fileDetailsSection = document.getElementById('fileDetailsSection');
const fileDetailsContainer = document.getElementById('fileDetailsContainer');
const extractButton = document.getElementById('extractButton');

// Event listeners
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    // Setup event listeners
    xmlFileInput.addEventListener('change', handleFileSelection);
    validateButton.addEventListener('click', validateXmlFile);
    downloadReportButton.addEventListener('click', downloadValidationReport);
    extractButton.addEventListener('click', extractDataFromFile);

    // Check if SaxonJS is available
    if (typeof SaxonJS === 'undefined') {
        showError('SaxonJS library is not loaded. Please check your internet connection.');
    }

    // Initialize with preloaded stylesheets if available
    preloadXsltStylesheets();
}

// Preload the compiled SEF stylesheets to improve performance
let validationStylesheet = null;
let reportStylesheet = null;

function preloadXsltStylesheets() {
    console.log('Preloading compiled SEF stylesheets...');
    
    // Load the main validation SEF
    fetch('../diggs-validation.sef.json')
        .then(response => response.json())
        .then(sef => {
            validationStylesheet = sef;
            console.log('Validation SEF loaded');
        })
        .catch(error => {
            console.error('Error loading validation SEF:', error);
        });
    
    // Load the HTML report SEF
    fetch('../validation-report-html.sef.json')
        .then(response => response.json())
        .then(sef => {
            reportStylesheet = sef;
            console.log('Report SEF loaded');
        })
        .catch(error => {
            console.error('Error loading report SEF:', error);
        });
}

function handleFileSelection(event) {
    const file = event.target.files[0];
    if (!file) {
        validateButton.disabled = true;
        return;
    }

    currentXmlFile = file;
    validateButton.disabled = false;
    
    // Hide previous results
    validationResultSection.style.display = 'none';
    fileDetailsSection.style.display = 'none';
    
    // Show basic file info
    const fileInfo = `
        <div class="mb-3">
            <strong>File:</strong> ${file.name}<br>
            <strong>Size:</strong> ${(file.size / 1024).toFixed(2)} KB<br>
            <strong>Type:</strong> ${file.type || 'text/xml'}
        </div>
    `;
    fileDetailsContainer.innerHTML = fileInfo;
    fileDetailsSection.style.display = 'block';
}

function validateXmlFile() {
    if (!currentXmlFile) {
        showError('Please select a file first.');
        return;
    }
    
    if (!validationStylesheet || !reportStylesheet) {
        showError('SEF stylesheets are still loading. Please try again in a moment.');
        return;
    }

    // Show loading state
    validationResultSection.style.display = 'block';
    validationResultContainer.innerHTML = `
        <div class="text-center my-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Validating...</span>
            </div>
            <p class="mt-3">Validating DIGGS file...</p>
        </div>
    `;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const xmlContent = e.target.result;
        currentXmlContent = xmlContent;
        
        try {
            // Execute validation using Saxon-JS
            executeValidation(xmlContent);
        } catch (error) {
            showError(`Validation error: ${error.message}`);
        }
    };
    
    reader.onerror = function() {
        showError('Error reading the file');
    };
    
    reader.readAsText(currentXmlFile);
}

function executeValidation(xmlContent) {
    console.log('Starting validation...');
    console.log('Validation stylesheet type:', typeof validationStylesheet);
    console.log('Validation stylesheet keys:', validationStylesheet ? Object.keys(validationStylesheet).slice(0, 5) : 'null');
    
    const startTime = performance.now();
    
    try {
        // First transform: Validate the XML using the validation SEF
        const xmlResult = SaxonJS.transform({
            stylesheetInternal: validationStylesheet,
            sourceText: xmlContent,
            destination: 'serialized',
            stylesheetParams: {
                'useHttps': 'true',
                'schemaBaseUrl': 'https://diggsml.org/schemas/2.6/'
            }
        }).principalResult;
        
        console.log('First transform result type:', typeof xmlResult);
        console.log('First transform result preview:', xmlResult.substring ? xmlResult.substring(0, 200) : xmlResult);
        
        // Second transform: Convert the XML result to HTML for display
        const htmlResult = SaxonJS.transform({
            stylesheetInternal: reportStylesheet,
            sourceText: xmlResult,
            destination: 'serialized'
        }).principalResult;
        
        // Store results for later use
        validationResult = xmlResult;
        htmlReport = htmlResult;
        
        // Check if validation passed (a simple heuristic, may need adjustment)
        const isValid = xmlResult.includes('valid="true"') || xmlResult.includes('<r>valid</r>');
        
        // Display results
        displayValidationResults(htmlResult, isValid);
        
        const endTime = performance.now();
        console.log(`Validation completed in ${(endTime - startTime).toFixed(2)} ms`);
    } catch (error) {
        console.error('Validation transformation error:', error);
        showError(`Validation failed: ${error.message}`);
    }
}

function displayValidationResults(htmlResult, isValid) {
    // Update status
    if (isValid) {
        validationStatus.innerHTML = `
            <span class="validation-success">
                <i class="bi bi-check-circle-fill"></i> File is valid
            </span>
        `;
    } else {
        validationStatus.innerHTML = `
            <span class="validation-failure">
                <i class="bi bi-exclamation-triangle-fill"></i> Validation failed
            </span>
        `;
    }
    
    // Display the HTML report
    validationResultContainer.innerHTML = htmlResult;
    
    // Enable download button
    downloadReportButton.disabled = false;
}

function downloadValidationReport() {
    if (!htmlReport) {
        showError('No validation report available to download.');
        return;
    }
    
    const blob = new Blob([htmlReport], { type: 'text/html;charset=utf-8' });
    const filename = `DIGGS_validation_report_${formatDate(new Date())}.html`;
    
    saveAs(blob, filename);
}

function extractDataFromFile() {
    if (!currentXmlContent) {
        showError('No file content available for extraction.');
        return;
    }
    
    // This is a placeholder for more sophisticated extraction
    // In a real implementation, you might use XSLT to extract specific parts
    // or create JSON structures from the XML data
    
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(currentXmlContent, "text/xml");
        
        // Simple extraction example
        const summary = {
            rootElement: xmlDoc.documentElement.nodeName,
            namespace: xmlDoc.documentElement.namespaceURI || 'None',
            childElements: Array.from(xmlDoc.documentElement.childNodes)
                .filter(node => node.nodeType === 1)
                .map(node => node.nodeName),
            totalElements: xmlDoc.getElementsByTagName("*").length
        };
        
        // Display the summary
        fileDetailsContainer.innerHTML = `
            <div class="mb-3">
                <strong>File:</strong> ${currentXmlFile.name}<br>
                <strong>Size:</strong> ${(currentXmlFile.size / 1024).toFixed(2)} KB<br>
                <strong>Type:</strong> ${currentXmlFile.type || 'text/xml'}
            </div>
            <div class="card">
                <div class="card-header">
                    <h6>Structure Summary</h6>
                </div>
                <div class="card-body">
                    <p><strong>Root Element:</strong> ${summary.rootElement}</p>
                    <p><strong>Namespace:</strong> ${summary.namespace}</p>
                    <p><strong>Total Elements:</strong> ${summary.totalElements}</p>
                    <p><strong>Top-level Elements:</strong></p>
                    <ul>
                        ${summary.childElements.map(name => `<li>${name}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    } catch (error) {
        showError(`Error extracting data: ${error.message}`);
    }
}

// Utility functions
function showError(message) {
    validationResultContainer.innerHTML = `
        <div class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle-fill"></i> ${message}
        </div>
    `;
    validationResultSection.style.display = 'block';
}

function formatDate(date) {
    return date.toISOString().split('T')[0].replace(/-/g, '');
}