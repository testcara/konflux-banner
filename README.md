# 🔔 Konflux Banner Repository

This repository manages **banner notifications** for the [Konflux](https://konflux.pages.redhat.com/docs/users/index.html).  
Use it to **add**, **edit**, or **remove** banners related to **upcoming shutdowns**, **service degradation**, etc.

Konflux frontend reads the content of banners directly from this repository and displays them in the UI.  
Each cluster reads only the its own banner file.

---

## 📝 Format

Each banner must be stored in **its own YAML file**, and adhere to the format below:

```yaml
enabled: true
title: Scheduled Maintenance Notification
message: The Konflux platform will undergo scheduled maintenance tonight. Temporary service interruptions may occur.
type: warning  # options: info, warning, danger
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

| Field         | Type   | Required | Description                                                                 |
|---------------|--------|----------|-----------------------------------------------------------------------------|
| `enabled`     | boolean| ✅       | To enable the banner or not                                               |
| `title`       | string | ✅       | A brief header summarizing the banner's purpose                           |
| `message`     | string | ✅       | Text shown to users in the banner                                         |
| `type`        | string | ✅       | Visual severity: `info`, `warning`, or `danger`                           |
| `startTime`   | string | ❌      | When the banner becomes active (UTC, ISO 8601 format)                      |
| `endTime`     | string | ❌      | When the banner disappears automatically (UTC, ISO 8601 format)            |
| `Details`     | string | ❌       | More details like: issues, slack channels, etc.                           |

Optional fields (e.g., start, end) should only be included if needed, and must follow the required format. If not needed, omit them entirely to avoid schema validation errors.

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

   For each cluster, a ConfigMap named konflux-banner-config is generated via Kustomize.
   This ConfigMap only contains a single bannerPath key, which points to the actual banner content file (e.g., `https://raw.githubusercontent.com/testcara/konflux-banner/main/clusters/production/stone-prod-p01.yaml`).
   The path is defined in configMapGenerator using a per-cluster environment file, and each cluster has its own configuration.

2. **Displaying Banners**

   The frontend polls the generated ConfigMap, read the content from the bannerPath then displays the relevant banner to users based on the configured `start` and `end` times.
   If the `start` and `end` times are not set, the banner would be shown immediately and never disapper.

3. **No Infra Deployment Required**

   Once bannerPath is set via a one-time infra PR, banner updates **require no deployment**.
   Simply modify the banner YAML here and merge the PR — the frontend will pick it up automatically.

## 🔎 YAML Validation

All banner YAML files under `clusters/` are validated to ensure correctness and safety.

Validation includes:

- ✅ File extension check — Only `.yaml` is allowed (no `.yml`)
- ✅ Schema validation — Validates required fields and types against a JSON schema
- ✅ Content safety — Ensures `summary` and `details` do not include unsafe content

### CI Validation (GitHub Actions)

On every push or pull request involving `clusters/**/*.yaml`, GitHub Actions will automatically run all validation checks.

Workflow location: `.github/workflows/validate-banner.yaml`

### Local Validation (Recommended Before Push)

#### Prerequisites

To run the validation locally, ensure the following tools are installed:

- `make` – available via most package managers (`brew`, `apt`, etc.)
- `npm` – required to install validator dependencies (`node` is also needed)

Example install commands:

```bash
# macOS
brew install make node

# Ubuntu/Debian
sudo apt-get install build-essential nodejs npm

# Fedora/Centos/RHEL
sudo dnf module enable nodejs:18 -y
sudo dnf install -y nodejs make
```

#### Run the same validations locally

Run ```make check-prereq``` to verify your environment has all required tools mentioned before and then validate.

```bash
make all
```

### Trigger Conditions

Validation is automatically triggered on any push or pull request that modifies files matching: ```clusters/**/*.yaml```.

### Workflow File

The workflow is defined in ```.github/workflows/validate-banner.yaml```.

### 🔐 Workflow Permissions

This repository's GitHub Actions workflows run with read-only permissions.
They do not perform any write operations such as pushing code, deploying, or publishing.
This ensures a safe CI process when accepting pull requests from external contributors.

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
    git push origin add-new-banner
    ```

7. **Create a Pull Request**  
    Open a Pull Request from your branch to the main branch of the original repository.
    Provide a clear description of your changes in the Pull Request.

8. **Review & Merge**  
    A reviewer will review your Pull Request. Once approved, your changes will be merged and automatically synced with the correct cluster.
