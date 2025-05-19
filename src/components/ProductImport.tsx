// src/components/ProductImport.tsx
import React, { useState, useEffect, ChangeEvent } from 'react';
import {
  Box, Typography, Button, Stack, TextField, Paper, Grid,
  CircularProgress, Tabs, Tab, List, ListItem, ListItemText, ListItemIcon,
  Chip, Tooltip, Divider, LinearProgress, FormControl
} from '@mui/material';
import {
  FileUpload as FileUploadIcon,
  CloudUpload as CloudUploadIcon,
  Visibility as PreviewIcon,
  DoneAll as DoneAllIcon,
  ReportProblem as ReportProblemIcon,
  CheckCircleOutline,
  ErrorOutline
} from '@mui/icons-material';
import type { SnackbarState, ProcessedFileData, JobStatusData } from '../types';
import { 
    API_URL_PRESIGNED_URL, 
    API_URL_PROCESS_FILE_INITIATE, 
    API_URL_APPROVE_PRODUCTS,
    API_URL_JOB_STATUS_BASE,
    S3_UPLOAD_BUCKET,
    S3_RESULTS_BUCKET_BASE_URL,
    POLLING_INTERVAL,
    MAX_POLLS,
    S3_PROPAGATION_DELAY
} from '../config/apiConfig'; // Assuming apiConfig is in src/config/

