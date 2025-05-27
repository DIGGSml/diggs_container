/**
 * Schema Loader Module
 * 
 * Handles loading and parsing XSD schema files for DIGGS XML validation and form generation.
 */

const SchemaLoader = (function() {
    // Cache for loaded schemas
    const schemaCache = new Map();
    
    // Base URL for schema files
    const SCHEMA_BASE_URL = 'https://diggsml.org/schema-dev/';
    
    /**
     * Loads a schema from a URL
     * @param {string} url - The URL of the schema to load
     * @returns {Promise<Object>} - The parsed schema
     */
    async function loadSchema(url) {
        if (schemaCache.has(url)) {
            console.log(`Using cached schema: ${url}`);
            return schemaCache.get(url);
        }
        
        console.log(`Loading schema: ${url}`);
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to load schema: ${response.status} ${response.statusText}`);
            }
            
            const schemaText = await response.text();
            const schema = xml2js(schemaText, {
                compact: false,
                spaces: 2,
                alwaysArray: true
            });
            
            schemaCache.set(url, schema);
            
            // Load included and imported schemas
            await loadReferencedSchemas(schema, new URL(url).pathname);
            
            return schema;
        } catch (error) {
            console.error(`Error loading schema ${url}:`, error);
            throw error;
        }
    }
    
    /**
     * Loads all schemas referenced by includes and imports
     * @param {Object} schema - The schema object
     * @param {string} baseUrl - The base URL for resolving relative paths
     */
    async function loadReferencedSchemas(schema, baseUrl) {
        const includes = findNodes(schema, 'include');
        const imports = findNodes(schema, 'import');
        
        const allReferences = [...includes, ...imports];
        
        for (const ref of allReferences) {
            if (ref.attributes && ref.attributes.schemaLocation) {
                const schemaLocation = ref.attributes.schemaLocation;
                const resolvedUrl = resolveUrl(schemaLocation, baseUrl);
                
                // Only load if not already in cache
                if (!schemaCache.has(resolvedUrl)) {
                    await loadSchema(resolvedUrl);
                }
            }
        }
    }
    
    /**
     * Finds all nodes with a specific name in the schema
     * @param {Object} obj - The object to search
     * @param {string} nodeName - The name of the nodes to find
     * @returns {Array} - The matching nodes
     */
    function findNodes(obj, nodeName) {
        const results = [];
        
        if (obj.elements) {
            for (const element of obj.elements) {
                if (element.name === nodeName || 
                    element.name && element.name.includes(':' + nodeName)) {
                    results.push(element);
                }
                
                if (element.elements) {
                    results.push(...findNodes(element, nodeName));
                }
            }
        }
        
        return results;
    }
    
    /**
     * Resolves a URL relative to a base URL
     * @param {string} url - The URL to resolve
     * @param {string} base - The base URL
     * @returns {string} - The resolved URL
     */
    function resolveUrl(url, base) {
        if (url.startsWith('http')) {
            return url;
        }
        
        const baseUrl = new URL(base, SCHEMA_BASE_URL);
        return new URL(url, baseUrl).toString();
    }
    
    /**
     * Finds a complex type definition in all loaded schemas
     * @param {string} typeName - The name of the type to find
     * @returns {Object|null} - The complex type definition, or null if not found
     */
    function findComplexType(typeName) {
        for (const schema of schemaCache.values()) {
            const complexTypes = findNodes(schema, 'complexType');
            
            for (const type of complexTypes) {
                if (type.attributes && type.attributes.name === typeName) {
                    return type;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Finds an element definition in all loaded schemas
     * @param {string} elementName - The name of the element to find
     * @returns {Object|null} - The element definition, or null if not found
     */
    function findElement(elementName) {
        for (const schema of schemaCache.values()) {
            const elements = findNodes(schema, 'element');
            
            for (const element of elements) {
                if (element.attributes && element.attributes.name === elementName) {
                    return element;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Loads the main DIGGS schema
     * @returns {Promise<Object>} - The main schema
     */
    async function loadMainSchema() {
        return loadSchema(SCHEMA_BASE_URL + 'Diggs.xsd');
    }
    
    return {
        loadSchema,
        loadMainSchema,
        findComplexType,
        findElement,
        getLoadedSchemas: () => Array.from(schemaCache.keys())
    };
})();