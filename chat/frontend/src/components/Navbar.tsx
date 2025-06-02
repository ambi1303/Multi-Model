import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Mental State Analyzer
        </Typography>
        <Box>
          <Button color="inherit" component={RouterLink} to="/">
            Home
          </Button>
          <Button color="inherit" component={RouterLink} to="/analysis">
            Analysis
          </Button>
          <Button color="inherit" component={RouterLink} to="/history">
            History
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 