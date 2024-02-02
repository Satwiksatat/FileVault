import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Alert,
  LinearProgress,
  Paper,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  Description as FileIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Archive as ArchiveIcon,
  MoreVert as MoreVertIcon,
  Group as GroupIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

function Files() {
  const [searchParams] = useSearchParams();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (groups.length > 0) {
      const groupId = searchParams.get('group');
      if (groupId) {
        const group = groups.find(g => g.id === parseInt(groupId));
        if (group) {
          setSelectedGroup(group);
        }
      } else {
        setSelectedGroup(groups[0]);
      }
    }
  }, [groups, searchParams]);

  useEffect(() => {
    if (selectedGroup) {
      fetchFiles();
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/groups/my`);
      setGroups(response.data);
    } catch (error) {
      setError('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    if (!selectedGroup) return;
    
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/files/${selectedGroup.id}/list`);
      setFiles(response.data);
    } catch (error) {
      setError('Failed to fetch files');
    }
  };

  const onDrop = async (acceptedFiles) => {
    if (!selectedGroup) {
      setError('Please select a group first');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        const formData = new FormData();
        formData.append('file', file);

        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/files/${selectedGroup.id}/upload`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(progress);
            },
          }
        );

        setUploadProgress(((i + 1) / acceptedFiles.length) * 100);
      }

      setSuccess(`${acceptedFiles.length} file(s) uploaded successfully!`);
      fetchFiles();
    } catch (error) {
      setError(error.response?.data?.msg || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const handleDownload = async (file) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/files/${selectedGroup.id}/download/${file.id}`,
        {
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Download failed');
    }
  };

  const handleDelete = async (file) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/files/${selectedGroup.id}/delete/${file.id}`
      );
      setSuccess('File deleted successfully!');
      fetchFiles();
    } catch (error) {
      setError('Failed to delete file');
    }
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) {
      return <ImageIcon color="primary" />;
    } else if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(extension)) {
      return <VideoIcon color="secondary" />;
    } else if (['mp3', 'wav', 'flac', 'aac'].includes(extension)) {
      return <AudioIcon color="success" />;
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return <ArchiveIcon color="warning" />;
    } else {
      return <FileIcon />;
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
        Files
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
        {/* Group Selection */}
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Group
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Group</InputLabel>
                <Select
                  value={selectedGroup?.id || ''}
                  onChange={(e) => {
                    const group = groups.find(g => g.id === e.target.value);
                    setSelectedGroup(group);
                  }}
                  label="Group"
                >
                  {groups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <GroupIcon sx={{ mr: 1 }} />
                        {group.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedGroup && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Group Info:
                  </Typography>
                  <Chip
                    label={`${files.length} files`}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={`${selectedGroup.member_count || 0} members`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* File Management */}
        <Grid item xs={12} md={9}>
          {selectedGroup ? (
            <>
              {/* Upload Area */}
              <Card elevation={2} sx={{ mb: 3 }}>
                <CardContent>
                  <Paper
                    {...getRootProps()}
                    sx={{
                      border: '2px dashed',
                      borderColor: isDragActive ? 'primary.main' : 'grey.300',
                      borderRadius: 2,
                      p: 4,
                      textAlign: 'center',
                      cursor: 'pointer',
                      bgcolor: isDragActive ? 'primary.50' : 'grey.50',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.50',
                      },
                    }}
                  >
                    <input {...getInputProps()} />
                    <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      or click to select files
                    </Typography>
                  </Paper>

                  {uploading && (
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress variant="determinate" value={uploadProgress} />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Uploading... {Math.round(uploadProgress)}%
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Files List */}
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Files in {selectedGroup.name}
                  </Typography>

                  {files.length > 0 ? (
                    <List>
                      {files.map((file, index) => (
                        <React.Fragment key={file.id}>
                          <ListItem
                            secondaryAction={
                              <Box>
                                <Tooltip title="Download">
                                  <IconButton
                                    edge="end"
                                    onClick={() => handleDownload(file)}
                                    sx={{ mr: 1 }}
                                  >
                                    <DownloadIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton
                                    edge="end"
                                    onClick={() => handleDelete(file)}
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            }
                          >
                            <ListItemIcon>
                              {getFileIcon(file.filename)}
                            </ListItemIcon>
                            <ListItemText
                              primary={file.filename}
                              secondary={
                                <Box>
                                  <Typography variant="body2" component="span">
                                    {formatFileSize(file.file_size || 0)} • {formatDate(file.uploaded_at)}
                                  </Typography>
                                  {file.uploader && (
                                    <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                                      • Uploaded by {file.uploader.username}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < files.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No files yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Upload your first file to get started
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <GroupIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No groups available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create a group first to start uploading files
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default Files; 