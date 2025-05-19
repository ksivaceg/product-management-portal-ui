// src/config/apiConfig.ts

export const API_URL_ATTRIBUTES = 'https://r57ebu7pxj.execute-api.ap-southeast-1.amazonaws.com/Dev/attributes';
export const API_URL_PRESIGNED_URL = 'https://k0zlslq4ha.execute-api.ap-southeast-1.amazonaws.com/Dev/uploads/presigned-url';
export const API_URL_PROCESS_FILE_INITIATE = 'https://k0zlslq4ha.execute-api.ap-southeast-1.amazonaws.com/Dev/uploads/process-file';
export const API_URL_APPROVE_PRODUCTS = 'https://ms1byj46ze.execute-api.ap-southeast-1.amazonaws.com/Dev/approve';
export const API_URL_GET_PRODUCTS = 'https://nyk68uq7j3.execute-api.ap-southeast-1.amazonaws.com/Dev/products'; 
export const API_URL_JOB_STATUS_BASE = 'https://45akmden8l.execute-api.ap-southeast-1.amazonaws.com/Dev/processing-jobs'; 
export const API_URL_ENRICH_SUGGESTIONS = 'https://2pbloohpj2.execute-api.ap-southeast-1.amazonaws.com/Dev/products/enrich'; 
export const API_URL_SAVE_ENRICHED_PRODUCTS = 'https://2pbloohpj2.execute-api.ap-southeast-1.amazonaws.com/Dev/products/bulk-update';

export const S3_UPLOAD_BUCKET = 'my-product-portal-uploads';
// This is used if resultDownloadUrl is not provided by job status API.
// For secure access, resultDownloadUrl (pre-signed GET) is preferred.
export const S3_RESULTS_BUCKET_BASE_URL = 'https://my-product-portal-results.s3.ap-southeast-1.amazonaws.com'; 

export const POLLING_INTERVAL = 5000; // 5 seconds
export const MAX_POLLS = 24; // Max 2 minutes of polling (24 * 5s = 120s)
export const S3_PROPAGATION_DELAY = 2000; // 2 seconds delay after S3 upload
