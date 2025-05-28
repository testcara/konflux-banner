YAML_DIR := $(abspath ./clusters)
SCHEMA := $(abspath .github/schema/banner-schema.json)

.DEFAULT_GOAL := help

## help: Show this help message
help:
	@echo "** Available make commands **"
	@echo "help - Show available make commands"
	@grep -E '^##' $(MAKEFILE_LIST) | grep -v '^## help' | sed -e 's/^## //' -e 's/:/ -/' | sort

## check-prereqs: Verify required tools are installed
check-prereqs:
	@command -v make >/dev/null 2>&1 || { echo >&2 "❌ make is not installed. Please install it first."; exit 1; }
	@command -v go >/dev/null 2>&1 || { echo >&2 "❌ go is not installed. Please install Go."; exit 1; }
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

## build: Build the Go validator binary
build:
	cd .github/scripts/validator && go build -o validator validator.go

## validate: Run the Go validator binary
validate:
	.github/scripts/validator/validator $(SCHEMA) $(YAML_DIR)

## all: Run check-prereqs, check-ext, build, and validate
all: check-prereqs check-ext build validate