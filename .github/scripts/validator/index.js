import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import sanitizeHtml from 'sanitize-html';
import Ajv from 'ajv';

// Get input arguments
const folderPath = process.argv[2];       // directory to validate
const schemaPath = process.argv[3];       // path to schema

if (!folderPath || !schemaPath) {
  console.error(chalk.red('❌ Missing arguments. Usage: node index.js <folderPath> <schemaPath>'));
  process.exit(1);
}

// Load and compile JSON schema
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });
const validateSchema = ajv.compile(schema);

/**
 * Validate the data structure using JSON Schema
 */
function validateWithSchema(data, file) {
  const valid = validateSchema(data);
  if (!valid) {
    console.error(chalk.red(`❌ Schema validation failed for ${file}:`));
    validateSchema.errors.forEach(err => {
      console.error(`  • ${err.instancePath} ${err.message}`);
    });
    return false;
  }
  return true;
}

/**
 * Validate content security in banner fields
 */
function validateContentSecurity(data, file) {
  let valid = true;

  if (data.Details) {
    const cleaned = sanitizeHtml(data.Details, {
      allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'li', 'br'],
      allowedAttributes: { a: ['href', 'title', 'target'] },
      allowedSchemes: ['http', 'https', 'mailto'],
    });
    if (cleaned !== data.Details) {
      console.error(chalk.red(`❌ Unsafe HTML content found in 'Details' field of ${file}`));
      valid = false;
    }
  }

  if (data.summary && /<.*?>/.test(data.summary)) {
    console.error(chalk.red(`❌ 'summary' field should not contain HTML tags in ${file}`));
    valid = false;
  }

  return valid;
}

/**
 * Main logic for validating all YAML files in a folder
 */
function validateYamlFiles() {
  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
  let hasError = false;

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    console.log(chalk.blue(`\n🔍 Validating ${file}...`));

    let banner;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      banner = yaml.parse(content);
    } catch (err) {
      console.error(chalk.red(`❌ YAML parse error in ${file}: ${err.message}`));
      hasError = true;
      continue;
    }

    const schemaOk = validateWithSchema(banner, file);
    const securityOk = validateContentSecurity(banner, file);

    if (schemaOk && securityOk) {
      console.log(chalk.green(`✅ ${file} passed all checks.`));
    } else {
      hasError = true;
    }
  }

  if (hasError) {
    console.error(chalk.red('\n🚫 Validation failed. Please fix the above issues.'));
    process.exit(1);
  } else {
    console.log(chalk.green('\n🎉 All files passed validation.'));
  }
}

validateYamlFiles();