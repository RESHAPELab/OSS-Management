import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Chip,
  Stack,
  Button,
  Select,
  MenuItem,
  FormControl,
  CircularProgress
} from '@mui/material';
import {
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { useAuthContext } from '../../context/AuthContext';

const QuestRoadmap = ({ questBreakdownQuests = [] }) => {
  const { classId } = useParams();
  const { authUser } = useAuthContext();
  const [draftQuests, setDraftQuests] = useState({ questSequence: [] });
  const [localDraftQuests, setLocalDraftQuests] = useState([]); // Local state for draft quest prerequisite changes
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [saveTimeout, setSaveTimeout] = useState(null);
  
  // Minimap state
  const scrollContainerRef = React.useRef(null);
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
  const [isDraggingMinimap, setIsDraggingMinimap] = useState(false);

  // Load draft quests from API
  const loadDraftQuests = async () => {
    if (!classId) {
      console.log("⚠️ [QuestRoadmap] No classId provided");
      return;
    }

    try {
      console.log("🔄 [QuestRoadmap] Loading draft quests for class:", classId);
      console.log("🔄 [QuestRoadmap] API URL:", `${API_BASE_URL}/api/group/${classId}/draft-quest-config`);

      const response = await axios.get(
        `${API_BASE_URL}/api/group/${classId}/draft-quest-config`
      );

      console.log("🔍 [QuestRoadmap] Draft quest API response:", response.data);

      if (response.data.success) {
        const draftConfig = response.data.data.draftQuestConfig || { questSequence: [] };
        setDraftQuests(draftConfig);
        console.log("✅ [QuestRoadmap] Loaded draft quests:", draftConfig.questSequence?.length || 0);
        console.log("✅ [QuestRoadmap] Draft quest data:", draftConfig);
      } else {
        console.log("⚠️ [QuestRoadmap] API returned success: false");
        setDraftQuests({ questSequence: [] });
      }
    } catch (error) {
      console.error("❌ [QuestRoadmap] Error loading draft quests:", error);
      console.error("❌ [QuestRoadmap] Error details:", error.response?.data || error.message);
      setDraftQuests({ questSequence: [] });
    }
  };

  // Load draft quests on component mount
  useEffect(() => {
    loadDraftQuests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  // Update local draft quests when draftQuests changes
  useEffect(() => {
    if (draftQuests?.questSequence?.length > 0) {
      setLocalDraftQuests([...draftQuests.questSequence]);
    }
  }, [draftQuests]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  // Track scroll position and viewport size for minimap
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const updateMinimapData = () => {
      setScrollPosition({
        x: scrollContainer.scrollLeft,
        y: scrollContainer.scrollTop
      });
      setViewportSize({
        width: scrollContainer.clientWidth,
        height: scrollContainer.clientHeight
      });
      setContentSize({
        width: scrollContainer.scrollWidth,
        height: scrollContainer.scrollHeight
      });
    };

    // Initial update
    updateMinimapData();

    // Update on scroll
    scrollContainer.addEventListener('scroll', updateMinimapData);
    
    // Update on resize
    const resizeObserver = new ResizeObserver(updateMinimapData);
    resizeObserver.observe(scrollContainer);

    return () => {
      scrollContainer.removeEventListener('scroll', updateMinimapData);
      resizeObserver.disconnect();
    };
  }, [questBreakdownQuests.length, localDraftQuests.length]); // Re-run when quests change

  // Save draft quests to backend
  const saveDraftQuests = async (updatedQuests) => {
    if (!classId) {
      console.log("❌ [QuestRoadmap] No classId available");
      return;
    }

    try {
      setIsSaving(true);
      setSaveStatus('Saving...');
      console.log("💾 [QuestRoadmap] Saving draft quests for class:", classId);
      console.log("📊 [QuestRoadmap] Quest count:", updatedQuests?.length || 0);

      const draftConfigToSave = {
        questSequence: updatedQuests,
        map_repo_link: draftQuests.map_repo_link || "https://raw.githubusercontent.com/caiton1/OSS-Doorway/main/map"
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/group/${classId}/draft-quest-config`,
        { draftQuestConfig: draftConfigToSave }
      );

      if (response.data.success) {
        console.log("✅ [QuestRoadmap] Draft quests saved successfully");
        setSaveStatus('✅ Saved');
        setTimeout(() => setSaveStatus(''), 2000);
      } else {
        console.log("❌ [QuestRoadmap] Backend reported save failure:", response.data);
        setSaveStatus('❌ Save failed');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (error) {
      console.error("❌ [QuestRoadmap] Error saving draft quests:", error);
      setSaveStatus('❌ Error saving');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle prerequisite change for draft quests with auto-save (by index)
  const handlePrerequisiteChange = (questIndex, newPrerequisite) => {
    console.log("🔄 [QuestRoadmap] Changing prerequisite for quest at index:", questIndex);
    console.log("🔄 [QuestRoadmap] New prerequisite value:", newPrerequisite, "Type:", typeof newPrerequisite);
    console.log("🔄 [QuestRoadmap] Is empty string?", newPrerequisite === '');
    
    setLocalDraftQuests(prev => {
      const updated = prev.map((quest, idx) => {
        if (idx === questIndex) {
          const updatedQuest = {
            ...quest,
            metadata: {
              ...quest.metadata,
              prerequisite: newPrerequisite // Explicitly set to newPrerequisite (can be empty string)
            }
          };
          console.log("🔄 [QuestRoadmap] Updated quest at index", idx);
          console.log("🔄 [QuestRoadmap] Old prerequisite:", quest.metadata?.prerequisite);
          console.log("🔄 [QuestRoadmap] New prerequisite:", updatedQuest.metadata.prerequisite);
          return updatedQuest;
        }
        return quest;
      });
      console.log("🔄 [QuestRoadmap] Total draft quests after update:", updated.length);
      
      // Debounced auto-save: clear existing timeout and set a new one
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      
      const newTimeout = setTimeout(() => {
        console.log("⏱️ [QuestRoadmap] Auto-saving after prerequisite change...");
        console.log("⏱️ [QuestRoadmap] Saving quests:", updated.map(q => ({
          id: q.questId || q.id,
          title: q.title,
          prereq: q.metadata?.prerequisite
        })));
        saveDraftQuests(updated);
      }, 1000); // Save 1 second after last change
      
      setSaveTimeout(newTimeout);
      
      return updated;
    });
  };

  // Minimap click handler
  const handleMinimapClick = (e) => {
    const minimapRect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - minimapRect.left;
    const clickY = e.clientY - minimapRect.top;
    
    // Calculate the scale factor (inverse of what we use to draw)
    const contentAspectRatio = contentSize.width / contentSize.height;
    const MINIMAP_WIDTH = 250;
    const MINIMAP_MAX_HEIGHT = 180;
    const minimapAspectRatio = MINIMAP_WIDTH / MINIMAP_MAX_HEIGHT;
    
    let scale;
    if (contentAspectRatio > minimapAspectRatio) {
      scale = MINIMAP_WIDTH / contentSize.width;
    } else {
      scale = MINIMAP_MAX_HEIGHT / contentSize.height;
    }
    
    // Convert click position back to content coordinates
    const contentX = clickX / scale;
    const contentY = clickY / scale;
    
    // Calculate new scroll position (center viewport on click)
    const newScrollX = contentX - (viewportSize.width / 2);
    const newScrollY = contentY - (viewportSize.height / 2);
    
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: Math.max(0, Math.min(newScrollX, contentSize.width - viewportSize.width)),
        top: Math.max(0, Math.min(newScrollY, contentSize.height - viewportSize.height)),
        behavior: 'smooth'
      });
    }
  };

  // Minimap drag handler
  const handleMinimapMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingMinimap(true);
    handleMinimapClick(e);
  };

  const handleMinimapMouseMove = (e) => {
    if (!isDraggingMinimap) return;
    handleMinimapClick(e);
  };

  const handleMinimapMouseUp = () => {
    setIsDraggingMinimap(false);
  };

  // Global mouse up listener for minimap dragging
  useEffect(() => {
    if (isDraggingMinimap) {
      window.addEventListener('mouseup', handleMinimapMouseUp);
      return () => window.removeEventListener('mouseup', handleMinimapMouseUp);
    }
  }, [isDraggingMinimap]);

  // Mock data for demonstration - replace with actual quest data
  const mockQuests = [
    {
      questId: 'Q0',
      title: 'Q0: Introduction to Open Source',
      metadata: {
        prerequisite: null
      }
    },
    {
      questId: 'Q1',
      title: 'Q1: Understanding OSS Projects and GitHub Basics',
      metadata: {
        prerequisite: 'Q0'
      }
    },
    {
      questId: 'Q2',
      title: 'Q2: Forking and Contributing to Repositories',
      metadata: {
        prerequisite: 'Q1'
      }
    },
    {
      questId: 'Q3',
      title: 'Q3: Creating Pull Requests and Code Reviews',
      metadata: {
        prerequisite: 'Q2'
      }
    }
  ];

  // Combine regular quests with draft quests
  const regularQuests = questBreakdownQuests.length > 0 ? questBreakdownQuests : mockQuests;
  const allDraftQuests = localDraftQuests.length > 0 ? localDraftQuests : (draftQuests?.questSequence || []);
  
  console.log("🔍 [QuestRoadmap] questBreakdownQuests prop:", questBreakdownQuests);
  console.log("🔍 [QuestRoadmap] questBreakdownQuests length:", questBreakdownQuests.length);
  console.log("🔍 [QuestRoadmap] Regular quests:", regularQuests.length);
  console.log("🔍 [QuestRoadmap] Regular quests data:", regularQuests);
  console.log("🔍 [QuestRoadmap] localDraftQuests length:", localDraftQuests.length);
  console.log("🔍 [QuestRoadmap] Draft quests loaded:", allDraftQuests.length);
  console.log("🔍 [QuestRoadmap] Draft quests with prerequisites:", allDraftQuests.map(q => ({
    id: q.questId || q.id,
    title: q.title,
    prereq: q.metadata?.prerequisite
  })));
  console.log("🔍 [QuestRoadmap] Class ID:", classId);
  console.log("🔍 [QuestRoadmap] Auth User:", authUser?._id);
  
  // Find the last regular quest ID to use as prerequisite for draft quests
  const lastRegularQuestId = regularQuests.length > 0 ? 
    (regularQuests[regularQuests.length - 1].questId || regularQuests[regularQuests.length - 1].id) : null;
  
  console.log("🔍 [QuestRoadmap] Last regular quest ID:", lastRegularQuestId);
  
  // Mark all draft quests as draft and set prerequisite (use local state if available)
  const markedDraftQuests = allDraftQuests.map((quest, index) => {
    // Generate Q{number} ID for draft quests
    const draftQuestNumber = regularQuests.length + index + 1;
    const draftQuestId = `Q${draftQuestNumber}`;
    
    // Use existing prerequisite, or default to lastRegularQuestId only if prerequisite is undefined (not empty string)
    const existingPrereq = quest.metadata?.prerequisite;
    const finalPrereq = existingPrereq !== undefined ? existingPrereq : lastRegularQuestId;
    
    return {
      ...quest,
      questId: draftQuestId, // Override with Q{number} format
      isDraftQuest: true,
      metadata: {
        ...quest.metadata,
        isDraft: true,
        prerequisite: finalPrereq // Allows empty string for "no prerequisite"
      }
    };
  });
  
  console.log("🔍 [QuestRoadmap] Marked draft quests:", markedDraftQuests);
  
  // Combine all quests: regular quests first, then draft quests
  const quests = [...regularQuests, ...markedDraftQuests];
  
  console.log("🔍 [QuestRoadmap] Total quests (regular + draft):", quests.length);
  console.log("🔍 [QuestRoadmap] All quests with prerequisites:", quests.map(q => ({
    id: q.questId || q.id,
    prereq: q.metadata?.prerequisite || q.prerequisites?.[0] || 'none'
  })));

  // Function to detect if a quest is a draft quest
  const isDraftQuest = (quest) => {
    if (!quest) return false; // Safety check for undefined quest
    return quest.metadata?.isDraft === true || 
           quest.isDraft === true || 
           quest.isDraftQuest === true ||
           (quest.questId && quest.questId.startsWith('TEMP_'));
  };

  // Function to check if a draft quest is movable (only leaf nodes - no dependents)
  const isDraftQuestMovable = (quest) => {
    if (!isDraftQuest(quest)) return false;
    
    const questId = quest.questId || quest.id;
    
    // Check if ANY quest (draft or regular) depends on this quest
    const hasDependents = quests.some(otherQuest => {
      const otherPrereq = otherQuest.metadata?.prerequisite || otherQuest.prerequisites?.[0];
      return otherPrereq === questId && (otherQuest.questId || otherQuest.id) !== questId;
    });
    
    // Only movable if no other quest depends on this one (it's a leaf node)
    return !hasDependents;
  };

  // Function to check if a draft quest is the first in its chain (has no draft quest prerequisites)
  const isFirstDraftQuestInChain = (quest) => {
    if (!isDraftQuest(quest)) return false;
    
    const prerequisite = quest.metadata?.prerequisite || quest.prerequisites?.[0];
    
    // If no prerequisite or empty string, it's first (connects to START)
    if (!prerequisite || prerequisite === '') return true;
    
    // If prerequisite is a regular quest (not draft), it's first in draft chain
    const prerequisiteQuest = quests.find(q => (q.questId || q.id) === prerequisite);
    // If prerequisite not found or not a draft quest, this is first in draft chain
    return !prerequisiteQuest || !isDraftQuest(prerequisiteQuest);
  };

  // Function to check if a draft quest is in the middle of a chain (has draft prerequisite AND dependents)
  const isMiddleDraftQuest = (quest) => {
    if (!isDraftQuest(quest)) return false;
    
    const prerequisite = quest.metadata?.prerequisite || quest.prerequisites?.[0];
    
    // If no prerequisite or empty string, it's not in the middle
    if (!prerequisite || prerequisite === '') return false;
    
    const prerequisiteQuest = quests.find(q => (q.questId || q.id) === prerequisite);
    
    // Middle quest: has draft prerequisite AND has dependents
    // If prerequisite not found, it's not in the middle
    return prerequisiteQuest && isDraftQuest(prerequisiteQuest) && !isDraftQuestMovable(quest);
  };

  // Group quests by prerequisite to create columns
  const groupQuestsByPrerequisite = () => {
    const columns = [];
    const processed = new Set();
    const questToColumn = new Map(); // Track which column each quest is in
    
    // First column: START NODE (placeholder)
    columns.push([{ isStartNode: true, questId: 'START' }]);
    
    // Second column: quests with no prerequisites (including empty string)
    const noPrereqQuests = quests.filter(q => {
      const prereq = q.metadata?.prerequisite;
      const prereqs = q.prerequisites;
      return (!prereq || prereq === '') && (!prereqs || prereqs.length === 0);
    });
    if (noPrereqQuests.length > 0) {
      columns.push(noPrereqQuests);
      noPrereqQuests.forEach(q => {
        const questId = q.questId || q.id;
        processed.add(questId);
        questToColumn.set(questId, 1);
      });
    }
    
    // Build remaining columns based on prerequisite column position
    let changesDetected = true;
    while (changesDetected && processed.size < quests.length) {
      changesDetected = false;
      const nextColumn = [];
      
      // Get the last column (current parent column)
      const currentParentColumn = columns[columns.length - 1];
      
      // For each parent in the current column (in order), find their children
      currentParentColumn.forEach(parentQuest => {
        const parentId = parentQuest.questId || parentQuest.id;
        
        // Find all unprocessed quests that depend on this parent
        const children = quests.filter(quest => {
          const questId = quest.questId || quest.id;
          if (processed.has(questId)) return false;
          
          const prereq = quest.metadata?.prerequisite || quest.prerequisites?.[0];
          return prereq === parentId;
        });
        
        // Add children to next column in the same order as their parent
        children.forEach(child => {
          nextColumn.push(child);
          processed.add(child.questId || child.id);
          changesDetected = true;
        });
      });
      
      if (nextColumn.length > 0) {
        nextColumn.forEach(q => {
          questToColumn.set(q.questId || q.id, columns.length);
        });
        columns.push(nextColumn);
      }
    }
    
    return columns;
  };

  const questColumns = groupQuestsByPrerequisite();
  
  console.log("🔍 [QuestRoadmap] Quest columns:", questColumns.map((col, idx) => ({
    column: idx,
    quests: col.map(q => q.questId || q.id)
  })));

  // Find which quests depend on a given quest
  const findDependents = (questId) => {
    return quests.filter(q => {
      const prereq = q.metadata?.prerequisite || q.prerequisites?.[0];
      return prereq === questId;
    });
  };

  // Find the position (column, row) of a quest
  const findQuestPosition = (questId) => {
    for (let colIndex = 0; colIndex < questColumns.length; colIndex++) {
      const rowIndex = questColumns[colIndex].findIndex(q => (q.questId || q.id) === questId);
      if (rowIndex !== -1) {
        return { colIndex, rowIndex };
      }
    }
    return null;
  };

  // Calculate bend point based on position in column
  const getBendPoint = (questIndex, totalQuestsInColumn) => {
    if (totalQuestsInColumn === 1) {
      return 50; // Single quest uses middle
    } else if (totalQuestsInColumn === 2) {
      return [70, 30][questIndex];
    } else if (totalQuestsInColumn === 3) {
      return [70, 30, 60][questIndex];
    } else {
      // For 4+, cycle through [70, 30, 60, 40]
      const pattern = [70, 30, 60, 40];
      return pattern[questIndex % 4];
    }
  };

  // Get arrow styling (color and dash pattern) based on quest index
  const getArrowStyle = (questIndex) => {
    const colors = ['#9e9e9e', '#5c6bc0', '#26a69a', '#ab47bc', '#ef5350', '#ffa726'];
    const dashPatterns = ['8,8', '12,4', '4,4', '16,4,4,4', '8,4,2,4', '6,6'];
    
    const colorIndex = questIndex % colors.length;
    const dashIndex = questIndex % dashPatterns.length;
    
    return {
      color: colors[colorIndex],
      dashPattern: dashPatterns[dashIndex],
      strokeWidth: 5
    };
  };

  // Generate consistent arrow coordinates for quests with the same prerequisite
  const getSharedArrowCoordinates = (questIndex, totalQuestsInColumn, targetPositions) => {
    // Calculate bend point based on position in column
    const bendPoint = getBendPoint(questIndex, totalQuestsInColumn);
    
    // Calculate shared start and bend coordinates
    const startX = 10; // 10% from left
    const bendX = bendPoint;
    const endX = 90; // 90% from left
    
    return {
      startX,
      bendX,
      endX,
      targetPositions // Array of target positions for multiple dependents
    };
  };

  return (
    <Box sx={{ 
      width: '100%', 
      height: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      p: 3
    }}>
      {/* Save Status Indicator */}
      {(saveStatus || isSaving) && (
        <Box sx={{ 
          position: 'fixed', 
          top: 80, 
          right: 24, 
          zIndex: 1000,
          backgroundColor: saveStatus?.includes('✅') ? '#e8f5e9' : saveStatus?.includes('❌') ? '#ffebee' : '#fff3e0',
          color: saveStatus?.includes('✅') ? '#2e7d32' : saveStatus?.includes('❌') ? '#c62828' : '#e65100',
          px: 2,
          py: 1,
          borderRadius: 2,
          boxShadow: 2,
          fontSize: '0.875rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          {isSaving && (
            <CircularProgress 
              size={16} 
              sx={{ 
                color: '#e65100' 
              }} 
            />
          )}
          <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
            {saveStatus || 'Saving...'}
          </Typography>
        </Box>
      )}

      {/* Quest Blocks */}
      {questColumns.length === 0 ? (
        <Box 
          sx={{ 
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fafafa',
            borderRadius: 4
          }}
        >
          <Box textAlign="center">
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No quests configured yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Set up quests in the Manage Quests section to see the roadmap.
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box 
          ref={scrollContainerRef}
          sx={{ flex: 1, overflow: 'auto', position: 'relative' }}
        >
          <Stack 
            direction="row" 
            spacing={0} 
            sx={{ 
              minWidth: 'fit-content',
              pb: 2,
              alignItems: 'flex-start'
            }}
          >
            {questColumns.map((column, colIndex) => (
              <React.Fragment key={`column-${colIndex}`}>
                {/* Column of quests */}
                <Stack direction="column" spacing={3}>
                  {column.map((quest, questIndex) => {
                    // Special rendering for START NODE
                    if (quest.isStartNode) {
                      return (
                        <Card
                          key="start-node"
                          sx={{
                            minWidth: 280,
                            maxWidth: 320,
                            height: 200,
                            borderRadius: 4,
                            boxShadow: 'none',
                            border: '3px solid #ff9800',
                            backgroundColor: '#fff3e0',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            transition: 'all 0.2s ease-in-out'
                          }}
                        >
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography 
                              variant="h4" 
                              sx={{ 
                                fontWeight: 700,
                                color: '#e65100'
                              }}
                            >
                              START
                            </Typography>
                          </Box>
                        </Card>
                      );
                    }
                    
                    // Regular quest card
                    return (
                     <Card
                       key={quest.questId || quest.id || questIndex}
                       sx={{
                         minWidth: 280,
                         maxWidth: 320,
                         height: 200,
                         borderRadius: 4,
                         boxShadow: 'none',
                         border: isDraftQuest(quest) 
                           ? '2px solid #ffb74d' 
                           : '1px solid #e0e0e0',
                         backgroundColor: isDraftQuest(quest) 
                           ? '#fff8e1' 
                           : 'white',
                         display: 'flex',
                         flexDirection: 'column',
                         position: 'relative',
                         '&:hover': {
                           borderColor: isDraftQuest(quest) 
                             ? '#ff9800' 
                             : 'primary.main',
                           backgroundColor: isDraftQuest(quest) 
                             ? '#fff3c4' 
                             : '#f8f9fa',
                           boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                         },
                         transition: 'all 0.2s ease-in-out'
                       }}
                     >
                {/* Quest Number Badge */}
        <Box 
          sx={{ 
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    backgroundColor: isDraftQuest(quest) 
                      ? '#ff9800' 
                      : 'primary.main',
                    color: 'white',
            borderRadius: 2,
                    px: 1.5,
                    py: 0.5,
                    minWidth: 40,
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {quest.questId || quest.id || `Q${questIndex + 1}`}
                  </Typography>
                </Box>

                {/* Quest Icon */}
                <Box sx={{ p: 3, pb: 1 }}>
                  <AssignmentIcon 
                    sx={{ 
                      fontSize: 32, 
                      color: 'primary.main',
                      opacity: 0,
                      mb: 1
                    }} 
                  />
                </Box>

                {/* Quest Content */}
                <Box sx={{ px: 3, pb: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Quest Title */}
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 2,
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {isDraftQuest(quest) ? quest.questId || quest.id : (quest.title || `Quest ${questIndex + 1}`)}
                  </Typography>

                  {/* Prerequisites and Deploy Button Container */}
                  <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {isDraftQuest(quest) ? (
                      // Draft quest prerequisite dropdown (only enabled for leaf nodes)
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Prerequisite: {(!quest.metadata?.prerequisite || quest.metadata?.prerequisite === '') && (
                            <Typography component="span" variant="caption" sx={{ ml: 1, color: '#ff9800', fontSize: '0.65rem', fontStyle: 'italic' }}>
                              (from Start)
                            </Typography>
                          )}
                          {!isDraftQuestMovable(quest) && (
                            <Typography component="span" variant="caption" sx={{ ml: 1, color: '#ff9800', fontSize: '0.65rem', fontStyle: 'italic' }}>
                              (Locked - has dependents)
                            </Typography>
                          )}
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={quest.metadata?.prerequisite === '' ? '' : (quest.metadata?.prerequisite || '')}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newPrerequisite = e.target.value;
                              const questId = quest.questId || quest.id;
                              
                              console.log("🔄 [QuestRoadmap] ========== DROPDOWN CHANGE ==========");
                              console.log("🔄 [QuestRoadmap] Quest ID:", questId);
                              console.log("🔄 [QuestRoadmap] New prerequisite:", newPrerequisite);
                              console.log("🔄 [QuestRoadmap] Is empty string?", newPrerequisite === '');
                              console.log("🔄 [QuestRoadmap] markedDraftQuests length:", markedDraftQuests.length);
                              console.log("🔄 [QuestRoadmap] localDraftQuests length:", localDraftQuests.length);
                              
                              // Find the index of this quest in markedDraftQuests (which maps 1:1 with localDraftQuests)
                              const draftQuestIndex = markedDraftQuests.findIndex(mq => (mq.questId || mq.id) === questId);
                              
                              console.log("🔄 [QuestRoadmap] Found draft quest at index:", draftQuestIndex);
                              console.log("🔄 [QuestRoadmap] Current quest in localDraftQuests:", localDraftQuests[draftQuestIndex]);
                              console.log("🔄 [QuestRoadmap] =====================================");
                              
                              if (draftQuestIndex !== -1) {
                                // Use the handler function which includes auto-save
                                handlePrerequisiteChange(draftQuestIndex, newPrerequisite);
                              } else {
                                console.error("❌ [QuestRoadmap] Could not find quest index!");
                              }
                            }}
                            displayEmpty
                            disabled={!isDraftQuestMovable(quest) || isSaving}
                            sx={{
                              fontSize: '0.75rem',
                              height: 24,
                              '& .MuiSelect-select': {
                                py: 0.5,
                                px: 1
                              },
                              '&.Mui-disabled': {
                                opacity: 0.6,
                                backgroundColor: '#f5f5f5',
                                cursor: 'not-allowed'
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MenuItem value="">
                              <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#ff9800' }}>
                                None (connects to Start)
                              </Typography>
                            </MenuItem>
                            
                            {/* Regular Quests */}
                            {regularQuests.map((regularQuest) => (
                              <MenuItem 
                                key={regularQuest.questId || regularQuest.id} 
                                value={regularQuest.questId || regularQuest.id}
                              >
                                <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                                  {regularQuest.questId || regularQuest.id}
                                </Typography>
                              </MenuItem>
                            ))}
                            
                            {/* Other Draft Quests (excluding current quest) */}
                            {markedDraftQuests
                              .filter(draftQuest => (draftQuest.questId || draftQuest.id) !== (quest.questId || quest.id))
                              .map((draftQuest) => (
                                <MenuItem 
                                  key={draftQuest.questId || draftQuest.id} 
                                  value={draftQuest.questId || draftQuest.id}
                                >
                                  <Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#ff9800' }}>
                                    {draftQuest.questId || draftQuest.id} (Draft)
                                  </Typography>
                                </MenuItem>
                              ))}
                          </Select>
                        </FormControl>
                      </Box>
                    ) : quest.metadata?.prerequisite || quest.prerequisites?.length > 0 ? (
                      // Regular quest prerequisite chip
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Prerequisites:
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          {quest.metadata?.prerequisite ? (
                            <Chip
                              label={quest.metadata.prerequisite}
                              size="small"
                              variant="outlined"
                              sx={{
                                fontSize: '0.75rem',
                                height: 20,
                                '& .MuiChip-label': {
                                  px: 1
                                }
                              }}
                            />
                          ) : (
                            quest.prerequisites?.map((prereq, prereqIndex) => (
                              <Chip
                                key={prereqIndex}
                                label={prereq}
                                size="small"
                                variant="outlined"
                                sx={{
                                  fontSize: '0.75rem',
                                  height: 20,
                                  '& .MuiChip-label': {
                                    px: 1
                                  }
                                }}
                              />
                            ))
                          )}
                        </Stack>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No prerequisites
                      </Typography>
                    )}

                    {/* Deploy Button for Draft Quests - Different states based on chain position */}
                    {isDraftQuest(quest) && !isMiddleDraftQuest(quest) && (
                      <Button
                        variant="contained"
                        size="small"
                        disabled={!isFirstDraftQuestInChain(quest)}
                        sx={{
                          backgroundColor: isFirstDraftQuestInChain(quest) ? '#9c27b0' : '#bdbdbd',
                          color: 'white',
                          fontSize: '0.7rem',
                          px: 1.5,
                          py: 0.3,
                          minWidth: 'auto',
                          height: 24,
                          alignSelf: 'flex-start',
                          borderRadius: '50px', // Completely rounded
                          '&:hover': {
                            backgroundColor: isFirstDraftQuestInChain(quest) ? '#7b1fa2' : '#bdbdbd',
                          },
                          '&:disabled': {
                            backgroundColor: '#bdbdbd',
                            color: 'white',
                          },
                          textTransform: 'none',
                          fontWeight: 500
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isFirstDraftQuestInChain(quest)) {
                            // No functionality - UI only as requested
                            console.log('Deploy button clicked for quest:', quest.questId || quest.id);
                          }
                        }}
                      >
                        Deploy
                      </Button>
                    )}
                  </Box>
                </Box>
              </Card>
                    );
                  })}
                </Stack>
                
                {/* Arrows from this column's quests to their dependents */}
                <Stack direction="column" spacing={3}>
                  {column.map((quest, questIndex) => {
                    const questId = quest.questId || quest.id;
                    
                    // Special handling for START node - draw arrows to all quests in next column
                    if (quest.isStartNode && colIndex === 0 && questColumns[1]) {
                      return (
                        <Box
                          key={`arrow-container-start`}
                          sx={{
                            width: 280,
                            height: 200,
                            position: 'relative'
                          }}
                        >
                          {questColumns[1].map((targetQuest, targetIndex) => {
                            const rowDiff = targetIndex - questIndex;
                            const isStraight = rowDiff === 0;
                            // START node is at index 0, column has 1 quest, so it always uses 50%
                            const startX = 10;
                            const bendX = 50; // START node always uses center
                            const endX = 90;
                            
                            return (
                              <Box
                                key={`start-arrow-${targetIndex}`}
                                sx={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  pointerEvents: 'none'
                                }}
                              >
                                {isStraight ? (
                                  // Straight horizontal arrow
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 0,
                                      left: `${startX}%`,
                                      width: `${endX - startX}%`,
                                      height: 5,
                                      backgroundColor: 'transparent',
                                      borderTop: '5px solid #ff9800',
                                      '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        right: 0,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: 0,
                                        height: 0,
                                        borderLeft: '20px solid #ff9800',
                                        borderTop: '12px solid transparent',
                                        borderBottom: '12px solid transparent'
                                      }
                                    }}
                                  />
                                ) : (
                                  // Bent arrow (L-shaped)
                                  <svg
                                    style={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: `${Math.abs(rowDiff) * 224 + 100}%`,
                                      overflow: 'visible'
                                    }}
                                  >
                                    <line
                                      x1={`${startX}%`}
                                      y1="0"
                                      x2={`${bendX}%`}
                                      y2="0"
                                      stroke="#ff9800"
                                      strokeWidth="5"
                                    />
                                    <line
                                      x1={`${bendX}%`}
                                      y1="0"
                                      x2={`${bendX}%`}
                                      y2={`${rowDiff * 224}px`}
                                      stroke="#ff9800"
                                      strokeWidth="5"
                                    />
                                    <line
                                      x1={`${bendX}%`}
                                      y1={`${rowDiff * 224}px`}
                                      x2={`${endX}%`}
                                      y2={`${rowDiff * 224}px`}
                                      stroke="#ff9800"
                                      strokeWidth="5"
                                    />
                                    <polygon
                                      points={`${280 * (endX / 100)},${rowDiff * 224 - 12} ${280 * (endX / 100) + 20},${rowDiff * 224} ${280 * (endX / 100)},${rowDiff * 224 + 12}`}
                                      fill="#ff9800"
                                    />
                                  </svg>
                                )}
                              </Box>
                            );
                          })}
                        </Box>
                      );
                    }
                    
                    const dependents = findDependents(questId);
                    
                    return (
                      <Box
                        key={`arrow-container-${colIndex}-${questIndex}`}
                        sx={{
                          width: 280,
                          height: 200,
                          position: 'relative'
                        }}
                      >
                        {(() => {
                          // Group dependents by their target positions to handle branching
                          const dependentPositions = dependents.map(dependent => {
                            const depPos = findQuestPosition(dependent.questId || dependent.id);
                            return depPos ? { ...depPos, dependent } : null;
                          }).filter(Boolean);

                          if (dependentPositions.length === 0) return null;

                          // Get shared arrow coordinates for this prerequisite
                          // Use questIndex and total quests in this column to calculate bend point
                          const sharedCoords = getSharedArrowCoordinates(questIndex, column.length, dependentPositions);
                          
                          // Get arrow styling for this quest
                          const arrowStyle = getArrowStyle(questIndex);

                          return dependentPositions.map((depData, depIndex) => {
                            const { rowIndex: depRowIndex } = depData;
                            const rowDiff = depRowIndex - questIndex;
                            const isStraight = rowDiff === 0;
                            
                            return (
                              <Box
                                key={`arrow-${colIndex}-${questIndex}-${depIndex}`}
                                sx={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  pointerEvents: 'none'
                                }}
                              >
                                {isStraight ? (
                                  // Straight horizontal arrow with shared coordinates
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 0,
                                      left: `${sharedCoords.startX}%`,
                                      width: `${sharedCoords.endX - sharedCoords.startX}%`,
                                      height: arrowStyle.strokeWidth,
                                      backgroundColor: 'transparent',
                                      borderTop: `${arrowStyle.strokeWidth}px dashed ${arrowStyle.color}`,
                                      borderImageSlice: 1,
                                      '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        right: 0,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: 0,
                                        height: 0,
                                        borderLeft: `20px solid ${arrowStyle.color}`,
                                        borderTop: '12px solid transparent',
                                        borderBottom: '12px solid transparent'
                                      }
                                    }}
                                  />
                                ) : (
                                  // Bent arrow (L-shaped) with shared coordinates
                                  <svg
                                    style={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: `${Math.abs(rowDiff) * 224 + 100}%`,
                                      overflow: 'visible'
                                    }}
                                  >
                                    {/* Horizontal line with shared start */}
                                    <line
                                      x1={`${sharedCoords.startX}%`}
                                      y1="0"
                                      x2={`${sharedCoords.bendX}%`}
                                      y2="0"
                                      stroke={arrowStyle.color}
                                      strokeWidth={arrowStyle.strokeWidth}
                                      strokeDasharray={arrowStyle.dashPattern}
                                    />
                                    {/* Vertical line with shared bend point */}
                                    <line
                                      x1={`${sharedCoords.bendX}%`}
                                      y1="0"
                                      x2={`${sharedCoords.bendX}%`}
                                      y2={`${rowDiff * 224}px`}
                                      stroke={arrowStyle.color}
                                      strokeWidth={arrowStyle.strokeWidth}
                                      strokeDasharray={arrowStyle.dashPattern}
                                    />
                                    {/* Final horizontal line with shared end */}
                                    <line
                                      x1={`${sharedCoords.bendX}%`}
                                      y1={`${rowDiff * 224}px`}
                                      x2={`${sharedCoords.endX}%`}
                                      y2={`${rowDiff * 224}px`}
                                      stroke={arrowStyle.color}
                                      strokeWidth={arrowStyle.strokeWidth}
                                      strokeDasharray={arrowStyle.dashPattern}
                                    />
                                    {/* Arrowhead */}
                                    <polygon
                                      points={`${280 * (sharedCoords.endX / 100)},${rowDiff * 224 - 12} ${280 * (sharedCoords.endX / 100) + 20},${rowDiff * 224} ${280 * (sharedCoords.endX / 100)},${rowDiff * 224 + 12}`}
                                      fill={arrowStyle.color}
                                    />
                                  </svg>
                                )}
                              </Box>
                            );
                          });
                        })()}
                      </Box>
                    );
                  })}
                </Stack>
              </React.Fragment>
            ))}
          </Stack>

          {/* Minimap - Bottom Right Corner */}
          {contentSize.width > 0 && contentSize.height > 0 && (() => {
            // Fixed minimap dimensions
            const MINIMAP_WIDTH = 250;
            const MINIMAP_MAX_HEIGHT = 180;
            
            // Calculate aspect ratio and scale to fit
            const contentAspectRatio = contentSize.width / contentSize.height;
            const minimapAspectRatio = MINIMAP_WIDTH / MINIMAP_MAX_HEIGHT;
            
            let minimapCanvasWidth, minimapCanvasHeight, scale;
            
            if (contentAspectRatio > minimapAspectRatio) {
              // Content is wider - fit to width
              minimapCanvasWidth = MINIMAP_WIDTH;
              scale = MINIMAP_WIDTH / contentSize.width;
              minimapCanvasHeight = contentSize.height * scale;
            } else {
              // Content is taller - fit to height
              minimapCanvasHeight = MINIMAP_MAX_HEIGHT;
              scale = MINIMAP_MAX_HEIGHT / contentSize.height;
              minimapCanvasWidth = contentSize.width * scale;
            }
            
            return (
              <Box
                sx={{
                  position: 'fixed',
                  bottom: 24,
                  right: 24,
                  width: MINIMAP_WIDTH,
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '2px solid #e0e0e0',
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                  zIndex: 100,
                  cursor: isDraggingMinimap ? 'grabbing' : 'pointer'
                }}
              >
                {/* Minimap Header */}
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    backgroundColor: '#f5f5f5',
                    borderBottom: '1px solid #e0e0e0'
                  }}
                >
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#666' }}>
                    Quest Map
                  </Typography>
                </Box>

                {/* Minimap Canvas */}
                <Box
                  sx={{
                    position: 'relative',
                    width: minimapCanvasWidth,
                    height: minimapCanvasHeight,
                    backgroundColor: '#fafafa',
                    margin: '0 auto'
                  }}
                  onMouseDown={handleMinimapMouseDown}
                  onMouseMove={handleMinimapMouseMove}
                >
                  {/* Quest blocks in minimap */}
                  {questColumns.map((column, colIndex) => (
                    <React.Fragment key={`minimap-col-${colIndex}`}>
                      {column.map((quest, questIndex) => {
                        // Exact card dimensions from the main view
                        const questCardWidth = 280;
                        const questCardHeight = 200;
                        const arrowContainerWidth = 280;
                        const columnSpacing = questCardWidth + arrowContainerWidth; // 280px quest + 280px arrow container = 560px per column
                        const rowSpacing = 224; // 200px height + 24px spacing (MUI spacing={3} = 3*8px)
                        
                        // Calculate actual position in the scroll content
                        const questX = colIndex * columnSpacing;
                        const questY = questIndex * rowSpacing;
                        
                        // Scale down to minimap coordinates
                        const minimapQuestX = questX * scale;
                        const minimapQuestY = questY * scale;
                        const minimapQuestWidth = questCardWidth * scale;
                        const minimapQuestHeight = questCardHeight * scale;
                        
                        // Determine color based on quest type
                        let backgroundColor = '#e3f2fd'; // Regular quest
                        let borderColor = '#2196f3';
                        
                        if (quest.isStartNode) {
                          backgroundColor = '#fff3e0';
                          borderColor = '#ff9800';
                        } else if (isDraftQuest(quest)) {
                          backgroundColor = '#fff8e1';
                          borderColor = '#ffb74d';
                        }
                        
                        return (
                          <Box
                            key={`minimap-quest-${colIndex}-${questIndex}`}
                            sx={{
                              position: 'absolute',
                              left: minimapQuestX,
                              top: minimapQuestY,
                              width: minimapQuestWidth,
                              height: minimapQuestHeight,
                              backgroundColor,
                              border: `1px solid ${borderColor}`,
                              borderRadius: 0.5,
                              pointerEvents: 'none'
                            }}
                          />
                        );
                      })}
                    </React.Fragment>
                  ))}

                  {/* Viewport indicator */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: scrollPosition.x * scale,
                      top: scrollPosition.y * scale,
                      width: viewportSize.width * scale,
                      height: viewportSize.height * scale,
                      border: '2px solid #1976d2',
                      backgroundColor: 'rgba(25, 118, 210, 0.1)',
                      borderRadius: 1,
                      pointerEvents: 'none',
                      boxShadow: '0 0 8px rgba(25, 118, 210, 0.3)'
                    }}
                  />
                </Box>
              </Box>
            );
          })()}
        </Box>
      )}
    </Box>
  );
};

export default QuestRoadmap;