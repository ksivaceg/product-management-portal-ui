/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
// src/components/AttributeManagement.tsx
import React, { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import {
  Box, Typography, Button, Stack, TextField, Paper, Grid,
  CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch,
  TableContainer, Table, TableHead, TableRow, TableCell, TableBody, IconButton,
  Tooltip
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Close as CloseIcon } from '@mui/icons-material';
import type { AttributeDefinition, AttributeManagementProps, SnackbarState } from '../types';
import { API_URL_ATTRIBUTES } from '../config/apiConfig';

const AttributeManagement: React.FC<AttributeManagementProps> = ({ attributes, setAttributes, setSnackbar }) => { 
  const [openModal, setOpenModal] = useState(false); 
  const [editingAttribute, setEditingAttribute] = useState<AttributeDefinition | null>(null); 
  const [currentName, setCurrentName] = useState(''); 
  const [currentType, setCurrentType] = useState<AttributeDefinition['type']>('short_text'); 
  const [currentOptions, setCurrentOptions] = useState(''); 
  const [currentUnit, setCurrentUnit] = useState(''); 
  const [currentDescription, setCurrentDescription] = useState(''); 
  const [isFilterable, setIsFilterable] = useState(true); 
  const [isSortable, setIsSortable] = useState(true); 
  const [isRequired, setIsRequired] = useState(false); 
  const [isLoading, setIsLoading] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAttributes = useCallback(async () => { 
    setIsLoading(true); 
    try { 
      const response = await fetch(API_URL_ATTRIBUTES); 
      if (!response.ok) { 
        const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` })); 
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      } 
      const result = await response.json(); 
      setAttributes(result.data || []); 
    } catch (error) { 
      console.error("Failed to fetch attributes:", error); 
      setSnackbar({ open: true, message: error instanceof Error ? error.message : 'Could not load attributes.', severity: 'error' }); 
    } finally { 
      setIsLoading(false); 
    } 
  }, [setAttributes, setSnackbar]);
  
  useEffect(() => { fetchAttributes(); }, [fetchAttributes]);

  const resetForm = () => { 
    setCurrentName(''); setCurrentType('short_text'); setCurrentOptions(''); 
    setCurrentUnit(''); setCurrentDescription(''); setIsFilterable(true); 
    setIsSortable(true); setIsRequired(false); setEditingAttribute(null); 
  }; 
  
  const handleOpenModal = (attr?: AttributeDefinition) => { 
    if (attr) { 
      setEditingAttribute(attr); setCurrentName(attr.name); setCurrentType(attr.type); 
      setCurrentOptions(attr.options?.join(', ') || ''); setCurrentUnit(attr.unit || ''); 
      setCurrentDescription(attr.description || ''); 
      setIsFilterable(attr.isFilterable ?? true); setIsSortable(attr.isSortable ?? true); setIsRequired(attr.isRequired ?? false); 
    } else { 
      resetForm(); 
    } 
    setOpenModal(true); 
  }; 
  
  const handleCloseModal = () => { setOpenModal(false); resetForm(); };

  const handleSaveAttribute = async () => { 
    if (!editingAttribute && !currentName.trim()) { setSnackbar({ open: true, message: 'Attribute Name is required.', severity: 'error' }); return; } 
    let payload: Partial<AttributeDefinition> & { name?: string } = { 
      description: currentDescription.trim(), 
      isFilterable, isSortable, isRequired, 
    }; 
    if (editingAttribute) { 
      if (editingAttribute.type === 'single_select' || editingAttribute.type === 'multiple_select') { payload.options = currentOptions.split(',').map(opt => opt.trim()).filter(opt => opt); } 
      if (editingAttribute.type === 'measure') { payload.unit = currentUnit.trim(); } 
    } else { 
      payload.name = currentName.trim(); 
      payload.type = currentType; 
      if (currentType === 'single_select' || currentType === 'multiple_select') { 
        payload.options = currentOptions.split(',').map(opt => opt.trim()).filter(opt => opt); 
        if (!payload.options?.length) { setSnackbar({ open: true, message: 'Options are required for select types.', severity: 'error' }); return; } 
      } 
      if (currentType === 'measure') { 
        payload.unit = currentUnit.trim(); 
        if (!payload.unit) { setSnackbar({ open: true, message: 'Unit is required for measure type.', severity: 'error' }); return; } 
      } 
    } 
    const url = editingAttribute ? `${API_URL_ATTRIBUTES}/${editingAttribute._id}` : API_URL_ATTRIBUTES; 
    const method = editingAttribute ? 'PUT' : 'POST'; 
    setIsSubmitting(true); 
    try { 
      const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), }); 
      const responseData = await response.json(); 
      if (!response.ok) { throw new Error(responseData.error || `HTTP error! status: ${response.status}`); } 
      setSnackbar({ open: true, message: responseData.message || `Attribute ${editingAttribute ? 'updated' : 'created'} successfully.`, severity: 'success' }); 
      fetchAttributes(); handleCloseModal(); 
    } catch (error) { 
      console.error(`Failed to ${editingAttribute ? 'update' : 'create'} attribute:`, error); 
      setSnackbar({ open: true, message: error instanceof Error ? error.message : 'An unexpected error occurred.', severity: 'error' }); 
    } finally { 
      setIsSubmitting(false); 
    } 
  };

  const handleDeleteAttribute = async (attributeId: string) => { 
    setIsSubmitting(true); 
    try { 
      const response = await fetch(`${API_URL_ATTRIBUTES}/${attributeId}`, { method: 'DELETE', }); 
      const responseData = await response.json(); 
      if (!response.ok) { throw new Error(responseData.error || `HTTP error! status: ${response.status}`); } 
      setSnackbar({ open: true, message: responseData.message || 'Attribute Deleted.', severity: 'success' }); 
      fetchAttributes(); 
    } catch (error) { 
      console.error("Failed to delete attribute:", error); 
      setSnackbar({ open: true, message: error instanceof Error ? error.message : 'Could not delete attribute.', severity: 'error' }); 
    } finally { 
      setIsSubmitting(false); 
    } 
  };
  
  return ( 
    <Paper elevation={3} sx={{ p: {xs:2, sm:3}, borderRadius: 3 }}> 
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}> 
        <Typography variant="h6" sx={{ color: 'primary.dark' }}>Manage Attributes</Typography> 
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()} disabled={isLoading}> Add Attribute </Button> 
      </Stack> 
      {isLoading && attributes.length === 0 ? ( <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box> ) : ( 
        <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2, maxHeight: 500, overflow: 'auto'}}> 
          <Table stickyHeader sx={{ minWidth: 650 }} aria-label="attributes table"> 
            <TableHead sx={{ backgroundColor: 'grey.100' }}> 
              <TableRow> 
                <TableCell>Name</TableCell> 
                <TableCell>Type</TableCell> 
                <TableCell>Description</TableCell> 
                <TableCell>Details</TableCell> 
                <TableCell>Filterable</TableCell> 
                <TableCell>Sortable</TableCell> 
                <TableCell>Required</TableCell> 
                <TableCell>Actions</TableCell> 
              </TableRow> 
            </TableHead> 
            <TableBody> 
              {attributes.length === 0 && !isLoading && ( <TableRow><TableCell colSpan={8} align="center">No attributes defined yet.</TableCell></TableRow> )} 
              {attributes.map((attr) => ( 
                <TableRow key={attr._id} hover> 
                  <TableCell>{attr.name}</TableCell> 
                  <TableCell>{attr.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableCell> 
                  <TableCell sx={{maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    <Tooltip title={attr.description || 'No description'}>
                        <span>{attr.description || 'N/A'}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{attr.options ? attr.options.join(', ') : attr.unit || 'N/A'}</TableCell> 
                  <TableCell>{attr.isFilterable ? 'Yes' : 'No'}</TableCell> 
                  <TableCell>{attr.isSortable ? 'Yes' : 'No'}</TableCell> 
                  <TableCell>{attr.isRequired ? 'Yes' : 'No'}</TableCell> 
                  <TableCell> 
                    <Stack direction="row" spacing={1}> 
                      <IconButton size="small" color="primary" onClick={() => handleOpenModal(attr)} disabled={isSubmitting}><EditIcon /></IconButton> 
                      <IconButton size="small" color="error" onClick={() => handleDeleteAttribute(attr._id)} disabled={isSubmitting}><DeleteIcon /></IconButton> 
                    </Stack> 
                  </TableCell> 
                </TableRow> 
              ))} 
            </TableBody> 
          </Table> 
        </TableContainer> 
      )} 
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth PaperProps={{ elevation: 5, sx: { borderRadius: 3 } }}> 
        <DialogTitle> {editingAttribute ? 'Edit' : 'Add New'} Attribute 
          <IconButton aria-label="close" onClick={handleCloseModal} sx={{ position: 'absolute', right: 8, top: 8, color: (themeDialog) => themeDialog.palette.common.white }}> <CloseIcon /> </IconButton> 
        </DialogTitle> 
        <DialogContent dividers> 
          <Stack spacing={3} pt={2}> 
            <TextField required={!editingAttribute} disabled={!!editingAttribute} name="name" label="Attribute Name" value={currentName} onChange={(e) => setCurrentName(e.target.value)} fullWidth placeholder="e.g., Color, Item Weight" helperText={editingAttribute ? "Name cannot be changed after creation." : ""} /> 
            <FormControl fullWidth required disabled={!!editingAttribute}> 
              <InputLabel id="attribute-type-label">Attribute Type</InputLabel> 
              <Select<AttributeDefinition['type']> labelId="attribute-type-label" name="type" value={currentType} label="Attribute Type" onChange={(e) => setCurrentType(e.target.value as AttributeDefinition['type'])} > 
                <MenuItem value="short_text">Short Text</MenuItem> <MenuItem value="long_text">Long Text</MenuItem> <MenuItem value="rich_text">Rich Text (HTML)</MenuItem> <MenuItem value="number">Number</MenuItem> <MenuItem value="single_select">Single Select</MenuItem> <MenuItem value="multiple_select">Multiple Select</MenuItem> <MenuItem value="measure">Measure</MenuItem> 
              </Select> 
              {editingAttribute && <Typography variant="caption" color="textSecondary" sx={{mt:1}}>Type cannot be changed after creation.</Typography>} 
            </FormControl> 
            <TextField 
              name="description" 
              label="Description (for AI Enrichment)" 
              value={currentDescription} 
              onChange={(e) => setCurrentDescription(e.target.value)} 
              fullWidth 
              multiline 
              rows={3}
              placeholder="e.g., The primary color of the product." 
            />
            {(currentType === 'single_select' || currentType === 'multiple_select') && ( <TextField name="options" label="Options (comma-separated)" value={currentOptions} onChange={(e) => setCurrentOptions(e.target.value)} fullWidth placeholder="e.g., Red, Green, Blue" required /> )} 
            {currentType === 'measure' && ( <TextField name="unit" label="Unit" value={currentUnit} onChange={(e) => setCurrentUnit(e.target.value)} fullWidth placeholder="e.g., KG, CM, USD" required /> )} 
            <FormControlLabel control={<Switch checked={isFilterable} onChange={(e) => setIsFilterable(e.target.checked)} color="primary" />} label="Is Filterable?" /> 
            <FormControlLabel control={<Switch checked={isSortable} onChange={(e) => setIsSortable(e.target.checked)} color="primary" />} label="Is Sortable?" /> 
            <FormControlLabel control={<Switch checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} color="primary" />} label="Is Required?" /> 
          </Stack> 
        </DialogContent> 
        <DialogActions> 
          <Button onClick={handleCloseModal} color="inherit" disabled={isSubmitting}>Cancel</Button> 
          <Button onClick={handleSaveAttribute} variant="contained" disabled={isSubmitting}> {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (editingAttribute ? 'Save Changes' : 'Create Attribute')} </Button> 
        </DialogActions> 
      </Dialog> 
    </Paper> 
  );
};
export default AttributeManagement; // Assuming AttributeManagement is the main export for this file
