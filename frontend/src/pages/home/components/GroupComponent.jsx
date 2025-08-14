import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  Grid,
  Chip,
  Card,
  CardContent,
  Stack,
  Divider,
  InputBase,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  School as SchoolIcon,
  Group as GroupIcon
} from '@mui/icons-material';

const GroupComponent = ({ professor, groups, createGroup }) => {
    const [createGroupOpen, setCreateGroupOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [nameSearch, setNameSearch] = useState("");
    const navigate = useNavigate();

    const handleClassClick = (classId) => {
        navigate(`/class/${classId}`)
    }

    const toggleCreateGroupForm = () => {
        setCreateGroupOpen((prevState) => !prevState);
    };

    const handleGroupNameChange = (e) => {
        setNewGroupName(e.target.value);
    };

    const handleNameSearchChange = (e) => {
        setNameSearch(e.target.value);
    };

    const handleAddGroup = async () => {
        if (newGroupName.trim() !== "") {
            const newGroup = await createGroup({ groupName: newGroupName });
            if (newGroup && newGroup._id) {
                setNewGroupName("");
                setCreateGroupOpen(false);
                // Navigate to the newly created class
                navigate(`/class/${newGroup._id}`);
            }
        }
    };

    const handleCancel = () => {
        setNewGroupName("");  // Clear the input field
        setCreateGroupOpen(false);  // Close the form
    };

    const filteredGroups = groups.filter((group) => {
        const nameMatches = group.groupName.toLowerCase().includes(nameSearch.toLowerCase());
        return nameMatches;
    }).sort((a, b) => {
        // Sort by creation date: most recent first
        // Handle cases where createdAt might be missing (fallback to _id timestamp)
        const dateA = new Date(a.createdAt || a._id ? new Date(parseInt(a._id.toString().substring(0, 8), 16) * 1000) : 0);
        const dateB = new Date(b.createdAt || b._id ? new Date(parseInt(b._id.toString().substring(0, 8), 16) * 1000) : 0);
        return dateB - dateA;
    });

    // Helper function to format creation date
    const formatCreationDate = (dateString, groupId) => {
        if (!dateString) {
            // Fallback to _id timestamp if createdAt is missing
            if (groupId) {
                try {
                    const timestamp = parseInt(groupId.toString().substring(0, 8), 16) * 1000;
                    const date = new Date(timestamp);
                    if (!isNaN(date.getTime())) {
                        return formatRelativeDate(date);
                    }
                } catch (e) {
                    // Ignore errors in fallback
                }
            }
            return 'N/A';
        }
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        
        return formatRelativeDate(date);
    };

    // Helper function to format relative dates
    const formatRelativeDate = (date) => {
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays - 1} days ago`;
        if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months ago`;
        return date.toLocaleDateString();
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4, backgroundColor: 'white', textAlign: 'left' }}>
            <Box sx={{ mb: 3 }}>
                <Typography 
                    variant="h3" 
                    component="h1" 
                    sx={{ 
                        fontWeight: 700,
                        color: '#111827',
                        mb: 3
                    }}
                >
                    Classes
                </Typography>
                <Typography 
                    variant="body1" 
                    component="p" 
                    sx={{ 
                        color: 'text.secondary',
                        mt: 0.5
                    }}
                >
                    Select a class to view the dashboard and manage students and quests.
                </Typography>
            </Box>

            {/* Filters and Create Group Section */}
            <Card sx={{ mb: 3, p: 2, backgroundColor: 'white', borderRadius: 2, boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                <Grid container spacing={2} alignItems="center">
                    {/* Search */}
                    <Grid item xs={12} md={8}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                width: '100%',
                                px: 2,
                                py: 1.25,
                                borderRadius: 999,
                                border: '1px solid #e5e7eb',
                                bgcolor: '#f9fafb',
                                '&:focus-within': { borderColor: '#cbd5e1' }
                            }}
                        >
                            <InputBase
                                placeholder="Search classes..."
                                value={nameSearch}
                                onChange={handleNameSearchChange}
                                sx={{ flex: 1, fontSize: '0.95rem' }}
                                inputProps={{ 'aria-label': 'search classes' }}
                            />
                        </Box>
                    </Grid>

                    {/* Create Group Button */}
                    <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={toggleCreateGroupForm}
                            sx={{ 
                                px: 3,
                                py: 1.25,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '0.95rem',
                                backgroundColor: '#fb5233',
                                boxShadow: 'none',
                                '&:hover': {
                                    backgroundColor: '#e64a19',
                                    boxShadow: 'none'
                                }
                            }}
                        >
                            Create New Class
                        </Button>
                    </Grid>
                </Grid>
            </Card>

            {/* Create Group Dialog */}
            <Dialog 
                open={createGroupOpen} 
                onClose={handleCancel}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SchoolIcon sx={{ mr: 1, color: '#fb5233' }} />
                        Create New Class
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Class Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={newGroupName}
                        onChange={handleGroupNameChange}
                        placeholder="Enter class name..."
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button 
                        onClick={handleCancel}
                        startIcon={<CloseIcon />}
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleAddGroup}
                        startIcon={<CheckIcon />}
                        variant="contained"
                        disabled={!newGroupName.trim()}
                        sx={{
                            backgroundColor: '#fb5233',
                            borderRadius: 2,
                            boxShadow: 'none',
                            '&:hover': {
                                backgroundColor: '#e64a19',
                                boxShadow: 'none'
                            }
                        }}
                    >
                        Create Class
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Groups Table */}
            <Card sx={{ backgroundColor: 'white', borderRadius: 2, boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                <TableContainer component={Paper} elevation={0} sx={{ backgroundColor: 'white', boxShadow: 'none' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#1976d2' }}>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Class Name</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Code</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Student Count</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700, minWidth: 120 }}>Status</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 700, minWidth: 120 }}>Created</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                        {filteredGroups.length > 0 ? (
                            filteredGroups.map((group, index) => (
                                <TableRow 
                                    key={index} 
                                    onClick={() => handleClassClick(group._id)}
                                    sx={{ 
                                        cursor: 'pointer',
                                        backgroundColor: 'white',
                                        '&:hover': { backgroundColor: '#f9fafb' },
                                        transition: 'background-color 0.2s',
                                        borderBottom: '1px solid #eef2f7'
                                    }}
                                >
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <GroupIcon sx={{ color: '#fb5233' }} />
                                            <Typography variant="body1" fontWeight={600} sx={{ color: '#111827' }}>
                                                {group.groupName}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={group.classCode} 
                                            size="small" 
                                            variant="outlined"
                                            sx={{ borderColor: '#fb5233', color: '#fb5233', borderRadius: 1 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ color: '#374151' }}>
                                            {group.studentCount || "N/A"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 120 }}>
                                        <Chip
                                            label={group.active ? "Active" : "Inactive"}
                                            color={group.active ? "success" : "default"}
                                            size="small"
                                            variant={group.active ? "filled" : "outlined"}
                                            sx={{ borderRadius: 1 }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 120 }}>
                                        <Tooltip title={(() => {
                                            if (group.createdAt) {
                                                return new Date(group.createdAt).toLocaleDateString();
                                            } else if (group._id) {
                                                try {
                                                    const timestamp = parseInt(group._id.toString().substring(0, 8), 16) * 1000;
                                                    const date = new Date(timestamp);
                                                    if (!isNaN(date.getTime())) {
                                                        return date.toLocaleDateString();
                                                    }
                                                } catch (e) {
                                                    // Ignore errors
                                                }
                                            }
                                            return 'Date not available';
                                        })()}>
                                            <Typography variant="body2" sx={{ color: '#374151' }}>
                                                {formatCreationDate(group.createdAt, group._id)}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                                <TableRow sx={{ backgroundColor: 'white' }}>
                                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <SchoolIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                            <Typography variant="h6" color="text.secondary">
                                                No classes available
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                Create your first class to get started
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
        </Container>
    );
};

export default GroupComponent;
