/**
 * Main Application Module
 * 
 * Coordinates the XML parser, schema loader, and form builder components.
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const loadFileButton = document.getElementById('load-file');
    const saveFileButton = document.getElementById('save-file');
    const validateButton = document.getElementById('validate');
    const fileInput = document.getElementById('file-input');
    const treeView = document.getElementById('tree-view');
    const formContainer = document.getElementById('form-container');
    const xmlPreview = document.getElementById('xml-preview');
    
    // Current file name
    let currentFileName = '';
    
    // Event listeners
    loadFileButton.addEventListener('click', function() {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', function(event) {
        if (event.target.files.length > 0) {
            const file = event.target.files[0];
            loadXmlFile(file);
        }
    });
    
    saveFileButton.addEventListener('click', function() {
        saveXmlFile();
    });
    
    validateButton.addEventListener('click', function() {
        validateXml();
    });
    
    /**
     * Loads an XML file
     * @param {File} file - The file to load
     */
    async function loadXmlFile(file) {
        try {
            // Save the file name for later use
            currentFileName = file.name;
            
            // Parse the XML file
            const xmlObj = await XmlParser.parseXmlFile(file);
            
            // Build the tree view
            treeView.innerHTML = '';
            const tree = XmlParser.buildTree(xmlObj);
            FormBuilder.buildTreeView(tree, treeView, []);
            
            // Update the XML preview
            FormBuilder.refreshXmlPreview();
            
            // Enable buttons
            saveFileButton.disabled = false;
            validateButton.disabled = false;
            
            // Show success message
            showMessage('success', `File "${file.name}" loaded successfully.`);
            
            // Load the main DIGGS schema for validation and form generation
            loadSchema();
        } catch (error) {
            console.error('Error loading file:', error);
            showMessage('error', `Error loading file: ${error.message}`);
        }
    }
    
    /**
     * Loads the DIGGS schema
     */
    async function loadSchema() {
        try {
            showMessage('info', 'Loading DIGGS schema...');
            await SchemaLoader.loadMainSchema();
            showMessage('success', 'DIGGS schema loaded successfully.');
        } catch (error) {
            console.error('Error loading schema:', error);
            showMessage('error', `Error loading schema: ${error.message}`);
        }
    }
    
    /**
     * Saves the current XML to a file
     */
    function saveXmlFile() {
        try {
            // Generate the XML string
            const xmlString = XmlParser.generateXml();
            
            // Create a blob
            const blob = new Blob([xmlString], { type: 'application/xml' });
            
            // Create a download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = currentFileName || 'diggs_export.xml';
            
            // Trigger the download
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
            
            showMessage('success', `File "${a.download}" saved successfully.`);
        } catch (error) {
            console.error('Error saving file:', error);
            showMessage('error', `Error saving file: ${error.message}`);
        }
    }
    
    /**
     * Validates the current XML against the DIGGS schema
     */
    async function validateXml() {
        showMessage('info', 'Validation not yet implemented.');
        
        // TODO: Implement XML validation against the DIGGS schema
        // This would typically involve sending the XML to a server-side validator
        // or implementing a client-side validation mechanism
    }
    
    /**
     * Shows a message to the user
     * @param {string} type - The message type ('success', 'error', 'info')
     * @param {string} text - The message text
     */
    function showMessage(type, text) {
        // Check if a message container already exists
        let messageContainer = document.querySelector('.message-container');
        
        if (!messageContainer) {
            // Create a message container
            messageContainer = document.createElement('div');
            messageContainer.className = 'message-container';
            document.body.appendChild(messageContainer);
        }
        
        // Create the message element
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'close-button';
        closeButton.textContent = '×';
        closeButton.addEventListener('click', function() {
            message.remove();
        });
        
        message.appendChild(closeButton);
        
        // Add the message to the container
        messageContainer.appendChild(message);
        
        // Auto-remove the message after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(function() {
                message.remove();
            }, 5000);
        }
    }
    
    // Allow dropping files on the window
    window.addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    window.addEventListener('drop', function(e) {
        e.preventDefault();
        
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            
            // Only accept XML files
            if (file.type === 'application/xml' || file.name.endsWith('.xml')) {
                loadXmlFile(file);
            } else {
                showMessage('error', 'Only XML files are supported.');
            }
        }
    });
    
    // Initial message
    formContainer.innerHTML = `
        <div class="initial-message">
            <h3>Welcome to the DIGGS XML Editor</h3>
            <p>To get started, click the "Load XML File" button or drag and drop a DIGGS XML file here.</p>
        </div>
    `;
});