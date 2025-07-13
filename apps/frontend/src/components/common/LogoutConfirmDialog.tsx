import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { LogOutIcon, AlertTriangleIcon } from '../../utils/icons';

interface LogoutConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string | null;
  isLoading?: boolean;
}

export const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  userName,
  isLoading = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="logout-dialog-title"
      aria-describedby="logout-dialog-description"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="logout-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LogOutIcon />
          <Typography variant="h6" component="span">
            Confirm Logout
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <DialogContentText id="logout-dialog-description">
          {userName ? (
            <>
              Are you sure you want to log out, <strong>{userName}</strong>?
            </>
          ) : (
            'Are you sure you want to log out?'
          )}
        </DialogContentText>
        
        <Alert 
          severity="info" 
          icon={<AlertTriangleIcon />}
          sx={{ mt: 2 }}
        >
          <Typography variant="body2">
            <strong>What happens when you log out:</strong>
          </Typography>
          <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>Your current session will be terminated</li>
            <li>All analysis history will be cleared from this device</li>
            <li>You'll need to log in again to access your data</li>
            <li>Any unsaved work may be lost</li>
          </Typography>
        </Alert>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color="error"
          disabled={isLoading}
          startIcon={<LogOutIcon />}
        >
          {isLoading ? 'Logging out...' : 'Log Out'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 