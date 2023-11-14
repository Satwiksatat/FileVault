import React, { useEffect, useState } from 'react';
import { Button, Container, Typography, Box, TextField, List, ListItem, ListItemText, Divider } from '@mui/material';
import axios from 'axios';

function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [files, setFiles] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [file, setFile] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/groups/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setGroups(res.data);
  };

  const createGroup = async () => {
    await axios.post(`${process.env.REACT_APP_API_URL}/api/groups/`, { name: groupName }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setGroupName('');
    fetchGroups();
  };

  const selectGroup = async (group) => {
    setSelectedGroup(group);
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/files/${group.id}/list`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setFiles(res.data);
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const uploadFile = async () => {
    if (!file || !selectedGroup) return;
    const formData = new FormData();
    formData.append('file', file);
    await axios.post(`${process.env.REACT_APP_API_URL}/api/files/${selectedGroup.id}/upload`, formData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    selectGroup(selectedGroup);
    setFile(null);
  };

  const downloadFile = async (fileId, filename) => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/files/${selectedGroup.id}/download/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Container>
      <Box mt={4}>
        <Typography variant="h4">Dashboard</Typography>
        <Box mt={2} display="flex" gap={2}>
          <TextField label="New Group Name" value={groupName} onChange={e => setGroupName(e.target.value)} />
          <Button variant="contained" onClick={createGroup}>Create Group</Button>
        </Box>
        <Box mt={2} display="flex" gap={4}>
          <Box>
            <Typography variant="h6">Your Groups</Typography>
            <List>
              {groups.map(group => (
                <ListItem button key={group.id} selected={selectedGroup?.id === group.id} onClick={() => selectGroup(group)}>
                  <ListItemText primary={group.name} />
                </ListItem>
              ))}
            </List>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box flex={1}>
            {selectedGroup && (
              <>
                <Typography variant="h6">Files in {selectedGroup.name}</Typography>
                <input type="file" onChange={handleFileChange} />
                <Button variant="contained" onClick={uploadFile} disabled={!file}>Upload</Button>
                <List>
                  {files.map(f => (
                    <ListItem key={f.id}>
                      <ListItemText primary={f.filename} secondary={f.uploaded_at} />
                      <Button onClick={() => downloadFile(f.id, f.filename)}>Download</Button>
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

export default Dashboard; 