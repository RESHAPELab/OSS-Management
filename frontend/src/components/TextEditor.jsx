import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Stack, Paper, Chip } from '@mui/material';
import { Preview as PreviewIcon, Edit as EditIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';

const renderMarkdown = (text) => {
  if (!text) return '';
  
  let html = text;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 style="margin: 16px 0 8px 0; color: #1976d2; font-weight: 600;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="margin: 20px 0 12px 0; color: #1976d2; font-weight: 700;">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 style="margin: 24px 0 16px 0; color: #1976d2; font-weight: 800;">$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>');
  
  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre style="background-color: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; margin: 8px 0;"><code>$1</code></pre>');
  
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code style="background-color: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #1976d2; text-decoration: none;">$1</a>');
  
  // Line breaks and paragraphs
  const lines = html.split('\n');
  const processedLines = [];
  let inList = false;
  
  for (const line of lines) {
    if (line.trim() === '') {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push('<br>');
    } else if (line.match(/^[-*+]\s/)) {
      if (!inList) {
        processedLines.push('<ul style="margin: 8px 0; padding-left: 20px;">');
        inList = true;
      }
      processedLines.push(`<li style="margin: 4px 0;">${line.substring(2)}</li>`);
    } else if (line.match(/^\d+\.\s/)) {
      if (!inList) {
        processedLines.push('<ol style="margin: 8px 0; padding-left: 20px;">');
        inList = true;
      }
      const listItemMatch = line.match(/^\d+\.\s(.+)/);
      if (listItemMatch) {
        processedLines.push(`<li style="margin: 4px 0;">${listItemMatch[1]}</li>`);
      }
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push(line);
    }
  }
  
  if (inList) {
    processedLines.push('</ul>');
  }
  
  html = processedLines.join('\n');
  
  // Line breaks (convert remaining newlines to <br>)
  html = html.replace(/\n/g, '<br>');
  
  return html;
};

const TextEditor = ({ 
  value, 
  onChange, 
  label = "Text Content",
  placeholder = "Enter your text here...",
  helperText = "You can type directly in the text area below",
  showPreview = true,
  maxHeight = "300px"
}) => {
  const [isEditing, setIsEditing] = useState(true);

  const handleTextChange = (e) => {
    onChange(e.target.value);
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  // Check if this is the Question Text label and replace with markdown cheatsheet link
  const renderLabel = () => {
    if (label === "Question Text") {
      return (
        <Chip
          component="a"
          href="https://www.markdownguide.org/cheat-sheet/"
          target="_blank"
          rel="noopener noreferrer"
          label="Markdown Cheatsheet"
          icon={<OpenInNewIcon />}
          clickable
          sx={{ 
            backgroundColor: '#e3f2fd',
            color: '#1976d2',
            border: '1px solid #bbdefb',
            '&:hover': {
              backgroundColor: '#bbdefb',
              color: '#1565c0'
            },
            '& .MuiChip-icon': {
              color: 'inherit'
            }
          }}
        />
      );
    }
    
    return (
      <Typography variant="subtitle2">
        ✏️ {label}
      </Typography>
    );
  };

  return (
    <Box>
      {/* Text Editor Section */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="flex-start" alignItems="center" sx={{ mb: 1, gap: { xs: 4, sm: 8, md: 52, lg: 86, xl: 90 } }}>
          {renderLabel()}
          {showPreview && (
            <Button
              size="small"
              variant="outlined"
              startIcon={isEditing ? <PreviewIcon /> : <EditIcon />}
              onClick={toggleEditMode}
            >
              {isEditing ? 'Preview' : 'Edit'}
            </Button>
          )}
        </Stack>

        {isEditing ? (
          <TextField
            fullWidth
            multiline
            rows={6}
            value={value}
            onChange={handleTextChange}
            placeholder={placeholder}
            helperText={helperText}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: 'monospace',
                fontSize: '14px'
              }
            }}
          />
        ) : (
          <Paper sx={{ p: 2, bgcolor: 'grey.50', fontSize: '14px', maxHeight, overflowY: 'auto' }}>
            <div 
              dangerouslySetInnerHTML={{ 
                __html: renderMarkdown(value || placeholder) 
              }}
              style={{
                fontFamily: 'inherit',
                lineHeight: '1.6',
                color: '#333'
              }}
            />
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default TextEditor; 