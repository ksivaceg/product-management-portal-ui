// src/styles/theme.ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: { 
    primary: { main: '#008ae6', light: '#4db2ff', dark: '#006bb3' }, 
    secondary: { main: '#00bfa5' }, 
    background: { default: '#f4f6f8', paper: '#ffffff' },
    error: { main: '#d32f2f' },
    warning: { main: '#ffa000'}, 
    info: { main: '#0288d1'}
  },
  typography: { 
    fontFamily: 'Inter, sans-serif', 
    h5: { fontWeight: 600 }, 
    h6: { fontWeight: 600 }
  },
  components: { 
    MuiButton: { 
      styleOverrides: { 
        root: { 
          borderRadius: 8, 
          textTransform: 'none', 
          padding: '8px 16px' 
        }
      }
    }, 
    MuiTextField: { 
      styleOverrides: { 
        root: { 
          '& .MuiOutlinedInput-root': { 
            borderRadius: 8 
          }
        }
      } 
    }, 
    MuiSelect: { 
      styleOverrides: { 
        root: { 
          borderRadius: 8 
        }
      }
    }, 
    MuiPaper: { 
      styleOverrides: { 
        rounded: { 
          borderRadius: 12 
        }
      }
    }, 
    MuiDialogTitle: { 
      styleOverrides: { 
        root: { 
          backgroundColor: '#008ae6', 
          color: '#ffffff' 
        }
      }
    }, 
    MuiDialogActions: { 
      styleOverrides: { 
        root: { 
          padding: '16px 24px' 
        }
      }
    },
    MuiTab: { 
      styleOverrides: { 
        root: { 
          textTransform: 'none', 
          fontWeight: 'bold' 
        } 
      } 
    }
  }
});
