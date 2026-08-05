# COMP4635: AI-Powered Cloud Security Auditor & Resume Portal

This repository contains the implementation for the COMP4635 Group Project. It features a fully serverless **Resume Portal Web Application** deployed on AWS, alongside an **AI/LLM Automation Solution** that performs automated Cloud Security Audits against industry-standard frameworks (NIST, SOC 2, ISO 27001).

## 🌐 Live Application
*   **Web Link:** [https://main.d3gvpl5s7wcxyg.amplifyapp.com](https://main.d3gvpl5s7wcxyg.amplifyapp.com)
*   **API Invoke URL:** `https://32q3wg7vzb.execute-api.us-east-1.amazonaws.com`

### Test Credentials
| Role | Email | Password |
| :--- | :--- | :--- |
| **Candidate** | `candidate@example.com` | `CandidatePW#2026` |
| **HR** | `hr@example.com` | `hrPW#2026` |
| **Admin** | `admin@example.com` | `AdminPW#2026` |

---

## 🤖 AI/LLM Security Audit Tool (Bonus Requirement #6)

To fulfill the requirement of developing an AI/LLM automation solution for cloud security audits, we built a Python-based auditing engine. 

Instead of relying on static rule engines, this tool queries live AWS configurations via `boto3`, packages the infrastructure state into JSON, and feeds it into an LLM (**Amazon Bedrock - Nova Lite**) via a highly engineered System Prompt. The LLM evaluates the configuration against specific compliance frameworks and generates a uniformly formatted, professional Microsoft Word (`.docx`) report complete with risk scores, pass/fail statuses, and remediation steps.

### Supported Frameworks
*   **NIST SP 800-53** (`audit_nist.py`)
*   **SOC 2 Trust Services Criteria** (`audit_soc2.py`)
*   **ISO/IEC 27001:2022** (`audit_iso27001.py`)

### Targeted AWS Resources
The scripts are hardcoded to evaluate the specific architecture of our Resume Portal:
*   **Amazon S3:** `resume-portal-files-327771416838` (Checks Public Access Block, Encryption, Versioning, CORS)
*   **AWS Lambda:** `GenerateUploadUrl`, `ListResumes`, `GenerateDownloadUrl` (Checks VPC configuration, Execution Roles)
*   **Amazon Cognito:** User Pool `us-east-1_VNwNbecJZ` (Checks MFA status, Group assignments: Admin, HR, Candidate)
*   **API Gateway:** `ResumePortalAPI` (Checks JWT Authorizers, CORS settings)
*   **AWS Amplify:** Frontend hosting environment variables and build settings.

---

## 🚀 How to Run the AI Auditor

Follow these steps to generate the security audit reports locally.

### Prerequisites
1.  **Python 3.8+** installed on your machine.
2.  **AWS CLI** configured with credentials. 
    *   *Security Note:* The IAM