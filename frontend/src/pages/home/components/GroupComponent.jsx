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
  Checkbox,
  FormControlLabel,
  IconButton,
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
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  School as SchoolIcon,
  Group as GroupIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

const GroupComponent = ({ professor, groups, createGroup }) => {
    const [createGroupOpen, setCreateGroupOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [nameSearch, setNameSearch] = useState("");
    const [showActiveOnly, setShowActiveOnly] = useState(true);
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

    const handleAddGroup = () => {
        if (newGroupName.trim() !== "") {
            createGroup({ groupName: newGroupName });
            setNewGroupName("");
            setCreateGroupOpen(false);
        }
    };

    const handleCancel = () => {
        setNewGroupName("");  // Clear the input field
        setCreateGroupOpen(false);  // Close the form
    };

    const handleShowActiveOnlyChange = (e) => {
        setShowActiveOnly(e.target.checked);
    };

    const filteredGroups = groups.filter((group) => {
        const nameMatches = group.groupName.toLowerCase().includes(nameSearch.toLowerCase());
        const activeMatches = showActiveOnly ? group.active : true;
        return nameMatches && activeMatches;
    });

    return (
        <Container maxWidth="lg" sx={{ py: 4, backgroundColor: 'white' }}>
            <Box sx={{ mb: 4 }}>
                <Typography 
                    variant="h2" 
                    component="h1" 
                    sx={{ 
                        textAlign: 'center', 
                        mb: 2,
                        fontWeight: 900,
                        fontFamily: 'Georgia, serif',
                        color: '#fb5233'
                    }}
                >
                    Welcome!
                </Typography>
                <Typography 
                    variant="h5" 
                    component="h2" 
                    sx={{ 
                        textAlign: 'center',
                        color: 'text.secondary',
                        mb: 3
                    }}
                >
                    {professor.groups
                ? `Your Classes:`
                        : `Create groups to track student progress!`}
                </Typography>
            </Box>

            {/* Filters and Create Group Section */}
            <Card sx={{ mb: 3, p: 3, backgroundColor: 'white' }}>
                <Grid container spacing={3} alignItems="center">
                    {/* Search and Filter */}
                    <Grid item xs={12} md={8}>
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 200 }}>
                                <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                <TextField
                                    size="small"
                                    label="Search Class Name"
                        value={nameSearch}
                        onChange={handleNameSearchChange}
                                    placeholder="Enter class name..."
                                    variant="outlined"
                                    sx={{ minWidth: 200 }}
                                />
                            </Box>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={showActiveOnly}
                                        onChange={handleShowActiveOnlyChange}
                                        sx={{ color: '#fb5233', '&.Mui-checked': { color: '#fb5233' } }}
                                    />
                                }
                                label="Show Active Classes Only"
                                sx={{ ml: 2 }}
                            />
                        </Stack>
                    </Grid>

                    {/* Create Group Button */}
                    <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={toggleCreateGroupForm}
                            sx={{ 
                                px: 3,
                                py: 1.5,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '1rem',
                                backgroundColor: '#fb5233',
                                '&:hover': {
                                    backgroundColor: '#e64a19'
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
                            '&:hover': {
                                backgroundColor: '#e64a19'
                            }
                        }}
                    >
                        Create Class
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Groups Table */}
            <Card sx={{ backgroundColor: 'white' }}>
                <TableContainer component={Paper} elevation={0} sx={{ backgroundColor: 'white' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#fb5233' }}>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                                    Class Name
                                </TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                                    Code
                                </TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                                    Student Count
                                </TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 120 }}>
                                    Status
                                </TableCell>
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
                                            '&:hover': {
                                                backgroundColor: '#f5f5f5',
                                            },
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <GroupIcon sx={{ mr: 1, color: '#fb5233' }} />
                                                <Typography variant="body1" fontWeight="medium">
                                                    {group.groupName}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={group.classCode} 
                                                size="small" 
                                                variant="outlined"
                                                sx={{ 
                                                    borderColor: '#fb5233',
                                                    color: '#fb5233'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {group.studentCount || "N/A"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ minWidth: 120 }}>
                                            <Chip
                                                label={group.active ? "Active" : "Inactive"}
                                                color={group.active ? "success" : "default"}
                                                size="small"
                                                variant={group.active ? "filled" : "outlined"}
                                                sx={{
                                                    maxWidth: '100%',
                                                    '& .MuiChip-label': {
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                            ))
                        ) : (
                                <TableRow sx={{ backgroundColor: 'white' }}>
                                    <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
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
