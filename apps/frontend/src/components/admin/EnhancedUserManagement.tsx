import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  Checkbox,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  InputAdornment,
  ButtonGroup,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  PersonIcon,
  EditIcon,
  DeleteIcon,
  SearchIcon,
  FilterListIcon,
  GetAppIcon,
  PersonAddIcon,
  MoreVertIcon,
  BlockIcon,
  LockOpenIcon,
  EmailIcon,
  RefreshIcon,
  CheckBoxIcon,
  IndeterminateCheckBoxIcon,
} from '../../utils/icons';
import { User } from '../../types';
import api from '../../services/api';
import { useAppStore } from '../../store/useAppStore';

interface Department {
  id: number;
  name: string;
  description: string;
  user_count?: number;
}

interface UserFilters {
  search: string;
  role: string;
  department: string;
  status: string;
  dateRange: string;
}

interface EnhancedUserManagementProps {
  users: User[];
  onUsersChange: (users: User[]) => void;
  loading?: boolean;
}

export const EnhancedUserManagement: React.FC<EnhancedUserManagementProps> = ({
  users: initialUsers,
  onUsersChange,
  loading: initialLoading = false
}) => {
  const { user: currentUser } = useAppStore(state => ({ user: state.user }));
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(initialUsers);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  // Table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  
  // Filter state
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    department: 'all',
    status: 'all',
    dateRange: 'all'
  });
  
  // Dialog states
  const [editDialog, setEditDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [bulkActionMenu, setBulkActionMenu] = useState<HTMLElement | null>(null);

  // Form state for editing/creating users
  const [userForm, setUserForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    employee_id: '',
    department_id: '',
    role: 'employee',
    phone_number: '',
    is_active: true
  });

  // Load departments for dropdowns
  useEffect(() => {
    loadDepartments();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [filters, users]);

  const loadDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/users', {
        params: {
          skip: page * rowsPerPage,
          limit: rowsPerPage
        }
      });
      setUsers(response.data);
      onUsersChange(response.data);
    } catch (err) {
      setError('Failed to load users');
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, onUsersChange]);

  const applyFilters = () => {
    let filtered = [...users];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(user => 
        user.first_name.toLowerCase().includes(searchLower) ||
        user.last_name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.employee_id?.toLowerCase().includes(searchLower)
      );
    }

    // Role filter
    if (filters.role !== 'all') {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    // Department filter
    if (filters.department !== 'all') {
      filtered = filtered.filter(user => user.department_id?.toString() === filters.department);
    }

    // Status filter
    if (filters.status !== 'all') {
      const isActive = filters.status === 'active';
      filtered = filtered.filter(user => user.is_active === isActive);
    }

    setFilteredUsers(filtered);
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setUserForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      employee_id: user.employee_id || '',
      department_id: user.department_id?.toString() || '',
      role: user.role,
      phone_number: user.phone_number || '',
      is_active: user.is_active
    });
    setEditDialog(true);
  };

  const handleCreateUser = () => {
    setUserForm({
      first_name: '',
      last_name: '',
      email: '',
      employee_id: '',
      department_id: '',
      role: 'employee',
      phone_number: '',
      is_active: true
    });
    setCreateDialog(true);
  };

  const handleSaveUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Form validation
      if (!userForm.first_name.trim() || !userForm.last_name.trim()) {
        setError('First name and last name are required');
        return;
      }
      
      if (!userForm.email.trim()) {
        setError('Email is required');
        return;
      }
      
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userForm.email)) {
        setError('Please enter a valid email address');
        return;
      }
      
      // Prepare data for API call - convert types as needed
      const apiData = {
        ...userForm,
        department_id: userForm.department_id ? parseInt(userForm.department_id) : null,
        // Ensure empty strings are converted to null for optional fields
        employee_id: userForm.employee_id || null,
        phone_number: userForm.phone_number || null
      };

      if (selectedUser) {
        // Update existing user
        const response = await api.put(`/users/${selectedUser.id}`, apiData);
        console.log('User updated successfully:', response.data);
      } else {
        // Create new user
        const response = await api.post('/users', apiData);
        console.log('User created successfully:', response.data);
      }
      
      await loadUsers();
      setEditDialog(false);
      setCreateDialog(false);
      setSelectedUser(null);
      
      // Show success message
      const message = selectedUser ? 'User updated successfully' : 'User created successfully';
      console.log(message);
      
    } catch (err: any) {
      console.error('Save user error:', err);
      console.log('Request data sent:', apiData);
      console.log('Full error response:', err.response);
      
      if (err.response?.status === 400) {
        setError(err.response.data?.detail || 'Invalid data provided');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to perform this action');
      } else if (err.response?.status === 409) {
        setError('A user with this email already exists');
      } else if (err.response?.status === 500) {
        setError('Server error occurred. Please check the data and try again.');
      } else {
        setError(selectedUser ? 'Failed to update user' : 'Failed to create user');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.delete(`/users/${selectedUser.id}`);
      console.log('User deleted successfully:', response.data);
      
      await loadUsers();
      setDeleteDialog(false);
      setSelectedUser(null);
      
    } catch (err: any) {
      console.error('Delete user error:', err);
      
      if (err.response?.status === 403) {
        setError('You do not have permission to delete users');
      } else if (err.response?.status === 400) {
        setError(err.response.data.detail || 'Cannot delete this user');
      } else if (err.response?.status === 404) {
        setError('User not found');
      } else {
        setError('Failed to delete user');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.size === 0) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const userIds = Array.from(selectedUsers);
      console.log(`Performing bulk ${action} on ${userIds.length} users`);
      
      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];
      
      switch (action) {
        case 'activate':
          for (const id of userIds) {
            try {
              await api.put(`/users/${id}`, { is_active: true });
              successCount++;
            } catch (err: any) {
              failureCount++;
              errors.push(`Failed to activate user ${id}`);
            }
          }
          break;
          
        case 'deactivate':
          for (const id of userIds) {
            try {
              await api.put(`/users/${id}`, { is_active: false });
              successCount++;
            } catch (err: any) {
              failureCount++;
              errors.push(`Failed to deactivate user ${id}`);
            }
          }
          break;
          
        case 'delete':
          for (const id of userIds) {
            try {
              await api.delete(`/users/${id}`);
              successCount++;
            } catch (err: any) {
              failureCount++;
              errors.push(`Failed to delete user ${id}`);
            }
          }
          break;
      }
      
      // Show results
      if (failureCount === 0) {
        console.log(`Successfully ${action}d ${successCount} users`);
      } else {
        const message = `${successCount} users ${action}d successfully, ${failureCount} failed`;
        console.log(message);
        if (errors.length > 0) {
          setError(errors.slice(0, 3).join(', ') + (errors.length > 3 ? '...' : ''));
        }
      }
      
      await loadUsers();
      setSelectedUsers(new Set());
      
    } catch (err: any) {
      console.error(`Bulk ${action} error:`, err);
      setError(`Failed to ${action} users`);
    } finally {
      setLoading(false);
      setBulkActionMenu(null);
    }
  };

  const exportUsers = async () => {
    try {
      const dataToExport = filteredUsers.map(user => ({
        'Employee ID': user.employee_id,
        'Name': `${user.first_name} ${user.last_name}`,
        'Email': user.email,
        'Role': user.role,
        'Department': departments.find(d => d.id === user.department_id)?.name || 'N/A',
        'Status': user.is_active ? 'Active' : 'Inactive',
        'Created': new Date(user.created_at).toLocaleDateString()
      }));
      
      const csv = [
        Object.keys(dataToExport[0]).join(','),
        ...dataToExport.map(row => Object.values(row).join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export users');
      console.error('Export error:', err);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'error';
      case 'manager': return 'warning';
      case 'employee': return 'primary';
      default: return 'default';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error';
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          👥 User Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadUsers}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={exportUsers}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleCreateUser}
          >
            Add User
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select
                value={filters.role}
                label="Role"
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="employee">Employee</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Department</InputLabel>
              <Select
                value={filters.department}
                label="Department"
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              >
                <MenuItem value="all">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            {selectedUsers.size > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">
                  {selectedUsers.size} selected
                </Typography>
                <Button
                  size="small"
                  onClick={(e) => setBulkActionMenu(e.currentTarget)}
                  endIcon={<MoreVertIcon />}
                >
                  Actions
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedUsers.size > 0 && selectedUsers.size < filteredUsers.length}
                  checked={filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>User</TableCell>
              <TableCell>Employee ID</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {user.first_name[0]}{user.last_name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {user.first_name} {user.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{user.employee_id || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        size="small"
                        color={getRoleColor(user.role) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {departments.find(d => d.id === user.department_id)?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        color={getStatusColor(user.is_active) as any}
                        variant="filled"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit User">
                        <IconButton size="small" onClick={() => handleEditUser(user)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={user.id === currentUser?.id ? "Cannot delete your own account" : "Delete User"}>
                        <span>
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              setSelectedUser(user);
                              setDeleteDialog(true);
                            }}
                            disabled={user.id === currentUser?.id}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Bulk Actions Menu */}
      <Menu
        anchorEl={bulkActionMenu}
        open={Boolean(bulkActionMenu)}
        onClose={() => setBulkActionMenu(null)}
      >
        <MenuItem onClick={() => handleBulkAction('activate')}>
          <ListItemIcon><LockOpenIcon /></ListItemIcon>
          <ListItemText>Activate Users</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction('deactivate')}>
          <ListItemIcon><BlockIcon /></ListItemIcon>
          <ListItemText>Deactivate Users</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleBulkAction('delete')} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon /></ListItemIcon>
          <ListItemText>Delete Users</ListItemText>
        </MenuItem>
      </Menu>

      {/* Edit/Create User Dialog */}
      <Dialog open={editDialog || createDialog} onClose={() => {
        setEditDialog(false);
        setCreateDialog(false);
      }} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Edit User' : 'Create New User'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={userForm.first_name}
                onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={userForm.last_name}
                onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Employee ID"
                value={userForm.employee_id}
                onChange={(e) => setUserForm({ ...userForm, employee_id: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={userForm.role}
                  label="Role"
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                >
                  <MenuItem value="employee">Employee</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={userForm.department_id}
                  label="Department"
                  onChange={(e) => setUserForm({ ...userForm, department_id: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={userForm.phone_number}
                onChange={(e) => setUserForm({ ...userForm, phone_number: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEditDialog(false);
            setCreateDialog(false);
          }}>
            Cancel
          </Button>
          <Button onClick={handleSaveUser} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{selectedUser?.first_name} {selectedUser?.last_name}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained" disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 