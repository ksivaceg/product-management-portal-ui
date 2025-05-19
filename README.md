
# AI Product Management Portal

## Project Description

This project is a web-based platform designed to help users manage product information (SKUs) and enrich it using AI. The system allows users to import product data from CSV/Excel files, define custom attributes for their products, and then leverage AI to automatically populate or enhance these attributes. The core goal is to transform basic product information (like name, images, brand, barcode) into a richer, more complete dataset suitable for e-commerce or other business needs.

This system addresses the challenge of incomplete product data by providing tools for:
- Bulk import of existing product information.
- Flexible attribute definition to match diverse product types.
- AI-driven enrichment to automatically generate or suggest values for product attributes.
- A user interface to manage attributes, view products, and oversee the enrichment process.

## Features Implemented

* **Frontend (Material-UI & React):**
    * **Attribute Management UI:**
        * Create, Read, Update (description & flags), and Delete attribute definitions.
        * Define attribute types: short text, long text, rich text, number, single select, multiple select, measure.
        * Specify options for select types and units for measure types.
        * Mark attributes as filterable, sortable, or required.
        * Include a description field for each attribute (useful for AI context).
    * **Product Import UI (Asynchronous):**
        * Select CSV/Excel file for upload.
        * Securely upload file to S3 via pre-signed URL.
        * Initiate asynchronous backend processing for file validation.
        * Poll for job status.
        * Fetch and display processed results from S3 (valid products, ignored headers, validation errors) in separate tabs.
        * Approve validated products to be saved to the database.
    * **Product List UI:**
        * Display products fetched from the backend.
        * Columns dynamically generated based on defined attributes (with "ProductSKU" and "ProductName" prioritized).
        * Client-side state for pagination, with API calls for filtering and sorting.
        * Checkbox selection for individual products and "select all" on the current page.
    * **AI Enrichment UI (Preview & Approve Flow):**
        * "Enrich Selected Products" button on the product list.
        * Calls backend to get AI-generated suggestions (currently mocked if live AI is not configured).
        * Displays suggestions in a review modal where users can see original vs. suggested values and edit suggestions.
        * "Approve & Save Changes" button to send approved/edited enriched data to the backend for persistence.
    * **Navigation:** Simple tab-based navigation between Product Import, Attribute Management, and Product List views.
    * **Notifications:** Uses Snackbar/Alerts for user feedback on operations.

## Tech Stack
    * React with TypeScript
    * Material-UI (MUI) for components and styling
    * Vite for build tooling

## Frontend Structure Overview

The frontend is a single-page application (SPA) built with React and TypeScript, using Material-UI for the component library.

* **`src/App.tsx`**: The main application component, handles top-level state (like current view, attributes, products) and routing between different views.
* **`src/components/`**: Contains reusable UI components:
    * `Layout.tsx`: Provides the main page structure (header, navigation, content area, footer).
    * `ProductImport.tsx`: Manages the CSV/Excel file upload, initiates asynchronous backend processing, polls for job status, and displays validation results in tabs for user approval.
    * `AttributeManagement.tsx`: Handles CRUD operations for attribute definitions, allowing users to define the schema for their products.
    * `ProductList.tsx`: Fetches and displays products from the backend with pagination, filtering, and sorting. It also includes the UI flow for initiating AI enrichment and reviewing/approving suggestions.
* **`src/types/index.ts`**: Contains all shared TypeScript interfaces and type definitions.
* **`src/config/apiConfig.ts`**: Stores API endpoint URLs and other configuration constants.
* **`src/styles/theme.ts`**: Defines the custom Material-UI theme.
* **`src/main.tsx`**: The entry point of the React application.

## Setup and Installation

### Prerequisites
* Node.js and npm/yarn installed.
* AWS CLI configured (if deploying backend resources manually or via IaC).
* Git installed.


### Frontend Setup
1.  **Clone the Repository (Once you push it to Git):**
    ```bash
    git clone git remote add origin https://github.com/ksivaceg/product-management-portal-ui.git

    cd product-management-portal-ui
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Configure API Endpoints:**
    * Update the constants in `src/config/apiConfig.ts` with your deployed API Gateway invoke URLs and S3 bucket details.
4.  **Run the Development Server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The application should now be running locally (typically on `http://localhost:5173` or `http://localhost:3000`).

### Building for Production
```bash
npm run build
# or
yarn build
