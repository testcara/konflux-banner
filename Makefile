# Directory containing YAMLs and schema
YAML_DIR := $(abspath ./clusters)
SCHEMA := .github/schema/banner-schema.json

# Validator entry point
VALIDATOR := .github/scripts/validator/index.js

# Default target
.DEFAULT_GOAL := help

## help: Show this help message
help:
	@echo "** Available make commands **"
	@echo "help - Show available make commands"
	@grep -E '^##' $(MAKEFILE_LIST) | grep -v '^## help' | sed -e 's/^## //' -e 's/:/ -/' | sort


## check-prereqs: Verify required tools are installed
check-prereqs:
	@command -v make >/dev/null 2>&1 || { echo >&2 "❌ make is not installed. Please install it first."; exit 1; }
	@command -v node >/dev/null 2>&1 || { echo >&2 "❌ node is not installed. Please install Node.js."; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo >&2 "❌ npm is not installed. Please install npm."; exit 1; }
	@echo "✅ All prerequisites are installed."

## check-ext: Check for .yml files and enforce .yaml usage
check-ext:
	@echo "🔍 Checking for '.yml' files..."
	@invalid_files=$$(find $(YAML_DIR) -type f -name "*.yml"); \
	if [ -n "$$invalid_files" ]; then \
		echo "❌ Found .yml files:"; \
		echo "$$invalid_files"; \
		exit 1; \
	else \
		echo "✅ No .yml files found."; \
	fi

## install: Install npm dependencies for the validator
install:
	cd .github/scripts/validator && npm install

## validate: Run the banner YAML validation script
validate:
	node $(VALIDATOR) $(YAML_DIR) $(SCHEMA)

## all: Run check-prereqs, check-ext, install, and validate
all: check-prereqs check-ext install validate
