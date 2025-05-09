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
type: warning  # options: info, warning, error, success
start: "2025-05-15T21:00:00Z"
end: "2025-05-15T23:00:00Z"
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
| `summary`     | string | ✅       | Text shown to users in the banner                                           |
| `type`        | string | ✅       | Visual severity: `info`, `warning`, or `danger`                             |
| `start`       | string |  ❌      | When the banner becomes active (UTC, ISO 8601 format)                       |
| `end`         | string |  ❌      | When the banner disappears automatically (UTC, ISO 8601 format)            |
| `Details`     | string | ❌       | More details like: issues, slack channels, etc.                     |

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

- **`production/` and `staging/`**  
  Each subfolder corresponds to different environments. The files inside will be consumed by respective konflux clusters.

- **YAML Files**  
  Each YAML file represents **one** banner. For example, `kflux-ocp-p01.yaml` describes a specific banner for the `Private - ocp-p01` environment mentioned in the the [UI versions](https://konflux.pages.redhat.com/docs/users/getting-started/ui-versions.html) page.  

## ✅ How It Works

1. **Cluster-Specific Banner Configuration Paths**  
   For each cluster, a ConfigMap named konflux-banner-config is generated via Kustomize.
   This ConfigMap only contains a single bannerPath key, which points to the actual banner content file (e.g., `https://raw.githubusercontent.com/testcara/konflux-banner/main/clusters/production/stone-prod-p01.yaml`).
   The path is defined in configMapGenerator using a per-cluster environment file, and each cluster has its own configuration.

2. **Displaying Banners**  
   The frontend polls the generated ConfigMap, read the content from the bannerPath then displays the relevant banner to users based on the configured `start` and `end` times.
   If the `start` and `end` times are not set, the banner would be shown immediately and never disapper.

3. **Updating Banners Without Infra-Deployments**  
   Banner contents are just maintained here. Once the bannerPath is configured (via a one-time infra-deployments PR), further updates to the banner content only require merging a PR in this repo. Since the UI polls or fetches the banner dynamically from the remote path, no additional deployment or ArgoCD sync is needed to update the message.

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

4. **Follow the format strictly**  
    Ensure your YAML file adheres to the predefined format. Only one banner per YAML file will be accepted. Invalid files will be ignored.

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
