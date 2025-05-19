/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/Layout.tsx
import React from 'react';
import { Box, AppBar, Toolbar, Typography, Button, Container, Stack } from '@mui/material';
import type { View, LayoutProps } from '../types'; // Assuming types are in src/types/index.ts

const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children }) => { 
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Product Management Portal
          </Typography>
          <Stack direction="row" spacing={{xs: 1, sm: 2}}>
            <Button 
              color="inherit" 
              onClick={() => onNavigate('productList')} 
              variant={currentView === 'productList' ? 'outlined' : 'text'}
              sx={{ borderColor: currentView === 'productList' ? 'rgba(255,255,255,0.7)' : 'transparent' }}
            >
              Product List
            </Button>
            <Button 
              color="inherit" 
              onClick={() => onNavigate('attributeManagement')} 
              variant={currentView === 'attributeManagement' ? 'outlined' : 'text'}
              sx={{ borderColor: currentView === 'attributeManagement' ? 'rgba(255,255,255,0.7)' : 'transparent' }}
            >
              Attributes
            </Button>
            <Button 
              color="inherit" 
              onClick={() => onNavigate('productImport')} 
              variant={currentView === 'productImport' ? 'outlined' : 'text'}
              sx={{ borderColor: currentView === 'productImport' ? 'rgba(255,255,255,0.7)' : 'transparent' }}
            >
              Import
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ flexGrow: 1, py: {xs: 2, sm: 3, md: 4} }}>
        {children}
      </Container>
      <Box component="footer" sx={{ py: 2, textAlign: 'center', backgroundColor: 'grey.200', color: 'text.secondary' }}>
        <Typography variant="body2">&copy; {new Date().getFullYear()} Product Management System. MUI Version.</Typography>
      </Box>
    </Box>
  );
};

export default Layout;