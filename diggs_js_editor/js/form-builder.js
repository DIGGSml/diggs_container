/**
 * Form Builder Module
 * 
 * Generates dynamic forms based on XSD schema for editing DIGGS XML elements.
 */

const FormBuilder = (function() {
    // Current form element
    let currentForm = null;
    
    // Current XML element path
    let currentElementPath = null;
    
    /**
     * Creates a form for editing an XML element
     * @param {Object} element - The XML element to edit
     * @param {Array} path - The path to the element
     * @param {Object} schema - The element's schema definition
     * @returns {HTMLElement} - The form element
     */
    function createForm(element, path, schema) {
        currentElementPath = path;
        
        const form = document.createElement('form');
        form.className = 'element-form';
        
        // Create a heading with the element name
        const heading = document.createElement('h3');
        heading.textContent = element.name || 'Unknown Element';
        form.appendChild(heading);
        
        // Add element attributes
        if (element.attributes) {
            const attributesFieldset = document.createElement('fieldset');
            const attributesLegend = document.createElement('legend');
            attributesLegend.textContent = 'Attributes';
            attributesFieldset.appendChild(attributesLegend);
            
            for (const [name, value] of Object.entries(element.attributes)) {
                // Skip namespace declarations
                if (name.startsWith('xmlns') || name === 'xsi:schemaLocation') {
                    continue;
                }
                
                const formGroup = document.createElement('div');
                formGroup.className = 'form-group';
                
                const label = document.createElement('label');
                label.textContent = name;
                label.setAttribute('for', `attr-${name}`);
                
                const input = document.createElement('input');
                input.type = 'text';
                input.id = `attr-${name}`;
                input.name = `attr-${name}`;
                input.value = value || '';
                input.dataset.attrName = name;
                
                input.addEventListener('change', function() {
                    updateAttribute(name, this.value);
                });
                
                formGroup.appendChild(label);
                formGroup.appendChild(input);
                attributesFieldset.appendChild(formGroup);
            }
            
            form.appendChild(attributesFieldset);
        }
        
        // Add text content if applicable
        let hasTextContent = false;
        
        if (element.elements) {
            for (const child of element.elements) {
                if (child.type === 'text') {
                    hasTextContent = true;
                    
                    const formGroup = document.createElement('div');
                    formGroup.className = 'form-group';
                    
                    const label = document.createElement('label');
                    label.textContent = 'Text Content';
                    label.setAttribute('for', 'element-text');
                    
                    const textarea = document.createElement('textarea');
                    textarea.id = 'element-text';
                    textarea.name = 'element-text';
                    textarea.value = child.text || '';
                    textarea.rows = 3;
                    
                    textarea.addEventListener('change', function() {
                        updateText(this.value);
                    });
                    
                    formGroup.appendChild(label);
                    formGroup.appendChild(textarea);
                    form.appendChild(formGroup);
                    
                    break;
                }
            }
        }
        
        // Add child elements section if the element has children
        if (element.elements && element.elements.some(child => child.type !== 'text')) {
            const childrenSection = document.createElement('div');
            childrenSection.className = 'children-section';
            
            const childrenHeading = document.createElement('h4');
            childrenHeading.textContent = 'Child Elements';
            childrenSection.appendChild(childrenHeading);
            
            const childrenDescription = document.createElement('p');
            childrenDescription.textContent = 'Select a child element in the tree view to edit it.';
            childrenSection.appendChild(childrenDescription);
            
            form.appendChild(childrenSection);
        }
        
        // Add "Add Child Element" button for elements that can have children
        if (schema && canAddChildren(schema)) {
            const possibleChildren = getPossibleChildren(schema);
            
            if (possibleChildren.length > 0) {
                const addSection = document.createElement('div');
                addSection.className = 'add-element-section';
                
                const addHeading = document.createElement('h4');
                addHeading.textContent = 'Add Child Element';
                addSection.appendChild(addHeading);
                
                const formGroup = document.createElement('div');
                formGroup.className = 'form-group';
                
                const label = document.createElement('label');
                label.textContent = 'Element Type';
                label.setAttribute('for', 'new-element-type');
                
                const select = document.createElement('select');
                select.id = 'new-element-type';
                select.name = 'new-element-type';
                
                for (const child of possibleChildren) {
                    const option = document.createElement('option');
                    option.value = child.name;
                    option.textContent = child.name;
                    select.appendChild(option);
                }
                
                const addButton = document.createElement('button');
                addButton.type = 'button';
                addButton.textContent = 'Add Element';
                addButton.className = 'add-element-button';
                
                addButton.addEventListener('click', function() {
                    const selectedType = select.value;
                    addChildElement(selectedType);
                });
                
                formGroup.appendChild(label);
                formGroup.appendChild(select);
                formGroup.appendChild(addButton);
                addSection.appendChild(formGroup);
                
                form.appendChild(addSection);
            }
        }
        
        // Add delete button
        if (path.length > 0) { // Don't allow deleting the root element
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.textContent = 'Delete Element';
            deleteButton.className = 'delete-element-button';
            
            deleteButton.addEventListener('click', function() {
                if (confirm(`Are you sure you want to delete this ${element.name} element?`)) {
                    deleteElement();
                }
            });
            
            form.appendChild(deleteButton);
        }
        
        currentForm = form;
        return form;
    }
    
    /**
     * Updates an attribute value
     * @param {string} name - The attribute name
     * @param {string} value - The new attribute value
     */
    function updateAttribute(name, value) {
        XmlParser.updateElement(currentElementPath, {
            attributes: { [name]: value }
        });
        
        refreshXmlPreview();
    }
    
    /**
     * Updates the text content of an element
     * @param {string} text - The new text content
     */
    function updateText(text) {
        XmlParser.updateElement(currentElementPath, { text });
        
        refreshXmlPreview();
    }
    
    /**
     * Adds a child element
     * @param {string} elementType - The type of element to add
     */
    function addChildElement(elementType) {
        // Create a basic new element
        const newElement = {
            type: 'element',
            name: elementType,
            attributes: {},
            elements: []
        };
        
        // Add the element to the XML
        const newPath = XmlParser.addElement(currentElementPath, newElement);
        
        // Refresh the tree view and XML preview
        refreshTreeView();
        refreshXmlPreview();
        
        // Select the new element
        selectElement(newPath);
    }
    
    /**
     * Deletes the current element
     */
    function deleteElement() {
        XmlParser.removeElement(currentElementPath);
        
        // Refresh the tree view and XML preview
        refreshTreeView();
        refreshXmlPreview();
        
        // Select the parent element
        const parentPath = currentElementPath.slice(0, -1);
        selectElement(parentPath);
    }
    
    /**
     * Refreshes the XML preview
     */
    function refreshXmlPreview() {
        const previewElement = document.getElementById('xml-preview');
        const xmlString = XmlParser.generateXml();
        
        // Apply syntax highlighting
        previewElement.innerHTML = highlightXml(xmlString);
    }
    
    /**
     * Refreshes the tree view
     */
    function refreshTreeView() {
        const treeView = document.getElementById('tree-view');
        const xmlObj = XmlParser.buildTree();
        
        // Clear the tree view
        treeView.innerHTML = '';
        
        // Rebuild the tree
        buildTreeView(xmlObj, treeView, []);
    }
    
    /**
     * Selects an element in the tree view
     * @param {Array} path - The path to the element
     */
    function selectElement(path) {
        // Find the element in the tree view
        const treeView = document.getElementById('tree-view');
        const element = findTreeElement(treeView, path);
        
        if (element) {
            // Deselect all elements
            const selected = treeView.querySelectorAll('.tree-node.selected');
            for (const node of selected) {
                node.classList.remove('selected');
            }
            
            // Select the element
            element.classList.add('selected');
            
            // Trigger the click event
            element.click();
        }
    }
    
    /**
     * Finds a tree element by path
     * @param {HTMLElement} treeView - The tree view element
     * @param {Array} path - The path to the element
     * @returns {HTMLElement|null} - The tree element, or null if not found
     */
    function findTreeElement(treeView, path) {
        let current = treeView;
        
        for (const index of path) {
            const children = current.querySelectorAll(':scope > .tree-node');
            
            if (index >= children.length) {
                return null;
            }
            
            current = children[index];
        }
        
        return current;
    }
    
    /**
     * Builds the tree view
     * @param {Array} nodes - The tree nodes
     * @param {HTMLElement} parent - The parent element
     * @param {Array} parentPath - The path to the parent element
     */
    function buildTreeView(nodes, parent, parentPath) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const path = [...parentPath, i];
            
            const treeNode = document.createElement('div');
            treeNode.className = 'tree-node';
            treeNode.dataset.path = path.join(',');
            
            // Create the node label
            const label = document.createElement('span');
            label.className = 'tree-node-label';
            label.textContent = node.name;
            
            // Add attribute preview if the element has attributes
            if (Object.keys(node.attributes).length > 0) {
                const attrPreview = document.createElement('span');
                attrPreview.className = 'attribute-preview';
                
                // Show ID or name attribute if available
                const idAttr = node.attributes.id || node.attributes['gml:id'];
                if (idAttr) {
                    attrPreview.textContent = ` id="${idAttr}"`;
                }
                
                label.appendChild(attrPreview);
            }
            
            treeNode.appendChild(label);
            
            // Add click handler
            treeNode.addEventListener('click', function(event) {
                // Prevent triggering parent click handlers
                event.stopPropagation();
                
                // Deselect all nodes
                const allNodes = document.querySelectorAll('.tree-node');
                for (const node of allNodes) {
                    node.classList.remove('selected');
                }
                
                // Select this node
                treeNode.classList.add('selected');
                
                // Edit the element
                editElement(path);
            });
            
            parent.appendChild(treeNode);
            
            // Add child elements if any
            if (node.children && node.children.length > 0) {
                const childContainer = document.createElement('div');
                childContainer.className = 'tree-children';
                treeNode.appendChild(childContainer);
                
                buildTreeView(node.children, childContainer, path);
            }
        }
    }
    
    /**
     * Edits an element
     * @param {Array} path - The path to the element
     */
    function editElement(path) {
        currentElementPath = path;
        
        const element = XmlParser.findElementByPath(path);
        
        if (!element) {
            console.error('Element not found:', path);
            return;
        }
        
        // Get the element's schema definition
        const schema = findSchemaForElement(element);
        
        // Create a form for editing the element
        const form = createForm(element, path, schema);
        
        // Update the edit panel
        const formContainer = document.getElementById('form-container');
        formContainer.innerHTML = '';
        formContainer.appendChild(form);
    }
    
    /**
     * Finds the schema definition for an element
     * @param {Object} element - The XML element
     * @returns {Object|null} - The schema definition, or null if not found
     */
    function findSchemaForElement(element) {
        if (!element || !element.name) {
            return null;
        }
        
        // Remove namespace prefix if present
        const name = element.name.includes(':')
            ? element.name.split(':')[1]
            : element.name;
        
        return SchemaLoader.findElement(name);
    }
    
    /**
     * Checks if an element can have children based on its schema
     * @param {Object} schema - The schema definition
     * @returns {boolean} - Whether the element can have children
     */
    function canAddChildren(schema) {
        // This is a simplified implementation. In a real application,
        // you would need to analyze the schema more thoroughly.
        return true;
    }
    
    /**
     * Gets the possible child elements for an element based on its schema
     * @param {Object} schema - The schema definition
     * @returns {Array} - The possible child elements
     */
    function getPossibleChildren(schema) {
        // This is a simplified implementation. In a real application,
        // you would extract this information from the schema.
        return [
            { name: 'gml:name' },
            { name: 'gml:description' },
            { name: 'internalIdentifier' },
            { name: 'remark' }
        ];
    }
    
    /**
     * Highlights XML syntax for display
     * @param {string} xml - The XML string
     * @returns {string} - The highlighted XML
     */
    function highlightXml(xml) {
        return xml
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/("[^"]*")/g, '<span class="attribute-value">$1</span>')
            .replace(/(&lt;[\/]?)([^\s&>]+)/g, '$1<span class="tag-name">$2</span>')
            .replace(/([^\s=]+)=(?=[^<]*&gt;)/g, '<span class="attribute-name">$1</span>=');
    }
    
    return {
        createForm,
        editElement,
        refreshXmlPreview,
        refreshTreeView
    };
})();