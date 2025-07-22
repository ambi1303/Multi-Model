import React, { useState, useEffect } from 'react';
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
  Tab,
  Divider
} from '@mui/material';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { UserLogin, User } from '../../types';
import api from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate } from 'react-router-dom';

// Improved validation schema
const schema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  rememberMe: yup.boolean().optional(),
});

// Improved error handling function
const handleApiError = (error: any): string => {
  if (error.response?.status === 401) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  if (error.response?.status === 429) {
    return 'Too many login attempts. Please wait a few minutes before trying again.';
  }
  
  if (error.response?.status === 403) {
    return 'Your account has been temporarily suspended. Please contact support.';
  }
  
  if (error.response?.status === 422) {
    const details = error.response.data?.detail;
    if (Array.isArray(details)) {
      return details.map((d: any) => d.msg || d.message).join(', ');
    }
    return 'Invalid login data. Please check your information.';
  }
  
  if (error.response?.status === 500) {
    return 'Server error. Please try again in a few moments.';
  }
  
  if (error.response?.status === 503) {
    return 'Service temporarily unavailable. Please try again later.';
  }
  
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  
  return error.response?.data?.detail || 
         error.response?.data?.message || 
         'Login failed. Please try again.';
};

const loginUser = async (userData: UserLogin): Promise<{ access_token: string }> => {
  const response = await api.post('/auth/login', userData);
  return response.data;
};

const fetchUserProfile = async (token: string): Promise<User> => {
  const response = await api.get<User>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

// Local storage keys
const STORAGE_KEYS = {
  REMEMBER_EMAIL: 'loginForm_rememberEmail',
  REMEMBER_ME: 'loginForm_rememberMe',
} as const;

export const LoginForm = () => {
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    }
  });

  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimer, setBlockTimer] = useState(0);
  
  const login = useAppStore((state) => state.actions.login);
  const addNotification = useAppStore((state) => state.addNotification);
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  // Watch form values for real-time updates
  const rememberMe = watch('rememberMe');
  const email = watch('email');

  // Load saved email on component mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(STORAGE_KEYS.REMEMBER_EMAIL);
      const wasRemembered = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
      
      if (savedEmail && wasRemembered) {
        setValue('email', savedEmail);
        setValue('rememberMe', true);
      }
    } catch (error) {
      console.warn('Failed to load saved login preferences:', error);
    }
  }, [setValue]);

  // Save/remove email based on remember me preference
  useEffect(() => {
    try {
      if (rememberMe && email) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_EMAIL, email);
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
      } else if (!rememberMe) {
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_EMAIL);
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
      }
    } catch (error) {
      console.warn('Failed to save login preferences:', error);
    }
  }, [rememberMe, email]);

  // Handle blocking after multiple failed attempts
  useEffect(() => {
    if (loginAttempts >= 3) {
      setIsBlocked(true);
      setBlockTimer(30); // 30 seconds block
      
      const interval = setInterval(() => {
        setBlockTimer((prev) => {
          if (prev <= 1) {
            setIsBlocked(false);
            setLoginAttempts(0);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [loginAttempts]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 1) {
      navigate('/register');
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    if (isBlocked) {
      addNotification({
        message: `Too many failed attempts. Please wait ${blockTimer} seconds.`,
        type: 'error',
      });
      return;
    }

    try {
      setServerError(null);
      console.log('Attempting login for:', data.email);
      
      const loginData: UserLogin = {
        email: data.email.toLowerCase().trim(),
        password: data.password,
      };
      
      const { access_token } = await loginUser(loginData);
      console.log('Login successful, fetching user profile...');
      
      const userProfile = await fetchUserProfile(access_token);
      console.log('User profile fetched:', userProfile.email);
      
      // Reset login attempts on successful login
      setLoginAttempts(0);
      setIsBlocked(false);
      
      // Handle remember me functionality
      if (data.rememberMe) {
        try {
          localStorage.setItem(STORAGE_KEYS.REMEMBER_EMAIL, data.email);
          localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
        } catch (error) {
          console.warn('Failed to save remember me preference:', error);
        }
      }
      
      login(userProfile, access_token);
      
      addNotification({
        message: `Welcome back, ${userProfile.first_name}!`,
        type: 'success',
      });
      
      // Clear form on successful login
      reset();
      
      // Navigate to dashboard or intended route
      navigate('/dashboard');
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Increment login attempts for certain error types
      if (error.response?.status === 401 || error.response?.status === 422) {
        setLoginAttempts(prev => prev + 1);
      }
      
      const errorMessage = handleApiError(error);
      setServerError(errorMessage);
      
      addNotification({
        message: errorMessage,
        type: 'error',
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = () => {
    // Navigate to forgot password page or show forgot password modal
    navigate('/forgot-password');
  };

  const clearForm = () => {
    reset();
    setServerError(null);
    setLoginAttempts(0);
    setIsBlocked(false);
    try {
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_EMAIL);
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
    } catch (error) {
      console.warn('Failed to clear saved preferences:', error);
    }
  };

  return (
    <Box>
      <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 3 }}>
        <Tab label="Sign In" />
        <Tab label="Register" />
      </Tabs>
      
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Typography variant="h5" sx={{ textAlign: 'center', mb: 1, fontWeight: 700 }}>
          Welcome back
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'center', mb: 3, color: 'text.secondary' }}>
          Sign in to your Mind Matrix account
        </Typography>

        {serverError && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            icon={<AlertCircle size={20} />}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => setServerError(null)}
              >
                Dismiss
              </Button>
            }
          >
            {serverError}
          </Alert>
        )}

        {isBlocked && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Too many failed login attempts. Please wait {blockTimer} seconds before trying again.
          </Alert>
        )}

        {loginAttempts > 0 && !isBlocked && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Failed attempts: {loginAttempts}/3. Account will be temporarily blocked after 3 failed attempts.
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email Address"
                type="email"
                variant="outlined"
                fullWidth
                disabled={isBlocked}
                error={!!errors.email}
                helperText={errors.email?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={20} />
                    </InputAdornment>
                  ),
                }}
                autoComplete="email"
                autoFocus
              />
            )}
          />
          
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                disabled={isBlocked}
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
                        disabled={isBlocked}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                autoComplete="current-password"
              />
            )}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Controller
              name="rememberMe"
              control={control}
              render={({ field }) => (
                <FormControlLabel 
                  control={
                    <Checkbox 
                      {...field}
                      checked={field.value}
                      disabled={isBlocked}
                    />
                  } 
                  label="Remember me" 
                />
              )}
            />
            <Link 
              component="button"
              type="button"
              variant="body2"
              onClick={handleForgotPassword}
              disabled={isBlocked}
              sx={{ 
                cursor: isBlocked ? 'not-allowed' : 'pointer',
                opacity: isBlocked ? 0.5 : 1,
              }}
            >
              Forgot password?
            </Link>
          </Box>
          
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isSubmitting || isBlocked}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{
              mt: 1,
              py: 1.5,
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1e40af 0%, #5b21b6 100%)',
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
              }
            }}
          >
            {isSubmitting ? 'Signing In...' : isBlocked ? `Wait ${blockTimer}s` : 'Sign In'}
          </Button>

          {/* Clear form button for development/testing */}
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="text"
              onClick={clearForm}
              size="small"
              sx={{ mt: 1 }}
            >
              Clear Form & Preferences
            </Button>
          )}

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              New to Mind Matrix?
            </Typography>
          </Divider>

          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            <Link 
              component="button"
              type="button"
              onClick={() => navigate('/register')}
              sx={{ cursor: 'pointer', fontWeight: 500 }}
            >
              Create your account here
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};