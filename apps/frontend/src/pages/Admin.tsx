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
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondary,
  Badge,
  Avatar
} from '@mui/material';
import {
  PersonIcon,
  BusinessIcon,
  SecurityIcon,
  AnalyticsIcon,
  SettingsIcon,
  RefreshIcon,
  EditIcon,
  DeleteIcon,
  AddIcon,
  VisibilityIcon,
  BlockIcon,
  CheckCircleIcon,
  ErrorIcon,
  WarningIcon,
  InfoIcon
} from '../utils/icons';
import { useAppStore } from '../store/useAppStore';
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
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface Department {
  id: number;
  name: string;
  description: string;
  user_count?: number;
  created_at: string;
  updated_at: string;
}

interface AuditLog {
  id: number;
  user_id: string;
  action: string;
  details: any;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

interface SystemHealth {
  service: string;
  status: string;
  latency?: number;
  version?: string;
  lastChecked: string;
}

interface UserStats {
  total_users: number;
  active_users: number;
  by_role: Record<string, number>;
  by_department: Record<string, number>;
  recent_registrations: number;
}

const AdminPage: React.FC = () => {
  const { user } = useAppStore(state => ({ user: state.user }));
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  
  // Pagination states
  const [userPage, setUserPage] = useState(0);
  const [userRowsPerPage, setUserRowsPerPage] = useState(10);
  const [auditPage, setAuditPage] = useState(0);
  const [auditRowsPerPage, setAuditRowsPerPage] = useState(10);
  
  // Dialog states
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [createDepartmentDialog, setCreateDepartmentDialog] = useState(false);
  const [newDepartment, setNewDepartment] = useState({ name: '', description: '' });

  // Check if user has admin access
  const hasAdminAccess = user?.role === 'admin';
  const hasManagerAccess = user?.role === 'manager' || hasAdminAccess;

  useEffect(() => {
    if (!hasManagerAccess) {
      setError('Access denied. Admin or Manager role required.');
      setLoading(false);
      return;
    }
    
    loadInitialData();
  }, [hasManagerAccess]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUsers(),
        loadDepartments(),
        loadAuditLogs(),
        loadSystemHealth(),
        loadUserStats()
      ]);
    } catch (err) {
      setError('Failed to load admin data');
      console.error('Admin data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/users', {
        params: { skip: userPage * userRowsPerPage, limit: userRowsPerPage }
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await api.get('/audit/logs', {
        params: { skip: auditPage * auditRowsPerPage, limit: auditRowsPerPage }
      });
      setAuditLogs(response.data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  const loadSystemHealth = async () => {
    try {
      const response = await api.get('/health');
      const healthData = response.data;
      
      // Transform health data into array format
      const healthArray: SystemHealth[] = [];
      if (healthData.services) {
        Object.entries(healthData.services).forEach(([service, status]: [string, any]) => {
          healthArray.push({
            service,
            status: status.status || 'unknown',
            latency: status.latency,
            version: status.version,
            lastChecked: status.lastChecked || new Date().toISOString()
          });
        });
      }
      
      setSystemHealth(healthArray);
    } catch (err) {
      console.error('Failed to load system health:', err);
    }
  };

  const loadUserStats = async () => {
    try {
      // This would be a custom endpoint for user statistics
      // For now, we'll calculate from the users data
      const response = await api.get('/users');
      const allUsers = response.data;
      
      const stats: UserStats = {
        total_users: allUsers.length,
        active_users: allUsers.filter((u: User) => u.is_active).length,
        by_role: {},
        by_department: {},
        recent_registrations: allUsers.filter((u: User) => {
          const createdAt = new Date(u.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return createdAt > weekAgo;
        }).length
      };
      
      // Count by role
      allUsers.forEach((u: User) => {
        stats.by_role[u.role] = (stats.by_role[u.role] || 0) + 1;
      });
      
      // Count by department
      allUsers.forEach((u: User) => {
        const deptId = u.department_id?.toString() || 'unassigned';
        stats.by_department[deptId] = (stats.by_department[deptId] || 0) + 1;
      });
      
      setUserStats(stats);
    } catch (err) {
      console.error('Failed to load user stats:', err);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUserDialog(true);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      await api.put(`/users/${updatedUser.id}`, updatedUser);
      await loadUsers();
      setEditUserDialog(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  const handleCreateDepartment = async () => {
    try {
      await api.post('/departments', newDepartment);
      await loadDepartments();
      setCreateDepartmentDialog(false);
      setNewDepartment({ name: '', description: '' });
    } catch (err) {
      console.error('Failed to create department:', err);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'manager': return 'warning';
      case 'analyst': return 'info';
      case 'employee': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'degraded': return 'warning';
      case 'unhealthy': return 'error';
      default: return 'default';
    }
  };

  if (!hasManagerAccess) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Access Denied</Typography>
          <Typography>You need Admin or Manager privileges to access this page.</Typography>
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography>{error}</Typography>
        </Alert>
        <Button onClick={loadInitialData} variant="contained" startIcon={<RefreshIcon />}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PersonIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Users</Typography>
              </Box>
              <Typography variant="h4">{userStats?.total_users || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                {userStats?.recent_registrations || 0} new this week
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Active Users</Typography>
              </Box>
              <Typography variant="h4">{userStats?.active_users || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                {userStats ? Math.round((userStats.active_users / userStats.total_users) * 100) : 0}% of total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BusinessIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Departments</Typography>
              </Box>
              <Typography variant="h4">{departments.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Active departments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SecurityIcon sx={{ mr: 1 }} />
                <Typography variant="h6">System Health</Typography>
              </Box>
              <Typography variant="h4">
                {systemHealth.filter(s => s.status === 'healthy').length}/{systemHealth.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Services online
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
          <Tab label="Users" icon={<PersonIcon />} />
          <Tab label="Departments" icon={<BusinessIcon />} />
          <Tab label="System Health" icon={<SecurityIcon />} />
          <Tab label="Audit Logs" icon={<AnalyticsIcon />} />
        </Tabs>
      </Paper>

      {/* Users Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">User Management</Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={loadUsers}
          >
            Refresh
          </Button>
        </Box>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2 }}>{user.first_name[0]}</Avatar>
                      <Box>
                        <Typography variant="body2">{user.first_name} {user.last_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.employee_id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role} 
                      color={getRoleColor(user.role) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {departments.find(d => d.id === user.department_id)?.name || 'Unassigned'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.is_active ? 'Active' : 'Inactive'}
                      color={user.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit User">
                      <IconButton onClick={() => handleEditUser(user)} size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View Details">
                      <IconButton size="small">
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={users.length}
            rowsPerPage={userRowsPerPage}
            page={userPage}
            onPageChange={(event, newPage) => setUserPage(newPage)}
            onRowsPerPageChange={(event) => {
              setUserRowsPerPage(parseInt(event.target.value, 10));
              setUserPage(0);
            }}
          />
        </TableContainer>
      </TabPanel>

      {/* Departments Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Department Management</Typography>
          {hasAdminAccess && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDepartmentDialog(true)}
            >
              Create Department
            </Button>
          )}
        </Box>
        
        <Grid container spacing={3}>
          {departments.map((dept) => (
            <Grid item xs={12} md={6} key={dept.id}>
              <Card>
                <CardHeader
                  title={dept.name}
                  subheader={`Created: ${new Date(dept.created_at).toLocaleDateString()}`}
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {dept.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">
                      Users: {userStats?.by_department[dept.id.toString()] || 0}
                    </Typography>
                    {hasAdminAccess && (
                      <Box>
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* System Health Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">System Health</Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={loadSystemHealth}
          >
            Refresh
          </Button>
        </Box>
        
        <Grid container spacing={3}>
          {systemHealth.map((service) => (
            <Grid item xs={12} md={6} key={service.service}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">{service.service}</Typography>
                    <Chip 
                      label={service.status} 
                      color={getStatusColor(service.status) as any}
                      size="small"
                    />
                  </Box>
                  
                  {service.latency && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Latency: {service.latency}ms
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(service.latency / 10, 100)} 
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  )}
                  
                  {service.version && (
                    <Typography variant="body2" color="text.secondary">
                      Version: {service.version}
                    </Typography>
                  )}
                  
                  <Typography variant="caption" color="text.secondary">
                    Last checked: {new Date(service.lastChecked).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Audit Logs Tab */}
      <TabPanel value={tabValue} index={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Audit Logs</Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={loadAuditLogs}
          >
            Refresh
          </Button>
        </Box>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>IP Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(log.timestamp).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>{log.user_id}</TableCell>
                  <TableCell>
                    <Chip label={log.action} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {JSON.stringify(log.details)}
                    </Typography>
                  </TableCell>
                  <TableCell>{log.ip_address || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={auditLogs.length}
            rowsPerPage={auditRowsPerPage}
            page={auditPage}
            onPageChange={(event, newPage) => setAuditPage(newPage)}
            onRowsPerPageChange={(event) => {
              setAuditRowsPerPage(parseInt(event.target.value, 10));
              setAuditPage(0);
            }}
          />
        </TableContainer>
      </TabPanel>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialog} onClose={() => setEditUserDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={selectedUser.first_name}
                    onChange={(e) => setSelectedUser({...selectedUser, first_name: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={selectedUser.last_name}
                    onChange={(e) => setSelectedUser({...selectedUser, last_name: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={selectedUser.role}
                      onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}
                      disabled={!hasAdminAccess}
                    >
                      <MenuItem value="employee">Employee</MenuItem>
                      <MenuItem value="analyst">Analyst</MenuItem>
                      <MenuItem value="manager">Manager</MenuItem>
                      {hasAdminAccess && <MenuItem value="admin">Admin</MenuItem>}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={selectedUser.department_id || ''}
                      onChange={(e) => setSelectedUser({...selectedUser, department_id: Number(e.target.value)})}
                    >
                      {departments.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedUser.is_active}
                        onChange={(e) => setSelectedUser({...selectedUser, is_active: e.target.checked})}
                      />
                    }
                    label="Active"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUserDialog(false)}>Cancel</Button>
          <Button onClick={() => selectedUser && handleUpdateUser(selectedUser)} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Department Dialog */}
      <Dialog open={createDepartmentDialog} onClose={() => setCreateDepartmentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Department</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Department Name"
              value={newDepartment.name}
              onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={newDepartment.description}
              onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDepartmentDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateDepartment} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPage; 