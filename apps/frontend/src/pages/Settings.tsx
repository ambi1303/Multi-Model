import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  IconButton,
  Tooltip,
  Slider,
  FormGroup,
  Checkbox,
  RadioGroup,
  Radio,
  FormLabel,
  CircularProgress,
  Snackbar,
  LinearProgress
} from '@mui/material';
import {
  PersonIcon,
  SecurityIcon,
  NotificationsIcon,
  PaletteIcon,
  PrivacyTipIcon,
  SaveIcon,
  EditIcon,
  VisibilityIcon,
  VisibilityOffIcon,
  DeleteIcon,
  DownloadIcon,
  UploadIcon,
  RefreshIcon,
  LockIcon,
  EmailIcon,
  PhoneIcon,
  BusinessIcon,
  SettingsIcon,
  DarkModeIcon,
  LightModeIcon
} from '../utils/icons';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import { User } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface UserPreferences {
  autoSave: boolean;
  showTutorials: boolean;
  defaultAnalysisMode: string;
  language: string;
  timezone: string;
  dateFormat: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  analyticsSharing: boolean;
  dataRetention: number;
  theme: string;
  compactMode: boolean;
  animationsEnabled: boolean;
  soundEnabled: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  loginNotifications: boolean;
  deviceTracking: boolean;
  lastPasswordChange: string;
  activeSessions: number;
}

interface PrivacySettings {
  allowDataCollection: boolean;
  allowAnalysisSharing: boolean;
  shareWithTeam: boolean;
  shareWithManager: boolean;
  anonymizeData: boolean;
  dataExportEnabled: boolean;
  profileVisibility: string;
}

