import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Link,
  Tabs,
  Tab
} from '@mui/material';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { UserLogin, User } from '../../types';
import api from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate } from 'react-router-dom';

const schema = yup.object().shape({
  email: yup
    .string()
    .email('Invalid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(1, 'Password is required')
    .required('Password is required'),
});

const loginUser = async (
  userData: UserLogin
): Promise<{ access_token: string }> => {
  const response = await api.post('/auth/login', userData);
  return response.data;
};

const fetchUserProfile = async (token: string): Promise<User> => {
  const response = await api.get<User>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const LoginForm = () => {
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UserLogin>({
    resolver: yupResolver(schema),
    mode: 'onBlur',
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const login = useAppStore((state) => state.actions.login);
  const addNotification = useAppStore((state) => state.addNotification);
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 1) {
      navigate('/register');
    }
  };

  const onSubmit = async (data: UserLogin) => {
    try {
      setServerError(null);
      console.log('Attempting login for:', data.email);
      
      const { access_token } = await loginUser(data);
      console.log('Login successful, fetching user profile...');
      
      const userProfile = await fetchUserProfile(access_token);
      console.log('User profile fetched:', userProfile.email);
      
      login(userProfile, access_token);
      addNotification({
        message: `Welcome back, ${userProfile.firstName}!`,
        type: 'success',
      });
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please check your credentials and try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Authentication service is not available. Please try again later.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message && !error.message.includes('Network Error')) {
        errorMessage = error.message;
      }
      
      setServerError(errorMessage);
      addNotification({
        message: `Login failed: ${errorMessage}`,
        type: 'error',
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box>
      <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 3 }}>
        <Tab label="Sign In" />
        <Tab label="Register" />
      </Tabs>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Controller
            name="email"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                {...field}
                label="Email Address"
                type="email"
                variant="outlined"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={20} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          
          <Controller
            name="password"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                {...field}
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={20} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={togglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControlLabel control={<Checkbox name="remember" />} label="Remember me" />
            <Link href="#" variant="body2">
              Forgot password?
            </Link>
          </Box>
          
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{
              mt: 1,
              py: 1.5,
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1e40af 0%, #5b21b6 100%)',
              }
            }}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </Button>

          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            New to EmotiAnalyze?{' '}
            <Link href="#" onClick={() => navigate('/register')}>
              Register here
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};