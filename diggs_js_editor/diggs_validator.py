import os
from pathlib import Path
from typing import Optional, Tuple, List
from lxml import etree
import logging
from datetime import datetime
import socket
import time
import sys

# Configure logging
def setup_logging():
    app_name = "xml_validator"
    hostname = socket.gethostname()
    timestamp = datetime.now().strftime('%Y%m%d')
    log_dir = Path("/tmp/api_logs")  # Use /tmp for logging to avoid permission issues
    
    # Create log directory if it doesn't exist
    if not log_dir.exists():
        os.makedirs(log_dir, exist_ok=True)
        
    log_file = log_dir / f"{app_name}_{hostname}_{timestamp}.log"
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger(app_name)

# Initialize logger
logger = setup_logging()

# Log app startup
logger.info("DIGGS Validator module loaded")

class XMLValidator:
    def __init__(self, schema_dir: str = "/home/streamlit/schema_backup", debug: bool = False):
        self.schema_dir = Path(schema_dir)
        if not self.schema_dir.exists():
            os.makedirs(self.schema_dir, exist_ok=True)
            logger.info(f"Created schema directory: {schema_dir}")

        self.debug_messages = []
        self.validation_errors = []
        self.schema_version = None
        self.schema_base_path = None
        self.debug = debug

    def get_appropriate_schema_path(self, xml_content: bytes) -> str:
        """Determine the appropriate schema path from XML content."""
        try:
            xml_doc = etree.fromstring(xml_content)
            default_ns = xml_doc.nsmap.get(None)

            # Map namespaces to schema paths
            schema_map = {
                "http://diggsml.org/schema-dev": str(self.schema_dir / "schema-dev" / "Diggs.xsd"),
                "http://diggsml.org/schemas/2.6": str(self.schema_dir / "schemas" / "2.6" / "Diggs.xsd"),
                "http://diggsml.org/schemas/2.5.a": str(self.schema_dir / "schemas" / "2.5.a" / "Complete.xsd"),
                "http://diggsml.org/schemas/2.1.a": str(self.schema_dir / "schemas" / "2.1.a" / "Complete.xsd"),
                "http://diggsml.org/schemas/2.0.b": str(self.schema_dir / "schemas" / "2.0.b" / "Complete.xsd"),
                "http://diggsml.org/schemas/2.0a": str(self.schema_dir / "schemas" / "2.0a" / "schemas" / "Complete.xsd")
            }

            schema_path = schema_map.get(default_ns)
            if not schema_path:
                logger.warning(f"Unsupported schema namespace: {default_ns}")
                raise ValueError(f"Unsupported schema namespace: {default_ns}")

            logger.info(f"Determined schema path: {schema_path}")
            return schema_path
        except Exception as e:
            logger.error(f"Could not determine schema version from XML: {str(e)}")
            raise ValueError(f"Could not determine schema version from XML: {str(e)}")

    def validate(self, xml_content: bytes) -> Tuple[bool, List[str], str]:
        """Validate XML content against its declared schema version."""
        messages = []
        try:
            # Determine schema path from XML content
            schema_path = self.get_appropriate_schema_path(xml_content)
            self._determine_schema_version(schema_path)

            xml_parser = etree.XMLParser(resolve_entities=True, no_network=False, remove_blank_text=True)
            xml_parser.resolvers.add(self._create_schema_resolver())

            xml_doc = etree.fromstring(xml_content, xml_parser)

            schema_parser = etree.XMLParser(resolve_entities=True, no_network=False)
            schema_parser.resolvers.add(self._create_schema_resolver())

            schema_doc = etree.parse(schema_path, schema_parser)
            schema = etree.XMLSchema(schema_doc)

            is_valid = schema.validate(xml_doc)

            if is_valid:
                version = "dev" if "schema-dev" in schema_path else next(
                    (ver for ver in ["2.6", "2.5.a", "2.1.a", "2.0.b", "2.0a"]
                    if ver in schema_path),
                    "unknown version"
                )
                messages.append(f"XML file is valid according to DIGGS {version} schema!")
                logger.info(f"XML validation successful for DIGGS {version} schema")
                return True, messages, schema_path
            else:
                for error in schema.error_log:
                    error_msg = f"Line {error.line}, Column {error.column}: {error.message}"
                    messages.append(error_msg)
                    logger.warning(f"Validation error: {error_msg}")
                return False, messages, schema_path

        except Exception as e:
            error_msg = f"Validation error: {str(e)}"
            messages.append(error_msg)
            logger.error(error_msg)
            return False, messages, ""

    def _log_debug(self, message: str):
        """Add debug message to internal log"""
        if self.debug:
            self.debug_messages.append(f"DEBUG: {message}")
            logger.debug(message)

    def _determine_schema_version(self, schema_path: str):
        """Determine schema version from path and set base paths."""
        path = Path(schema_path)
        if 'schema-dev' in str(path):
            self.schema_version = 'dev'
            self.schema_base_path = self.schema_dir / 'schema-dev'
        else:
            for version in ['2.6', '2.5.a', '2.1.a', '2.0.b', '2.0a']:
                if version in str(path):
                    self.schema_version = version
                    self.schema_base_path = self.schema_dir / 'schemas' / version
                    break

        self._log_debug(f"Determined schema version: {self.schema_version}")
        self._log_debug(f"Schema base path: {self.schema_base_path}")

    def _create_schema_resolver(self):
        """Create a custom resolver to handle schema locations from local backup."""
        class LocalResolver(etree.Resolver):
            def __init__(self, schema_dir, schema_version, schema_base_path, debug_callback):
                self.schema_dir = schema_dir
                self.schema_version = schema_version
                self.schema_base_path = schema_base_path
                self.cache = {}
                self._debug = debug_callback
                self.resolved_schemas = set()

            def resolve(self, system_url, public_id, context):
                self._debug(f"Attempting to resolve: {system_url}")
                self._debug(f"Context: {context}")
                if public_id:
                    self._debug(f"Public ID: {public_id}")

                if system_url in self.cache:
                    self._debug(f"Found in cache: {system_url}")
                    return self.cache[system_url]

                # Handle DIGGS schema URLs
                if 'diggsml.org' in system_url:
                    if 'schema-dev' in system_url:
                        base_path = self.schema_dir / 'schema-dev'
                    else:
                        version = '2.6'  # Default to 2.6 or detect from URL
                        base_path = self.schema_dir / 'schemas' / version

                    filename = os.path.basename(system_url)
                    local_path = base_path / filename

                    if local_path.exists():
                        self._debug(f"Found schema at: {local_path}")
                        result = self.resolve_filename(str(local_path), context)
                        self.cache[system_url] = result
                        self.resolved_schemas.add(filename)
                        return result

                # Handle relative paths for includes
                if context is not None and not system_url.startswith(('file://', 'http://', 'https://')):
                    context_dir = str(Path(str(context)).parent)
                    self._debug(f"Include context directory: {context_dir}")
                    full_path = os.path.join(context_dir, system_url)
                    self._debug(f"Trying include path: {full_path}")
                    if os.path.exists(full_path):
                        self._debug(f"Found include file at: {full_path}")
                        try:
                            with open(full_path, 'rb') as f:
                                content = f.read()
                                doc = etree.XML(content)

                                # Special handling for Kernel.xsd
                                if 'kernel.xsd' in full_path.lower():
                                    self._debug("Examining Kernel.xsd content:")
                                    for prefix, uri in doc.nsmap.items():
                                        self._debug(f"  {prefix}: {uri}")

                                    for elem in doc.iter():
                                        if (elem.tag.endswith('attribute') and
                                            elem.get('name') == 'howDetermined'):
                                            self._debug("Found howDetermined attribute definition:")
                                            for key, value in elem.attrib.items():
                                                self._debug(f"  {key}: {value}")
                                            parent = elem.getparent()
                                            if parent is not None:
                                                self._debug(f"  Parent element: {parent.tag}")
                                                self._debug(f"  Parent name: {parent.get('name', '')}")

                            result = self.resolve_filename(full_path, context)
                            self.cache[system_url] = result
                            self.resolved_schemas.add(os.path.basename(full_path))
                            return result
                        except Exception as e:
                            self._debug(f"Error processing include file: {str(e)}")

                # General schema resolution
                search_paths = []
                filename = os.path.basename(system_url)

                if self.schema_version == 'dev':
                    search_base = self.schema_dir / 'schema-dev'
                else:
                    search_base = self.schema_base_path

                for subdir in ['', 'core', 'base', 'infrastructure', 'measurement', 'project']:
                    search_paths.append(search_base / subdir / filename)

                for path in search_paths:
                    if path.exists():
                        self._debug(f"Found schema at: {path}")
                        result = self.resolve_filename(str(path), context)
                        self.cache[system_url] = result
                        self.resolved_schemas.add(filename)
                        return result

                self._debug(f"Failed to find schema for: {system_url}")
                return None

            def resolve_filename(self, filepath, context):
                self._debug(f"Resolving filename: {filepath}")
                return super().resolve_filename(filepath, context)

        return LocalResolver(self.schema_dir, self.schema_version, self.schema_base_path, self._log_debug)

# For testing purposes
if __name__ == '__main__':
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        if os.path.exists(file_path):
            with open(file_path, 'rb') as f:
                xml_content = f.read()
            
            validator = XMLValidator(debug=True)
            result, messages, schema_path = validator.validate(xml_content)
            
            print(f"Validation result: {'VALID' if result else 'INVALID'}")
            print(f"Schema path: {schema_path}")
            for msg in messages:
                print(msg)
        else:
            print(f"File not found: {file_path}")
    else:
        print("Please provide an XML file path to validate.")