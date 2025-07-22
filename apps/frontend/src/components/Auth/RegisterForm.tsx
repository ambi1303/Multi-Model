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
  Grid,
  Link,
  Tabs,
  Tab,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText
} from '@mui/material';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, Building, Phone } from 'lucide-react';
import { UserRegister } from '../../types';
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
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  firstName: yup
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s]*$/, 'First name can only contain letters')
    .required('First name is required'),
  lastName: yup
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s]*$/, 'Last name can only contain letters')
    .required('Last name is required'),
  departmentId: yup
    .number()
    .required('Please select a department')
    .min(1, 'Please select a valid department'),
  phoneNumber: yup
    .string()
    .matches(
      /^[\+]?[1-9][\d]{0,15}$/,
      'Please enter a valid phone number (10-16 digits)'
    )
    .required('Phone number is required'),
});

// Improved error handling function
const handleApiError = (error: any): string => {
  if (error.response?.status === 422) {
    const details = error.response.data?.detail;
    if (Array.isArray(details)) {
      return details.map((d: any) => d.msg || d.message).join(', ');
    }
  }
  
  if (error.response?.status === 409) {
    return 'An account with this email already exists. Please use a different email or try logging in.';
  }
  
  if (error.response?.status === 400) {
    return error.response.data?.detail || 'Invalid registration data. Please check your information.';
  }
  
  return error.response?.data?.detail || 
         error.response?.data?.message || 
         'Registration failed. Please try again.';
};

const registerUser = async (userData: any) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

interface Department {
  id: number;
  name: string;
  description?: string;
}

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  departmentId: number;
  phoneNumber: string;
}

export const RegisterForm = () => {
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    watch
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      departmentId: undefined,
      phoneNumber: '',
    }
  });

  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [departmentError, setDepartmentError] = useState<string | null>(null);
  const addNotification = useAppStore((state) => state.addNotification);
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(1);

  // Watch password for real-time validation feedback
  const password = watch('password');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 0) {
      navigate('/login');
    }
  };

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);
        setDepartmentError(null);
        const response = await api.get('/departments');
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setDepartments(response.data);
        } else {
          throw new Error('No departments available');
        }
      } catch (error) {
        console.error('Failed to fetch departments:', error);
        setDepartmentError('Failed to load departments. Please refresh the page.');
        addNotification({
          message: 'Failed to load departments. Please refresh the page and try again.',
          type: 'error',
        });
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [addNotification]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setServerError(null);
      const { confirmPassword, ...registerData } = data;
      
      // Sanitize and format data before sending
      const payload = {
        first_name: registerData.firstName.trim(),
        last_name: registerData.lastName.trim(),
        email: registerData.email.toLowerCase().trim(),
        password: registerData.password,
        phone_number: registerData.phoneNumber.trim(),
        department_id: Number(registerData.departmentId),
      };
      
      console.log('Registering user with payload:', { ...payload, password: '[HIDDEN]' });
      
      await registerUser(payload);
      
      // Reset form on success
      reset();
      
      addNotification({
        message: 'Registration successful! Your employee ID has been automatically generated. Please log in with your new account.',
        type: 'success',
      });
      
      // Navigate to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = handleApiError(error);
      setServerError(errorMessage);
      addNotification({
        message: `Registration failed: ${errorMessage}`,
        type: 'error',
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Helper function to get password strength
  const getPasswordStrength = (password: string) => {
    if (!password) return '';
    if (password.length < 8) return 'Too short';
    
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const score = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (score < 3) return 'Weak';
    if (score === 3) return 'Medium';
    return 'Strong';
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <Box>
      <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 3 }}>
        <Tab label="Sign In" />
        <Tab label="Register" />
      </Tabs>
      
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Typography variant="h5" sx={{ textAlign: 'center', mb: 1, fontWeight: 700 }}>
          Create your account
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'center', mb: 3, color: 'text.secondary' }}>
          Fill in the details below to get started with Mind Matrix.
        </Typography>

        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        {departmentError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {departmentError}
          </Alert>
        )}
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="First Name"
                  fullWidth
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                  InputProps={{ 
                    startAdornment: (
                      <InputAdornment position="start">
                        <UserIcon size={20} />
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Last Name"
                  fullWidth
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                  InputProps={{ 
                    startAdornment: (
                      <InputAdornment position="start">
                        <UserIcon size={20} />
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email Address"
                  type="email"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{ 
                    startAdornment: (
                      <InputAdornment position="start">
                        <Mail size={20} />
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  error={!!errors.password}
                  helperText={
                    errors.password?.message || 
                    (password && `Strength: ${passwordStrength}`)
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={20} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={togglePasswordVisibility} edge="end">
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  fullWidth
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={20} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={toggleConfirmPasswordVisibility} edge="end">
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Controller
              name="phoneNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Phone Number"
                  fullWidth
                  error={!!errors.phoneNumber}
                  helperText={errors.phoneNumber?.message || 'Enter your phone number with country code (e.g., +1234567890)'}
                  InputProps={{ 
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone size={20} />
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.departmentId}>
              <InputLabel id="department-select-label">Department *</InputLabel>
              <Controller
                name="departmentId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={field.value || ''}
                    labelId="department-select-label"
                    label="Department *"
                    disabled={loadingDepartments || departments.length === 0}
                    startAdornment={
                      <InputAdornment position="start">
                        <Building size={20} />
                      </InputAdornment>
                    }
                  >
                    {loadingDepartments ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Loading departments...
                      </MenuItem>
                    ) : departments.length === 0 ? (
                      <MenuItem disabled>
                        No departments available
                      </MenuItem>
                    ) : (
                      departments.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id}>
                          {dept.name}
                          {dept.description && (
                            <Typography variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
                              ({dept.description})
                            </Typography>
                          )}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                )}
              />
              {errors.departmentId && (
                <FormHelperText>{errors.departmentId.message}</FormHelperText>
              )}
            </FormControl>
          </Grid>
        </Grid>
        
        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={isSubmitting || loadingDepartments || departments.length === 0}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{
            mt: 3,
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
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </Button>

        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Already have an account?{' '}
          <Link 
            component="button" 
            type="button"
            onClick={() => navigate('/login')}
            sx={{ cursor: 'pointer' }}
          >
            Sign in here
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterForm;