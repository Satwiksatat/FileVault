import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Button,
  LinearProgress,
  Paper
} from '@mui/material';
import {
  Folder as FolderIcon,
  Group as GroupIcon,
  Storage as StorageIcon,
  TrendingUp as TrendingUpIcon,
  Description as FileIcon,
  Person as PersonIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalFiles: 0,
    totalStorage: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [groupsRes, filesRes, activityRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/groups/my`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/files/stats`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/files/recent-activity`)
      ]);

      setStats({
        totalGroups: groupsRes.data.length,
        totalFiles: filesRes.data.total_files || 0,
        totalStorage: filesRes.data.total_size || 0,
        recentActivity: activityRes.data || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'upload':
        return <UploadIcon color="primary" />;
      case 'download':
        return <DownloadIcon color="secondary" />;
      case 'group_created':
        return <GroupIcon color="success" />;
      default:
        return <FileIcon />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'upload':
        return 'primary';
      case 'download':
        return 'secondary';
      case 'group_created':
        return 'success';
      default:
        return 'default';
    }
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
        Welcome back, {user?.username}! 👋
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <GroupIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalGroups}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Groups
                  </Typography>
                </Box>
              </Box>
              <Chip 
                label="Active" 
                color="success" 
                size="small" 
                variant="outlined"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <FileIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalFiles}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Files
                  </Typography>
                </Box>
              </Box>
              <Chip 
                label="Shared" 
                color="info" 
                size="small" 
                variant="outlined"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <StorageIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatFileSize(stats.totalStorage)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Storage Used
                  </Typography>
                </Box>
              </Box>
              <Chip 
                label="Available" 
                color="warning" 
                size="small" 
                variant="outlined"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.recentActivity.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Recent Activities
                  </Typography>
                </Box>
              </Box>
              <Chip 
                label="This Week" 
                color="primary" 
                size="small" 
                variant="outlined"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Recent Activity
              </Typography>
              {stats.recentActivity.length > 0 ? (
                <List>
                  {stats.recentActivity.slice(0, 5).map((activity, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'grey.100' }}>
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.description}
                        secondary={new Date(activity.timestamp).toLocaleString()}
                      />
                      <Chip
                        label={activity.type}
                        color={getActivityColor(activity.type)}
                        size="small"
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No recent activity
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<GroupIcon />}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Create New Group
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Upload Files
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PersonIcon />}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Invite Users
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard; 