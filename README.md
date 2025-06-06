# 🔔 Konflux Banner Repository

This repository manages **banner notifications** for the [Konflux](https://konflux.pages.redhat.com/docs/users/index.html).  
Use it to **add**, **edit**, or **remove** banners related to **upcoming shutdowns**, **service degradation**, etc.

Konflux frontend reads the content of banners directly from this repository and displays them in the UI.  
Each cluster reads only its own banner file.

---

## 📝 Format

Each banner must be stored in **its own YAML file**, and adhere to the format below:

```yaml
enable: true
title: Scheduled Maintenance Notification
message: The Konflux platform will undergo scheduled maintenance tonight. Temporary service interruptions may occur.
type: warning
startTime: "2025-05-15T21:00:00Z"
endTime: "2025-05-15T23:00:00Z"
details: |
  Details:
  - Maintenance window: May 15, 2025 from 21:00 to 23:00 UTC
  - Impact Component: Konflux UI, MintMaker
  - Contact: Please reach out via the #konflux-support Slack channel for assistance

  Thank you for your understanding and support.
```

### Fields

| Field       | Type    | Required | Description                                                      |
|-------------|---------|----------|------------------------------------------------------------------|
| `enable`    | boolean | ✅       | Whether to enable the banner (true or false, lowercase preferred)|
| `title`     | string  | ✅       | A brief header summarizing the banner's purpose                 |
| `message`   | string  | ✅       | Text shown to users in the banner                               |
| `type`      | string  | ✅       | Visual severity: `info`, `warning`, or `danger` affecting background color and icon              |
| `startTime` | string  | ❌       | When the banner becomes active (UTC, ISO 8601 format)           |
| `endTime`   | string  | ❌       | When the banner disappears automatically (UTC, ISO 8601 format) |
| `details`   | string  | ❌       | More details like: issues, Slack channels, etc.                 |

More details about certain fields:  

- Optional fields like `startTime`, `endTime`, and `details` should be included only when needed. If unused, omit them completely to avoid schema validation errors. 
- Time values must follow the ISO 8601 UTC format.
- The `details` field is a plain string but supports Markdown syntax (rather than raw HTML) to enhance readability and display in the UI.

### UI Preview

The following are two visual examples of how these fields are rendered in the UI when 'enable' is true.
Field values (such as `title` and `message`) are placeholders used to demonstrate how YAML fields map to the UI.

Examples:

<p align="left"> <img src="./assets/danger_banner.png" alt="Banner example 1" width="500"/> <br/> <img src="./assets/info_banner.png" alt="Banner example 2" width="500"/> </p>

What the examples show:

- `title` and `message` are shown as-is. 
- `type` sets the banner color (danger: red, info: blue, warning: yellow); 
- `startTime` and `endTime` are invisible but control display time.
- `details` is shown conditionally if provided.

## 🗂 Directory Structure

```yaml
clusters
├── production
│   ├── kflux-ocp-p01.yaml
│   ├── kflux-prd-rh02.yaml
│   ├── stone-prd-rh01.yaml
│   ├── stone-prod-p01.yaml
│   └── stone-prod-p02.yaml
└── staging
    ├── stone-stage-p01.yaml
    └── stone-stg-rh01.yaml
```

- production/ and staging/: Represent different environments.

- Each YAML file maps to a specific Konflux cluster, as referenced the [UI versions](https://konflux.pages.redhat.com/docs/users/getting-started/ui-versions.html) page.

## ✅ How It Works

1. **Cluster-Specific Banner Configuration Paths**

   For each cluster, a ConfigMap named 'konflux-banner-config' is generated via Kustomize.
   This ConfigMap only contains a single bannerPath key, which points to the actual banner content file (e.g., `https://raw.githubusercontent.com/testcara/konflux-banner/main/clusters/production/stone-prod-p01.yaml`).
   The path is defined in configMapGenerator using a per-cluster environment file, and each cluster has its own configuration.

2. **Displaying Banners**

   The frontend polls the generated ConfigMap, read the content from the bannerPath then displays the relevant banner to users based on the configured `startTime` and `endTime` times.
   If the `startTime` and `endTime` times are not set, the banner would be shown immediately and never disapper.

3. **No Infra Deployment Required**

   Once bannerPath is set via a one-time infra PR, banner updates **require no deployment**.
   Simply modify the banner YAML here and merge the PR — the frontend will pick it up automatically.

## 🔎 YAML Validation

All banner YAML files under `clusters/` are validated to ensure correctness and safety.

Validation includes:

- File extension check — Only `.yaml` is allowed (no `.yml`)
- Schema validation — Validates required fields and types against a JSON schema
- Content safety — Ensures `summary` and `details` do not include unsafe content

### CI Validation (GitHub Actions)

On every push or pull request involving `clusters/**/*.yaml`, GitHub Actions will automatically run all
validation checks with read-only permissions. The workflow file is locationed at `.github/workflows/validate-banner.yaml`.

To help demonstrate the logic, here are example pull requests that illustrate both valid and invalid cases:

✅ Valid Examples:

- ✅ [PR #4](https://github.com/testcara/konflux-banner/pull/4) – Valid Example 1: vaild banner content with all filed
- ✅ [PR #5](https://github.com/testcara/konflux-banner/pull/5) – Valid Example 2: vaild banner content without time or details.

❌ Invalid Examples:

- ❌ [PR #2](https://github.com/testcara/konflux-banner/pull/2) – Invalid Example 1: invalid banner content with invalid schema
- ❌ [PR #3](https://github.com/testcara/konflux-banner/pull/3) – Invalid Example 2: invalid banner content with improper HTML code.

### Local Validation (Recommended Before Push)

#### Prerequisites

To run the YAML schema validator locally, ensure you have the following tool installed:

- `Go` – the Go programming language (version 1.20 or higher recommended)

Example install commands:

```bash
# macOS (via Homebrew)
brew install go

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install golang

# Fedora/Centos/RHEL
sudo dnf install golang
```

#### Run Validations Locally

Run ```make check-prereq``` to verify your environment has all required tools mentioned before and then validate.

```bash
make all
```

## ✍️ Contributing

1. **Fork this repository**  
    If you haven't already, fork this repository to your own GitHub account.

2. **Create a new branch**  
    Create a branch for your changes. For example:

    ```bash
    git checkout -b update-banner
    ```

3. **Create/Update a YAML file**  
    Edit one exsiting YAML file under the appropriate directory (e.g., `clusters/staging` or `clusters/production`).
    As for adding new banner to new clusters, beside creating one YAML file here, one Pull Request for [konflux-banner](https://github.com/testcara/infra-deployments/tree/konflux-banner/components/konflux-banner) component in infra-deployment repo is also needed.

4. **(Optional) Validate Locally**  

    ```bash
    make all
    ```

5. **Commit your changes**  
    Commit your changes with a descriptive commit message. For example:

    ```bash
    git commit -m "Add new downtime banner for staging"
    ```

6. **Push your changes**  
    Push your changes to your forked repository:

    ```bash
    git push origin update-banner
    ```

7. **Create a Pull Request**  
    Open a Pull Request from your branch to the main branch of the original repository.
    Provide a clear description of your changes in the Pull Request.

8. **Review & Merge**  
    A reviewer will review your Pull Request. Once approved, your changes will be merged and automatically synced with the correct cluster.