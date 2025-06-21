import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button, IconButton, InputBase, Link } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import GitHubIcon from '@mui/icons-material/GitHub';
import { styled, alpha } from '@mui/material/styles';
import AdbIcon from '@mui/icons-material/Adb';
import { useNavigate } from 'react-router-dom';
import { Button as PrimeButton } from 'primereact/button';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { useState } from 'react';
import StepperModalWorkflow from './StepperModalWorkflow';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '24ch',
    },
  },
}));

const navLinks = [
  { label: 'Models', href: '#' },
  { label: 'Analysis', href: '#' },
  { label: 'Datasets', href: '#' },
  { label: 'Documentation', href: '#' },
  { label: 'About', href: '#' },
];

function Header() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = React.useState(false);

  const handleGetStarted = () => {
    console.log('Get Started button clicked');
    setShowModal(true);
    setTimeout(() => {
      console.log('showModal state after click:', true);
    }, 0);
  };
  const handleModalHide = () => {
    console.log('StepperModalWorkflow onHide called');
    setShowModal(false);
    setTimeout(() => {
      console.log('showModal state after hide:', false);
    }, 0);
  };

  React.useEffect(() => {
    console.log('Header rendered, showModal:', showModal);
  }, [showModal]);

  return (
    <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#fff' }}>
      <Toolbar sx={{ minHeight: 56, px: 2 }}>
        {/* Logo and Title */}
        <AdbIcon sx={{ mr: 1, color: 'black', fontSize: 28 }} />
        <Typography variant="h6" color="black" noWrap sx={{ fontWeight: 700, mr: 4 }}>
          Multi-Model Sentiment Analysis
        </Typography>
        {/* Navigation Links */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, flexGrow: 1 }}>
          {navLinks.map((link) => (
            <Link key={link.label} href={link.href} underline="none" color="text.primary" sx={{ fontWeight: 500, fontSize: 16, '&:hover': { color: 'primary.main' } }}>
              {link.label}
            </Link>
          ))}
        </Box>
        {/* Search Bar */}
        <Search sx={{ mx: 2, width: 260 }}>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase placeholder="Search models, datasets…" inputProps={{ 'aria-label': 'search' }} />
        </Search>
        {/* GitHub Icon */}
        <IconButton color="inherit" sx={{ color: 'black', mx: 1 }}>
          <GitHubIcon />
        </IconButton>
        {/* Sign In and Get Started Buttons */}
        <Button color="inherit" sx={{ fontWeight: 500, textTransform: 'none', mx: 1 }}>Sign In</Button>
        <PrimeButton label="Get Started" severity="primary" style={{ fontWeight: 700, borderRadius: 8, marginLeft: 8 }} onClick={handleGetStarted} />
        <StepperModalWorkflow visible={showModal} onHide={handleModalHide} />
      </Toolbar>
    </AppBar>
  );
}

export default Header; 