import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
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
  Slider,
  FormGroup,
  RadioGroup,
  Radio,
  FormLabel,
  CircularProgress,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  PersonIcon,
  SecurityIcon,
  NotificationsIcon,
  PrivacyTipIcon,
  SaveIcon,
  VisibilityIcon,
  VisibilityOffIcon,
  DeleteIcon,
  DownloadIcon,
  UploadIcon,
  LockIcon,
  EmailIcon,
  PhoneIcon,
  BusinessIcon,
  SettingsIcon,
  DevicesIcon,
  KeyIcon,
  HistoryIcon,
  WarningIcon,
  CheckCircleIcon,
  ExpandMoreIcon,
  RefreshIcon,
} from '../../utils/icons';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import { User } from '../../types';

interface ActiveSession {
  id: string;
  device: string;
  location: string;
  ip_address: string;
  last_activity: string;
  is_current: boolean;
  user_agent: string;
}

interface LoginAttempt {
  id: string;
  timestamp: string;
  ip_address: string;
  success: boolean;
  user_agent: string;
  location?: string;
}

interface DataExportRequest {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  download_url?: string;
}

interface EnhancedUserSettingsProps {
  user: User | null;
  onUserUpdate: (user: User) => void;
}

export const EnhancedUserSettings: React.FC<EnhancedUserSettingsProps> = ({
  user,
  onUserUpdate
}) => {
  const { mode, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Security data
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [dataExportRequests, setDataExportRequests] = useState<DataExportRequest[]>([]);

  // Form states
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    employee_id: user?.employee_id || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [preferences, setPreferences] = useState({
    email_notifications: true,
    push_notifications: true,
    marketing_emails: false,
    analytics_sharing: false,
    session_timeout: 60,
    theme_preference: mode,
    language: 'en',
    timezone: 'UTC',
    data_retention: 365,
  });

  // Dialog states
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);
  const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);
  const [exportDataDialog, setExportDataDialog] = useState(false);

  // Security settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      const [sessionsRes, attemptsRes, exportsRes] = await Promise.allSettled([
        api.get('/enhanced-security/sessions'),
        api.get('/enhanced-security/login-attempts'),
        api.get('/enhanced-security/data-exports')
      ]);

      if (sessionsRes.status === 'fulfilled') {
        setActiveSessions(sessionsRes.value.data);
      }
      if (attemptsRes.status === 'fulfilled') {
        setLoginAttempts(attemptsRes.value.data);
      }
      if (exportsRes.status === 'fulfilled') {
        setDataExportRequests(exportsRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load security data:', err);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      const response = await api.put(`/users/${user?.id}`, profileForm);
      onUserUpdate(response.data);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError('Failed to update profile');
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await api.post('/enhanced-security/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setSuccess('Password changed successfully');
      setChangePasswordDialog(false);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setError('Failed to change password');
      console.error('Password change error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    try {
      setLoading(true);
      await api.put('/users/preferences', preferences);
      setSuccess('Preferences updated successfully');
    } catch (err) {
      setError('Failed to update preferences');
      console.error('Preferences update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionTermination = async (sessionId: string) => {
    try {
      await api.delete(`/enhanced-security/sessions/${sessionId}`);
      await loadSecurityData();
      setSuccess('Session terminated successfully');
    } catch (err) {
      setError('Failed to terminate session');
      console.error('Session termination error:', err);
    }
  };

  const handleDataExport = async (exportType: string) => {
    try {
      setLoading(true);
      await api.post('/enhanced-security/export-data', { type: exportType });
      await loadSecurityData();
      setSuccess('Data export request submitted');
      setExportDataDialog(false);
    } catch (err) {
      setError('Failed to request data export');
      console.error('Data export error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    try {
      setLoading(true);
      await api.delete(`/users/${user?.id}`);
      setSuccess('Account deletion request submitted');
      setDeleteAccountDialog(false);
    } catch (err) {
      setError('Failed to delete account');
      console.error('Account deletion error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('Mobile')) return '📱';
    if (userAgent.includes('Tablet')) return '📲';
    return '💻';
  };

  const getLocationFromIP = (ip: string) => {
    // In a real app, this would use a geolocation service
    return 'Unknown Location';
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      {error && (
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      )}
      
      {success && (
        <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </Snackbar>
      )}

      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        ⚙️ Enhanced Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<PersonIcon />}
              title="Profile Information"
              subheader="Manage your personal information"
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={profileForm.phone_number}
                    onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Employee ID"
                    value={profileForm.employee_id}
                    onChange={(e) => setProfileForm({ ...profileForm, employee_id: e.target.value })}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleProfileUpdate}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<SecurityIcon />}
              title="Account Security"
              subheader="Manage your account security"
            />
            <CardContent>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Password"
                    secondary="Change your account password"
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setChangePasswordDialog(true)}
                    >
                      Change
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Two-Factor Authentication"
                    secondary={twoFactorEnabled ? "Enabled" : "Disabled"}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={twoFactorEnabled}
                      onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Session Timeout"
                    secondary={`${preferences.session_timeout} minutes`}
                  />
                </ListItem>
                <ListItem>
                  <Slider
                    value={preferences.session_timeout}
                    onChange={(_, value) => setPreferences({ ...preferences, session_timeout: value as number })}
                    min={15}
                    max={480}
                    step={15}
                    marks={[
                      { value: 15, label: '15m' },
                      { value: 60, label: '1h' },
                      { value: 240, label: '4h' },
                      { value: 480, label: '8h' },
                    ]}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Sessions */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              avatar={<DevicesIcon />}
              title="Active Sessions"
              subheader="Manage your active login sessions"
              action={
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={loadSecurityData}
                  size="small"
                >
                  Refresh
                </Button>
              }
            />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Device</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Last Activity</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography>{getDeviceIcon(session.user_agent)}</Typography>
                            <Box>
                              <Typography variant="body2">{session.device}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {session.ip_address}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{session.location}</TableCell>
                        <TableCell>
                          {new Date(session.last_activity).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {session.is_current ? (
                            <Chip label="Current" color="success" size="small" />
                          ) : (
                            <Chip label="Active" color="primary" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          {!session.is_current && (
                            <Button
                              size="small"
                              color="error"
                              onClick={() => handleSessionTermination(session.id)}
                            >
                              Terminate
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Privacy & Notifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<NotificationsIcon />}
              title="Notifications & Privacy"
              subheader="Control your notification preferences"
            />
            <CardContent>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.email_notifications}
                      onChange={(e) => setPreferences({ ...preferences, email_notifications: e.target.checked })}
                    />
                  }
                  label="Email Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.push_notifications}
                      onChange={(e) => setPreferences({ ...preferences, push_notifications: e.target.checked })}
                    />
                  }
                  label="Push Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.marketing_emails}
                      onChange={(e) => setPreferences({ ...preferences, marketing_emails: e.target.checked })}
                    />
                  }
                  label="Marketing Emails"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.analytics_sharing}
                      onChange={(e) => setPreferences({ ...preferences, analytics_sharing: e.target.checked })}
                    />
                  }
                  label="Share Analytics Data"
                />
              </FormGroup>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handlePreferencesUpdate}
                  disabled={loading}
                  fullWidth
                >
                  Save Preferences
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Data Management */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<DownloadIcon />}
              title="Data Management"
              subheader="Export or delete your data"
            />
            <CardContent>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Export Data"
                    secondary="Download your personal data"
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setExportDataDialog(true)}
                    >
                      Export
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Data Retention"
                    secondary={`Keep data for ${preferences.data_retention} days`}
                  />
                </ListItem>
                <ListItem>
                  <Slider
                    value={preferences.data_retention}
                    onChange={(_, value) => setPreferences({ ...preferences, data_retention: value as number })}
                    min={30}
                    max={730}
                    step={30}
                    marks={[
                      { value: 30, label: '30d' },
                      { value: 90, label: '90d' },
                      { value: 365, label: '1y' },
                      { value: 730, label: '2y' },
                    ]}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Delete Account"
                    secondary="Permanently delete your account"
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => setDeleteAccountDialog(true)}
                    >
                      Delete
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Login Attempts */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">🔐 Recent Login Attempts</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>IP Address</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Device</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loginAttempts.slice(0, 10).map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell>{new Date(attempt.timestamp).toLocaleString()}</TableCell>
                        <TableCell>{attempt.ip_address}</TableCell>
                        <TableCell>{attempt.location || 'Unknown'}</TableCell>
                        <TableCell>
                          <Chip
                            label={attempt.success ? 'Success' : 'Failed'}
                            color={attempt.success ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {attempt.user_agent.substring(0, 50)}...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordDialog} onClose={() => setChangePasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Password"
                type={showPassword ? 'text' : 'password'}
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordDialog(false)}>Cancel</Button>
          <Button onClick={handlePasswordChange} variant="contained" disabled={loading}>
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Data Dialog */}
      <Dialog open={exportDataDialog} onClose={() => setExportDataDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export Personal Data</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Choose what data you'd like to export:
          </Typography>
          <FormGroup>
            <FormControlLabel control={<Switch defaultChecked />} label="Profile Information" />
            <FormControlLabel control={<Switch defaultChecked />} label="Analysis History" />
            <FormControlLabel control={<Switch defaultChecked />} label="Session Data" />
            <FormControlLabel control={<Switch />} label="System Logs" />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDataDialog(false)}>Cancel</Button>
          <Button onClick={() => handleDataExport('full')} variant="contained" disabled={loading}>
            {loading ? 'Processing...' : 'Export Data'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteAccountDialog} onClose={() => setDeleteAccountDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>⚠️ Delete Account</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action cannot be undone. All your data will be permanently deleted.
          </Alert>
          <Typography>
            Are you sure you want to delete your account? This will:
          </Typography>
          <List dense>
            <ListItem>• Remove all your personal data</ListItem>
            <ListItem>• Delete all analysis history</ListItem>
            <ListItem>• Terminate all active sessions</ListItem>
            <ListItem>• Cancel any pending data exports</ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAccountDialog(false)}>Cancel</Button>
          <Button onClick={handleAccountDeletion} color="error" variant="contained" disabled={loading}>
            {loading ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 