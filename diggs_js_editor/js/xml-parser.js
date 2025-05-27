/**
 * XML Parser Module
 * 
 * Handles parsing, traversing, and modifying DIGGS XML files.
 */

const XmlParser = (function() {
    // Current XML document
    let currentDocument = null;
    
    // Current XML as JavaScript object
    let currentXmlObj = null;
    
    // Namespaces in the current document
    let namespaces = {};
    
    /**
     * Parses an XML string into a JavaScript object
     * @param {string} xmlString - The XML string to parse
     * @returns {Object} - The parsed XML as a JavaScript object
     */
    function parseXml(xmlString) {
        try {
            currentXmlObj = xml2js(xmlString, {
                compact: false,
                spaces: 2,
                alwaysArray: true,
                attributeNamePrefix: '',
                ignoreDeclaration: false
            });
            
            // Extract namespaces from the root element
            extractNamespaces(currentXmlObj);
            
            return currentXmlObj;
        } catch (error) {
            console.error('Error parsing XML:', error);
            throw error;
        }
    }
    
    /**
     * Extracts namespaces from the root element
     * @param {Object} xmlObj - The XML object
     */
    function extractNamespaces(xmlObj) {
        namespaces = {};
        
        if (xmlObj && xmlObj.elements && xmlObj.elements[0] && xmlObj.elements[0].attributes) {
            const attrs = xmlObj.elements[0].attributes;
            
            for (const key in attrs) {
                if (key.startsWith('xmlns:')) {
                    const prefix = key.replace('xmlns:', '');
                    namespaces[prefix] = attrs[key];
                } else if (key === 'xmlns') {
                    namespaces[''] = attrs[key];
                }
            }
        }
        
        console.log('Extracted namespaces:', namespaces);
    }
    
    /**
     * Parses an XML file
     * @param {File} file - The file to parse
     * @returns {Promise<Object>} - The parsed XML
     */
    function parseXmlFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(event) {
                try {
                    const xmlString = event.target.result;
                    const xmlObj = parseXml(xmlString);
                    resolve(xmlObj);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = function() {
                reject(new Error('Error reading file'));
            };
            
            reader.readAsText(file);
        });
    }
    
    /**
     * Generates an XML string from a JavaScript object
     * @param {Object} xmlObj - The XML object
     * @returns {string} - The XML string
     */
    function generateXml(xmlObj) {
        return js2xml(xmlObj || currentXmlObj, {
            compact: false,
            spaces: 2
        });
    }
    
    /**
     * Builds a tree representation of the XML for display
     * @param {Object} xmlObj - The XML object
     * @returns {Array} - The tree representation
     */
    function buildTree(xmlObj) {
        const tree = [];
        
        if (!xmlObj) {
            return tree;
        }
        
        if (xmlObj.elements) {
            for (const element of xmlObj.elements) {
                const node = {
                    id: generateId(),
                    name: element.name,
                    type: 'element',
                    attributes: element.attributes || {},
                    children: []
                };
                
                // Add text nodes
                if (element.elements) {
                    for (const child of element.elements) {
                        if (child.type === 'text') {
                            node.text = child.text;
                        } else {
                            node.children.push(...buildTree({ elements: [child] }));
                        }
                    }
                }
                
                tree.push(node);
            }
        }
        
        return tree;
    }
    
    /**
     * Generates a unique ID
     * @returns {string} - A unique ID
     */
    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Finds an element by path in the XML object
     * @param {Array} path - The path to the element
     * @param {Object} xmlObj - The XML object to search in
     * @returns {Object|null} - The element, or null if not found
     */
    function findElementByPath(path, xmlObj = currentXmlObj) {
        if (!xmlObj || !path || path.length === 0) {
            return null;
        }
        
        let current = xmlObj;
        
        for (const index of path) {
            if (!current.elements || !current.elements[index]) {
                return null;
            }
            
            current = current.elements[index];
        }
        
        return current;
    }
    
    /**
     * Updates an element's attributes or text
     * @param {Array} path - The path to the element
     * @param {Object} updates - The updates to apply
     */
    function updateElement(path, updates) {
        const element = findElementByPath(path);
        
        if (!element) {
            throw new Error('Element not found');
        }
        
        if (updates.attributes) {
            element.attributes = { ...element.attributes, ...updates.attributes };
        }
        
        if (updates.text !== undefined) {
            let textNode = null;
            
            if (element.elements) {
                for (let i = 0; i < element.elements.length; i++) {
                    if (element.elements[i].type === 'text') {
                        textNode = element.elements[i];
                        textNode.text = updates.text;
                        break;
                    }
                }
            }
            
            if (!textNode) {
                if (!element.elements) {
                    element.elements = [];
                }
                
                element.elements.push({
                    type: 'text',
                    text: updates.text
                });
            }
        }
    }
    
    /**
     * Adds a new element
     * @param {Array} parentPath - The path to the parent element
     * @param {Object} newElement - The new element to add
     * @returns {Array} - The path to the new element
     */
    function addElement(parentPath, newElement) {
        const parent = findElementByPath(parentPath);
        
        if (!parent) {
            throw new Error('Parent element not found');
        }
        
        if (!parent.elements) {
            parent.elements = [];
        }
        
        parent.elements.push(newElement);
        
        return [...parentPath, parent.elements.length - 1];
    }
    
    /**
     * Removes an element
     * @param {Array} path - The path to the element to remove
     */
    function removeElement(path) {
        if (!path || path.length === 0) {
            throw new Error('Invalid path');
        }
        
        const parentPath = path.slice(0, -1);
        const index = path[path.length - 1];
        
        const parent = findElementByPath(parentPath);
        
        if (!parent || !parent.elements) {
            throw new Error('Parent element not found');
        }
        
        parent.elements.splice(index, 1);
    }
    
    /**
     * Gets the namespaces in the current document
     * @returns {Object} - The namespaces
     */
    function getNamespaces() {
        return { ...namespaces };
    }
    
    return {
        parseXml,
        parseXmlFile,
        generateXml,
        buildTree,
        findElementByPath,
        updateElement,
        addElement,
        removeElement,
        getNamespaces
    };
})();