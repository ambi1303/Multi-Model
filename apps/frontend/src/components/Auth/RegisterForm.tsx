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
  InputLabel
} from '@mui/material';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, Building, Phone } from 'lucide-react';
import { UserRegister } from '../../types';
import api from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate } from 'react-router-dom';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm Password is required'),
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  departmentId: yup.number().transform((value, originalValue) => 
    originalValue === '' ? undefined : value
  ).min(1, 'Please select a department').required('Department is required'),
  phoneNumber: yup.string().required('Phone number is required'),
});

const registerUser = async (userData: any) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

interface Department {
  id: number;
  name: string;
  description?: string;
}

export const RegisterForm = () => {
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UserRegister>({
    resolver: yupResolver(schema),
    mode: 'onBlur',
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const addNotification = useAppStore((state) => state.addNotification);
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(1);

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
        const response = await api.get('/departments');
        setDepartments(response.data);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
        addNotification({
          message: 'Failed to load departments. Please refresh the page.',
          type: 'error',
        });
        // Fallback to hardcoded departments if API fails
        setDepartments([
          { id: 13, name: 'Engineering' },
          { id: 14, name: 'Human Resources' },
          { id: 15, name: 'Sales' },
          { id: 16, name: 'Marketing' },
          { id: 17, name: 'IT Department' },
        ]);
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [addNotification]);

  const onSubmit = async (data: UserRegister) => {
    try {
      setServerError(null);
      const { confirmPassword, ...registerData } = data;
      
      // Sanitize data before sending (employee_id and role are auto-generated)
      const payload = {
        first_name: registerData.firstName,
        last_name: registerData.lastName,
        email: registerData.email,
        password: registerData.password,
        phone_number: registerData.phoneNumber,
        department_id: Number(registerData.departmentId),
      };
      
      await registerUser(payload);
      addNotification({
        message: 'Registration successful! Your employee ID has been automatically generated. Please log in with your new account.',
        type: 'success',
      });
      navigate('/login');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || 
        error.response?.data?.message ||
        'Registration failed. Please try again.';
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

  return (
    <Box>
      <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 3 }}>
        <Tab label="Sign In" />
        <Tab label="Register" />
      </Tabs>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Typography variant="h5" sx={{ textAlign: 'center', mb: 1, fontWeight: 700 }}>
          Create your account
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'center', mb: 3, color: 'text.secondary' }}>
          Fill in the details below to get started.
        </Typography>

        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Controller
              name="firstName"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField
                  {...field}
                  label="First Name"
                  fullWidth
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                  InputProps={{ startAdornment: <InputAdornment position="start"><UserIcon size={20} /></InputAdornment> }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="lastName"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Last Name"
                  fullWidth
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                  InputProps={{ startAdornment: <InputAdornment position="start"><UserIcon size={20} /></InputAdornment> }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="email"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email Address"
                  type="email"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Mail size={20} /></InputAdornment> }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="password"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Lock size={20} /></InputAdornment>,
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
              defaultValue=""
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Lock size={20} /></InputAdornment>,
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="phoneNumber"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Phone Number"
                  fullWidth
                  error={!!errors.phoneNumber}
                  helperText={errors.phoneNumber?.message}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Phone size={20} /></InputAdornment> }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.departmentId}>
              <InputLabel id="department-select-label">Department</InputLabel>
                          <Controller
              name="departmentId"
              control={control}
              defaultValue=""
              render={({ field }) => (
                                  <Select
                  {...field}
                  value={field.value || ''}
                  labelId="department-select-label"
                  label="Department"
                  disabled={loadingDepartments}
                  startAdornment={<InputAdornment position="start"><Building size={20} /></InputAdornment>}
                >
                    <MenuItem value={0} disabled>
                      <em>{loadingDepartments ? 'Loading departments...' : 'Select a department...'}</em>
                    </MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.departmentId && <Typography variant="caption" color="error">{errors.departmentId.message}</Typography>}
              {loadingDepartments && (
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                  Loading departments...
                </Typography>
              )}
            </FormControl>
          </Grid>
        </Grid>
        
        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{
            mt: 3,
            py: 1.5,
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1e40af 0%, #5b21b6 100%)',
            }
          }}
        >
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </Button>

        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Already have an account?{' '}
          <Link href="#" onClick={() => navigate('/login')}>
            Sign in here
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterForm;