YAML_DIR := $(abspath ./clusters)
DEPLOY_DIR := $(abspath ./deploy)
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
	@command -v kustomize >/dev/null 2>&1 || { echo >&2 "❌ kustomize is not installed. Please install kustomize."; exit 1; }
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

## check-symlinks: Verify that all symlinks in clusters point to files under deploy
## check-symlinks: Verify all .yaml files in clusters are symlinks pointing into deploy
check-symlinks:
	@echo "🔍 Checking symlinks in $(YAML_DIR)..."
	@bad_links=0; \
	for file in $$(find $(YAML_DIR) -name "*.yaml"); do \
		if [ ! -L "$$file" ]; then \
			echo "❌ $$file is not a symlink of banner-content.yaml under ${DEPLOY_DIR}."; \
			bad_links=1; \
			continue; \
		fi; \
		target=$$(readlink "$$file"); \
		abs_target=$$(python3 -c "import os; print(os.path.realpath(os.path.join('$$file', '..', '$$target')))"); \
		if ! echo "$$abs_target" | grep -q "^$(DEPLOY_DIR)"; then \
			echo "❌ Symlink $$file points outside $(DEPLOY_DIR): $$abs_target"; \
			bad_links=1; \
		fi; \
	done; \
	if [ $$bad_links -eq 1 ]; then \
		exit 1; \
	else \
		echo "✅ All .yaml files are symlinks pointing into $(DEPLOY_DIR)."; \
	fi

## build: Build the Go validator binary
build:
	cd .github/scripts/validator && go build -o validator validator.go

## validate: Run the Go validator binary
validate:
	.github/scripts/validator/validator $(SCHEMA) $(YAML_DIR)

## kustomize-validate: Run kustomize build on all overlays under deploy
kustomize-validate:
	@echo "🔍 Validating kustomize builds under $(DEPLOY_DIR)..."
	@fail=0; \
	for overlay in $$(find $(DEPLOY_DIR) -mindepth 2 -maxdepth 2 -type d); do \
		echo "⏳ Building kustomize overlay: $$overlay"; \
		if ! kustomize build "$$overlay" > /dev/null 2>&1; then \
			echo "❌ kustomize build failed for $$overlay"; \
			fail=1; \
		else \
			echo "✅ kustomize build succeeded for $$overlay"; \
		fi; \
	done; \
	if [ $$fail -eq 1 ]; then \
		exit 1; \
	fi

## all: Run check-prereqs, check-ext, build, validate, check-symlinks and kustomize-validate
all: check-prereqs check-ext check-symlinks kustomize-validate build validate