const ProductImport: React.FC<{ setSnackbar: React.Dispatch<React.SetStateAction<SnackbarState>> }> = ({ setSnackbar }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isInitiatingProcessing, setIsInitiatingProcessing] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [isFetchingResults, setIsFetchingResults] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [currentS3Key, setCurrentS3Key] = useState<string | null>(null); 
  const [jobStatus, setJobStatus] = useState<JobStatusData['status'] | null>(null);
  const [pollCount, setPollCount] = useState(0);
  
  const [processedData, setProcessedData] = useState<ProcessedFileData | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    console.log("UI: processedData state updated:", processedData);
    if (processedData) {
        console.log("UI: processedData.products:", processedData.products);
        console.log("UI: processedData.headers:", processedData.headers);
    }
  }, [processedData]);

  const resetAllStates = () => {
    setSelectedFile(null); setIsUploading(false); setIsInitiatingProcessing(false); setIsPolling(false); setIsFetchingResults(false); setIsApproving(false);
    setCurrentJobId(null); setCurrentS3Key(null); setJobStatus(null); setPollCount(0);
    setProcessedData(null); setActiveTab(0);
    const fileInput = document.getElementById('file-upload-mui-enhanced') as HTMLInputElement;
    if (fileInput) fileInput.value = ''; 
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const newFile = event.target.files[0];
      setProcessedData(null); setCurrentJobId(null); setCurrentS3Key(null); setJobStatus(null); setPollCount(0); setActiveTab(0);
      setIsUploading(false); setIsInitiatingProcessing(false); setIsPolling(false); setIsFetchingResults(false); setIsApproving(false);
      setSelectedFile(newFile); 
    } else {
      resetAllStates();
    }
  };
  
  const handleInitiateProcessing = async () => {
    if (!selectedFile) { setSnackbar({ open: true, message: 'Please select a file first.', severity: 'warning' }); return; }
    setIsUploading(true); setProcessedData(null); setActiveTab(0); setCurrentJobId(null); setJobStatus(null); setPollCount(0);
    let generatedS3KeyForProcessing: string | null = null; 

    try {
      setSnackbar({ open: true, message: 'Requesting upload URL...', severity: 'info' });
      const presignedResponse = await fetch(API_URL_PRESIGNED_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: selectedFile.name, contentType: selectedFile.type || 'text/csv' }) });
      if (!presignedResponse.ok) { const err = await presignedResponse.json().catch(()=>({})); throw new Error(err.error || 'Failed to get pre-signed URL.'); }
      const { uploadUrl, s3Key: generatedS3Key } = await presignedResponse.json();
      setCurrentS3Key(generatedS3Key); 
      generatedS3KeyForProcessing = generatedS3Key; 

      setSnackbar({ open: true, message: 'Uploading file to S3...', severity: 'info' });
      const s3UploadResponse = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': selectedFile.type || 'text/csv' }, body: selectedFile });
      if (!s3UploadResponse.ok) { const s3Err = await s3UploadResponse.text(); throw new Error(`S3 Upload failed: ${s3UploadResponse.statusText}. ${s3Err.substring(0,100)}`); }
      
      setIsUploading(false); 
      setSnackbar({ open: true, message: 'File uploaded. Waiting for S3 propagation...', severity: 'info' });
      await new Promise(resolve => setTimeout(resolve, S3_PROPAGATION_DELAY));
      
      setIsInitiatingProcessing(true); 
      setSnackbar({ open: true, message: 'Initiating file processing...', severity: 'info' });
      if (!generatedS3KeyForProcessing) { throw new Error("S3 key not available for initiating processing."); }
      const initiateResponse = await fetch(API_URL_PROCESS_FILE_INITIATE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ s3Bucket: S3_UPLOAD_BUCKET, s3Key: generatedS3KeyForProcessing }) });
      
      setIsInitiatingProcessing(false); 

      const initiateData = await initiateResponse.json();
      if (!initiateResponse.ok || !initiateData.jobId) { throw new Error(initiateData.error || 'Failed to initiate file processing.'); }
      
      setCurrentJobId(initiateData.jobId);
      setJobStatus('PENDING');
      setIsPolling(true); 
      setSnackbar({ open: true, message: `Processing initiated (Job ID: ${initiateData.jobId}). Checking status...`, severity: 'info' });
    } catch (error) {
      console.error("Initiate processing error:", error);
      setSnackbar({ open: true, message: error instanceof Error ? error.message : 'An error occurred.', severity: 'error' });
      setIsUploading(false); 
      setIsInitiatingProcessing(false); 
    } 
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined = undefined;
    if (isPolling && currentJobId && pollCount < MAX_POLLS) {
      const pollJobStatus = async () => {
        try {
          if (API_URL_JOB_STATUS_BASE.includes("YOUR_API_ID")) { 
            console.warn("API_URL_JOB_STATUS_BASE placeholder not replaced. Polling disabled.");
            setSnackbar({open: true, message: "Job status polling endpoint not configured in UI.", severity: 'warning'});
            setIsPolling(false); return;
          }
          const response = await fetch(`${API_URL_JOB_STATUS_BASE}/${currentJobId}`);
          if (!response.ok) { 
            console.warn(`Polling failed for job ${currentJobId}: ${response.statusText}`);
            setPollCount(prev => prev + 1); return; 
          }
          const data: JobStatusData = await response.json();
          setJobStatus(data.status);
          setSnackbar({open: true, message: `Job ${currentJobId}: Status - ${data.status}`, severity: 'info'});

          if (data.status === 'COMPLETED' || data.status === 'COMPLETED_WITH_ISSUES') {
            setIsPolling(false); setIsFetchingResults(true);
            setSnackbar({open: true, message: `Job ${currentJobId} ${data.status}. Fetching results...`, severity: 'success'});
            
            if (data.resultDownloadUrl) { 
              const resultsResponse = await fetch(data.resultDownloadUrl, {
                method: 'GET',
                mode: 'cors', 
              });
              if (!resultsResponse.ok) {
                const errorText = await resultsResponse.text();
                console.error("Fetch results error status:", resultsResponse.status, "Text:", errorText);
                throw new Error(`Failed to fetch results using pre-signed URL: ${resultsResponse.statusText}`);
              }
              const resultsJson: ProcessedFileData = await resultsResponse.json();
              console.log("UI: Fetched S3 Results JSON:", JSON.stringify(resultsJson, null, 2)); 
              setProcessedData(resultsJson);
            } else { 
                throw new Error("Job completed but no result download URL found."); 
            }
            setIsFetchingResults(false);
          } else if (data.status === 'FAILED') {
            setIsPolling(false);
            setProcessedData({ 
              message: `Job ${currentJobId} failed.`,
              fileName: currentS3Key ? currentS3Key.split('/').pop() || "Unknown file" : "Unknown file",
              headers: [], products: [], totalRowsInPreview: 0, originalHeaders: [], ignoredHeaders: [],
              validationErrors: [typeof data.errorDetails === 'string' ? data.errorDetails : JSON.stringify(data.errorDetails) || "Processing failed. Check server logs."]
            });
            setActiveTab(1); 
            setSnackbar({open: true, message: `Job ${currentJobId} FAILED. Check issues tab.`, severity: 'error'});
          } else { setPollCount(prev => prev + 1); }
        } catch (error) {
          console.error("Polling error:", error);
          setSnackbar({open: true, message: `Error checking job status: ${error instanceof Error ? error.message : 'Unknown error'}`, severity: 'error'});
          setPollCount(prev => prev + 1); 
        }
      };
      intervalId = setInterval(pollJobStatus, POLLING_INTERVAL);
      return () => clearInterval(intervalId);
    } else if (pollCount >= MAX_POLLS && isPolling) {
      setIsPolling(false);
      setSnackbar({open: true, message: `Job ${currentJobId} status check timed out after ${MAX_POLLS * POLLING_INTERVAL / 1000}s. Please check later or contact support.`, severity: 'warning'});
    }
  }, [isPolling, currentJobId, pollCount, setSnackbar, currentS3Key]);

  const handleApproveProducts = async () => { 
    const productsForApproval = processedData?.products || []; 
    if (productsForApproval.length === 0) { 
        setSnackbar({ open: true, message: 'No valid products to approve.', severity: 'warning' }); 
        return; 
    }
    setIsApproving(true);
    try {
      const response = await fetch(API_URL_APPROVE_PRODUCTS, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ products: productsForApproval, s3Key: currentS3Key }), });
      const responseData = await response.json();
      if (!response.ok) { throw new Error(responseData.error || 'Failed to approve products.'); }
      setSnackbar({ open: true, message: responseData.message || 'Products approved and saved!', severity: 'success' });
      resetAllStates(); 
    } catch (error) { console.error("Approve products error:", error); setSnackbar({ open: true, message: error instanceof Error ? error.message : 'An error occurred during approval.', severity: 'error' });
    } finally { setIsApproving(false); }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => setActiveTab(newValue);
  const currentOverallLoadingState = isUploading || isInitiatingProcessing || isPolling || isFetchingResults || isApproving;

  const productsForApprovalList = processedData?.products || []; 
  const headersForDisplayList = processedData?.headers || processedData?.validHeaders || []; 
  const productsToApproveCount = productsForApprovalList.length;

  const validationErrorsCount = processedData?.validationErrors?.length || 0;
  const ignoredHeadersCount = processedData?.ignoredHeaders?.length || 0;
  const issuesCount = validationErrorsCount + ignoredHeadersCount;

  console.log("UI Render: productsToApproveCount:", productsToApproveCount, "processedData.products:", processedData?.products);


  return (
    <Paper elevation={3} sx={{ p: {xs:2, sm:3}, borderRadius: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ color: 'primary.dark', mb: 3 }}>Product Import & Validation (Async)</Typography>
      <Stack spacing={2} direction={{xs: 'column', sm: 'row'}} alignItems="center" mb={3}>
        <Button fullWidth variant="outlined" component="label" startIcon={<FileUploadIcon />} sx={{textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap'}} disabled={currentOverallLoadingState}>
          {selectedFile ? selectedFile.name : "Select CSV/Excel File"}
          <input id="file-upload-mui-enhanced" type="file" hidden accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileChange} disabled={currentOverallLoadingState}/>
        </Button>
        <Button fullWidth variant="contained" color="primary" onClick={handleInitiateProcessing} disabled={!selectedFile || currentOverallLoadingState} startIcon={isUploading || isInitiatingProcessing ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}>
          {isUploading ? 'Uploading...' : (isInitiatingProcessing ? 'Initiating...' : 'Upload & Process')}
        </Button>
      </Stack>
      {(isPolling || isFetchingResults) && !processedData && (
        <Box sx={{my:3}}>
          <Typography variant="body1" sx={{mb:1, textAlign: 'center', color: 'info.main'}}>
            {isPolling ? `Processing file (Job ID: ${currentJobId}). Status: ${jobStatus || 'Checking'} (${pollCount}/${MAX_POLLS})...` : 'Fetching processed results...'}
          </Typography>
          <LinearProgress color="info" />
        </Box>
      )}
      {processedData && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle2" gutterBottom>File: <strong>{processedData.fileName}</strong></Typography>
          <Tooltip title={processedData.originalHeaders?.join(', ') || 'N/A'}><Typography variant="caption" display="block" gutterBottom noWrap>Original Headers: {processedData.originalHeaders?.join(', ') || 'N/A'}</Typography></Tooltip>
          <Divider sx={{my:1}}/>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="import results tabs" variant="fullWidth">
              <Tab label={`Products to Approve (${productsToApproveCount})`} icon={<DoneAllIcon />} iconPosition="start" disabled={currentOverallLoadingState}/>
              <Tab label={`Validation Issues (${issuesCount})`} icon={<ReportProblemIcon />} iconPosition="start" disabled={currentOverallLoadingState} sx={{ color: issuesCount > 0 ? 'error.main' : 'inherit'}}/>
            </Tabs>
          </Box>
          {activeTab === 0 && ( <Box sx={{ py: 2 }}> {productsToApproveCount > 0 ? ( <> <Typography variant="body2" sx={{mb:1}}>The following products passed validation and are ready for approval.</Typography> <TableContainer component={Paper} elevation={1} sx={{my: 2, borderRadius: 2, maxHeight: 400, overflow: 'auto'}}> <Table size="small" stickyHeader> <TableHead sx={{ backgroundColor: 'grey.100' }}> <TableRow>{headersForDisplayList.map(header => <TableCell key={header} sx={{fontWeight: 'bold'}}>{header}</TableCell>)}</TableRow> </TableHead> <TableBody>{productsForApprovalList.map((product, index) => (<TableRow key={index} hover>{headersForDisplayList.map(header => (<TableCell key={`${index}-${header}`}>{Array.isArray(product[header]) ? (product[header] as string[]).join('; ') : product[header]}</TableCell>))} </TableRow>))} </TableBody> </Table> </TableContainer> <Button variant="contained" color="secondary" onClick={handleApproveProducts} disabled={isApproving || productsToApproveCount === 0 || currentOverallLoadingState} startIcon={isApproving ? <CircularProgress size={20} color="inherit" /> : <CheckCircleOutline />}> {isApproving ? 'Approving...' : `Approve ${productsToApproveCount} Valid Product(s)`} </Button> </> ) : <Typography sx={{my: 2, color: 'text.secondary'}}>No products passed validation for approval from this file.</Typography>} </Box> )}
          {activeTab === 1 && ( <Box sx={{ py: 2 }}> {(processedData.ignoredHeaders && processedData.ignoredHeaders.length > 0) && ( <Box mb={3}> <Typography variant="subtitle1" gutterBottom color="warning.dark">Ignored Columns from CSV</Typography> <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">{(processedData.ignoredHeaders || []).map(header => <Chip key={header} label={header} variant="outlined" color="warning" size="small"/>)}</Stack> <Typography variant="caption" display="block" sx={{mt:1}}>These columns were in your file but do not match any defined attributes and were ignored.</Typography> </Box> )} <Divider sx={{my:2, display: ((processedData.ignoredHeaders?.length || 0) > 0 && (processedData.validationErrors?.length || 0) > 0) ? 'block' : 'none' }}/> {(processedData.validationErrors && processedData.validationErrors.length > 0) ? ( <Box> <Typography variant="subtitle1" gutterBottom color="error.dark">Data Validation Errors ({validationErrorsCount})</Typography> <Paper elevation={1} sx={{maxHeight: 300, overflow: 'auto', p:1, border: '1px solid', borderColor: 'error.light', borderRadius:1}}> <List dense disablePadding>{(processedData.validationErrors || []).map((error, index) => (<React.Fragment key={index}><ListItem disableGutters sx={{alignItems: 'flex-start'}}><ListItemIcon sx={{minWidth: 30, mt:0.5}}><ErrorOutline color="error" fontSize="small"/></ListItemIcon><ListItemText primaryTypographyProps={{variant: 'body2', color: 'text.secondary'}} primary={error} /></ListItem>{index < (processedData.validationErrors?.length || 0) -1 && <Divider component="li" light />}</React.Fragment>))}</List> </Paper> </Box> ) : ( (processedData.ignoredHeaders?.length || 0) > 0 ? null : <Typography sx={{my: 2, color: 'text.secondary'}}>No validation errors found for the processed data.</Typography> )} </Box> )}
        </Box>
      )}
    </Paper>
  );
};
export default ProductImport; // Assuming ProductImport is the main export for this file
