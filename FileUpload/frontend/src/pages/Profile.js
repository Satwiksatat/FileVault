import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  LinearProgress,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Storage as StorageIcon,
  Group as GroupIcon,
  Folder as FolderIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function Profile() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalFiles: 0,
    totalStorage: 0,
    joinDate: null
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const [groupsRes, filesRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/groups/my`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/files/stats`)
      ]);

      setStats({
        totalGroups: groupsRes.data.length,
        totalFiles: filesRes.data.total_files || 0,
        totalStorage: filesRes.data.total_size || 0,
        joinDate: user?.created_at || new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEdit = () => {
    setEditing(true);
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      const updateData = {
        username: formData.username,
        email: formData.email
      };

      if (formData.newPassword) {
        updateData.current_password = formData.currentPassword;
        updateData.new_password = formData.newPassword;
      }

      await axios.put(`${process.env.REACT_APP_API_URL}/api/auth/profile`, updateData);
      setSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      setError(error.response?.data?.msg || 'Failed to update profile');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Overview */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: 'primary.main',
                  fontSize: '3rem',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
              
              <Typography variant="h5" gutterBottom>
                {user?.username}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Member since {formatDate(stats.joinDate)}
              </Typography>

              <Box sx={{ mt: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box>
                      <Typography variant="h6" color="primary">
                        {stats.totalGroups}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Groups
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box>
                      <Typography variant="h6" color="secondary">
                        {stats.totalFiles}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Files
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box>
                      <Typography variant="h6" color="success.main">
                        {formatFileSize(stats.totalStorage)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Storage
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab label="Profile" icon={<PersonIcon />} />
                  <Tab label="Security" icon={<SecurityIcon />} />
                  <Tab label="Activity" icon={<SettingsIcon />} />
                </Tabs>
              </Box>

              {/* Profile Tab */}
              <TabPanel value={tabValue} index={0}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">Personal Information</Typography>
                  {!editing ? (
                    <Button
                      startIcon={<EditIcon />}
                      onClick={handleEdit}
                      variant="outlined"
                    >
                      Edit
                    </Button>
                  ) : (
                    <Box>
                      <Button
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        variant="contained"
                        sx={{ mr: 1 }}
                      >
                        Save
                      </Button>
                      <Button
                        startIcon={<CancelIcon />}
                        onClick={handleCancel}
                        variant="outlined"
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Username"
                      value={editing ? formData.username : user?.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={!editing}
                      InputProps={{
                        startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={editing ? formData.email : user?.email || 'Not provided'}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!editing}
                      InputProps={{
                        startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Join Date"
                      value={formatDate(stats.joinDate)}
                      disabled
                      InputProps={{
                        startAdornment: <CalendarIcon sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Security Tab */}
              <TabPanel value={tabValue} index={1}>
                <Typography variant="h6" gutterBottom>
                  Security Settings
                </Typography>
                
                {editing && (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Current Password"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                        helperText="Required to change password"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="password"
                        label="New Password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Confirm New Password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                )}

                {!editing && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <SecurityIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Security Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Click "Edit" to change your password and security settings
                    </Typography>
                  </Box>
                )}
              </TabPanel>

              {/* Activity Tab */}
              <TabPanel value={tabValue} index={2}>
                <Typography variant="h6" gutterBottom>
                  Account Activity
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <GroupIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${stats.totalGroups} Groups`}
                      secondary="Groups you're a member of"
                    />
                    <Chip label="Active" color="success" size="small" />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <FolderIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${stats.totalFiles} Files`}
                      secondary="Files you've uploaded"
                    />
                    <Chip label="Shared" color="info" size="small" />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <StorageIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${formatFileSize(stats.totalStorage)} Storage Used`}
                      secondary="Total storage space used"
                    />
                    <Chip label="Available" color="warning" size="small" />
                  </ListItem>
                </List>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Profile; 