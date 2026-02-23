import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Box, Typography, Button, Grid } from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import reshapeLogo from '../../images/reshape.png';
import './LandingPage.css';

// Reusable Content Block Component that alternates image/text position
const ContentBlock = ({ imagePosition = 'left', imageSrc, imagePlaceholder, title, subtitle, description, list, imageColor = '#667eea', imageWidth = '100%' }) => {
  const imageContent = imageSrc ? (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Box 
        component="img"
        src={imageSrc}
        alt={title || imagePlaceholder}
        sx={{ 
          width: imageWidth,
          maxWidth: imageWidth,
          height: 'auto',
          objectFit: 'contain',
          borderRadius: 2,
          margin: '0 auto',
        }}
      />
    </Box>
  ) : (
    <Box 
      sx={{ 
        bgcolor: imageColor,
        borderRadius: 2,
        height: { xs: '250px', md: '350px' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.2rem',
        fontWeight: 500,
        p: 3,
        textAlign: 'center',
        opacity: 0.9
      }}
    >
      {imagePlaceholder || 'Image Placeholder'}
    </Box>
  );

  const textContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      {title && (
        <Typography variant="h4" component="h3" sx={{ mb: 2, fontWeight: 600 }}>
          {title}
        </Typography>
      )}
      {subtitle && (
        <Typography variant="h6" component="h4" sx={{ mb: 2, color: 'primary.main', fontWeight: 500 }}>
          {subtitle}
        </Typography>
      )}
      {description && (
        <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary', lineHeight: 1.8 }}>
          {description}
        </Typography>
      )}
      {list && list.length > 0 && (
        <Box component="ul" sx={{ pl: 3, '& li': { mb: 1, color: 'text.secondary' } }}>
          {list.map((item, idx) => (
            <li key={idx}>
              <Typography variant="body1">{item}</Typography>
            </li>
          ))}
        </Box>
      )}
    </Box>
  );

  return (
    <Grid container spacing={4} alignItems="center" sx={{ py: 6 }}>
      {imagePosition === 'left' ? (
        <>
          <Grid item xs={12} md={6}>
            {imageContent}
          </Grid>
          <Grid item xs={12} md={6}>
            {textContent}
          </Grid>
        </>
      ) : (
        <>
          <Grid item xs={12} md={6}>
            {textContent}
          </Grid>
          <Grid item xs={12} md={6}>
            {imageContent}
          </Grid>
        </>
      )}
    </Grid>
  );
};

