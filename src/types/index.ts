/* eslint-disable @typescript-eslint/no-explicit-any */
// src/types/index.ts

// For navigation within the app
export type View = 'productList' | 'attributeManagement' | 'productImport';

// For the main Layout component props
export interface LayoutProps { 
  currentView: View; 
  onNavigate: (view: View) => void; 
  children: React.ReactNode;
}

// For Product data
export interface Product { 
  _id?: string; 
  id?: string; // Kept for potential initial mock data or UI-generated IDs
  name?: string; // Made optional as it might come from attributes
  brand?: string; // Made optional
  barcode?: string; // Made optional
  ProductSKU?: string; // Specific attribute
  ProductName?: string; // Specific attribute
  images?: string[]; 
  [key: string]: any; // For other dynamic attributes
}

// For Attribute Definitions (matches backend structure)
export interface AttributeDefinition { 
  _id: string; 
  name: string; 
  type: 'short_text' | 'long_text' | 'rich_text' | 'number' | 'single_select' | 'multiple_select' | 'measure'; 
  description?: string; 
  options?: string[]; 
  unit?: string; 
  isFilterable?: boolean; 
  isSortable?: boolean; 
  isRequired?: boolean; 
  createdAt?: string; 
  updatedAt?: string; 
}

// For Snackbar notifications
export interface SnackbarState { 
  open: boolean; 
  message: string; 
  severity: 'success' | 'error' | 'warning' | 'info'; 
}

// For data returned after file processing and validation (from S3 result file)
export interface ProcessedFileData { 
  jobId?: string; 
  message: string; 
  fileName: string; 
  validHeaders?: string[]; // Headers that matched defined attributes
  headers?: string[];      // Preferred key for valid headers for UI consistency
  products?: Record<string, any>[]; // Products that passed validation
  totalRowsInPreview?: number; 
  originalHeaders?: string[]; // All headers from the CSV
  ignoredHeaders?: string[];  // CSV headers not matching defined attributes
  validationErrors?: string[];// Specific error messages for rows/cells
}

// For job status polling
export interface JobStatusData { 
  _id: string; 
  s3Bucket: string; 
  s3Key: string; 
  originalFileName: string; 
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'COMPLETED_WITH_ISSUES' | 'FAILED'; 
  submittedAt: string; 
  updatedAt: string; 
  resultS3Key?: string; 
  resultDownloadUrl?: string; // Pre-signed URL to fetch results
  errorDetails?: any; 
}

// Props for AttributeManagement component
export interface AttributeManagementProps { 
  attributes: AttributeDefinition[]; 
  setAttributes: React.Dispatch<React.SetStateAction<AttributeDefinition[]>>; 
  setSnackbar: React.Dispatch<React.SetStateAction<SnackbarState>>; 
}

// Props for ProductList component
export interface ProductListProps { 
  products: Product[]; 
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>; 
  attributes: AttributeDefinition[]; 
  setSnackbar: React.Dispatch<React.SetStateAction<SnackbarState>>; 
}

// For AI Enrichment Preview Modal
export interface EnrichedProductPreviewItem {
  _id: string;
  originalProductName?: string; 
  enrichedProductData: Record<string, any>; // Full product data with AI suggestions merged
  aiSuggestions: Record<string, any>; // Key-value pairs of { attributeName: suggestedValue }
}
