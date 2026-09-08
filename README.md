# Trackunit Fleet Billing & Settlement Calculator

An enterprise-grade telematics fleet dataset ingestion and contract settlement application tailored for Trackunit customers. Built with React 19, TypeScript, Tailwind CSS, and Vite.

---

## Overview

The **Trackunit Fleet Billing & Settlement Calculator** automates telematics data sanitization, contract evaluation under Trackunit Master Subscription Agreement (MSA) Terms & Conditions Section 2, and formal financial reconciliation. 

The application starts completely blank upon launch, ensuring that real customer data can be ingested securely via Excel (`.xlsx`, `.xls`) or CSV (`.csv`) spreadsheets without preloaded sample bias.

---

## The 5-Step Workflow

The application is structured into a sequential 5-step operational workflow:

### 1. Data Cleaning & Change Log
- **Deduplication**: Automatically detects duplicate asset IDs and duplicate telematics serial numbers.
- **Date Normalization**: Identifies date formatting anomalies, European (`DD/MM/YYYY`) vs. US (`MM/DD/YYYY`) inversions, and leap-year boundaries.
- **Audit Change Log**: Itemizes all modifications (imputed rates, normalized dates, merged duplicates) so reviewers can audit raw vs. cleaned data.

### 2. Terms & Conditions Engine (MSA Section 2)
- **Clause Evaluation**: Evaluates contracts against Trackunit MSA §2 rules (initial 36-month term, automatic 12-month renewal periods, and strict 3-month prior written notice cutoff).
- **Involuntary Renewal Detection**: Analyzes whether termination notice was received timely or triggered a mandatory 12-month auto-renewal.
- **Interactive Term Simulator**: Test individual contract parameters and edge cases in real time.

### 3. Published Formulas & Scenario Matrix
- **Standard T&C §2 Formula**: Full calendar-month proration through effective expiration.
- **Trackunit 42-Month OEM Equipment Term**: Extended term calculation for heavy OEM assets.
- **Trackunit Premium SLA (5% Credit Memo)**: Governed by the 99.8% uptime availability remedy.
- **Custom Parameter Sandbox**: Configurable term months, renewal cycles, and acceleration discounts.

### 4. Visual Analytics Dashboard
- **Financial Breakdown**: Visualizes timely vs. late notice obligations, plan distribution, and monthly fleet fee trends.
- **Interactive Charts**: Built with Recharts for responsive fleet distribution, exposure timelines, and risk indicators.

### 5. Settlement Ledger & Printable PDF Receipt
- **Auditable Ledger**: Comprehensive breakdown per asset (Start Date, Notice Cutoff, Expiration Date, Billed-To Date, Unbilled Months, Total Settlement Obligation).
- **Formal Settlement Notice**: Export-ready customer letterhead statement referencing contract clauses.
- **Printable Payment Receipt / PDF**: One-click printable receipt formatted for print and PDF archiving (with print CSS optimization).

---

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Motion](https://motion.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Spreadsheet Parsing**: [XLSX (SheetJS)](https://sheetjs.com/) & [PapaParse](https://www.papaparse.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/trackunit-settlement-calculator.git
   cd trackunit-settlement-calculator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   The app will run at `http://localhost:3000`.

4. **Build for production:**
   ```bash
   npm run build
   ```
   Static output will be generated in the `dist/` directory.

---

## Project Structure

```
├── src/
│   ├── components/                 # UI components
│   │   ├── DataCleaningCenter.tsx  # Step 1: Cleaning & change logs
│   │   ├── TermsAndConditionsSection.tsx # Step 2: MSA Section 2 rules
│   │   ├── PublishedFormulasSection.tsx  # Step 3: Formulas matrix
│   │   ├── Visualizations.tsx      # Step 4: Analytical charts
│   │   ├── SettlementTable.tsx     # Step 5: Ledger & table
│   │   ├── SimplifiedInvoiceModal.tsx # Printable payment receipt / PDF
│   │   ├── CustomerFacingStatementModal.tsx # Customer settlement statement
│   │   ├── KpiSummaryCards.tsx     # Executive metrics bar
│   │   └── Header.tsx              # Navigation & controls
│   ├── utils/                      # Core business logic & engines
│   │   ├── calculator.ts           # Contract math & date arithmetic
│   │   ├── dataSanitizer.ts        # Ingestion sanitization rules
│   │   ├── fileParser.ts           # Excel/CSV parser
│   │   ├── formulaEngine.ts        # Formula configurations
│   │   └── validationEngine.ts     # Audit verification engine
│   ├── types.ts                    # Global TypeScript interfaces
│   ├── App.tsx                     # Main state container & router
│   └── main.tsx                    # React DOM entry
├── public/                         # Static assets
├── index.html                      # Entry HTML
├── package.json                    # Project configuration
└── README.md                       # Documentation
```

---

## License

This project is private and proprietary or licensed under the MIT License.
