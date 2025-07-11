import React from 'react';
import { Modal, Box, Typography, Button } from '@mui/material';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate } from 'react-router-dom';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  textAlign: 'center',
};

export const WelcomeModal = () => {
  const { showWelcomeModal, setShowWelcomeModal, user } = useAppStore(state => ({
    showWelcomeModal: state.showWelcomeModal,
    setShowWelcomeModal: state.setShowWelcomeModal,
    user: state.user,
  }));
  const navigate = useNavigate();

  const handleClose = () => {
    setShowWelcomeModal(false);
  };

  const handleContinue = () => {
    setShowWelcomeModal(false);
    navigate('/dashboard');
  };

  return (
    <Modal
      open={showWelcomeModal}
      onClose={handleClose}
      aria-labelledby="welcome-modal-title"
      aria-describedby="welcome-modal-description"
    >
      <Box sx={style}>
        <Typography id="welcome-modal-title" variant="h6" component="h2">
          Welcome, {user?.firstName || 'User'}!
        </Typography>
        <Typography id="welcome-modal-description" sx={{ mt: 2 }}>
          You have successfully logged in.
        </Typography>
        <Button onClick={handleContinue} sx={{ mt: 2 }} variant="contained">
          Continue to Dashboard
        </Button>
      </Box>
    </Modal>
  );
}; 