import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  PersonAddIcon,
  EditIcon,
  DeleteIcon,
  RefreshIcon,
  GetAppIcon,
  CheckBoxIcon,
  MoreVertIcon,
} from '../../utils/icons';

export const CRUDLocationGuide: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          🎯 CRUD Operations Location Guide
        </Typography>
        <Typography>
          Your complete CRUD (Create, Read, Update, Delete) operations are implemented in:
          <strong> Admin Panel → Users Tab</strong>
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* CREATE Operation */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: '2px solid #4CAF50' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonAddIcon sx={{ color: '#4CAF50', mr: 1, fontSize: 28 }} />
                <Typography variant="h6" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                  CREATE User
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Location:</strong> Top-right corner of User Management section
              </Typography>
              <Chip 
                label="Add User" 
                color="primary" 
                variant="filled"
                sx={{ mb: 2 }}
              />
              <Typography variant="body2">
                Click this button to open a form where you can create new users with:
              </Typography>
              <List dense>
                <ListItem>• First Name & Last Name</ListItem>
                <ListItem>• Email Address</ListItem>
                <ListItem>• Employee ID (auto-generated)</ListItem>
                <ListItem>• Department Assignment</ListItem>
                <ListItem>• Role Selection (Employee/Manager/Admin)</ListItem>
                <ListItem>• Phone Number</ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* READ Operation */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: '2px solid #2196F3' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <RefreshIcon sx={{ color: '#2196F3', mr: 1, fontSize: 28 }} />
                <Typography variant="h6" sx={{ color: '#2196F3', fontWeight: 600 }}>
                  READ Users
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Location:</strong> Main data table with search and filters
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip label="Search" size="small" />
                <Chip label="Filter by Role" size="small" />
                <Chip label="Filter by Department" size="small" />
                <Chip label="Filter by Status" size="small" />
              </Box>
              <Typography variant="body2">
                Features include:
              </Typography>
              <List dense>
                <ListItem>• Real-time search across all fields</ListItem>
                <ListItem>• Advanced filtering options</ListItem>
                <ListItem>• Pagination (5/10/25/50 per page)</ListItem>
                <ListItem>• Sortable columns</ListItem>
                <ListItem>• Export to CSV</ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* UPDATE Operation */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: '2px solid #FF9800' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EditIcon sx={{ color: '#FF9800', mr: 1, fontSize: 28 }} />
                <Typography variant="h6" sx={{ color: '#FF9800', fontWeight: 600 }}>
                  UPDATE User
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Location:</strong> Edit icon (✏️) in the Actions column of each user row
              </Typography>
              <Chip 
                label="Edit Icon" 
                color="warning" 
                variant="filled"
                sx={{ mb: 2 }}
              />
              <Typography variant="body2">
                Click the edit icon next to any user to:
              </Typography>
              <List dense>
                <ListItem>• Modify user information</ListItem>
                <ListItem>• Change role assignments</ListItem>
                <ListItem>• Update department</ListItem>
                <ListItem>• Activate/deactivate accounts</ListItem>
                <ListItem>• Update contact information</ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* DELETE Operation */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: '2px solid #F44336' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DeleteIcon sx={{ color: '#F44336', mr: 1, fontSize: 28 }} />
                <Typography variant="h6" sx={{ color: '#F44336', fontWeight: 600 }}>
                  DELETE User
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Location:</strong> Delete icon (🗑️) in the Actions column of each user row
              </Typography>
              <Chip 
                label="Delete Icon" 
                color="error" 
                variant="filled"
                sx={{ mb: 2 }}
              />
              <Typography variant="body2">
                Click the delete icon to:
              </Typography>
              <List dense>
                <ListItem>• Soft delete users (preserves data)</ListItem>
                <ListItem>• Shows confirmation dialog</ListItem>
                <ListItem>• Admin-only operation</ListItem>
                <ListItem>• Cannot delete your own account</ListItem>
                <ListItem>• Creates audit log entry</ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* BULK Operations */}
        <Grid item xs={12}>
          <Card sx={{ border: '2px solid #9C27B0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckBoxIcon sx={{ color: '#9C27B0', mr: 1, fontSize: 28 }} />
                <Typography variant="h6" sx={{ color: '#9C27B0', fontWeight: 600 }}>
                  BULK Operations
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Location:</strong> Select multiple users using checkboxes, then use Actions menu
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip label="Select All Checkbox" size="small" />
                <Chip label="Individual Checkboxes" size="small" />
                <Chip label="Actions Menu" size="small" />
              </Box>
              <Typography variant="body2">
                Bulk operations available:
              </Typography>
              <List dense>
                <ListItem>• Bulk Activate Users</ListItem>
                <ListItem>• Bulk Deactivate Users</ListItem>
                <ListItem>• Bulk Delete Users</ListItem>
                <ListItem>• Progress tracking with success/failure counts</ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Alert severity="success">
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          🚀 How to Access CRUD Operations:
        </Typography>
        <List>
          <ListItem>
            <Typography>
              <strong>1.</strong> Go to Admin Panel (click Admin in sidebar)
            </Typography>
          </ListItem>
          <ListItem>
            <Typography>
              <strong>2.</strong> Click on "Users" tab (first tab with 👥 icon)
            </Typography>
          </ListItem>
          <ListItem>
            <Typography>
              <strong>3.</strong> You'll see the enhanced user management with all CRUD operations
            </Typography>
          </ListItem>
        </List>
      </Alert>
    </Box>
  );
}; 