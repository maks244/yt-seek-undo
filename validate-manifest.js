#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function validateManifest() {
  console.log('Validating manifest.json...\n');
  
  let hasErrors = false;
  let hasWarnings = false;

  const manifestPath = path.join(__dirname, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('Error: manifest.json not found');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  if (manifest.manifest_version !== 3) {
    console.warn('Warning: Using Manifest V2');
    hasWarnings = true;
  } else {
    console.log('Manifest V3 detected');
  }

  const requiredFields = ['name', 'version', 'description'];
  requiredFields.forEach(field => {
    if (!manifest[field]) {
      console.error(`Error: Missing required field: ${field}`);
      hasErrors = true;
    }
  });

  if (manifest.browser_specific_settings?.gecko) {
    console.log('Firefox settings found');
    if (!manifest.browser_specific_settings.gecko.id) {
      console.error('Error: Firefox extension ID missing');
      hasErrors = true;
    }
    if (!manifest.browser_specific_settings.gecko.strict_min_version) {
      console.warn('Warning: Firefox minimum version not specified');
      hasWarnings = true;
    }
  } else {
    console.warn('Warning: No Firefox-specific settings');
    hasWarnings = true;
  }

  if (manifest.content_scripts) {
    manifest.content_scripts.forEach((script, index) => {
      if (script.js && script.js[0] !== 'browser-polyfill.js') {
        console.warn(`Warning: Content script ${index} should load polyfill first`);
        hasWarnings = true;
      } else if (script.js && script.js[0] === 'browser-polyfill.js') {
        console.log(`Content script ${index} includes polyfill`);
      }
    });
  }

  if (manifest.background) {
    if (manifest.background.service_worker) {
      console.log('Service worker detected');
    } else if (manifest.background.scripts) {
      console.log('Background scripts detected');
    }
  }

  if (manifest.permissions) {
    console.log(`Permissions: ${manifest.permissions.join(', ')}`);
  }

  if (manifest.host_permissions) {
    console.log(`Host permissions: ${manifest.host_permissions.join(', ')}`);
  }

  if (manifest.commands) {
    console.log(`Commands: ${Object.keys(manifest.commands).length}`);
  }

  if (manifest.options_page || manifest.options_ui) {
    console.log('Options page configured');
  }

  console.log('\n' + '-'.repeat(40));
  if (hasErrors) {
    console.error('Validation failed');
    process.exit(1);
  } else if (hasWarnings) {
    console.warn('Validation passed with warnings');
  } else {
    console.log('Validation passed');
  }
}

try {
  validateManifest();
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
