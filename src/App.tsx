/* eslint-disable no-debugger */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
// src/App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider, CssBaseline, Snackbar, Alert } from '@mui/material';

import Layout from './components/Layout'; // Assuming Layout.tsx is in src/components/
import ProductImport from './components/ProductImport';
import AttributeManagement from './components/AttributeManagement';
import ProductList from './components/ProductList';

import { theme } from './styles/theme'; // Assuming theme.ts is in src/styles/
import { API_URL_ATTRIBUTES } from './config/apiConfig'; // Assuming apiConfig.ts is in src/config/
import type { View, Product, AttributeDefinition, SnackbarState } from './types'; // Assuming types are in src/types/index.ts

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('productImport'); // Default view
  const [products, setProducts] = useState<Product[]>([]); 
  const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'info' });

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Fetch attributes once when App mounts, as they are used by multiple components
  useEffect(() => {
    const fetchInitialAttributes = async () => {
        try {
            const response = await fetch(API_URL_ATTRIBUTES);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            setAttributes(result.data || []);
            console.log("App: Initial attributes fetched:", result.data);
        } catch (error) {
            console.error("App: Failed to fetch initial attributes:", error);
            setSnackbar({ open: true, message: error instanceof Error ? error.message : 'Could not load initial attributes.', severity: 'error' });
        }
    };
    fetchInitialAttributes();
  }, []);


  const renderView = () => {
    switch (currentView) {
      case 'productImport':
        return <ProductImport setSnackbar={setSnackbar} />;
      case 'attributeManagement':
        // AttributeManagement fetches its own attributes but also updates the App's state
        // for other components like ProductList to use.
        return <AttributeManagement attributes={attributes} setAttributes={setAttributes} setSnackbar={setSnackbar} />;
      case 'productList':
      default:
        // ProductList uses the attributes from App state for column definitions
        // and can update the App's products state if needed (e.g., after an edit/delete feature is added)
        return <ProductList products={products} setProducts={setProducts} attributes={attributes} setSnackbar={setSnackbar} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout currentView={currentView} onNavigate={setCurrentView}>
        {renderView()}
      </Layout>
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar} 
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled" elevation={6}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default App;



/*
To run this in a Vite + React + TypeScript project:

1.  **Set up Vite:**
    ```bash
    npm create vite@latest my-product-portal-mui -- --template react-ts
    cd my-product-portal-mui
    ```

2.  **Install Material-UI and Icons:**
    ```bash
    npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
    ```
    (or `yarn add ...`)

3.  **Replace `src/App.tsx` with the code above.**

4.  **Replace `src/main.tsx` with:**
    ```typescript
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import App from './App';
    // You can import a global CSS file here if needed, e.g., for fonts like Inter
    // import './index.css'; 

    ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    ```

5.  **(Optional) Add Inter font:**
    Add to your `index.html` in the `<head>`:
    ```html
    <link rel="preconnect" href="[https://fonts.googleapis.com](https://fonts.googleapis.com)">
    <link rel="preconnect" href="[https://fonts.gstatic.com](https://fonts.gstatic.com)" crossorigin>
    <link href="[https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap](https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap)" rel="stylesheet">
    ```
    The theme in the code already specifies 'Inter'.

6.  **Run the development server:**
    ```bash
    npm run dev
    ```
    (or `yarn dev`)

*/
