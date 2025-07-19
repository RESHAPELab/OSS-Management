import { useEffect, useState } from "react";
import { useParams, useNavigate } from 'react-router-dom'
import HomeHeader from '../home/components/HomeHeader'
import axios from 'axios'
import { useAuthContext } from '../../context/AuthContext';
import {
  Container, Box, Typography, Button, Stack, Card, Dialog, DialogTitle, DialogContent, DialogActions, 
  Alert, TextField, Chip, List, ListItem, ListItemText, Divider, Paper, Grid, IconButton,
  Accordion, AccordionSummary, AccordionDetails, FormControlLabel, Switch, LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  KeyboardArrowUp as UpIcon,
  KeyboardArrowDown as DownIcon,
  ExpandMore as ExpandMoreIcon,
  School as SchoolIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import RepositoryStatusChecker from '../../components/RepositoryStatusChecker';

let baseURL = `http://localhost:${process.env.PORT || 8080}`;

const ClassView = () => {
    const { classId } = useParams();
    const [classInfo, setClassInfo] = useState({})
    const { authUser } = useAuthContext();
    const [activeIndex, setActiveIndex] = useState(null);
    const [studentData, setStudentData] = useState([]);
    const [createReposStatus, setCreateReposStatus] = useState('');
    const [organizationGh, setOrganizationGh] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showQuestModal, setShowQuestModal] = useState(false);
    const [showReadmeModal, setShowReadmeModal] = useState(false);
    const [csvFile, setCsvFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentProcessingUser, setCurrentProcessingUser] = useState('');
    const [processedCount, setProcessedCount] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [processingResults, setProcessingResults] = useState({ successful: [], unsuccessful: [] });
    const [studentScores, setStudentScores] = useState({});
    const [isLoadingScores, setIsLoadingScores] = useState(false);
    const [readmeFile, setReadmeFile] = useState(null);
    const [readmeContent, setReadmeContent] = useState('');
    const [existingReadme, setExistingReadme] = useState(null);
    const [questFormData, setQuestFormData] = useState({
        title: '',
        type: 'Q1',
        description: '',
        descriptionImage: null,
        tasks: [{
            type: 'multiple-choice',
            title: '',
            objective: '',
            description: '',
            outcome: '',
            helpText: '',
            points: 100,
            descriptionImage: null,
            config: {
                correctAnswer: 'a',
                optionA: '',
                optionB: '',
                optionC: '',
                optionD: ''
            }
        }],
        hints: {
            enabled: false,
            penalty: 10,
            hints: []
        },
        dueDate: ''
    });
    const [collaborationStatus, setCollaborationStatus] = useState({
        accepted: [],
        pending: [],
        notFound: []
    });
    const [showActiveOnly, setShowActiveOnly] = useState(false);
    const [isReuploading, setIsReuploading] = useState(false);
    const [reuploadStatus, setReuploadStatus] = useState('');
    const [isUploadingQuest, setIsUploadingQuest] = useState(false);
    const [uploadQuestStatus, setUploadQuestStatus] = useState('');
    const [showQuestsModal, setShowQuestsModal] = useState(false);
    const [myQuests, setMyQuests] = useState([]);
    const [isLoadingQuests, setIsLoadingQuests] = useState(false);
    const [editingQuest, setEditingQuest] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [questOrder, setQuestOrder] = useState([]);
    const [isSavingQuestOrder, setIsSavingQuestOrder] = useState(false);
    const [questOrderSaveStatus, setQuestOrderSaveStatus] = useState('');
    const [saveQuestOrderTimeout, setSaveQuestOrderTimeout] = useState(null);
    const [fixedQ0Quest] = useState({
        id: 'Q0',
        title: 'Q0: Introduction to Open Source',
        description: 'Welcome to the world of Open Source Software! This foundational quest will introduce you to the basic concepts and tools you\'ll need throughout this course.',
        content: 'This is the fixed introductory quest that cannot be modified or deleted. It serves as the foundation for all other quests in this course.',
        type: 'fixed'
    });
    // Unified quest order that includes both fixed and custom quests
    const [unifiedQuestOrder, setUnifiedQuestOrder] = useState([
        { id: 'Q0', title: 'Q0: Introduction to Open Source', content: 'Introduction to Open Source Software', type: 'fixed', isQ0: true },
        { id: 'Q1', title: 'Q1', content: 'Understanding OSS Projects and GitHub Basics', type: 'fixed' },
        { id: 'Q2', title: 'Q2', content: 'Forking and Contributing to Repositories', type: 'fixed' },
        { id: 'Q3', title: 'Q3', content: 'Creating Pull Requests and Code Reviews', type: 'fixed' }
    ]);
    const navigate = useNavigate();

    useEffect(() => {
        if (authUser) {
            console.log("logged in user:", authUser.profName)
            fetchClassInfo();
            fetchOrganizationGh();
            fetchExistingReadme();
            // Load quests for the course outline
            loadQuestOrderFromDatabase();
        }
    }, [authUser])

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveQuestOrderTimeout) {
                clearTimeout(saveQuestOrderTimeout);
            }
        };
    }, [saveQuestOrderTimeout]);

    useEffect(() => {
        console.log('existingReadme state changed:', existingReadme);
    }, [existingReadme]);

    useEffect(() => {
        if (organizationGh) {
            fetchOrganizationRepos();
        }
    }, [organizationGh]);
    
    const toggleAccordion = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };
    
    useEffect(() => {
        console.log('studentData:', studentData);
    }, [studentData]);

    // Fetch student scores whenever studentData changes
    useEffect(() => {
        if (studentData.length > 0 && classInfo?.groupName) {
            console.log('🔄 [DEBUG] studentData changed, fetching scores...');
            console.log('🔄 [DEBUG] Current studentData:', studentData);
            console.log('🔄 [DEBUG] Current classInfo.groupName:', classInfo.groupName);
            setTimeout(() => {
                fetchStudentScores();
            }, 1000);
        } else {
            console.log('⚠️ [DEBUG] Not fetching scores yet:', {
                hasStudentData: studentData.length > 0,
                hasClassName: !!classInfo?.groupName,
                studentDataLength: studentData.length
            });
        }
    }, [studentData, classInfo?.groupName]);

    // Debug studentScores state changes
    useEffect(() => {
        console.log('🎯 [DEBUG] studentScores state changed:', studentScores);
        console.log('🎯 [DEBUG] studentScores keys:', Object.keys(studentScores));
    }, [studentScores]);

    //karissa: 

    // i set it up for you here so that all of the students info will be inside 'studentData'! 
    // i set up some fake students for both of the classes under your acc,
    // but if you want more don't forget you can create some at 
    // localhost:3000/studentRegister using the code for your classes!

    // also don't forget you can access different parts of the student by doing stuff like: 
    // student.firstName or student.lastName
    // looking at the console.log of student data will help with structure/names of attributes of the objects 
    // for display of students on this page, 
    // i think it would look best if we displayed both their first and last names
    // if you're not already doing too much and feel like being extra,
    // it would be great to have the students sorted in order of last name! 
    // good luck and reach out whenever you need anything!!!

    const fetchClassInfo = async () => {
        try {
            console.log('Fetching class info for classId:', classId);
            const response = await axios.get(`${baseURL}/api/group/class/${classId}`);
            console.log('Class info response:', response.data);
            setClassInfo(response.data);
            // We're not using the students from the backend anymore
            // setStudentData(response.data.students || []);
        } catch (error) {
            console.error('Error fetching class info:', error.response?.data || error.message);
            console.error('Full error:', error);
        }
    }

    const fetchExistingReadme = async () => {
        try {
            console.log('📄 [FETCH-README] Starting to fetch existing README...');
            console.log('📄 [FETCH-README] Class ID:', classId);
            
            const response = await axios.get(`${baseURL}/api/group/${classId}/readme`);
            console.log('📄 [FETCH-README] API response received:', {
                status: response.status,
                hasData: !!response.data,
                hasReadme: !!(response.data && response.data.readme)
            });
            
            if (response.data && response.data.readme) {
                console.log('✅ [FETCH-README] Existing README found:', {
                    fileName: response.data.readme.fileName,
                    contentLength: response.data.readme.contentLength,
                    hasContent: !!response.data.readme.content
                });
                setExistingReadme(response.data.readme);
                console.log('✅ [FETCH-README] README state updated successfully');
            } else {
                console.log('📄 [FETCH-README] No README found in response');
                setExistingReadme(null);
            }
        } catch (error) {
            // README doesn't exist yet, which is fine
            console.log('📄 [FETCH-README] No existing README found for this class:', {
                status: error.response?.status,
                message: error.message
            });
            setExistingReadme(null);
        }
    }

    const fetchOrganizationGh = async () => {
        try {
            const response = await axios.get(`${baseURL}/api/repo/prodStatus`);
            setOrganizationGh(response.data.organizationGh);
        } catch (error) {
            console.error('Error fetching organization GitHub name:', error);
            setCreateReposStatus('Error: Could not fetch organization information');
        }
    }

    const fetchOrganizationRepos = async () => {
        try {
            setIsLoading(true);
            // Don't proceed if we don't have the class info yet
            if (!classInfo || !classInfo.groupName) {
                console.log('Waiting for class info to load...');
                return;
            }

            console.log('🔍 [DEBUG] fetchOrganizationRepos called with:', {
                organizationGh,
                className: classInfo.groupName
            });

            const response = await axios.get(`${baseURL}/api/repo/listRepos`, {
                params: { organizationGh }
            });
            
            console.log('📋 [DEBUG] listRepos response:', response.data);
            
            if (response.data.repos) {
                // Format class name to match repository naming convention
                const formattedClassName = classInfo.groupName
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')  // Replace any non-alphanumeric chars with hyphens
                    .replace(/^-+|-+$/g, '');     // Remove leading/trailing hyphens

                console.log('🏷️ [DEBUG] formattedClassName:', formattedClassName);
                console.log('📦 [DEBUG] All repos found:', response.data.repos.map(r => r.name));

                // Filter repositories to only show ones for this class using new username-classname format
                const classRepos = response.data.repos
                    .filter(repo => {
                        const matches = repo.name.endsWith(`-${formattedClassName}`);
                        console.log(`🔍 [DEBUG] Checking repo "${repo.name}" - matches pattern: ${matches}`);
                        return matches;
                    })
                    .map(repo => ({ 
                        githubUsername: repo.name.replace(`-${formattedClassName}`, '') // Remove class suffix to get username
                    }));

                console.log('👥 [DEBUG] Filtered classRepos:', classRepos);
                setStudentData(classRepos);
                
                // Immediately check collaboration status
                if (classRepos.length > 0) {
                    try {
                        const statusResponse = await axios.post(`${baseURL}/api/repo/collaborationStatus`, {
                            organizationGh,
                            students: classRepos.map(repo => repo.githubUsername),
                            className: classInfo.groupName
                        });
                        if (statusResponse.data.results) {
                            console.log('Initial collaboration status:', statusResponse.data.results);
                            setCollaborationStatus(statusResponse.data.results);
                        }
                    } catch (error) {
                        console.error('Error checking initial collaboration status:', error);
                    }
                    
                    // Also fetch student scores
                    setTimeout(() => {
                        fetchStudentScores();
                    }, 500);
                }
            }
        } catch (error) {
            console.error('Error fetching organization repositories:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Update useEffect to wait for classInfo
    useEffect(() => {
        if (organizationGh && classInfo && classInfo.groupName) {
            fetchOrganizationRepos();
        }
    }, [organizationGh, classInfo]);

    const handleCsvUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'text/csv') {
            setCsvFile(file);
        } else {
            alert('Please upload a valid CSV file');
        }
    };

    const handleCreateRepos = async () => {
        if (!csvFile) {
            alert('Please upload a CSV file first');
            return;
        }

        try {
            if (!organizationGh) {
                setCreateReposStatus('Error: Organization information not available');
                return;
            }

            // Debug: Log the classId to see what it looks like
            console.log('🔍 DEBUG: classId from URL params:', classId);
            console.log('🔍 DEBUG: classId type:', typeof classId);
            console.log('🔍 DEBUG: classId length:', classId ? classId.length : 'null');

            // Validate that classId looks like a MongoDB ObjectId (24 hex characters)
            if (!classId || classId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(classId)) {
                console.error('❌ DEBUG: Invalid classId format:', classId);
                setCreateReposStatus(`Error: Invalid class ID format. Expected 24-character hex string, got: ${classId}`);
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target.result;
                const lines = text.split('\n');
                // Skip header if it exists and filter out empty lines
                const usernames = lines
                    .slice(lines[0].toLowerCase().includes('github_username') ? 1 : 0)
                    .map(line => line.trim())
                    .filter(line => line.length > 0);

                console.log('🔍 [CSV-UPLOAD] Processing usernames:', usernames);
                console.log('🔍 [CSV-UPLOAD] Using createCustomRepos for each user individually');

                // Initialize progress tracking
                setIsProcessing(true);
                setTotalUsers(usernames.length);
                setProcessedCount(0);
                setCurrentProcessingUser('');
                setProcessingResults({ successful: [], unsuccessful: [] });

                // Use createCustomRepos (same as individual button) for each user
                const results = {
                    successful: [],
                    unsuccessful: []
                };

                for (let i = 0; i < usernames.length; i++) {
                    const username = usernames[i];
                    console.log(`🔄 [CSV-UPLOAD] Processing ${i + 1}/${usernames.length}: ${username}`);
                    console.log(`🔄 [CSV-UPLOAD] Building request for user: ${username}`);
                    
                    // Update progress state for UI
                    setCurrentProcessingUser(username);
                    setProcessedCount(i);
                    
                    // Update status to show progress
                    setCreateReposStatus(`Processing ${i + 1}/${usernames.length}: Creating repository for ${username}...`);
                    
                    try {
                        const requestBody = {
                            users: [username], // Single user per request
                            customSequence: questConfig, // Use the same quest config as individual button
                            className: classInfo?.groupName,
                            classId: classInfo?._id
                        };

                        console.log(`📤 [CSV-UPLOAD] Request details for ${username}:`, {
                            users: requestBody.users,
                            className: requestBody.className,
                            classId: requestBody.classId,
                            hasQuestConfig: !!requestBody.customSequence,
                            questCount: requestBody.customSequence?.questSequence?.length || 0
                        });

                        console.log(`🌐 [CSV-UPLOAD] Sending API request to createCustomRepos for ${username}...`);
                        const response = await axios.post(`${baseURL}/api/repo/createCustomRepos`, requestBody);
                        
                        console.log(`📥 [CSV-UPLOAD] API response for ${username}:`, {
                            status: response.status,
                            statusText: response.statusText,
                            hasResults: !!response.data.results,
                            successful: response.data.results?.successful?.length || 0,
                            unsuccessful: response.data.results?.unsuccessful?.length || 0
                        });
                        
                        if (response.data.results && response.data.results.successful.length > 0) {
                            console.log(`✅ [CSV-UPLOAD] Success for ${username}`);
                            console.log(`✅ [CSV-UPLOAD] Success details:`, response.data.results.successful[0]);
                            results.successful.push(username);
                            setProcessingResults(prev => ({
                                ...prev,
                                successful: [...prev.successful, username]
                            }));
                        } else {
                            console.error(`❌ [CSV-UPLOAD] Failed for ${username}:`, response.data);
                            console.error(`❌ [CSV-UPLOAD] Failure reason:`, {
                                message: response.data.message,
                                results: response.data.results,
                                error: response.data.error
                            });
                            results.unsuccessful.push(username);
                            setProcessingResults(prev => ({
                                ...prev,
                                unsuccessful: [...prev.unsuccessful, username]
                            }));
                        }
                    } catch (error) {
                        console.error(`💥 [CSV-UPLOAD] Error for ${username}:`, error.message);
                        results.unsuccessful.push(username);
                        setProcessingResults(prev => ({
                            ...prev,
                            unsuccessful: [...prev.unsuccessful, username]
                        }));
                    }

                    // Small delay to prevent overwhelming the server
                    if (i < usernames.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }

                console.log('🏁 [CSV-UPLOAD] All users processed:', results);

                // Mark processing as complete
                setProcessedCount(usernames.length);
                setCurrentProcessingUser('');
                setIsProcessing(false);

                setCreateReposStatus(
                    `Repository creation completed.\n` +
                    `Successful: ${results.successful.join(', ')}\n` +
                    `Failed: ${results.unsuccessful.join(', ')}`
                );
                // Add a small delay to allow GitHub to process collaborator invitations
                console.log('⏳ Waiting 3 seconds for GitHub to process invitations...');
                setTimeout(() => {
                    console.log('🔄 Refreshing repository list and collaboration status...');
                    fetchOrganizationRepos();
                    // Close the modal after refresh
                    setTimeout(() => {
                        setShowModal(false);
                        setCsvFile(null);
                        setIsProcessing(false);
                        setProcessingResults({ successful: [], unsuccessful: [] });
                    }, 1000);
                }, 3000);
                // Don't close the modal immediately - let users see the completion status
                // Modal will close automatically after refresh completes
            };
            reader.readAsText(csvFile);
        } catch (error) {
            console.error('Error creating repos:', error);
            if (error.response?.data?.message) {
                setCreateReposStatus(`Error: ${error.response.data.message}`);
            } else {
                setCreateReposStatus('Error creating repositories. Please try again.');
            }
        }
    };

    const checkCollaborationStatus = async () => {
        try {
            if (!organizationGh || studentData.length === 0 || !classInfo?.groupName) {
                console.log('⚠️ [DEBUG] checkCollaborationStatus skipped:', {
                    hasOrgGh: !!organizationGh,
                    hasStudentData: studentData.length > 0,
                    hasClassName: !!classInfo?.groupName
                });
                return;
            }

            console.log('🔍 [DEBUG] checkCollaborationStatus called:', {
                organizationGh,
                studentCount: studentData.length,
                className: classInfo.groupName,
                students: studentData.map(s => s.githubUsername)
            });

            const response = await axios.post(`${baseURL}/api/repo/collaborationStatus`, {
                organizationGh,
                students: studentData.map(repo => repo.githubUsername),
                className: classInfo.groupName
            });

            if (response.data.results) {
                console.log('📊 [DEBUG] Collaboration status results:', response.data.results);
                setCollaborationStatus(response.data.results);
            }
        } catch (error) {
            console.error('❌ [DEBUG] Error checking collaboration status:', error);
            console.error('❌ [DEBUG] Error details:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
        }
    };

    const fetchStudentScores = async () => {
        try {
            if (!classInfo?.groupName || studentData.length === 0) {
                console.log('⚠️ [DEBUG] fetchStudentScores skipped:', {
                    hasClassName: !!classInfo?.groupName,
                    hasStudentData: studentData.length > 0
                });
                return;
            }

            setIsLoadingScores(true);
            console.log('📊 [DEBUG] fetchStudentScores called:', {
                className: classInfo.groupName,
                studentCount: studentData.length,
                students: studentData.map(s => s.githubUsername)
            });

            const response = await axios.post(`${baseURL}/api/repo/studentScores`, {
                className: classInfo.groupName,
                students: studentData.map(repo => repo.githubUsername)
            });

            if (response.data.scores) {
                console.log('🏆 [DEBUG] Student scores received:', response.data.scores);
                setStudentScores(response.data.scores);
            }
        } catch (error) {
            console.error('❌ [DEBUG] Error fetching student scores:', error);
            console.error('❌ [DEBUG] Error details:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
        } finally {
            setIsLoadingScores(false);
        }
    };

    // Remove the separate useEffect for initial status check since we're doing it in fetchOrganizationRepos
    useEffect(() => {
        if (organizationGh) {
            const interval = setInterval(checkCollaborationStatus, 30000);
            return () => clearInterval(interval);
        }
    }, [organizationGh]);

    const handleShowActiveOnlyChange = (e) => {
        setShowActiveOnly(e.target.checked);
    };

    const handleQuestFormChange = (field, value) => {
        setQuestFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleTaskChange = (taskIndex, field, value) => {
        setQuestFormData(prev => ({
            ...prev,
            tasks: prev.tasks.map((task, index) => 
                index === taskIndex ? { ...task, [field]: value } : task
            )
        }));
    };

    const addTask = () => {
        setQuestFormData(prev => ({
            ...prev,
            tasks: [...prev.tasks, {
                type: 'multiple-choice',
                title: '',
                objective: '',
                description: '',
                outcome: '',
                helpText: '',
                points: 100,
                descriptionImage: null,
                config: {
                    correctAnswer: 'a',
                    optionA: '',
                    optionB: '',
                    optionC: '',
                    optionD: ''
                }
            }]
        }));
    };

    const removeTask = (taskIndex) => {
        setQuestFormData(prev => ({
            ...prev,
            tasks: prev.tasks.filter((_, index) => index !== taskIndex)
        }));
    };

    const getTaskConfigFields = (taskType) => {
        switch(taskType) {
            case 'multiple-choice':
                return ['correctAnswer', 'optionA', 'optionB', 'optionC', 'optionD'];
            case 'github-api':
                return ['apiCallType', 'ossRepository'];
            case 'quiz':
                return ['questionCount', 'correctAnswers'];
            case 'text-input':
                return ['expectedAnswer'];
            default:
                return [];
        }
    };

    const addHint = () => {
        if (questFormData.hints.hints.length < 3) {
            setQuestFormData(prev => ({
                ...prev,
                hints: {
                    ...prev.hints,
                    hints: [...prev.hints.hints, '']
                }
            }));
        }
    };

    const removeHint = (hintIndex) => {
        setQuestFormData(prev => ({
            ...prev,
            hints: {
                ...prev.hints,
                hints: prev.hints.hints.filter((_, index) => index !== hintIndex)
            }
        }));
    };

    const updateHint = (hintIndex, content) => {
        setQuestFormData(prev => ({
            ...prev,
            hints: {
                ...prev.hints,
                hints: prev.hints.hints.map((hint, index) => 
                    index === hintIndex ? content : hint
                )
            }
        }));
    };

    const handleImageUpload = (file, type, hintIndex = null, taskIndex = null) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = {
                    name: file.name,
                    type: file.type,
                    data: e.target.result
                };
                
                if (type === 'description') {
                    setQuestFormData(prev => ({
                        ...prev,
                        descriptionImage: imageData
                    }));
                } else if (type === 'hint' && hintIndex !== null) {
                    setQuestFormData(prev => ({
                        ...prev,
                        hints: {
                            ...prev.hints,
                            hints: prev.hints.hints.map((hint, index) => 
                                index === hintIndex ? { ...hint, image: imageData } : hint
                            )
                        }
                    }));
                } else if (type === 'task' && taskIndex !== null) {
                    setQuestFormData(prev => ({
                        ...prev,
                        tasks: prev.tasks.map((task, index) => 
                            index === taskIndex ? { ...task, descriptionImage: imageData } : task
                        )
                    }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = (type, hintIndex = null, taskIndex = null) => {
        if (type === 'description') {
            setQuestFormData(prev => ({
                ...prev,
                descriptionImage: null
            }));
        } else if (type === 'hint' && hintIndex !== null) {
            setQuestFormData(prev => ({
                ...prev,
                hints: {
                    ...prev.hints,
                    hints: prev.hints.hints.map((hint, index) => 
                        index === hintIndex ? { ...hint, image: null } : hint
                    )
                }
            }));
        } else if (type === 'task' && taskIndex !== null) {
            setQuestFormData(prev => ({
                ...prev,
                tasks: prev.tasks.map((task, index) => 
                    index === taskIndex ? { ...task, descriptionImage: null } : task
                )
            }));
        }
    };

    const handleReuploadReadme = async () => {
        if (!readmeContent) {
            alert('Please upload a README file first.');
            return;
        }
        setIsReuploading(true);
        setReuploadStatus('');
        try {
            // POST to backend to update README and push to all student repos
            const response = await axios.post(`${baseURL}/api/group/${classId}/readme`, {
                content: readmeContent,
                fileName: readmeFile ? readmeFile.name : 'README.md',
                pushToRepos: true // (optional, if backend supports it)
            });
            if (response.status === 200) {
                setReuploadStatus('README re-uploaded and pushed to all student repositories successfully!');
                setShowReadmeModal(false);
                setReadmeFile(null);
                setReadmeContent('');
                fetchExistingReadme();
                fetchOrganizationRepos(); // Refresh repos in case of update
            } else {
                setReuploadStatus('Unexpected response from server.');
            }
        } catch (error) {
            setReuploadStatus('Error re-uploading README. Please try again.');
            console.error('Error re-uploading README:', error);
        } finally {
            setIsReuploading(false);
        }
    };

    const handleUploadMCQQuest = async () => {
        if (!questFormData.title.trim()) {
            alert('Please fill in the quest title.');
            return;
        }

        if (questFormData.tasks.length === 0) {
            alert('Please add at least one task.');
            return;
        }

        // Validate all tasks have required fields
        for (let i = 0; i < questFormData.tasks.length; i++) {
            const task = questFormData.tasks[i];
            
            if (task.type !== 'multiple-choice') {
                alert(`Task ${i + 1} must be a multiple choice question.`);
                return;
            }
            
            // Check each required field individually for better error messages
            if (!task.title.trim()) {
                alert(`Task ${i + 1} is missing a title.`);
                return;
            }
            if (!task.objective.trim()) {
                alert(`Task ${i + 1} is missing an objective.`);
                return;
            }
            if (!task.description.trim()) {
                alert(`Task ${i + 1} is missing a description.`);
                return;
            }
            if (!task.outcome.trim()) {
                alert(`Task ${i + 1} is missing an outcome.`);
                return;
            }
            if (!task.helpText.trim()) {
                alert(`Task ${i + 1} is missing help text.`);
                return;
            }
            if (!task.config.correctAnswer) {
                alert(`Task ${i + 1} is missing a correct answer.`);
                return;
            }
            if (!task.config.optionA.trim()) {
                alert(`Task ${i + 1} is missing option A.`);
                return;
            }
            if (!task.config.optionB.trim()) {
                alert(`Task ${i + 1} is missing option B.`);
                return;
            }
            if (!task.config.optionC.trim()) {
                alert(`Task ${i + 1} is missing option C.`);
                return;
            }
            if (!task.config.optionD.trim()) {
                alert(`Task ${i + 1} is missing option D.`);
                return;
            }
        }

        setIsUploadingQuest(true);
        setUploadQuestStatus('');

        try {
            // Convert quest form data to the format expected by the backend
            const questData = {
                questTitle: questFormData.title,
                professorId: authUser._id, // Use _id instead of id
                tasks: questFormData.tasks.map((task, index) => ({
                    title: task.title,
                    objective: task.objective,
                    description: task.description,
                    outcome: task.outcome,
                    helpText: task.helpText,
                    points: task.points,
                    correctAnswer: task.config.correctAnswer,
                    options: [
                        task.config.optionA,
                        task.config.optionB,
                        task.config.optionC,
                        task.config.optionD
                    ],
                    hints: questFormData.hints.enabled ? questFormData.hints.hints.map((hint, hintIndex) => ({
                        content: hint,
                        penalty: questFormData.hints.penalty,
                        sequence: hintIndex + 1
                    })) : []
                }))
            };

            let response;
            if (isEditMode && editingQuest) {
                // Update existing quest
                response = await axios.put(`${baseURL}/api/quest/${editingQuest._id}`, questData);
            } else {
                // Create new quest
                response = await axios.post(`${baseURL}/api/quest/upload-mcq`, questData);
            }
            
            if (response.data.success) {
                const action = isEditMode ? 'updated' : 'uploaded';
                setUploadQuestStatus(`✅ MCQ Quest "${questFormData.title}" ${action} successfully! Quest ID: ${response.data.data.questId || editingQuest._id}`);
                setShowQuestModal(false);
                
                console.log('Quest creation response:', response.data);
                console.log('New quest ID:', response.data.data.questId || response.data.data._id);
                
                // If this is a new quest (not editing), add it to the quest order
                if (!isEditMode) {
                    const newQuestId = response.data.data.questId || response.data.data._id;
                    console.log('Adding new quest to order with ID:', newQuestId);
                    
                    const newQuest = {
                        _id: newQuestId,
                        questTitle: questFormData.title,
                        title: questFormData.title,
                        type: 'custom',
                        content: questFormData.description || questFormData.title,
                        isQ0: false
                    };
                    
                    console.log('New quest object:', newQuest);
                    
                    // Add the new quest to the unified quest order
                    setUnifiedQuestOrder(prevOrder => {
                        console.log('Previous quest order:', prevOrder);
                        const newOrder = [...prevOrder, newQuest];
                        console.log('New quest order with added quest:', newOrder);
                        
                        // Save the updated order to database
                        saveQuestOrderToDatabase(newOrder).then(success => {
                            if (success) {
                                console.log('Quest order updated successfully with new quest');
                                // Refresh the quest order to ensure UI is in sync
                                setTimeout(() => {
                                    loadQuestOrderFromDatabase();
                                }, 500);
                            }
                        });
                        return newOrder;
                    });
                }
                
                // Reset form and edit state
                setQuestFormData({
                    title: '',
                    type: 'Q1',
                    description: '',
                    descriptionImage: null,
                    tasks: [{
                        type: 'multiple-choice',
                        title: '',
                        objective: '',
                        description: '',
                        outcome: '',
                        helpText: '',
                        points: 100,
                        descriptionImage: null,
                        config: {
                            correctAnswer: 'a',
                            optionA: '',
                            optionB: '',
                            optionC: '',
                            optionD: ''
                        }
                    }],
                    hints: {
                        enabled: false,
                        penalty: 10,
                        hints: []
                    },
                    dueDate: ''
                });
                setEditingQuest(null);
                setIsEditMode(false);
                
                // Refresh quests list if we're editing
                if (isEditMode) {
                    handleViewMyQuests();
                }
                
                // Refresh quest order for the course outline
                loadQuestOrderFromDatabase();
            } else {
                setUploadQuestStatus(`❌ Error: ${response.data.message}`);
            }
        } catch (error) {
            console.error('Error uploading MCQ quest:', error);
            const action = isEditMode ? 'updating' : 'uploading';
            setUploadQuestStatus(`❌ Error ${action} quest: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsUploadingQuest(false);
        }
    };

    const handleViewMyQuests = async () => {
        setIsLoadingQuests(true);
        try {
            const response = await axios.get(`${baseURL}/api/quest/professor/${authUser._id}`);
            if (response.data.success) {
                setMyQuests(response.data.data);
                // Set quest order for the dynamic section (excluding Q0)
                setQuestOrder(response.data.data);
            } else {
                console.error('Error fetching quests:', response.data.message);
            }
        } catch (error) {
            console.error('Error fetching quests:', error);
        } finally {
            setIsLoadingQuests(false);
            setShowQuestsModal(true);
        }
    };

    const handleEditQuest = (quest) => {
        // Helper function to parse options from accept response
        const parseOptionsFromResponse = (acceptResponse) => {
            const options = [];
            const lines = acceptResponse.split('\n');
            for (const line of lines) {
                if (line.trim().match(/^[A-D]\)/)) {
                    const option = line.trim().substring(2).trim();
                    options.push(option);
                }
            }
            return options;
        };

        // Helper function to extract objective, outcome, and helpText from responses
        const extractFieldFromResponse = (acceptResponse, fieldName) => {
            const lines = acceptResponse.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith(`**${fieldName}:**`)) {
                    return line.substring(fieldName.length + 4).trim();
                }
            }
            return '';
        };

        // Populate the form with existing quest data
        const questData = {
            title: quest.questTitle,
            type: 'Q1',
            description: quest.description || '',
            descriptionImage: null,
            tasks: quest.tasks ? quest.tasks.map(task => {
                // Parse options from the accept response
                const options = parseOptionsFromResponse(task.responses?.accept || '');
                
                // Extract other fields from the accept response
                const objective = extractFieldFromResponse(task.responses?.accept || '', 'Objective');
                const outcome = extractFieldFromResponse(task.responses?.accept || '', 'Outcome');
                const helpText = extractFieldFromResponse(task.responses?.accept || '', 'Help');
                
                return {
                    type: 'multiple-choice',
                    title: task.taskTitle || task.title || '',
                    objective: objective,
                    description: task.desc || task.description || '',
                    outcome: outcome,
                    helpText: helpText,
                    points: task.points || 100,
                    descriptionImage: null,
                    config: {
                        correctAnswer: task.answer || 'a',
                        optionA: options[0] || '',
                        optionB: options[1] || '',
                        optionC: options[2] || '',
                        optionD: options[3] || ''
                    }
                };
            }) : [{
                type: 'multiple-choice',
                title: '',
                objective: '',
                description: '',
                outcome: '',
                helpText: '',
                points: 100,
                descriptionImage: null,
                config: {}
            }],
            hints: {
                enabled: quest.hints && quest.hints.length > 0,
                penalty: 10,
                hints: quest.hints ? quest.hints.map(hint => hint.content || '') : []
            },
            dueDate: ''
        };

        setQuestFormData(questData);
        setEditingQuest(quest);
        setIsEditMode(true);
        setShowQuestsModal(false);
        setShowQuestModal(true);
    };

    const handleCancelEdit = () => {
        setShowQuestModal(false);
        setEditingQuest(null);
        setIsEditMode(false);
        setUploadQuestStatus('');
        
        // Reset form to initial state
        setQuestFormData({
            title: '',
            type: 'Q1',
            description: '',
            descriptionImage: null,
            tasks: [{
                type: 'multiple-choice',
                title: '',
                objective: '',
                description: '',
                outcome: '',
                helpText: '',
                points: 100,
                descriptionImage: null,
                config: {
                    correctAnswer: 'a',
                    optionA: '',
                    optionB: '',
                    optionC: '',
                    optionD: ''
                }
            }],
            hints: {
                enabled: false,
                penalty: 10,
                hints: []
            },
            dueDate: ''
        });
    };

    const handleDeleteQuest = async (quest) => {
        if (!window.confirm(`Are you sure you want to delete the quest "${quest.questTitle}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await axios.delete(`${baseURL}/api/quest/${quest._id}`);
            if (response.data.success) {
                // Remove the quest from the local state
                setMyQuests(prevQuests => prevQuests.filter(q => q._id !== quest._id));
                alert(`Quest "${quest.questTitle}" deleted successfully!`);
                
                // Refresh quest order for the course outline
                loadQuestOrderFromDatabase();
            } else {
                alert(`Error deleting quest: ${response.data.message}`);
            }
        } catch (error) {
            console.error('Error deleting quest:', error);
            alert(`Error deleting quest: ${error.response?.data?.message || error.message}`);
        }
    };

    const moveQuestUp = (questId) => {
        console.log("=== MOVE QUEST UP ===");
        console.log("Quest ID:", questId);
        setUnifiedQuestOrder(prevOrder => {
            console.log('Previous unified order:', prevOrder.map(q => q.title || q.questTitle));
            const newOrder = [...prevOrder];
            const currentIndex = newOrder.findIndex(q => q._id === questId || q.id === questId);
            console.log('Current index:', currentIndex);
            
            if (currentIndex > 1) { // Can't move above Q0 (index 0) or Q1 (index 1)
                console.log(`Moving "${newOrder[currentIndex].title || newOrder[currentIndex].questTitle}" from position ${currentIndex} to ${currentIndex - 1}`);
                const temp = newOrder[currentIndex];
                newOrder[currentIndex] = newOrder[currentIndex - 1];
                newOrder[currentIndex - 1] = temp;
                console.log('New unified order:', newOrder.map(q => q.title || q.questTitle));
                
                // Use debounced save instead of immediate save
                debouncedSaveQuestOrder(newOrder);
            } else {
                console.log('Cannot move up - already at top of movable quests list');
            }
            return newOrder;
        });
    };

    const moveQuestDown = (questId) => {
        console.log("=== MOVE QUEST DOWN ===");
        console.log("Quest ID:", questId);
        setUnifiedQuestOrder(prevOrder => {
            console.log('Previous unified order:', prevOrder.map(q => q.title || q.questTitle));
            const newOrder = [...prevOrder];
            const currentIndex = newOrder.findIndex(q => q._id === questId || q.id === questId);
            console.log('Current index:', currentIndex);
            
            if (currentIndex < newOrder.length - 1) {
                console.log(`Moving "${newOrder[currentIndex].title || newOrder[currentIndex].questTitle}" from position ${currentIndex} to ${currentIndex + 1}`);
                const temp = newOrder[currentIndex];
                newOrder[currentIndex] = newOrder[currentIndex + 1];
                newOrder[currentIndex + 1] = temp;
                console.log('New unified order:', newOrder.map(q => q.title || q.questTitle));
                
                // Use debounced save instead of immediate save
                debouncedSaveQuestOrder(newOrder);
            } else {
                console.log('Cannot move down - already at bottom of quests list');
            }
            return newOrder;
        });
    };

    const moveFixedQuestUp = (questId) => {
        console.log("=== MOVE FIXED QUEST UP ===");
        console.log("Quest ID:", questId);
        setUnifiedQuestOrder(prevOrder => {
            console.log('Previous unified order:', prevOrder.map(q => q.title || q.questTitle));
            const newOrder = [...prevOrder];
            const currentIndex = newOrder.findIndex(q => q.id === questId);
            console.log('Current index:', currentIndex);
            
            if (currentIndex > 1) { // Can't move above Q0 (index 0) or Q1 (index 1)
                console.log(`Moving "${newOrder[currentIndex].title}" from position ${currentIndex} to ${currentIndex - 1}`);
                const temp = newOrder[currentIndex];
                newOrder[currentIndex] = newOrder[currentIndex - 1];
                newOrder[currentIndex - 1] = temp;
                console.log('New unified order:', newOrder.map(q => q.title || q.questTitle));
                
                // Use debounced save instead of immediate save
                debouncedSaveQuestOrder(newOrder);
            } else {
                console.log('Cannot move up - already at top of movable quests list');
            }
            return newOrder;
        });
    };

    const moveFixedQuestDown = (questId) => {
        console.log("=== MOVE FIXED QUEST DOWN ===");
        console.log("Quest ID:", questId);
        setUnifiedQuestOrder(prevOrder => {
            console.log('Previous unified order:', prevOrder.map(q => q.title || q.questTitle));
            const newOrder = [...prevOrder];
            const currentIndex = newOrder.findIndex(q => q.id === questId);
            console.log('Current index:', currentIndex);
            
            if (currentIndex < newOrder.length - 1) {
                console.log(`Moving "${newOrder[currentIndex].title}" from position ${currentIndex} to ${currentIndex + 1}`);
                const temp = newOrder[currentIndex];
                newOrder[currentIndex] = newOrder[currentIndex + 1];
                newOrder[currentIndex + 1] = temp;
                console.log('New unified order:', newOrder.map(q => q.title || q.questTitle));
                
                // Use debounced save instead of immediate save
                debouncedSaveQuestOrder(newOrder);
            } else {
                console.log('Cannot move down - already at bottom of quests list');
            }
            return newOrder;
        });
    };

    const deleteQuestFromOrder = (questId) => {
        setQuestOrder(prevOrder => prevOrder.filter(q => q._id !== questId));
    };

    const loadQuestsForOutline = async () => {
        try {
            const response = await axios.get(`${baseURL}/api/quest/professor/${authUser._id}`);
            if (response.data.success) {
                // Merge custom quests into the unified order
                const customQuests = response.data.data.map(quest => ({
                    ...quest,
                    type: 'custom',
                    isQ0: false
                }));
                
                // Start with the fixed quests
                const newUnifiedOrder = [
                    { id: 'Q0', title: 'Q0: Introduction to Open Source', content: 'Introduction to Open Source Software', type: 'fixed', isQ0: true },
                    { id: 'Q1', title: 'Q1', content: 'Understanding OSS Projects and GitHub Basics', type: 'fixed' },
                    { id: 'Q2', title: 'Q2', content: 'Forking and Contributing to Repositories', type: 'fixed' },
                    { id: 'Q3', title: 'Q3', content: 'Creating Pull Requests and Code Reviews', type: 'fixed' }
                ];
                
                // Add custom quests at the end
                newUnifiedOrder.push(...customQuests);
                
                setUnifiedQuestOrder(newUnifiedOrder);
                setQuestOrder(customQuests); // Keep this for backward compatibility
                
                // Save this order to the database if we have custom quests
                if (customQuests.length > 0) {
                    saveQuestOrderToDatabase(newUnifiedOrder);
                }
            }
        } catch (error) {
            console.error('Error loading quests for outline:', error);
        }
    };

    // Load quest order from MongoDB
    const loadQuestOrderFromDatabase = async () => {
        try {
            console.log('Loading quest order from database for classId:', classId);
            const response = await axios.get(`${baseURL}/api/group/${classId}/quest-order`);
            console.log('Quest order response:', response.data);
            
            if (response.data.questOrder) {
                // Convert database format to frontend format
                const questOrderFromDB = response.data.questOrder.map(quest => ({
                    id: quest.questId,
                    _id: quest.questType === 'custom' ? quest.questId : null,
                    title: quest.title,
                    questTitle: quest.title,
                    content: quest.title,
                    type: quest.questType,
                    isQ0: quest.isQ0
                }));
                
                console.log('Converted quest order from DB:', questOrderFromDB);
                setUnifiedQuestOrder(questOrderFromDB);
                console.log('Loaded quest order from database:', questOrderFromDB);
            } else {
                console.log('No quest order found in database, loading default order');
                // If no custom order exists, load default order with custom quests
                await loadQuestsForOutline();
            }
        } catch (error) {
            console.error('Error loading quest order from database:', error);
            // Fall back to default loading if database fails
            await loadQuestsForOutline();
        }
    };

    // Debounced save quest order function
    const debouncedSaveQuestOrder = (questOrder) => {
        // Clear any existing timeout
        if (saveQuestOrderTimeout) {
            clearTimeout(saveQuestOrderTimeout);
        }
        
        // Set a new timeout to save after 500ms of no changes
        const timeout = setTimeout(() => {
            saveQuestOrderToDatabase(questOrder);
        }, 500);
        
        setSaveQuestOrderTimeout(timeout);
    };

    // Save quest order to MongoDB
    const saveQuestOrderToDatabase = async (questOrder, retryCount = 0) => {
        setIsSavingQuestOrder(true);
        setQuestOrderSaveStatus('Saving quest order and prerequisites...');
        try {
            // Convert frontend format to database format with prerequisites
            const questOrderForDB = questOrder.map((quest, index) => ({
                questId: quest._id || quest.id,
                questType: quest.type || 'custom',
                sequenceNumber: index,
                title: quest.title || quest.questTitle || quest.content,
                isQ0: quest.isQ0 || false,
                // Prerequisites will be generated automatically on the backend
            }));

            const response = await axios.post(`${baseURL}/api/group/${classId}/quest-order`, {
                questOrder: questOrderForDB
            });
            
            console.log('Quest order and prerequisites saved to database:', response.data);
            setQuestOrderSaveStatus('Quest order and prerequisites saved successfully!');
            // Clear success message after 3 seconds
            setTimeout(() => setQuestOrderSaveStatus(''), 3000);
            return true;
        } catch (error) {
            console.error('Error saving quest order to database:', error);
            
            // Check for specific error types
            if (error.response?.status === 409) {
                // Version conflict - retry automatically
                if (retryCount < 3) {
                    console.log(`Version conflict detected, retrying... (attempt ${retryCount + 1})`);
                    setQuestOrderSaveStatus(`Retrying due to concurrent changes... (attempt ${retryCount + 1})`);
                    setIsSavingQuestOrder(false);
                    // Wait a bit before retrying
                    setTimeout(() => {
                        saveQuestOrderToDatabase(questOrder, retryCount + 1);
                    }, 1000 * (retryCount + 1));
                    return false;
                } else {
                    setQuestOrderSaveStatus('Quest order was modified by another operation. Please refresh and try again.');
                    setTimeout(() => setQuestOrderSaveStatus(''), 5000);
                    return false;
                }
            } else if (error.response?.status === 500) {
                const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Server error';
                console.log('500 error details:', errorMessage);
                
                // If it's a version conflict and we haven't retried too many times, try again
                if (errorMessage.includes('No matching document found') && retryCount < 3) {
                    console.log(`Retrying quest order save (attempt ${retryCount + 1})...`);
                    setQuestOrderSaveStatus(`Retrying... (attempt ${retryCount + 1})`);
                    setIsSavingQuestOrder(false);
                    // Wait a bit before retrying
                    setTimeout(() => {
                        saveQuestOrderToDatabase(questOrder, retryCount + 1);
                    }, 1000);
                    return false;
                } else {
                    // Other 500 errors
                    setQuestOrderSaveStatus(`Server error: ${errorMessage}`);
                    setTimeout(() => setQuestOrderSaveStatus(''), 5000);
                    return false;
                }
            } else if (error.response?.status === 404) {
                setQuestOrderSaveStatus('Group not found - quest order not saved');
                setTimeout(() => setQuestOrderSaveStatus(''), 5000);
                return false;
            } else {
                // Network or other errors
                setQuestOrderSaveStatus('Network error - quest order not saved');
                setTimeout(() => setQuestOrderSaveStatus(''), 5000);
                return false;
            }
        } finally {
            if (retryCount === 0) {
                setIsSavingQuestOrder(false);
            }
        }
    };

    // Reset quest order to default
    const resetQuestOrderToDefault = async () => {
        try {
            const response = await axios.post(`${baseURL}/api/group/${classId}/quest-order/reset`);
            if (response.data.success) {
                loadQuestOrderFromDatabase();
                console.log('Quest order reset to default');
            }
        } catch (error) {
            console.error('Error resetting quest order:', error);
        }
    };

    // Generate dynamic quest configuration
    const generateDynamicQuestConfig = async () => {
        try {
            const response = await axios.post(`${baseURL}/api/quest-config/generate/${classId}`);
            if (response.data.success) {
                console.log('Dynamic quest config generated:', response.data.data);
                alert(`Dynamic quest configuration generated successfully!\n\nQuest Count: ${response.data.data.questCount}\nConfig Path: ${response.data.data.configPath}\n\nThis configuration includes dynamic prerequisites and can be used by the bot.`);
                return response.data.data;
            }
        } catch (error) {
            console.error('Error generating dynamic quest config:', error);
            alert('Error generating dynamic quest configuration. Please try again.');
        }
    };

    // Helper function to format prerequisites for display
    const formatPrerequisites = (prerequisites) => {
        if (!prerequisites || prerequisites.length === 0) {
            return 'None';
        }
        return prerequisites.map(pre => pre.description || `Complete ${pre.questId}`).join(', ');
    };

    const questConfig = {
      map_repo_link: "https://raw.githubusercontent.com/caiton1/OSS-Doorway/main/map",
      questSequence: unifiedQuestOrder.map((quest, index) => {
        const questData = {
          questId: quest.id || quest._id,
          title: quest.title || quest.questTitle,
          isQ0: quest.isQ0 || false,
          questType: quest.type || 'custom',
          sequenceNumber: index,
          metadata: {
            title: quest.title || quest.questTitle,
            description: quest.content || quest.description || '',
            prerequisite: null, // Will be set based on sequence
            type: quest.type === 'fixed' ? 'general' : 'custom'
          }
        };
        if (index > 0) {
          const previousQuest = unifiedQuestOrder[index - 1];
          questData.metadata.prerequisite = previousQuest.id || previousQuest._id;
        }
        // For fixed quests, always use detailed task content based on quest ID
        if (quest.type === 'fixed') {
          if (quest.id === 'Q0') {
            questData.tasks = {
              T1: {
                desc: "Environment Preferences",
                points: 0,
                xp: 0,
                type: "general",
                accept: "## Choosing Your Environment 🌟\n\nWelcome, adventurer! Before diving into the project, you get to customize your experience. Choose how you want to see your progress:\n\n**Options:**\n**A) Show Rank, Not Map** - Only keep track of your ranking, leaving the map a mystery. ✨\n**B) Show Map, Not Rank** - See where you're going, but let your rank remain a surprise! 🗺️\n**C) Show Both** - Get the best of both worlds! See your rank and the map as you go. 🌍\n**D) Show Neither** - For the thrill-seekers: navigate and rank without a guide! 🤫\n\nType the letter of your choice in the comment box, and let the adventure begin! 🎉",
                error: "Q0T1 answer incorrect, please input a valid multi choice answer, only a single letter",
                success: "### 🌟 Congratulations! Your environment preferences have been saved.\n\n",
                answer: "a",
                hints: []
              }
            };
          } else if (quest.id === 'Q1') {
            questData.tasks = {
              T1: {
                desc: "Explore the issue tracker",
                points: 20,
                xp: 20,
                type: "general",
                accept: "### 🎯 Task 1: Find the Issue Tracker\n\n**Objective:** The issue tracker is the hub for project discussions, bug reports, and feature requests. Your goal is to find the issue tracker within our GitHub repository.\n\n**Task:** Visit the GitHub repository in the link below and **COUNT** the number of open issues and provide that number in the comment box to complete the task.\n\n**Outcome:** This task will help you become familiar with how issues are reported, discussed, and tracked. Understanding the volume of discussions is crucial for grasping the project's activity level and areas that might need your contribution.\n\n**Help:** If you need help with this task, type \"help\" in the comment box to get hints, but it will cost you 5 points from your total score.",
                error: "### 🚨 Oops, That's Not Quite Right!\n\nIt looks like the number you've provided doesn't match the current count of **OPEN** issues in our project. \n\nNo worries, though! Mistakes are just stepping stones on the path to learning.\n\nIf you need help, don't forget that you can type **\"help\"** to get hints to complete this task.\n\nEach issue represents a story, a problem to solve, or a feature to improve. Finding the correct number is just the start of understanding the broader narrative of our project.\n\nReady for another try? Your correct answer awaits just a click away!",
                success: "### 🌟 Congratulations! You Nailed It!\n\nYou've successfully identified the correct number of issues in our project, displaying keen attention to detail and dedication. As a reward for your sharp observation skills, you've earned **${experiencePoints} experience points!**\n\n> 🌟 🌟 🌟\n\n🏆 **Current Progress:** You now have **${currentPoints} points**, edging closer to the next level. Remember, you need a total of **100 points to level up**, meaning you're just **${pointsRemaining} points away** from achieving that milestone.\n\n🎯 **Quest Completion:** You now have ${completionRate}% completion rate, to successfully complete the entire quest, you need to reach an 100% completion rate. Every task you accomplish brings you closer to mastering the GitHub realm and unlocking new levels of collaboration and contribution.\n\n> 🌟 🌟 🌟\n\nKeep up the great work! Your journey through the quest is shaping up to be an exciting one. \n\nReady for the next challenge? More experiences and rewards await!\n\nA new task has appeared in the issues tab.\n\nYour adventure awaits! 🌟\n\n",
                answer: "a",
                hints: []
              }
            };
          } else if (quest.id === 'Q2') {
            questData.tasks = {
              T1: {
                desc: "Identify the assigned user for the issue",
                points: 25,
                xp: 25,
                type: "general",
                accept: "### 🎯 Task 1: Identify the Assigned User for the Issue\n\n**Objective:** In open-source collaboration, tracking issue ownership is crucial for effective project management. Your mission is to **find the assigned user** for the following issue and confirm their GitHub username.\n\n **Issue Number:** 91 \n\n**Task:** Type the assigned user's GitHub username (e.g., `your-username`) in the comment box below.\n\n**Outcome:** By identifying the assigned user, you demonstrate your ability to track project ownership and ensure accountability in open-source collaboration. This skill is essential for maintaining clarity and preventing duplicate efforts in a project.\n\n**Help:** Need assistance? Type **\"help\"** in the comment box to receive hints, but remember, each hint will cost you **5 points** from your total score.",
                error: "### 🚨 Oops, That's Not Quite Right!\n\nIt looks like the username you entered isn't the one assigned to this issue.\n\nNo worries—double-check the issue page, ensure you're looking at the correct issue, and try again!\n\nIf you need help, type **\"help\"** in the comment box, but remember, using hints will deduct **5 points** from your total score.\n\nWhen you're ready, submit the correct **GitHub username** of the assigned user and move forward in your contribution journey!",
                success: "### 🌟 Congratulations! You Successfully Identified the Assigned User!\n\nGreat job! You've demonstrated an important skill in open-source collaboration: **tracking issue ownership.** This ensures clarity, accountability, and smooth teamwork in any project.\n\n🏆 **Current Progress:** With this achievement, you've earned **${experiencePoints} points**, bringing you **${pointsRemaining} points** closer to Level 2!\n\n🎯 **Quest Advancement:** You're mastering the fundamentals of GitHub issue management. Understanding **who is responsible for which task** is key to contributing effectively and ensuring the project moves forward efficiently.\n\n💡 Keep up the great work! Your next challenge is just around the corner—let's continue this journey together! 🚀",
                answer: "a",
                hints: []
              }
            };
          } else if (quest.id === 'Q3') {
            questData.tasks = {
              T1: {
                desc: "Solve the issue (upload a file/make commit)",
                points: 50,
                xp: 50,
                type: "general",
                accept: "### 🛠️ Task 1 - Solve the Issue (Non-Code Contribution) and Submit a Pull Request\n\n**Objective:** Your mission involves two key stages: identifying and resolving a non-code issue in our GitHub repository and submitting your solution through a pull request (PR). This task focuses on improving the project's quality and accessibility without writing code, such as enhancing documentation, designing graphics, or organizing content.\n\n**Task:** Using the link below, **complete** the task in the issue assigned to you, **submit** a pull request, and choose the correct file in the options and comment it below.\n\nWhich file did you have to interact with to solve the issue?\n\nA) CONTRIBUTING.md\nB) LICENSE\nC) README.md\nD) CHANGELOG.md\n\n**Outcome:** By identifying and resolving a non-code issue and submitting a pull request, you contribute to the project's improvement. This task demonstrates your initiative and commitment to enhancing the project, deepening your understanding of open-source collaboration, and supporting the project's growth.\n\n**Help:** If you need help with this task, type \"help\" in the comment box to get hints, but it will cost you 5 points from your total score.",
                error: "### 🚨 Oops, That's Not Quite Right!\n\nIt seems the file you've chosen doesn't match the one we were looking for to solve the non-code issue. \n\nRemember, each non-code contribution plays a crucial role in enhancing the project's quality and accessibility. Whether it's documentation, graphics, or organization, every aspect is important.\n\nIf you need help, don't forget that you can type **\"help\"** to get hints to complete this task.\n\nThis task is a bit like detective work 🔍.\n\nSolving a non-code issue by interacting with the right project file demonstrates your ability to contribute to and navigate the project effectively. It's an essential skill in open-source collaboration, showing that you're ready to contribute in a variety of ways.\n\nReady for another try? The correct file and solution to the issue are just a thought process away!\n\nPlease select the correct answer from the options below based on the issue you're addressing:\n\nA) README.md\nB) LICENSE\nC) CONTRIBUTING.md\nD) CHANGELOG.md\n\nType the letter in the comment box to complete this task.",
                success: "### 🌟 Congratulations! You've Made Your First Contribution!\n\nBy solving a non-code issue within our project, you've demonstrated your ability to contribute to our community in diverse and meaningful ways. Your effort enhances the project's quality and accessibility, proving that contributions extend far beyond just code.\n\nFor your dedication and successful contribution, you've been awarded **${experiencePoints} experience points!**\n\n>🌟 🌟 🌟\n\n🏆 **Current Progress:** These ${experiencePoints} points boost your total to **${currentPoints} points**, solidifying your status at Level 2. This achievement is a direct reflection of your commitment, learning, and active participation in our project.\n\n🎯 **Quest Completion:** You now have ${completionRate}% completion rate. To successfully complete the entire quest, you need to reach a 100% completion rate. Each contribution brings you closer to this next significant milestone.\n\n> 🌟 🌟 🌟\n\nFantastic work! Your journey through the project vividly illustrates your growth and the impact of your contributions.\n\nAre you ready to tackle the next challenge? More adventures and rewards are on the horizon!\n\nThe adventure continues! 🌟\n\n",
                answer: "a",
                hints: []
              }
            };
          } else {
            // Fallback for other fixed quests
            questData.tasks = {
              T1: {
                desc: "Complete the quest task",
                points: 20,
                xp: 20,
                type: "general",
                accept: "Complete this quest task to progress in your learning journey.",
                success: "Great job! You've completed this quest task successfully!",
                error: "Not quite right. Please try again!",
                answer: "a",
                hints: []
              }
            };
          }
        } else {
          // Always try to use real tasks from the quest object
          let realTasks = quest.tasks;
          // For custom quests, try to find in myQuests if not present
          if ((!realTasks || Object.keys(realTasks).length === 0) && quest.type === 'custom' && quest._id) {
            const customQuest = myQuests.find(q => q._id === quest._id);
            if (customQuest && customQuest.tasks) realTasks = customQuest.tasks;
          }
          if (realTasks && typeof realTasks === 'object' && Object.keys(realTasks).length > 0) {
            questData.tasks = realTasks;
          } else {
            // Generic fallback for custom quests or unknown types
            questData.tasks = {
              T1: {
                desc: "Task description",
                points: 20,
                xp: 20,
                type: "general",
                accept: "Task description",
                success: "Task completed successfully!",
                error: "Incorrect answer, please try again.",
                answer: "a",
                hints: []
              }
            };
          }
        }
        return questData;
      }),
      metadata: {
        version: "2.0",
        description: `Quest configuration for ${classInfo.groupName || 'Class'}`,
        lastUpdated: new Date().toISOString(),
        totalQuests: unifiedQuestOrder.length,
        customQuests: unifiedQuestOrder.filter(q => q.type === 'custom').length,
        fixedQuests: unifiedQuestOrder.filter(q => q.type === 'fixed').length
      }
    };
    
    console.log('📊 [QUEST-CONFIG] Generated quest configuration:', {
      totalQuests: questConfig.questSequence.length,
      customQuests: questConfig.metadata.customQuests,
      fixedQuests: questConfig.metadata.fixedQuests,
      version: questConfig.metadata.version
    });

    return (
        <div>
            <HomeHeader className="header" />
            <Container maxWidth="lg" sx={{ py: 4 }}>
                {!classInfo || !classInfo.groupName ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                        <Typography variant="h6" color="text.secondary">
                            Loading class information...
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {/* Header Section */}
                        <Box mb={4}>
                            <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
                                {classInfo.groupName}
                            </Typography>
                            <Typography variant="h5" color="text.secondary" gutterBottom>
                                Class Code: {classInfo.classCode}
                            </Typography>
                            <Stack direction="row" spacing={2} alignItems="center" mt={2}>
                                <Chip label="Export Grades" variant="outlined" />
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 1, 
                                    px: 2, 
                                    py: 0.5, 
                                    bgcolor: 'success.main', 
                                    color: 'white', 
                                    borderRadius: 2,
                                    fontSize: '0.875rem'
                                }}>
                                    <CheckCircleIcon sx={{ fontSize: '1rem' }} />
                                    <span>Active Class</span>
                                </Box>
                            </Stack>
                        </Box>

                        {/* Students Section */}
                        <Card sx={{ mb: 4 }}>
                            <Box p={3}>
                                <Typography variant="h5" component="h3" gutterBottom display="flex" alignItems="center">
                                    <GroupIcon sx={{ mr: 1 }} />
                                    Students
                                </Typography>
                                
                                {isLoading ? (
                                    <Box textAlign="center" py={4}>
                                        <LinearProgress sx={{ mb: 2 }} />
                                        <Typography>Loading repositories...</Typography>
                                    </Box>
                                ) : studentData.length === 0 ? (
                                    <Box textAlign="center" py={4}>
                                        <Typography color="text.secondary">
                                            No student repositories found. Click "Add Students" to create repositories.
                                        </Typography>
                                    </Box>
                                ) : (
                                    <List>
                                        <ListItem sx={{ bgcolor: 'primary.light', color: 'white' }}>
                                            <ListItemText 
                                                primary={`📚 Students (${studentData.length})`}
                                                primaryTypographyProps={{ fontWeight: 600 }}
                                            />
                                        </ListItem>
                                        {studentData.map((repo, index) => (
                                            <ListItem key={index}>
                                                <ListItemText primary={repo.githubUsername} />
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                                
                                <Box textAlign="center" mt={3}>
                                    <Button 
                                        variant="contained" 
                                        startIcon={<AddIcon />}
                                        onClick={() => setShowModal(true)}
                                        sx={{ 
                                            bgcolor: '#fb5233', 
                                            '&:hover': { bgcolor: '#e04a2e' },
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Add Students
                                    </Button>
                                    {createReposStatus && (
                                        <Alert severity="info" sx={{ mt: 2 }}>
                                            {createReposStatus}
                                        </Alert>
                                    )}
                                </Box>
                            </Box>
                        </Card>

                        {/* Quest Completion Section */}
                        <Card sx={{ mb: 4 }}>
                            <Box p={3}>
                                <Typography variant="h5" component="h3" gutterBottom display="flex" alignItems="center">
                                    <SchoolIcon sx={{ mr: 1 }} />
                                    Student Progress & Scores
                                </Typography>
                                
                                {isLoadingScores ? (
                                    <Box textAlign="center" py={4}>
                                        <LinearProgress sx={{ mb: 2 }} />
                                        <Typography>Loading student scores...</Typography>
                                    </Box>
                                ) : studentData.length === 0 ? (
                                    <Box textAlign="center" py={4}>
                                        <Typography color="text.secondary">
                                            No students found. Add students to see their progress.
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#f5f5f5' }}>
                                                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', fontWeight: 600 }}>Student</th>
                                                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', fontWeight: 600 }}>Points</th>
                                                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', fontWeight: 600 }}>XP</th>
                                                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', fontWeight: 600 }}>Completion %</th>
                                                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', fontWeight: 600 }}>Current Streak</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {studentData
                                                    .sort((a, b) => {
                                                        const scoreA = studentScores[a.githubUsername]?.points || 0;
                                                        const scoreB = studentScores[b.githubUsername]?.points || 0;
                                                        return scoreB - scoreA; // Sort by points descending
                                                    })
                                                    .map((student, index) => {
                                                        const scores = studentScores[student.githubUsername] || {};
                                                        
                                                        return (
                                                            <tr key={student.githubUsername} style={{
                                                                backgroundColor: index % 2 === 0 ? '#fafafa' : 'white'
                                                            }}>
                                                                <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 500 }}>
                                                                    {student.githubUsername}
                                                                    {index === 0 && scores.points > 0 && (
                                                                        <span style={{ marginLeft: '8px', fontSize: '14px' }}>🏆</span>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                                    <strong style={{ color: '#1976d2' }}>{scores.points || 0}</strong>
                                                                </td>
                                                                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                                    <strong style={{ color: '#9c27b0' }}>{scores.xp || 0}</strong>
                                                                </td>
                                                                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <LinearProgress 
                                                                            variant="determinate" 
                                                                            value={scores.completion || 0}
                                                                            sx={{ 
                                                                                width: '80px', 
                                                                                height: '6px',
                                                                                borderRadius: '3px'
                                                                            }}
                                                                        />
                                                                        <span style={{ fontSize: '14px', fontWeight: 500 }}>
                                                                            {scores.completion || 0}%
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                                    <span style={{ color: '#ff5722', fontWeight: 500 }}>
                                                                        🔥 {scores.currentStreak || 0}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                            </tbody>
                                        </table>
                                        
                                        {/* Summary Statistics */}
                                        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                            <Typography variant="h6" gutterBottom>
                                                📊 Class Statistics
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6} md={4}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Total Students
                                                    </Typography>
                                                    <Typography variant="h6">
                                                        {studentData.length}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={12} sm={6} md={4}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Average Points
                                                    </Typography>
                                                    <Typography variant="h6">
                                                        {studentData.length > 0 ? Math.round(
                                                            studentData.reduce((sum, student) => 
                                                                sum + (studentScores[student.githubUsername]?.points || 0), 0
                                                            ) / studentData.length
                                                        ) : 0}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={12} sm={6} md={4}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Average Completion
                                                    </Typography>
                                                    <Typography variant="h6">
                                                        {studentData.length > 0 ? Math.round(
                                                            studentData.reduce((sum, student) => 
                                                                sum + (studentScores[student.githubUsername]?.completion || 0), 0
                                                            ) / studentData.length
                                                        ) : 0}%
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Card>

                        {/* Course Outline Section */}
                        <Card>
                            <Box p={3}>
                                <Typography variant="h5" component="h3" gutterBottom display="flex" alignItems="center">
                                    <AssignmentIcon sx={{ mr: 1 }} />
                                    Course Outline
                                </Typography>
                                
                                {/* Action Buttons */}
                                <Stack direction="row" spacing={2} mb={3} flexWrap="wrap" useFlexGap>
                                    <Button 
                                        variant="contained" 
                                        startIcon={<EditIcon />}
                                onClick={() => setShowReadmeModal(true)}
                                        sx={{ 
                                            bgcolor: '#fb5233', 
                                            '&:hover': { bgcolor: '#e04a2e' },
                                            fontWeight: 'bold'
                                }}
                            >
                                {existingReadme ? 'Edit README Instructions' : 'Add README Instructions'}
                                    </Button>
                                    <Button 
                                        variant="contained" 
                                        color="primary"
                                        onClick={() => navigate(`/class/${classId}/manage-quests`)}
                                        startIcon={<AssignmentIcon />}
                                    >
                                        Manage Quests
                                    </Button>
                                </Stack>

                                {/* Status Messages */}
                            {existingReadme && (
                                    <Alert severity="success" sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            ✓ README Instructions Set
                                        </Typography>
                                        <Typography variant="body2">
                                            File: {existingReadme.fileName} | Content Length: {existingReadme.contentLength} characters
                                        </Typography>
                                    </Alert>
                            )}
                            {!existingReadme && (
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            ℹ️ No README Instructions Set
                                        </Typography>
                                        <Typography variant="body2">
                                            Click "Add README Instructions" to upload a README file for this class.
                                        </Typography>
                                    </Alert>
                                )}
                                
                                {/* Quest Summary */}
                                <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Quest Summary
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        {unifiedQuestOrder.length} total quests configured for this class
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        • {unifiedQuestOrder.filter(q => q.type === 'fixed').length} fixed quests (Q0-Q3)
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        • {unifiedQuestOrder.filter(q => q.type === 'custom').length} custom quests
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Use the "Manage Quests" button to create, edit, delete, and reorder quests.
                                    </Typography>
                                </Paper>

                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" fontWeight={600}>
                                        🔄 Quest Management
                                    </Typography>
                                    <Typography variant="body2">
                                        Use the "Manage Quests" button to create, edit, delete, and reorder quests for this class.
                                    </Typography>
                                </Alert>
                                <Box sx={{ mt: 3 }}>
                                </Box>
                            </Box>
                        </Card>
                    </>
                )}
            </Container>

            {/* Add Students Modal */}
            <Dialog open={showModal} onClose={() => {
                if (!isProcessing) {
                    setShowModal(false);
                    setCsvFile(null);
                }
            }} maxWidth="md" fullWidth>
                <DialogTitle>
                    {isProcessing ? 'Creating Repositories...' : 'Upload GitHub Usernames'}
                </DialogTitle>
                <DialogContent>
                    {isProcessing ? (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Processing Users ({processedCount}/{totalUsers})
                            </Typography>
                            <LinearProgress 
                                variant="determinate" 
                                value={(processedCount / totalUsers) * 100}
                                sx={{ mb: 2, height: 8, borderRadius: 4 }}
                            />
                            {currentProcessingUser && (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <Typography variant="body2">
                                        Currently processing: <strong>{currentProcessingUser}</strong>
                                    </Typography>
                                </Alert>
                            )}
                            
                            {processingResults.successful.length > 0 && (
                                <Paper sx={{ p: 2, mb: 2, bgcolor: '#f0f9ff' }}>
                                    <Typography variant="subtitle2" color="success.main" gutterBottom>
                                        ✅ Successfully Created ({processingResults.successful.length})
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {processingResults.successful.map(user => (
                                            <Chip key={user} label={user} color="success" size="small" />
                                        ))}
                                    </Box>
                                </Paper>
                            )}
                            
                            {processingResults.unsuccessful.length > 0 && (
                                <Paper sx={{ p: 2, mb: 2, bgcolor: '#fef2f2' }}>
                                    <Typography variant="subtitle2" color="error.main" gutterBottom>
                                        ❌ Failed ({processingResults.unsuccessful.length})
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {processingResults.unsuccessful.map(user => (
                                            <Chip key={user} label={user} color="error" size="small" />
                                        ))}
                                    </Box>
                                </Paper>
                            )}
                            
                            {processedCount === totalUsers && (
                                <Alert severity="success" sx={{ mt: 2 }}>
                                    <Typography variant="body2">
                                        🎉 Processing completed! {processingResults.successful.length} successful, {processingResults.unsuccessful.length} failed.
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        ⏳ Refreshing collaboration status... This dialog will close automatically.
                                    </Typography>
                                </Alert>
                            )}
                        </Box>
                    ) : (
                        <Box>
                            <Typography variant="body1" paragraph>
                                This method will:
                            </Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemText primary="Create student accounts for each GitHub username" />
                                </ListItem>
                                <ListItem>
                                    <ListItemText primary="Create private repositories for each student with initial README" />
                                </ListItem>
                                <ListItem>
                                    <ListItemText primary="Send invitation emails to join the class" />
                                </ListItem>
                                <ListItem>
                                    <ListItemText primary="Set up quest system and initial tasks" />
                                </ListItem>
                            </List>
                            <Typography variant="body1" paragraph>
                                Upload a CSV file containing GitHub usernames (one per line)
                            </Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemText primary="File must be in .csv format" />
                                </ListItem>
                                <ListItem>
                                    <ListItemText primary="One GitHub username per line" />
                                </ListItem>
                                <ListItem>
                                    <ListItemText primary="First line can optionally be a header" />
                                </ListItem>
                                <ListItem>
                                    <ListItemText primary="Usernames must match existing GitHub accounts" />
                                </ListItem>
                            </List>
                            <Button 
                                variant="outlined" 
                                onClick={() => {
                                    const csvContent = "github_username\njohndoe\njanesmith";
                                    const blob = new Blob([csvContent], { type: 'text/csv' });
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = 'github_usernames_template.csv';
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    window.URL.revokeObjectURL(url);
                                }}
                                sx={{ mb: 2 }}
                            >
                                Download Template
                            </Button>
                            <Box>
                                                <input 
                                                    type="file" 
                            id="csvFile"
                            accept=".csv" 
                            onChange={handleCsvUpload}
                            style={{ display: 'none' }}
                        />
                        <label htmlFor="csvFile">
                            <Button variant="outlined" component="span">
                                {csvFile ? csvFile.name : 'Choose CSV file...'}
                            </Button>
                                            </label>
                    </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    {isProcessing ? (
                        <>
                            <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                                Please wait while repositories are being created...
                            </Typography>
                            {processedCount === totalUsers && (
                                <Button 
                                    onClick={() => {
                                        setShowModal(false);
                                        setCsvFile(null);
                                        setIsProcessing(false);
                                        setProcessingResults({ successful: [], unsuccessful: [] });
                                    }}
                                    variant="contained"
                                >
                                    Close
                                </Button>
                            )}
                        </>
                    ) : (
                        <>
                            <Button onClick={() => {
                                setShowModal(false);
                                setCsvFile(null);
                            }}>
                                Cancel
                            </Button>
                            <Button 
                                variant="contained" 
                                onClick={handleCreateRepos}
                                disabled={!csvFile}
                            >
                                Create Repositories
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

            {/* README Modal */}
            <Dialog open={showReadmeModal} onClose={() => setShowReadmeModal(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {existingReadme ? 'Edit README Instructions' : 'Add README Instructions'}
                </DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            📋 README Setup for Student Repositories
                        </Typography>
                        <Typography variant="body2">
                            Upload a README file that will be automatically included in the initial commit when creating student repositories. This README will contain course information, objectives, and instructions for students.
                        </Typography>
                    </Alert>
                                
                                {existingReadme && (
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                ⚠️ Existing README Found
                            </Typography>
                            <Typography variant="body2">
                                This class already has a README file: <strong>{existingReadme.fileName}</strong>
                            </Typography>
                            <Typography variant="body2">
                                Uploading a new file will replace the existing one.
                            </Typography>
                        </Alert>
                    )}

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            📁 Upload README File
                        </Typography>
                        <Typography variant="body2" paragraph>
                            Upload a markdown (.md) file that will serve as the README for all student repositories:
                        </Typography>
                        
                        <Box>
                                        <input 
                                            type="file" 
                                            id="readmeFile"
                                            accept=".md,.markdown,text/markdown" 
                                            onChange={(event) => {
                                                const file = event.target.files[0];
                                                if (file) {
                                                    setReadmeFile(file);
                                                    const reader = new FileReader();
                                                    reader.onload = (e) => {
                                                        setReadmeContent(e.target.result);
                                                    };
                                                    reader.readAsText(file);
                                                }
                                            }}
                                style={{ display: 'none' }}
                                        />
                            <label htmlFor="readmeFile">
                                <Button variant="outlined" component="span" sx={{ mb: 2 }}>
                                            {readmeFile ? readmeFile.name : 'Choose README file (.md)...'}
                                </Button>
                                        </label>
                        </Box>
                                    
                                    {readmeContent && (
                            <Alert severity="success" sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" fontWeight={600}>
                                    ✓ File loaded successfully!
                                </Typography>
                                <Typography variant="body2">
                                    This README will be added to all student repositories.
                                </Typography>
                            </Alert>
                        )}
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            📝 README Preview
                        </Typography>
                                    {readmeContent ? (
                            <Paper sx={{ p: 2, bgcolor: 'grey.50', fontFamily: 'monospace', fontSize: '14px', maxHeight: '300px', overflowY: 'auto' }}>
                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{readmeContent}</pre>
                            </Paper>
                        ) : (
                            <Paper sx={{ p: 2, bgcolor: 'grey.50', color: 'text.secondary' }}>
                                <Typography variant="body2">
                                    Upload a README file to see a preview here.
                                </Typography>
                            </Paper>
                        )}
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            📥 Download Template (Optional)
                        </Typography>
                        <Typography variant="body2" paragraph>
                            Don't have a README file? Download this template as a starting point:
                        </Typography>
                        
                        <Button 
                            variant="outlined"
                                        onClick={() => {
                                            const template = `# 🎓 ${classInfo.groupName} - OSS Management Course

## 📚 Course Overview
Welcome to the Open Source Software (OSS) Management course! This repository will track your progress through various quests and challenges designed to teach you about contributing to open source projects.

## 🎯 Learning Objectives
- Understand the OSS contribution workflow
- Learn to work with Git and GitHub
- Practice creating pull requests and issues
- Develop collaboration skills in open source projects

## 📊 Your Progress
Your current progress will be displayed here as you complete quests.

### 🚀 Current Quest
{Current quest information will appear here}

### ✅ Completed Quests
{Completed quests will be listed here}

##  Available Quests
{Quest list will be populated here}

## 🛠️ Getting Started
1. Accept the invitation to this repository
2. Check the issues tab for your first quest
3. Follow the instructions in each quest
4. Submit your answers as comments on the issues

## 📞 Need Help?
- Check the quest instructions carefully
- Use hints if available (they may cost XP)
- Ask questions in the issue comments

---
*This README is automatically updated as you progress through the course.*`;
                                            const blob = new Blob([template], { type: 'text/markdown' });
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `${classInfo.groupName}-README-template.md`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            window.URL.revokeObjectURL(url);
                                        }}
                                    >
                                        📥 Download Template
                        </Button>
                    </Box>

                                {existingReadme && (
                        <Button 
                            variant="contained" 
                            color="warning"
                                        onClick={handleReuploadReadme}
                                        disabled={isReuploading || !readmeContent}
                            sx={{ mt: 2 }}
                                    >
                                        {isReuploading ? 'Re-uploading...' : 'Re-upload README & Push to Student Repos'}
                        </Button>
                                )}
                                {!existingReadme && (
                        <Button 
                            variant="contained" 
                                        onClick={async () => {
                                            if (!readmeContent) {
                                                alert('Please upload a README file first.');
                                                return;
                                            }
                                            try {
                                                console.log('📝 [README-UPLOAD] Starting README upload process...');
                                                console.log('📝 [README-UPLOAD] README details:', {
                                                    fileName: readmeFile ? readmeFile.name : 'README.md',
                                                    contentLength: readmeContent.length,
                                                    classId: classId,
                                                    preview: readmeContent.substring(0, 100) + '...'
                                                });
                                                
                                                const response = await axios.post(`${baseURL}/api/group/${classId}/readme`, {
                                                    content: readmeContent,
                                                    fileName: readmeFile ? readmeFile.name : 'README.md'
                                                });
                                                
                                                console.log('✅ [README-UPLOAD] README upload successful:', {
                                                    status: response.status,
                                                    data: response.data
                                                });
                                                
                                                if (response.status === 200) {
                                                    console.log('🎉 [README-UPLOAD] README saved successfully to database');
                                                    alert('README file saved successfully! It will be added to all new student repositories.');
                                                    setShowReadmeModal(false);
                                                    setReadmeFile(null);
                                                    setReadmeContent('');
                                                    fetchExistingReadme();
                                                } else {
                                                    console.error('⚠️ [README-UPLOAD] Unexpected response status:', response.status);
                                                    alert('Unexpected response from server.');
                                                }
                                            } catch (error) {
                                                console.error('❌ [README-UPLOAD] README upload failed:', error);
                                                console.error('❌ [README-UPLOAD] Error details:', {
                                                    message: error.message,
                                                    status: error.response?.status,
                                                    data: error.response?.data
                                                });
                                                alert('Error saving README file. Please try again.');
                                            }
                                        }}
                                        disabled={!readmeContent}
                            sx={{ 
                                mt: 2,
                                bgcolor: '#fb5233', 
                                '&:hover': { bgcolor: '#e04a2e' },
                                fontWeight: 'bold'
                            }}
                                    >
                                        Save README
                        </Button>
                                )}
                                {reuploadStatus && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                                        {reuploadStatus}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setShowReadmeModal(false);
                        setReadmeFile(null);
                        setReadmeContent('');
                    }}>
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>

            {/* My Quests Modal */}
            <Dialog open={showQuestsModal} onClose={() => setShowQuestsModal(false)} maxWidth="lg" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center">
                        <AssignmentIcon sx={{ mr: 1 }} />
                        My Uploaded Quests
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {myQuests.length === 0 ? (
                        <Box textAlign="center" py={4}>
                            <AssignmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No quests found
                            </Typography>
                            <Typography color="text.secondary" paragraph>
                                You haven't uploaded any quests yet.
                            </Typography>
                            <Button 
                                variant="contained"
                                onClick={() => {
                                    setShowQuestsModal(false);
                                    setShowQuestModal(true);
                                }}
                            >
                                Create Your First Quest
                            </Button>
                        </Box>
                    ) : (
                        <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                <Typography variant="h6">
                                    Total Quests: {myQuests.length}
                                </Typography>
                                <Button 
                                    variant="outlined"
                                    onClick={() => {
                                        setShowQuestsModal(false);
                                        setShowQuestModal(true);
                                    }}
                                >
                                    Create New Quest
                                </Button>
                            </Box>
                            
                            <Grid container spacing={2}>
                                {myQuests.map((quest) => (
                                    <Grid item xs={12} key={quest._id}>
                                        <Card>
                                            <Box p={2}>
                                                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                                    <Box>
                                                        <Typography variant="h6" color="primary" fontWeight={600}>
                                                            {quest.questTitle}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Created: {new Date(quest.createdAt).toLocaleDateString()}
                                                        </Typography>
                                                    </Box>
                                                    <Box textAlign="right">
                                                        <Chip 
                                                            label={`${quest.tasks ? quest.tasks.length : 0} Tasks`} 
                                                            color="success" 
                                                            size="small" 
                                                            sx={{ mb: 1 }}
                                                        />
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            ID: {quest._id.slice(-8)}...
                                                        </Typography>
                                                        <Stack direction="row" spacing={1} mt={1}>
                                                            <Button 
                                                                variant="outlined" 
                                                                size="small"
                                                                onClick={() => handleEditQuest(quest)}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button 
                                                                variant="outlined" 
                                                                color="error"
                                                                size="small"
                                                                onClick={() => handleDeleteQuest(quest)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </Stack>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowQuestsModal(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Quest Creation/Edit Modal */}
            <Dialog open={showQuestModal} onClose={isEditMode ? handleCancelEdit : () => setShowQuestModal(false)} maxWidth="md" fullWidth>
                <DialogTitle>{isEditMode ? 'Edit Quest' : 'Create New Quest'}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Quest creation form would go here. This is a placeholder for the enhanced quest form.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={isEditMode ? handleCancelEdit : () => setShowQuestModal(false)}>
                        {isEditMode ? 'Cancel Edit' : 'Cancel'}
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleUploadMCQQuest} 
                        disabled={isUploadingQuest}
                    >
                        {isUploadingQuest ? (isEditMode ? 'Updating...' : 'Uploading...') : (isEditMode ? 'Update Quest' : 'Upload MCQ Quest to Database')}
                    </Button>
                </DialogActions>
                {uploadQuestStatus && (
                    <Box px={3} pb={2}>
                        <Alert severity={uploadQuestStatus.startsWith('✅') ? 'success' : 'error'}>
                            {uploadQuestStatus}
                        </Alert>
                    </Box>
                )}
            </Dialog>
        </div>
    );
};

export default ClassView;