const SettingsPage: React.FC = () => {
  const { user, updatePreferences, preferences } = useAppStore(state => ({
    user: state.user,
    updatePreferences: state.updatePreferences,
    preferences: state.preferences
  }));
  const { mode, toggleTheme } = useTheme();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  // Form states
  const [userProfile, setUserProfile] = useState<Partial<User>>({});
  const [userPrefs, setUserPrefs] = useState<UserPreferences>({
    autoSave: preferences.autoSave,
    showTutorials: preferences.showTutorials,
    defaultAnalysisMode: preferences.defaultAnalysisMode,
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/dd/yyyy',
    emailNotifications: true,
    pushNotifications: true,
    analyticsSharing: false,
    dataRetention: 90,
    theme: mode,
    compactMode: false,
    animationsEnabled: true,
    soundEnabled: true
  });
  
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    loginNotifications: true,
    deviceTracking: true,
    lastPasswordChange: '',
    activeSessions: 1
  });
  
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    allowDataCollection: true,
    allowAnalysisSharing: false,
    shareWithTeam: false,
    shareWithManager: true,
    anonymizeData: false,
    dataExportEnabled: true,
    profileVisibility: 'team'
  });
  
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (user) {
      setUserProfile({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_number: user.phone_number,
        department_id: user.department_id
      });
      
      setPrivacySettings(prev => ({
        ...prev,
        allowDataCollection: user.allow_data_collection || true,
        allowAnalysisSharing: user.allow_analysis_sharing || false
      }));
    }
  }, [user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaveLoading(true);
    try {
      await api.put(`/users/${user.id}`, userProfile);
      setSnackbarMessage('Profile updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to update profile');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaveLoading(true);
    try {
      // Update local preferences
      updatePreferences({
        autoSave: userPrefs.autoSave,
        showTutorials: userPrefs.showTutorials,
        defaultAnalysisMode: userPrefs.defaultAnalysisMode
      });
      
      // If theme changed, apply it
      if (userPrefs.theme !== mode) {
        toggleTheme();
      }
      
      setSnackbarMessage('Preferences saved successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to save preferences');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    if (!user) return;
    
    setSaveLoading(true);
    try {
      await api.put(`/users/${user.id}`, {
        allow_data_collection: privacySettings.allowDataCollection,
        allow_analysis_sharing: privacySettings.allowAnalysisSharing
      });
      
      setSnackbarMessage('Privacy settings updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to update privacy settings');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSnackbarMessage('New passwords do not match');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    setSaveLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });
      
      setChangePasswordDialog(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSnackbarMessage('Password changed successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to change password');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await api.get('/users/export-data', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `user-data-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSnackbarMessage('Data exported successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to export data');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager' || isAdmin;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
          <Tab label="Profile" icon={<PersonIcon />} />
          <Tab label="Preferences" icon={<SettingsIcon />} />
          <Tab label="Security" icon={<SecurityIcon />} />
          <Tab label="Privacy" icon={<PrivacyTipIcon />} />
          <Tab label="Notifications" icon={<NotificationsIcon />} />
        </Tabs>
      </Paper>

      {/* Profile Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar 
                  sx={{ width: 100, height: 100, mx: 'auto', mb: 2, fontSize: '2rem' }}
                >
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  {user?.first_name} {user?.last_name}
                </Typography>
                <Chip 
                  label={user?.role} 
                  color={user?.role === 'admin' ? 'error' : user?.role === 'manager' ? 'warning' : 'primary'}
                  sx={{ mb: 2 }}
                />
                <Box>
                  <Button variant="outlined" startIcon={<UploadIcon />} sx={{ mr: 1 }}>
                    Upload Photo
                  </Button>
                  <Button variant="outlined" startIcon={<DeleteIcon />} color="error">
                    Remove
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="Personal Information" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={userProfile.first_name || ''}
                      onChange={(e) => setUserProfile({...userProfile, first_name: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={userProfile.last_name || ''}
                      onChange={(e) => setUserProfile({...userProfile, last_name: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={userProfile.email || ''}
                      onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                      InputProps={{
                        startAdornment: <EmailIcon sx={{ mr: 1 }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={userProfile.phone_number || ''}
                      onChange={(e) => setUserProfile({...userProfile, phone_number: e.target.value})}
                      InputProps={{
                        startAdornment: <PhoneIcon sx={{ mr: 1 }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Employee ID"
                      value={user?.employee_id || ''}
                      disabled
                      InputProps={{
                        startAdornment: <BusinessIcon sx={{ mr: 1 }} />
                      }}
                    />
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    onClick={handleSaveProfile}
                    disabled={saveLoading}
                    startIcon={saveLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    Save Changes
                  </Button>
                  <Button variant="outlined">
                    Cancel
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Preferences Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Application Preferences" />
              <CardContent>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPrefs.autoSave}
                        onChange={(e) => setUserPrefs({...userPrefs, autoSave: e.target.checked})}
                      />
                    }
                    label="Auto-save work"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPrefs.showTutorials}
                        onChange={(e) => setUserPrefs({...userPrefs, showTutorials: e.target.checked})}
                      />
                    }
                    label="Show tutorials and tips"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPrefs.compactMode}
                        onChange={(e) => setUserPrefs({...userPrefs, compactMode: e.target.checked})}
                      />
                    }
                    label="Compact mode"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPrefs.animationsEnabled}
                        onChange={(e) => setUserPrefs({...userPrefs, animationsEnabled: e.target.checked})}
                      />
                    }
                    label="Enable animations"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPrefs.soundEnabled}
                        onChange={(e) => setUserPrefs({...userPrefs, soundEnabled: e.target.checked})}
                      />
                    }
                    label="Enable sound effects"
                  />
                </FormGroup>
                
                <Divider sx={{ my: 2 }} />
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Default Analysis Mode</InputLabel>
                  <Select
                    value={userPrefs.defaultAnalysisMode}
                    onChange={(e) => setUserPrefs({...userPrefs, defaultAnalysisMode: e.target.value})}
                  >
                    <MenuItem value="webcam">Webcam</MenuItem>
                    <MenuItem value="upload">Upload</MenuItem>
                    <MenuItem value="live">Live Analysis</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={userPrefs.language}
                    onChange={(e) => setUserPrefs({...userPrefs, language: e.target.value})}
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                    <MenuItem value="de">German</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Date Format</InputLabel>
                  <Select
                    value={userPrefs.dateFormat}
                    onChange={(e) => setUserPrefs({...userPrefs, dateFormat: e.target.value})}
                  >
                    <MenuItem value="MM/dd/yyyy">MM/dd/yyyy</MenuItem>
                    <MenuItem value="dd/MM/yyyy">dd/MM/yyyy</MenuItem>
                    <MenuItem value="yyyy-MM-dd">yyyy-MM-dd</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Theme & Display" />
              <CardContent>
                <FormLabel component="legend">Theme</FormLabel>
                <RadioGroup
                  value={userPrefs.theme}
                  onChange={(e) => setUserPrefs({...userPrefs, theme: e.target.value})}
                >
                  <FormControlLabel value="light" control={<Radio />} label="Light" />
                  <FormControlLabel value="dark" control={<Radio />} label="Dark" />
                  <FormControlLabel value="system" control={<Radio />} label="System" />
                </RadioGroup>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography gutterBottom>Data Retention (days)</Typography>
                <Slider
                  value={userPrefs.dataRetention}
                  onChange={(e, value) => setUserPrefs({...userPrefs, dataRetention: value as number})}
                  min={30}
                  max={365}
                  marks={[
                    { value: 30, label: '30' },
                    { value: 90, label: '90' },
                    { value: 180, label: '180' },
                    { value: 365, label: '365' }
                  ]}
                  valueLabelDisplay="auto"
                />
                
                <Box sx={{ mt: 3 }}>
                  <Button 
                    variant="contained" 
                    onClick={handleSavePreferences}
                    disabled={saveLoading}
                    startIcon={saveLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    Save Preferences
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Security Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Password & Authentication" />
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Password"
                      secondary={`Last changed: ${securitySettings.lastPasswordChange || 'Never'}`}
                    />
                    <ListItemSecondaryAction>
                      <Button 
                        variant="outlined" 
                        onClick={() => setChangePasswordDialog(true)}
                        startIcon={<LockIcon />}
                      >
                        Change
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText
                      primary="Two-Factor Authentication"
                      secondary="Add an extra layer of security"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={securitySettings.twoFactorEnabled}
                        onChange={(e) => setSecuritySettings({...securitySettings, twoFactorEnabled: e.target.checked})}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText
                      primary="Login Notifications"
                      secondary="Get notified of new logins"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={securitySettings.loginNotifications}
                        onChange={(e) => setSecuritySettings({...securitySettings, loginNotifications: e.target.checked})}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography gutterBottom>Session Timeout (minutes)</Typography>
                <Slider
                  value={securitySettings.sessionTimeout}
                  onChange={(e, value) => setSecuritySettings({...securitySettings, sessionTimeout: value as number})}
                  min={5}
                  max={120}
                  marks={[
                    { value: 5, label: '5m' },
                    { value: 30, label: '30m' },
                    { value: 60, label: '1h' },
                    { value: 120, label: '2h' }
                  ]}
                  valueLabelDisplay="auto"
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Active Sessions" />
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  You have {securitySettings.activeSessions} active session(s)
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Current Session"
                      secondary="Chrome on Windows - Active now"
                    />
                    <ListItemSecondaryAction>
                      <Chip label="Current" color="success" size="small" />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
                
                <Button variant="outlined" color="error" fullWidth sx={{ mt: 2 }}>
                  Sign Out All Other Sessions
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Privacy Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Data Collection" />
              <CardContent>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={privacySettings.allowDataCollection}
                        onChange={(e) => setPrivacySettings({...privacySettings, allowDataCollection: e.target.checked})}
                      />
                    }
                    label="Allow data collection for analysis"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={privacySettings.allowAnalysisSharing}
                        onChange={(e) => setPrivacySettings({...privacySettings, allowAnalysisSharing: e.target.checked})}
                      />
                    }
                    label="Share analysis data for research"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={privacySettings.anonymizeData}
                        onChange={(e) => setPrivacySettings({...privacySettings, anonymizeData: e.target.checked})}
                      />
                    }
                    label="Anonymize my data"
                  />
                </FormGroup>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="h6" gutterBottom>Data Sharing</Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={privacySettings.shareWithTeam}
                        onChange={(e) => setPrivacySettings({...privacySettings, shareWithTeam: e.target.checked})}
                      />
                    }
                    label="Share with team members"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={privacySettings.shareWithManager}
                        onChange={(e) => setPrivacySettings({...privacySettings, shareWithManager: e.target.checked})}
                      />
                    }
                    label="Share with manager"
                  />
                </FormGroup>
                
                <Box sx={{ mt: 3 }}>
                  <Button 
                    variant="contained" 
                    onClick={handleSavePrivacy}
                    disabled={saveLoading}
                    startIcon={saveLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    Save Privacy Settings
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Data Management" />
              <CardContent>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Export Data"
                      secondary="Download all your data"
                    />
                    <ListItemSecondaryAction>
                      <Button 
                        variant="outlined" 
                        onClick={handleExportData}
                        startIcon={<DownloadIcon />}
                      >
                        Export
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText
                      primary="Delete Account"
                      secondary="Permanently delete your account"
                    />
                    <ListItemSecondaryAction>
                      <Button variant="outlined" color="error" startIcon={<DeleteIcon />}>
                        Delete
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Data exports include all your analysis results, preferences, and account information.
                    Account deletion is permanent and cannot be undone.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Notifications Tab */}
      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Email Notifications" />
              <CardContent>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPrefs.emailNotifications}
                        onChange={(e) => setUserPrefs({...userPrefs, emailNotifications: e.target.checked})}
                      />
                    }
                    label="Email notifications"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Analysis completion alerts"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Weekly summary reports"
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="System maintenance notifications"
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="New feature announcements"
                  />
                </FormGroup>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Push Notifications" />
              <CardContent>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPrefs.pushNotifications}
                        onChange={(e) => setUserPrefs({...userPrefs, pushNotifications: e.target.checked})}
                      />
                    }
                    label="Push notifications"
                  />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Real-time alerts"
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="Reminder notifications"
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="Team activity updates"
                  />
                </FormGroup>
                
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Push notifications require browser permission. Click "Allow" when prompted.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Change Password Dialog */}
      <Dialog 
        open={changePasswordDialog} 
        onClose={() => setChangePasswordDialog(false)} 
        maxWidth="sm" 
        fullWidth
        aria-labelledby="change-password-dialog-title"
        disableRestoreFocus={false}
        keepMounted={false}
      >
        <DialogTitle id="change-password-dialog-title">Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Current Password"
              type={showPassword.current ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                  >
                    {showPassword.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
            
            <TextField
              fullWidth
              label="New Password"
              type={showPassword.new ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                  >
                    {showPassword.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
            
            <TextField
              fullWidth
              label="Confirm New Password"
              type={showPassword.confirm ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                  >
                    {showPassword.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleChangePassword} 
            variant="contained"
            disabled={saveLoading}
          >
            {saveLoading ? <CircularProgress size={20} /> : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage; 