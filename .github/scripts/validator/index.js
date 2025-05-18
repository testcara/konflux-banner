import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import sanitizeHtml from 'sanitize-html';
import Ajv from 'ajv';

// Get input arguments
const folderPath = process.argv[2];
const schemaPath = process.argv[3];

if (!folderPath || !schemaPath) {
   console.error(chalk.red('❌ Missing arguments. Usage: node index.js <folderPath> <schemaPath>'));
   process.exit(1);
}

// Load and compile JSON schema
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: true, formats: { 'date-time': true } });
const validateSchema = ajv.compile(schema);

/**
 * Get all files ends with specific extension
 */
function findAllFilesWithExtension (dir, format) {
   let results = [];
   const entries = fs.readdirSync(dir, { withFileTypes: true });
   console.log(entries.length);

   for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      //console.log(fullPath)
      console.log(entry.name);
      if (entry.isDirectory()) {
         results = results.concat(findAllFilesWithExtension(fullPath, format));
         console.log(results);
      } else if (entry.isFile() && entry.name.endsWith(format)) {
         console.log(results);
         results.push(fullPath);
      }
   }

   return results;
}

/**
 * Validate the data structure using JSON Schema
 */
function validateWithSchema (data, file) {
   console.log(chalk.yellow('🧪 Validating schema...'));
   const valid = validateSchema(data);
   if (!valid) {
      console.error(chalk.red(`❌ Schema validation failed for ${file}:`));
      validateSchema.errors.forEach(err => {
         console.error(`  • ${err.instancePath} ${err.message}`);
      });
      return false;
   }
   console.log(chalk.green('✅ Schema validation passed.'));
   return true;
}

/**
 * Validate content security in banner fields
 */
function validateContentSecurity (data, file) {
   console.log(chalk.yellow('🛡️  Validating HTML content security...'));
   let valid = true;

   if (data.details) {
      const cleaned = sanitizeHtml(data.details, {
         allowedTags: [ 'b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'li', 'br' ],
         allowedAttributes: { a: [ 'href', 'title', 'target' ] },
         allowedSchemes: [ 'http', 'https', 'mailto' ]
      });
      if (cleaned !== data.details) {
         console.error(chalk.red(`❌ Unsafe HTML content found in 'details' field of ${file}`));
         valid = false;
      }
   }

   if (data.summary && /<.*?>/.test(data.summary)) {
      console.error(chalk.red(`❌ 'summary' field should not contain HTML tags in ${file}`));
      valid = false;
   }

   if (valid) {
      console.log(chalk.green('✅ Content security validation passed.'));
   }

   return valid;
}

/**
 * Validate empty fields for optional strings
 */
function validateEmptyStrings (data, file) {
   console.log(chalk.yellow('🔍 Checking for empty or null optional fields...'));
   const checkFields = [ 'start', 'end' ];
   let valid = true;

   for (const field of checkFields) {
      if (field in data && (data[field] === null || data[field] === '')) {
         console.error(chalk.red(`❌ Field '${field}' in ${file} is empty but should be a valid date-time string.`));
         valid = false;
      }
   }

   if (valid) {
      console.log(chalk.green('✅ Optional field check passed.'));
   }

   return valid;
}

/**
 * Main logic for validating all YAML files in a folder
 */
function validateYamlFiles () {
   console.log(chalk.cyan(`📁 Scanning directory: ${folderPath}`));
   const yamlfiles = findAllFilesWithExtension(folderPath, '.yaml');
   const ymlFiles = findAllFilesWithExtension(folderPath, '.yml');
   console.log(yamlfiles);

   if (ymlFiles.length === 0) {
      console.log(chalk.green('⚠️  No .yml files found.'));
   }

   if (yamlfiles.length === 0) {
      console.log(chalk.yellow('⚠️  No YAML yaml files found.'));
      return;
   } else {
      console.log(chalk.green(`⚠️  Found ${yamlfiles.length} yaml files.`));
   }

   let hasError = false;

   for (const filePath of yamlfiles) {
      const file = path.basename(filePath);
      console.log(chalk.blue(`\n🔍 Validating file: ${file}`));

      let data;
      try {
         const content = fs.readFileSync(filePath, 'utf8');
         data = yaml.parse(content);
      } catch (err) {
         console.error(chalk.red(`❌ YAML parse error in ${file}: ${err.message}`));
         hasError = true;
         continue;
      }

      const schemaOk = validateWithSchema(data, file);
      const securityOk = validateContentSecurity(data, file);
      const emptyOk = validateEmptyStrings(data, file);

      if (schemaOk && securityOk && emptyOk) {
         console.log(chalk.green(`✅ ${file} passed all checks.`));
      } else {
         console.error(chalk.red(`❌ ${file} failed validation.`));
         hasError = true;
      }
   }

   if (hasError) {
      console.error(chalk.red('\n🚫 Validation failed. Please fix the above issues.'));
      process.exit(1);
   } else {
      console.log(chalk.green('\n🎉 All YAML files passed validation.'));
   }
}

validateYamlFiles();
