/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/ProductList.tsx
import React, { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import {
  Box, Typography, Button, Stack, TextField, Paper, Grid,
  CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Checkbox, IconButton,
  List, ListItem, ListItemText, ListItemIcon, Chip, Tooltip, 
} from '@mui/material';
import { 
    Settings as SettingsIcon, 
    Close as CloseIcon,
    AutoFixHigh as EnrichIcon, 
    ThumbUpAlt as ThumbUpAltIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    ErrorOutline as ErrorIcon, // Added for consistency
} from '@mui/icons-material';
import type { Product, AttributeDefinition, ProductListProps, EnrichedProductPreviewItem } from '../types'; // Assuming types are in src/types/index.ts
import { API_URL_GET_PRODUCTS, API_URL_ENRICH_SUGGESTIONS, API_URL_SAVE_ENRICHED_PRODUCTS } from '../config/apiConfig'; // Assuming apiConfig is in src/config/


const ProductList: React.FC<ProductListProps> = ({ products: appProducts, setProducts: setAppProducts, attributes, setSnackbar }) => {
  const [products, setProductsState] = useState<Product[]>([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false); 
  const [isSavingEnrichment, setIsSavingEnrichment] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(0); 
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [enrichmentPreviewOpen, setEnrichmentPreviewOpen] = useState(false);
  const [enrichmentPreviewData, setEnrichmentPreviewData] = useState<EnrichedProductPreviewItem[]>([]);
  const [editableSuggestions, setEditableSuggestions] = useState<Record<string, Record<string, any>>>({});


  const fetchProducts = useCallback(async (pageToFetch: number, currentFilters: Record<string,string>, currentSort: {key:string, direction: string} | null) => {
    setIsLoading(true);
    const params = new URLSearchParams();
    params.set('page', (pageToFetch + 1).toString());
    params.set('limit', rowsPerPage.toString());
    Object.entries(currentFilters).forEach(([key, value]) => { if(value) params.set(key, value); });
    if(currentSort?.key) { params.set('sortBy', currentSort.key); params.set('sortOrder', currentSort.direction); }

    console.log("ProductList: Fetching products with params:", params.toString()); 

    try {
      const response = await fetch(`${API_URL_GET_PRODUCTS}?${params.toString()}`);
      if (!response.ok) { 
        const errorData = await response.json().catch(() => ({error: `HTTP error! status: ${response.status}`})); 
        console.error("ProductList: Fetch error response:", errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`); 
      }
      const result = await response.json();
      console.log("ProductList: Fetched products result:", result); 
      setProductsState(result.data || []); 
      setTotalItems(result.pagination?.totalItems || 0);
    } catch (error) { 
      console.error("ProductList: Failed to fetch products:", error); 
      setSnackbar({ open: true, message: error instanceof Error ? error.message : 'Could not load products.', severity: 'error' });
    } finally { 
      setIsLoading(false); 
    }
  }, [setSnackbar, rowsPerPage]); 

  useEffect(() => { 
    console.log("ProductList: useEffect for fetchProducts triggered. currentPage:", currentPage, "filterValues:", filterValues, "sortConfig:", sortConfig);
    fetchProducts(currentPage, filterValues, sortConfig); 
  }, [fetchProducts, currentPage, filterValues, sortConfig]);
  
  const handleSelectProduct = (productId?: string) => { 
    if (!productId) {
        console.warn("ProductList: handleSelectProduct called with undefined productId.");
        return;
    }
    console.log("ProductList: handleSelectProduct called with productId:", productId);
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      console.log("ProductList: selectedProducts state updated to:", next);
      return next;
    });
  };
  const paginatedProducts = products; 
  const isAllOnPageSelected = paginatedProducts.length > 0 && paginatedProducts.every(p => p._id && selectedProducts.has(p._id));
  const handleSelectAll = (event: ChangeEvent<HTMLInputElement>) => { 
    console.log("ProductList: handleSelectAll called. Checked:", event.target.checked);
    if (event.target.checked) { 
      const newSelecteds = paginatedProducts.filter(p => p._id).map((p) => p._id!); 
      setSelectedProducts(new Set(newSelecteds)); 
      console.log("ProductList: All on page selected:", newSelecteds);
      return; 
    } 
    setSelectedProducts(new Set()); 
    console.log("ProductList: All on page deselected.");
  };
  const handleFilterChange = (attributeName: string, value: string) => { setFilterValues(prev => ({ ...prev, [attributeName]: value })); setCurrentPage(0); };
  const handleSort = (key: string) => { const isAsc = sortConfig?.key === key && sortConfig.direction === 'asc'; setSortConfig({ key, direction: isAsc ? 'desc' : 'asc' }); setCurrentPage(0);};
  
  const handleEnrichSelectedProducts = async () => {
    if (selectedProducts.size === 0) { setSnackbar({ open: true, message: "Please select products to enrich.", severity: 'warning' }); return; }
    if (API_URL_ENRICH_SUGGESTIONS.includes("YOUR_ENRICH_API_ID") || API_URL_ENRICH_SUGGESTIONS.includes("YOUR_API_ID")) { // Check for placeholder
        setSnackbar({ open: true, message: "AI Enrichment API endpoint not configured in UI.", severity: 'error'}); 
        // For testing UI without backend, populate mock data:
        // setEnrichmentPreviewData([
        //   { _id: "PROD001", originalProductName: "Sample Product 1", enrichedProductData: { _id: "PROD001", name: "Sample Product 1", Description: "[MOCK AI] A truly amazing sample product." }, aiSuggestions: { Description: "[MOCK AI] A truly amazing sample product." } },
        //   { _id: "PROD002", originalProductName: "Sample Product 2", enrichedProductData: { _id: "PROD002", name: "Sample Product 2", Color: "[MOCK AI] Ocean Blue" }, aiSuggestions: { Color: "[MOCK AI] Ocean Blue" } }
        // ]);
        // setEnrichmentPreviewOpen(true);
        return; 
    }
    setIsEnriching(true);
    setSnackbar({ open: true, message: `Requesting AI enrichment suggestions for ${selectedProducts.size} product(s)...`, severity: 'info' });
    try {
      const response = await fetch(API_URL_ENRICH_SUGGESTIONS, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productIds: Array.from(selectedProducts) }) });
      const data = await response.json();
      if (!response.ok) { throw new Error(data.error || "Failed to get enrichment suggestions."); }
      setEnrichmentPreviewData(data.enrichedProductsPreview || []);
      const initialEditable = (data.enrichedProductsPreview || []).reduce((acc: Record<string, Record<string, any>>, item: EnrichedProductPreviewItem) => { acc[item._id] = { ...item.aiSuggestions }; return acc; }, {});
      setEditableSuggestions(initialEditable);
      setEnrichmentPreviewOpen(true);
      setSnackbar({ open: true, message: data.message || "Enrichment suggestions received.", severity: 'success' });
    } catch (error) { console.error("Enrichment error:", error); setSnackbar({ open: true, message: error instanceof Error ? error.message : "Failed to process enrichment.", severity: 'error' });
    } finally { setIsEnriching(false); }
  };

  const handleEnrichmentSuggestionChange = (productId: string, attrName: string, value: string) => { setEditableSuggestions(prev => ({ ...prev, [productId]: { ...prev[productId], [attrName]: value } })); };
  const handleCloseEnrichmentPreview = () => { setEnrichmentPreviewOpen(false); setEnrichmentPreviewData([]); setEditableSuggestions({}); };

  const handleApproveEnrichment = async () => {
    const productsToUpdate = enrichmentPreviewData.map(item => {
      const finalProductData = { ...item.enrichedProductData }; 
      if (editableSuggestions[item._id]) { Object.entries(editableSuggestions[item._id]).forEach(([attr, value]) => { finalProductData[attr] = value; }); }
      return finalProductData;
    });
    if (API_URL_SAVE_ENRICHED_PRODUCTS.includes("YOUR_SAVE_ENRICH_API_ID") || API_URL_SAVE_ENRICHED_PRODUCTS.includes("YOUR_API_ID")) { // Check for placeholder
        setSnackbar({ open: true, message: "Save Enriched Products API endpoint not configured.", severity: 'error'}); 
        console.log("Approved Data (not sent):", productsToUpdate); 
        handleCloseEnrichmentPreview(); return; 
    }
    setIsSavingEnrichment(true); 
    setSnackbar({open: true, message: "Saving enriched data...", severity: "info"});
    try {
        const response = await fetch(API_URL_SAVE_ENRICHED_PRODUCTS, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ products: productsToUpdate }) });
        const responseData = await response.json();
        if (!response.ok) { throw new Error(responseData.error || "Failed to save enriched data."); }
        setSnackbar({open: true, message: responseData.message || "Enriched data saved successfully!", severity: "success"});
        fetchProducts(currentPage, filterValues, sortConfig); 
        setSelectedProducts(new Set()); 
    } catch (error) { console.error("Save enrichment error:", error); setSnackbar({open: true, message: error instanceof Error ? error.message : "Failed to save enriched data.", severity: "error"});
    } finally { setIsSavingEnrichment(false); handleCloseEnrichmentPreview(); }
  };

  const prioritizedBaseColumns = ['ProductSKU', 'ProductName']; 
  const otherBaseColumns = ['brand', 'barcode'].filter(name => 
    !prioritizedBaseColumns.some(pbc => pbc.toLowerCase() === name.toLowerCase())
  );

  const dynamicAttributeNames = attributes
    .map(attr => attr.name)
    .filter(name => 
        !prioritizedBaseColumns.some(pbc => pbc.toLowerCase() === name.toLowerCase()) &&
        !otherBaseColumns.some(obc => obc.toLowerCase() === name.toLowerCase())
    ); 
  
  const allDisplayColumns = [...prioritizedBaseColumns, ...otherBaseColumns, ...dynamicAttributeNames];
  const uniqueDisplayColumns = Array.from(new Set(allDisplayColumns)); 

  const totalPages = Math.ceil(totalItems / rowsPerPage);
  
  const baseColumnNamesLowerForFilter = [...prioritizedBaseColumns, ...otherBaseColumns].map(name => name.toLowerCase());
  const dynamicFiltersToShow = attributes
    .filter(attr => attr.isFilterable && !baseColumnNamesLowerForFilter.includes(attr.name.toLowerCase()))
    .slice(0, Math.max(0, 3 - prioritizedBaseColumns.length)); 


  const prioritizedFilters: AttributeDefinition[] = [];
  const productSKUAttr = attributes.find(attr => attr.name.toLowerCase() === 'productsku');
  const productNameAttr = attributes.find(attr => attr.name.toLowerCase() === 'productname');

  if (productSKUAttr && productSKUAttr.isFilterable) {
    prioritizedFilters.push(productSKUAttr);
  }
  if (productNameAttr && productNameAttr.isFilterable && productNameAttr.name.toLowerCase() !== 'productsku') { 
    prioritizedFilters.push(productNameAttr);
  }

  console.log("ProductList Render: isLoading:", isLoading, "paginatedProducts.length:", paginatedProducts.length, "totalItems:", totalItems, "selectedProducts:", selectedProducts);

  return ( <Paper elevation={3} sx={{ p: {xs:2, sm:3}, borderRadius: 3 }}> <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}> <Typography variant="h6" sx={{ color: 'primary.dark' }}>Product List</Typography> <Button variant="contained" color="secondary" startIcon={isEnriching ? <CircularProgress size={20} color="inherit"/> : <EnrichIcon />} onClick={handleEnrichSelectedProducts} disabled={selectedProducts.size === 0 || isLoading || isEnriching} > {isEnriching ? "Fetching Suggestions..." : `Enrich Selected (${selectedProducts.size})`} </Button> </Stack> 
  <Grid container={true} spacing={2} mb={3}> 
    {prioritizedFilters.map(attr => (
      <Grid item={true} xs={12} sm={6} md={4} key={`filter-priority-${attr.name}`}>
        <TextField fullWidth label={`Filter by ${attr.name}`} variant="outlined" size="small" value={filterValues[attr.name] || ''} onChange={(e) => handleFilterChange(attr.name, e.target.value)} />
      </Grid>
    ))}
    {dynamicFiltersToShow.map(attr => ( 
        <Grid item={true} xs={12} sm={6} md={4} key={`filter-dynamic-${attr.name}`}> 
          <TextField fullWidth label={`Filter by ${attr.name}`} variant="outlined" size="small" value={filterValues[attr.name] || ''} onChange={(e) => handleFilterChange(attr.name, e.target.value)} /> 
        </Grid> 
    ))} 
  </Grid> 
  {isLoading && <Box sx={{display: 'flex', justifyContent: 'center', my: 3}}><CircularProgress/></Box>}
  {!isLoading && <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2, maxHeight: 600, overflow: 'auto'}}> <Table stickyHeader sx={{ minWidth: 750 }} aria-label="product table"> <TableHead sx={{ backgroundColor: 'grey.100' }}> <TableRow> <TableCell padding="checkbox"> <Checkbox indeterminate={selectedProducts.size > 0 && selectedProducts.size < paginatedProducts.length && !isAllOnPageSelected} checked={isAllOnPageSelected} onChange={handleSelectAll} disabled={paginatedProducts.length === 0} /> </TableCell> {uniqueDisplayColumns.map(colName => ( <TableCell key={colName} sortDirection={sortConfig?.key === colName ? sortConfig.direction : false}> <Stack direction="row" alignItems="center" onClick={() => handleSort(colName)} sx={{ cursor: 'pointer' }}> <Typography variant="body2" fontWeight="bold">{colName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Typography> {sortConfig?.key === colName && (sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />)} </Stack> </TableCell> ))} <TableCell><Typography variant="body2" fontWeight="bold">Images</Typography></TableCell> </TableRow> </TableHead> <TableBody> {paginatedProducts.length === 0 && !isLoading && ( <TableRow><TableCell colSpan={uniqueDisplayColumns.length + 2} align="center">No products found.</TableCell></TableRow> )} {paginatedProducts.map((product, rowIndex) => { 
    console.log(`ProductList: Rendering row ${rowIndex}, product ID: ${product._id}, product:`, product); 
    return (
    <TableRow key={product._id || product.id || `product-row-${rowIndex}`} hover selected={!!(product._id && selectedProducts.has(product._id))}>
      <TableCell padding="checkbox">
        <Checkbox
          checked={!!(product._id && selectedProducts.has(product._id))}
          onChange={(e) => { 
            console.log(`--- MUI CHECKBOX CLICKED --- Product ID: ${product._id}, Checked: ${e.target.checked}`); 
            if (product._id) {
              handleSelectProduct(product._id);
            } else {
              console.warn("ProductList: Product ID is undefined in simplified onChange", product);
            }
          }}
        />
      </TableCell>
      {uniqueDisplayColumns.map(colName => (
        <TableCell key={`${product._id || product.id}-${colName}`}>
          {typeof product[colName] === 'object' && product[colName] !== null && !Array.isArray(product[colName]) ? JSON.stringify(product[colName]) : Array.isArray(product[colName]) ? (product[colName] as string[]).join('; ') : product[colName] || 'N/A'}
        </TableCell>
      ))}
      <TableCell>
        {product.images && product.images.length > 0 && (
          <img src={product.images[0]} alt={product.ProductName || product.name || 'Product Image'} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/50x50/EEE/AAA?text=No+Img';}} />
        )}
      </TableCell>
    </TableRow>
  );
})} </TableBody> </Table> </TableContainer>}
   <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}> <Typography variant="body2" color="textSecondary"> Page {currentPage + 1} of {totalPages > 0 ? totalPages : 1} ({totalItems} items) </Typography> <Stack direction="row" spacing={1}> <Button onClick={() => setCurrentPage(p => Math.max(p - 1, 0))} disabled={currentPage === 0 || isLoading} size="small">Previous</Button> <Button onClick={() => setCurrentPage(p => Math.min(p + 1, Math.max(0, totalPages -1 )))} disabled={currentPage >= Math.max(0, totalPages -1) || isLoading} size="small">Next</Button> </Stack> </Stack>
      
      <Dialog open={enrichmentPreviewOpen} onClose={handleCloseEnrichmentPreview} maxWidth="lg" fullWidth PaperProps={{sx: {maxHeight: '90vh'}}}>
        <DialogTitle>
          AI Enrichment Suggestions Review
          <IconButton aria-label="close" onClick={handleCloseEnrichmentPreview} sx={{ position: 'absolute', right: 8, top: 8, color: (themeDialog) => themeDialog.palette.common.white }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {isEnriching && <Box sx={{display: 'flex', justifyContent: 'center', my:2}}><CircularProgress/></Box>}
          {!isEnriching && enrichmentPreviewData.length === 0 && <Typography>No AI suggestions were generated for the selected products.</Typography>}
          {!isEnriching && enrichmentPreviewData.map(item => (
            <Paper key={item._id} elevation={2} sx={{p:2, mb:2}}>
              <Typography variant="h6" gutterBottom>Product: {item.originalProductName} <Chip label={`ID: ${item._id}`} size="small" variant="outlined" sx={{ml:1}}/></Typography>
              <List dense>
                {Object.entries(item.aiSuggestions).map(([attrName, suggestedValue]) => {
                  const originalValue = item.enrichedProductData[attrName] !== suggestedValue 
                    ? (item.enrichedProductData[attrName] || "") 
                    : ""; 
                  
                  const displayOriginalValue = Array.isArray(originalValue) ? originalValue.join('; ') : originalValue;
                  const displaySuggestedValue = Array.isArray(suggestedValue) ? suggestedValue.join('; ') : suggestedValue;

                  return (
                    <ListItem key={attrName} divider>
                      <Grid container spacing={1} alignItems="center">
                        <Grid item xs={12} sm={3}>
                          <Typography variant="subtitle2" component="span" sx={{fontWeight: 'bold'}}>{attrName}:</Typography>
                          {originalValue && <Typography variant="caption" color="textSecondary" display="block">Original: {displayOriginalValue || "Empty"}</Typography>}
                        </Grid>
                        <Grid item xs={12} sm={9}>
                           <TextField
                                fullWidth
                                multiline
                                size="small"
                                variant="outlined"
                                label={`Suggested ${attrName}`}
                                value={editableSuggestions[item._id]?.[attrName] ?? displaySuggestedValue ?? ""}
                                onChange={(e) => handleEnrichmentSuggestionChange(item._id, attrName, e.target.value)}
                                sx={{backgroundColor: 'rgba(0, 191, 165, 0.08)'}} 
                            />
                        </Grid>
                      </Grid>
                    </ListItem>
                  );
                })}
                 {Object.keys(item.aiSuggestions).length === 0 && <ListItem><ListItemText primary="No new suggestions were generated by AI for this product."/></ListItem>}
              </List>
            </Paper>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEnrichmentPreview} color="inherit" disabled={isSavingEnrichment}>Cancel</Button>
          <Button 
            onClick={handleApproveEnrichment} 
            variant="contained" 
            color="secondary"
            disabled={enrichmentPreviewData.length === 0 || isSavingEnrichment || isEnriching}
            startIcon={isSavingEnrichment ? <CircularProgress size={20} color="inherit"/> : <ThumbUpAltIcon/>}
          >
            {isSavingEnrichment ? "Saving..." : "Approve & Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
export default ProductList; // Assuming ProductList is the main export for this file
