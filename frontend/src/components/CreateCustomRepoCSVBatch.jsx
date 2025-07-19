import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  IconButton,
  Collapse
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from "@mui/icons-material";

export default function CreateCustomRepoCSVBatch({ customQuestConfig, classInfo }) {
  const [csvFile, setCsvFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [batchResults, setBatchResults] = useState(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentUser, setCurrentUser] = useState('');
  const [expandedDetails, setExpandedDetails] = useState({});
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [repositoryStatus, setRepositoryStatus] = useState(null);

  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      alert('Please upload a valid CSV file');
    }
  };

  const downloadTemplate = () => {
    const csvContent = "github_username\njohndoe\njanesmith\nalicedev\nbobcoder";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom_repo_usernames_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const toggleDetails = (index) => {
    setExpandedDetails(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const checkRepositoryStatus = async () => {
    if (!batchResults || batchResults.successful.length === 0) {
      alert('No successful repositories to check status for');
      return;
    }

    if (!classInfo?.groupName) {
      alert('Class information not available');
      return;
    }

    setIsCheckingStatus(true);
    console.log('🔍 [STATUS-CHECK] Starting repository status check');

    try {
      const usernames = batchResults.successful.map(result => result.username);
      console.log('👥 [STATUS-CHECK] Checking status for usernames:', usernames);

      const response = await fetch("/api/repo/collaborationStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationGh: process.env.REACT_APP_GITHUB_ORG || 'OSS-Doorway-Dev',
          students: usernames,
          className: classInfo.groupName
        })
      });

      const data = await response.json();
      console.log('📊 [STATUS-CHECK] Status check response:', data);

      if (response.ok && data.results) {
        setRepositoryStatus(data.results);
        console.log('✅ [STATUS-CHECK] Status updated:', data.results);
      } else {
        alert(`Error checking repository status: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('💥 [STATUS-CHECK] Error checking repository status:', error);
      alert(`Error checking repository status: ${error.message}`);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const processBatchCreateRepos = async () => {
    if (!csvFile) {
      alert('Please upload a CSV file first');
      return;
    }

    if (!customQuestConfig) {
      alert('No custom quest arrangement provided. Please configure quests first.');
      return;
    }

    if (!classInfo?.groupName) {
      alert('Class information not available. Please refresh the page and try again.');
      return;
    }

    console.log('🎯 [CSV-BATCH] Starting batch repository creation process');
    console.log('📁 [CSV-BATCH] CSV file:', csvFile.name);
    console.log('📚 [CSV-BATCH] Class:', classInfo.groupName);
    console.log('📊 [CSV-BATCH] Quest config:', {
      totalQuests: customQuestConfig?.questSequence?.length || 0,
      hasMapLink: !!customQuestConfig?.map_repo_link,
      hasMetadata: !!customQuestConfig?.metadata
    });
    console.log('🏷️ [CSV-BATCH] Repository naming pattern:', classInfo.groupName ? `username-${classInfo.groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : 'username-custom-oss-doorway');
    
    const formattedClassName = classInfo.groupName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    console.log('📝 [CSV-BATCH] Formatted class name:', formattedClassName);

    setIsProcessing(true);
    setCurrentProgress(0);
    setBatchResults(null);

    try {
      // Read and parse CSV file
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(csvFile);
      });

      const lines = text.split('\n');
      const usernames = lines
        .slice(lines[0].toLowerCase().includes('github_username') ? 1 : 0)
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (usernames.length === 0) {
        alert('No valid usernames found in CSV file');
        setIsProcessing(false);
        return;
      }

      console.log(`📝 [CSV-BATCH] Parsed ${usernames.length} usernames from CSV:`, usernames);

      const results = {
        successful: [],
        unsuccessful: [],
        total: usernames.length,
        processedCount: 0
      };

      setBatchResults(results);
      console.log(`🚀 [CSV-BATCH] Beginning individual repository creation for ${usernames.length} users`);

      // Process each user individually
      for (let i = 0; i < usernames.length; i++) {
        const username = usernames[i];
        setCurrentUser(username);
        setCurrentProgress(((i) / usernames.length) * 100);

        try {
          console.log(`⏳ [CSV-BATCH] Processing ${i + 1}/${usernames.length}: ${username}`);
          
          const requestBody = {
            users: [username], // Single user per request
            customSequence: customQuestConfig,
            className: classInfo?.groupName,
            classId: classInfo?._id
          };

          const response = await fetch("/api/repo/createCustomRepos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
          });

          const data = await response.json();

          if (response.ok && data.results && data.results.successful.length > 0) {
            const successResult = data.results.successful[0];
            console.log(`✅ [CSV-BATCH] SUCCESS: ${username} -> ${successResult.repoName}`);
            results.successful.push({
              username,
              repoName: successResult.repoName,
              repoUrl: successResult.repoUrl,
              dbUser: successResult.dbUser,
              groupId: successResult.groupId,
              status: 'success',
              message: 'Repository created successfully',
              timestamp: new Date().toISOString()
            });
          } else {
            const errorResult = data.results?.unsuccessful?.[0] || { error: data.message || 'Unknown error' };
            console.error(`❌ [CSV-BATCH] FAILED: ${username} - ${errorResult.error}`);
            results.unsuccessful.push({
              username,
              status: 'error',
              error: errorResult.error || data.message || 'Repository creation failed',
              details: errorResult.details || data.details || 'No additional details',
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error(`💥 [CSV-BATCH] ERROR: ${username} - Network/processing error:`, error.message);
          results.unsuccessful.push({
            username,
            status: 'error',
            error: error.message,
            details: 'Network or processing error',
            timestamp: new Date().toISOString()
          });
        }

        results.processedCount = i + 1;
        setBatchResults({ ...results });
        
        // Small delay to prevent overwhelming the server
        if (i < usernames.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setCurrentProgress(100);
      setCurrentUser('');
      
      console.log('🏁 [CSV-BATCH] Batch process completed');
      console.log(`📊 [CSV-BATCH] Final results: ${results.successful.length} successful, ${results.unsuccessful.length} failed`);
      
    } catch (error) {
      console.error('💥 [CSV-BATCH] Critical error during batch processing:', error);
      alert(`Error processing CSV file: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <SuccessIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <PendingIcon color="warning" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mt: 2, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#f8f9ff' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#2563eb' }}>
          🎯 Batch Create Custom Repositories
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create custom repositories for multiple users with the current quest configuration. Each user gets their own repository with the complete quest setup.
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />}
            onClick={downloadTemplate}
            sx={{ mb: 2 }}
          >
            Download CSV Template
          </Button>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <input
              type="file"
              id="csv-batch-file"
              accept=".csv"
              onChange={handleCsvUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="csv-batch-file">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
              >
                {csvFile ? csvFile.name : 'Choose CSV File'}
              </Button>
            </label>
            
            <Button
              variant="contained"
              onClick={() => setShowModal(true)}
              disabled={!csvFile || !customQuestConfig || isProcessing}
              sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
            >
              Create Repositories
            </Button>
          </Box>
        </Box>

        {(!customQuestConfig || !classInfo?.groupName) && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {!customQuestConfig && "No quest configuration available. Please configure quests first before creating repositories."}
            {!classInfo?.groupName && "Class information not available. Please refresh the page to load class data."}
          </Alert>
        )}

        {batchResults && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              📊 Batch Processing Results
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Chip 
                label={`✅ Successful: ${batchResults.successful.length}`} 
                color="success" 
                variant="outlined" 
              />
              <Chip 
                label={`❌ Failed: ${batchResults.unsuccessful.length}`} 
                color="error" 
                variant="outlined" 
              />
              <Chip 
                label={`📊 Total: ${batchResults.total}`} 
                color="primary" 
                variant="outlined" 
              />
            </Box>

            {batchResults.successful.length > 0 && (
              <Paper sx={{ p: 2, mb: 2, bgcolor: '#f0f9ff' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" color="success.main" gutterBottom>
                    ✅ Successfully Created Repositories
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={checkRepositoryStatus}
                    disabled={isCheckingStatus}
                    startIcon={<RefreshIcon />}
                    sx={{ minWidth: '120px' }}
                  >
                    {isCheckingStatus ? 'Checking...' : 'Check Status'}
                  </Button>
                </Box>
                <List dense>
                  {batchResults.successful.map((result, index) => {
                    const userStatus = repositoryStatus ? 
                      (repositoryStatus.accepted?.includes(result.username) ? 'accepted' :
                       repositoryStatus.pending?.includes(result.username) ? 'pending' : 'not-found') : null;
                    
                    return (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon>
                          <SuccessIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">{result.username}</Typography>
                              {userStatus && (
                                <Chip 
                                  label={userStatus === 'accepted' ? '✅ Accepted' : 
                                         userStatus === 'pending' ? '⏳ Pending' : '❓ Unknown'}
                                  color={userStatus === 'accepted' ? 'success' : 
                                         userStatus === 'pending' ? 'warning' : 'default'}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                Repository: <a href={result.repoUrl} target="_blank" rel="noopener noreferrer">{result.repoName}</a>
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(result.timestamp).toLocaleString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Paper>
            )}

            {batchResults.unsuccessful.length > 0 && (
              <Paper sx={{ p: 2, bgcolor: '#fef2f2' }}>
                <Typography variant="subtitle2" color="error.main" gutterBottom>
                  ❌ Failed Repository Creations
                </Typography>
                <List dense>
                  {batchResults.unsuccessful.map((result, index) => (
                    <Box key={index}>
                      <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon>
                          <ErrorIcon color="error" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={result.username}
                          secondary={
                            <Box>
                              <Typography variant="caption" color="error.main" display="block">
                                {result.error}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(result.timestamp).toLocaleString()}
                              </Typography>
                            </Box>
                          }
                        />
                        <IconButton 
                          size="small" 
                          onClick={() => toggleDetails(index)}
                        >
                          {expandedDetails[index] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </ListItem>
                      <Collapse in={expandedDetails[index]}>
                        <Box sx={{ pl: 8, pb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Details: {result.details}
                          </Typography>
                        </Box>
                      </Collapse>
                    </Box>
                  ))}
                </List>
              </Paper>
            )}
          </Box>
        )}
      </Paper>

      {/* Confirmation Modal */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Batch Repository Creation</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            This will create custom repositories for all users in the CSV file with the current quest configuration.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Class: {classInfo?.groupName || 'Unknown'}
            </Typography>
            <Typography variant="subtitle2" gutterBottom>
              Quest Configuration:
            </Typography>
            <Typography variant="body2">
              {customQuestConfig?.questSequence?.length || 0} quests configured
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Repository naming pattern: <strong>{classInfo?.groupName ? `username-${classInfo.groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : 'username-custom-oss-doorway'}</strong>
            </Typography>
          </Alert>

          <Typography variant="body2" color="text.secondary">
            • Each user will get an individual repository<br/>
            • Repository names will follow the pattern: <strong>{classInfo?.groupName?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-username</strong><br/>
            • Repositories will be created one by one<br/>
            • You can monitor the progress in real-time<br/>
            • Failed creations will be reported with details
          </Typography>

          {isProcessing && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" gutterBottom>
                Processing: {currentUser || 'Preparing...'}
              </Typography>
              <LinearProgress variant="determinate" value={currentProgress} />
              <Typography variant="caption" color="text.secondary">
                {Math.round(currentProgress)}% complete
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModal(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setShowModal(false);
              processBatchCreateRepos();
            }}
            disabled={isProcessing}
            sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
          >
            {isProcessing ? 'Processing...' : 'Start Batch Creation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 