// Full-width Image Block
const ImageBlock = ({ imageSrc, imagePlaceholder, imageColor = '#667eea', height = '400px', width = '100%' }) => {
  return (
    <Box sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {imageSrc ? (
        <Box 
          component="img"
          src={imageSrc}
          alt={imagePlaceholder}
          sx={{ 
            width: width,
            maxWidth: width,
            height: 'auto',
            borderRadius: 2,
            display: 'block',
            margin: '0 auto',
          }}
        />
      ) : (
        <Box 
          sx={{ 
            bgcolor: imageColor,
            borderRadius: 2,
            height: height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.3rem',
            fontWeight: 500,
            p: 3,
            textAlign: 'center',
            opacity: 0.9
          }}
        >
          {imagePlaceholder || 'Image Placeholder'}
        </Box>
      )}
    </Box>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Hero + Tagline Section */}
      <Box className="hero-section">
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography 
              variant="h1" 
              component="h1" 
              className="hero-title"
              sx={{ 
                fontWeight: 700, 
                mb: 3,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                color: 'white'
              }}
            >
              Gamified Open Source Learning on GitHub
            </Typography>
            <Typography 
              variant="h5" 
              component="p" 
              sx={{ 
                mb: 4, 
                color: 'rgba(255, 255, 255, 0.95)', 
                maxWidth: '800px', 
                mx: 'auto',
                fontSize: { xs: '1.8rem', md: '2.2rem' },
                lineHeight: 1.6
              }}
            >
              Quest-based curriculum with live GitHub issues and automated mentoring. 
              Transform how students learn open source workflows through immersive, 
              data-driven learning environments.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 2 }}>
              <Button 
                variant="contained" 
                size="large"
                onClick={() => navigate('/login')}
                sx={{ 
                  px: 4, 
                  py: 1.5,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'grey.100'
                  }
                }}
              >
                Get Started
                <ArrowForwardIcon sx={{ ml: 1 }} />
              </Button>
              <Button 
                variant="outlined" 
                size="large"
                href="https://www.researchgate.net/publication/388954834_OSSDoorway_A_Gamified_Environment_to_Scaffold_Student_Contributions_to_Open_Source_Software"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ 
                  px: 4, 
                  py: 1.5,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Read Our Paper
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* OSS-Doorway Header Section */}
      <Box sx={{ 
        textAlign: 'center', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 8,
        px: 4,
        width: '100%'
      }}>
        <Typography 
          variant="h1" 
          component="h2" 
          sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '6rem', md: '8rem' }, color: 'white' }}
        >
          OSS-Doorway
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
          <Typography variant="h5" sx={{ color: 'white', opacity: 0.9 }}>
            by
          </Typography>
          <Box 
            component={Link}
            to="/login"
            sx={{ 
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8
              }
            }}
          >
            <Box 
              component="img"
              src={reshapeLogo}
              alt="Reshape Lab"
              sx={{ height: '100px', objectFit: 'contain' }}
            />
          </Box>
        </Box>
      </Box>

      {/* Problem & Motivation Section */}
      <Box sx={{ bgcolor: 'background.default', py: 6 }}>
        <Container maxWidth="lg">
          
          <Box sx={{ mb: 6, px: { xs: 2, md: 8 } }}>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', color: 'text.secondary', lineHeight: 1.8 }}>
              Traditional software engineering education emphasizes theory over real-world practice. Contributing to open source software (OSS) projects bridges this gap, but students face significant barriers including complex workflows, difficulty understanding contribution processes, and lack of proper guidance. Research shows that students, particularly women and those with lower self-efficacy, require structured support to succeed. Instructors struggle to maintain engagement and provide timely, personalized feedback at scale. Strategic scaffolding through game elements and structured learning environments has shown promise in promoting sustained student participation in OSS projects.
            </Typography>
          </Box>
          
          <ContentBlock 
            imagePosition="right"
            imageSrc={process.env.PUBLIC_URL + '/immersive-env.png'}
            imagePlaceholder="Immersive Learning Environment"
            imageColor="#3498db"
            imageWidth="100%"
            title="The Need for Immersive Learning"
            description="Students need hands-on experience with real GitHub workflows, immediate feedback on their progress, and a structured path through complex open source concepts. Our data-driven approach provides exactly that by transforming abstract concepts into concrete, measurable skills."
          />
        </Container>
      </Box>

      {/* System Overview Section */}
      <Box sx={{ bgcolor: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            component="h2" 
            sx={{ textAlign: 'center', mb: 6, fontWeight: 600 }}
          >
            System Overview
          </Typography>
          
          <ImageBlock 
            imageSrc={process.env.PUBLIC_URL + '/architecture-diagram.png'}
            imagePlaceholder="Architecture Diagram: GitHub App ↔ Management Portal ↔ MongoDB ↔ Quest Configs"
            imageColor="#9b59b6"
            width="60%"
          />
          
          <Box sx={{ textAlign: 'center', mt: 4, px: { xs: 2, md: 6 } }}>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', color: 'text.secondary', lineHeight: 1.8 }}>
              Powered by Probot-based automation, our system seamlessly integrates with GitHub through 
              a dedicated GitHub App. The Management Portal provides instructors with full control over 
              quest configurations, while MongoDB stores student progress and analytics. Students interact 
              directly with their repositories, receiving automated feedback and guidance through GitHub issues.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Core Features Section */}
      <Box sx={{ bgcolor: 'background.default', py: 6 }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            component="h2" 
            sx={{ textAlign: 'center', mb: 6, fontWeight: 600 }}
          >
            Core Features
          </Typography>
          
          <ContentBlock 
            imagePosition="right"
            imageSrc={process.env.PUBLIC_URL + '/quest-maker.png'}
            imagePlaceholder="Quest JSON Builder Interface"
            imageColor="#16a085"
            imageWidth="60%"
            title="Quest JSON Builder"
            description="Create and manage quests with an intuitive drag-and-drop editor. Design complex task sequences, set validation rules, and configure automated feedback. Switch between draft and live workflows seamlessly, ensuring your curriculum is always polished before deployment."
          />
          
          <ContentBlock 
            imagePosition="left"
            imageSrc={process.env.PUBLIC_URL + '/roadmap.png'}
            imagePlaceholder="Quest Roadmap Visualization"
            imageColor="#f39c12"
            imageWidth="60%"
            title="Quest Roadmap Visualization"
            description="Visualize quest dependencies with an interactive minimap. Edit prerequisite relationships, configure deployment gating, and see the entire learning path at a glance. Students always know what's next and what they need to unlock future quests."
          />
        </Container>
      </Box>

      {/* Gamified Experience Section */}
      <Box sx={{ bgcolor: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            component="h2" 
            sx={{ textAlign: 'center', mb: 6, fontWeight: 600 }}
          >
            Gamified Experience
          </Typography>
          
          <ContentBlock 
            imagePosition="right"
            imageSrc={process.env.PUBLIC_URL + '/ui.png'}
            imagePlaceholder="Points, XP, Levels & Badges"
            imageColor="#e67e22"
            imageWidth="60%"
            title="Comprehensive Progression System"
            description="Students earn points, XP, and level up as they complete quests. Track daily streaks, unlock achievement badges, and watch progress accumulate. Every contribution matters, and every milestone is celebrated."
          />
          
          <Box sx={{ my: 6, px: { xs: 2, md: 6 }, textAlign: 'center' }}>
            <Typography variant="h4" component="h3" sx={{ mb: 2, fontWeight: 600, color: 'black' }}>
              Real-Time Guidance & Support
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', color: 'text.secondary', lineHeight: 1.8, maxWidth: '900px', mx: 'auto' }}>
              Our intelligent bot system provides instant, context-aware feedback as students work through quests. Every action receives immediate validation, whether it's correctly finding an issue, successfully submitting a pull request, or engaging with the community. Students receive personalized encouragement for successes and helpful guidance when they encounter challenges, ensuring they never feel lost in the contribution process.
            </Typography>
          </Box>
          
          <ContentBlock 
            imagePosition="left"
            imageSrc={process.env.PUBLIC_URL + '/helpful.png'}
            imagePlaceholder="Personalized Response System"
            imageColor="#8e44ad"
            imageWidth="60%"
            title="Intelligent Automated Mentoring"
            description="Dynamic, personalized feedback for every student action. Success messages celebrate achievements, error guidance points students in the right direction, and navigation hints keep learners on track. Context-aware responses use dynamic placeholders to address each student's unique situation."
          />
          
          <ContentBlock 
            imagePosition="right"
            imageSrc={process.env.PUBLIC_URL + '/quest-board.png'}
            imagePlaceholder="Leaderboards & Rankings"
            imageColor="#c0392b"
            imageWidth="60%"
            title="Leaderboards & Class Rankings"
            description="Foster healthy competition with class leaderboards and percentile rankings. Students see where they stand, motivating continued engagement. Instructors gain insights into class performance at a glance."
          />
          
          <ContentBlock 
            imagePosition="left"
            imageSrc={process.env.PUBLIC_URL + '/quest-map.png'}
            imagePlaceholder="Quest Maps & SVG Scorecards"
            imageColor="#27ae60"
            imageWidth="60%"
            title="Visual Progress Tracking"
            description="Quest map PNGs show student progression through the curriculum. README SVG scorecards display streak rings, badge collections, and achievement histories. Progress is showcased throughout."
          />
          
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Button 
              variant="outlined" 
              size="large"
              href="https://www.researchgate.net/publication/388954834_OSSDoorway_A_Gamified_Environment_to_Scaffold_Student_Contributions_to_Open_Source_Software"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                px: 5, 
                py: 1.5,
                fontSize: '1.1rem',
                textTransform: 'none',
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  bgcolor: 'primary.light',
                  color: 'primary.dark'
                }
              }}
            >
              Read Our Paper
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Call to Action Section */}
      <Box className="cta-section" sx={{ py: 8, bgcolor: 'primary.main', color: 'white' }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
              Ready to Transform Your OSS Education?
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, fontSize: '1.1rem', opacity: 0.9 }}>
              Adopt OSS-Doorway in your course and revolutionize how your students learn open source development.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                variant="contained" 
                size="large"
                href="https://ossdoorway.vercel.app/class/691b7f64528ddbaa6810aa3f/invite"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ 
                  px: 5, 
                  py: 1.5,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'grey.100'
                  }
                }}
              >
                Try Demo
                <ArrowForwardIcon sx={{ ml: 1 }} />
              </Button>
              <Button 
                variant="outlined" 
                size="large"
                onClick={() => navigate('/login')}
                sx={{ 
                  px: 5, 
                  py: 1.5,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Sign Up Today
                <ArrowForwardIcon sx={{ ml: 1 }} />
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </div>
  );
};

export default LandingPage;
