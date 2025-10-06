import React, { useRef, useEffect } from 'react';
import {
  Box,
  Typography
} from '@mui/material';
import {
  Timeline as TimelineIcon
} from '@mui/icons-material';

const QuestRoadmap = ({ questBreakdownQuests = [] }) => {
  const canvasRef = useRef(null);

  // Extract prerequisite relationships from quest data
  const getQuestPrerequisites = (quest) => {
    // Look for prerequisite information in quest data
    if (quest.prerequisites) {
      return quest.prerequisites;
    }
    if (quest.requirements) {
      return quest.requirements;
    }
    if (quest.dependsOn) {
      return quest.dependsOn;
    }
    
    // Default: sequential prerequisites (each quest depends on the previous one)
    const questIndex = questBreakdownQuests.findIndex(q => q === quest);
    if (questIndex > 0) {
      return [questIndex - 1]; // Previous quest is prerequisite
    }
    
    return [];
  };

  // Draw the roadmap diagram
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || questBreakdownQuests.length === 0) return;

    const ctx = canvas.getContext('2d');
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Quest block dimensions - FIXED SIZE for consistent display
    const blockHeight = 250; // Fixed height - large and consistent
    const blockWidth = 350; // Fixed width - large and consistent
    const blockSpacing = 80; // Fixed spacing between blocks
    
    // Horizontal layout - single row
    const totalWidth = (questBreakdownQuests.length * blockWidth) + ((questBreakdownQuests.length - 1) * blockSpacing);
    
    // Start position - left side with significant padding to ensure first quest is fully visible
    const startX = 100;
    const startY = (canvasHeight - blockHeight) / 2;

    // Store quest positions for arrow drawing
    const questPositions = {};

    // Draw quest blocks in horizontal line
    questBreakdownQuests.forEach((quest, index) => {
      const x = startX + (index * (blockWidth + blockSpacing));
      const y = startY;
      
      questPositions[index] = { x, y, width: blockWidth, height: blockHeight };

      // Block background - simple white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, blockWidth, blockHeight);

      // Block border - simple gray border
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 3; // Fixed border width for consistency
      ctx.strokeRect(x, y, blockWidth, blockHeight);

      // Quest title - FIXED font sizes for consistency
      ctx.fillStyle = '#333333';
      const titleFontSize = 24; // Large, readable title
      ctx.font = `bold ${titleFontSize}px Arial`;
      ctx.textAlign = 'center';
      const title = quest.title || `Quest ${index + 1}`;
      const maxTitleWidth = blockWidth - 40;
      let displayTitle = title;
      
      // Truncate title if too long
      if (ctx.measureText(title).width > maxTitleWidth) {
        while (ctx.measureText(displayTitle + '...').width > maxTitleWidth && displayTitle.length > 0) {
          displayTitle = displayTitle.slice(0, -1);
        }
        displayTitle += '...';
      }
      
      ctx.fillText(displayTitle, x + blockWidth / 2, y + 70);

      // Quest number - FIXED font size
      ctx.fillStyle = '#666666';
      const numberFontSize = 18;
      ctx.font = `${numberFontSize}px Arial`;
      ctx.fillText(`Quest ${index + 1}`, x + blockWidth / 2, y + 140);

      // Quest description (if available) - FIXED font size
      if (quest.description) {
        ctx.fillStyle = '#888888';
        const descFontSize = 14;
        ctx.font = `${descFontSize}px Arial`;
        const maxDescLength = 45; // Approximately 45 characters
        const description = quest.description.length > maxDescLength ? quest.description.substring(0, maxDescLength) + '...' : quest.description;
        ctx.fillText(description, x + blockWidth / 2, y + 190);
      }
    });

    // Draw arrows for prerequisites
    questBreakdownQuests.forEach((quest, index) => {
      const prerequisites = getQuestPrerequisites(quest);
      
      prerequisites.forEach(prereqIndex => {
        if (prereqIndex >= 0 && prereqIndex < questBreakdownQuests.length && prereqIndex !== index) {
          const fromPos = questPositions[prereqIndex];
          const toPos = questPositions[index];
          
          if (fromPos && toPos) {
            // Calculate arrow start and end points for horizontal layout
            const fromX = fromPos.x + fromPos.width;
            const fromY = fromPos.y + fromPos.height / 2;
            const toX = toPos.x;
            const toY = toPos.y + toPos.height / 2;

            // Draw arrow line - FIXED line width
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 3; // Fixed line width
            const dashSize = 10; // Fixed dash size
            ctx.setLineDash([dashSize, dashSize]);
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.stroke();

            // Draw arrowhead - FIXED size
            const arrowLength = 15; // Fixed arrowhead size
            const arrowAngle = Math.atan2(toY - fromY, toX - fromX);
            
            ctx.fillStyle = '#666666';
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(toX, toY);
            ctx.lineTo(
              toX - arrowLength * Math.cos(arrowAngle - Math.PI / 6),
              toY - arrowLength * Math.sin(arrowAngle - Math.PI / 6)
            );
            ctx.lineTo(
              toX - arrowLength * Math.cos(arrowAngle + Math.PI / 6),
              toY - arrowLength * Math.sin(arrowAngle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fill();
          }
        }
      });
    });

    // Reset line dash
    ctx.setLineDash([]);
  }, [questBreakdownQuests]);

  return (
    <Box sx={{ 
      width: '100%', 
      height: 'calc(100vh - 64px)', // Full height minus header
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ p: 2, flexShrink: 0 }}>
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <TimelineIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          <Typography variant="h5" component="h1" fontWeight={700}>
            Quest Roadmap
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Visual roadmap showing quest dependencies. Arrows indicate prerequisite relationships.
        </Typography>
      </Box>

      {questBreakdownQuests.length === 0 ? (
        <Box 
          sx={{ 
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fafafa',
            m: 2,
            borderRadius: 2
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
          sx={{ 
            flex: 1,
            overflow: 'auto',
            backgroundColor: '#fafafa',
            m: 2,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            minWidth: 0 // Allow shrinking
          }}
        >
          <canvas
            ref={canvasRef}
            width={200 + (questBreakdownQuests.length * 430)}
            height={500}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              backgroundColor: 'white',
              display: 'block',
              minWidth: `${200 + (questBreakdownQuests.length * 430)}px`, // Force minimum width
              flexShrink: 0 // Prevent shrinking
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default QuestRoadmap;
