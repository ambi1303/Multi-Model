import React from 'react';
import { Paper, Typography, Chip, LinearProgress, Box, CircularProgress } from '@mui/material';
import { Menubar } from 'primereact/menubar';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Divider } from 'primereact/divider';
import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa';

export function ResultCard({ title, value, chips, progress, progressLabel, content, children }) {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', mb: 2 }}>
      {title && <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>{title}</Typography>}
      {value && <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>{value}</Typography>}
      {content && <Box sx={{ mb: 2 }}>{content}</Box>}
      {progress !== undefined && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinearProgress variant="determinate" value={progress} sx={{ flex: 1, height: 10, borderRadius: 2 }} />
          {progressLabel && <Chip label={progressLabel} size="small" sx={{ ml: 1, fontWeight: 700 }} />}
        </Box>
      )}
      {chips && chips.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {chips.map((chip, i) => <Chip key={i} label={chip} variant="outlined" />)}
        </Box>
      )}
      {children}
    </Paper>
  );
}

export function Spinner() {
  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
      <CircularProgress />
    </Box>
  );
}

export function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <Typography color="error" sx={{ fontWeight: 600, mt: 2, textAlign: 'center' }}>{message}</Typography>
  );
}

export function AppHeader() {
  const logo = (
    <span style={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: 28 }}>
      <Avatar icon="pi pi-brain" shape="circle" style={{ backgroundColor: '#fff', color: '#222', marginRight: 10, fontSize: 32, width: 48, height: 48 }} />
      <span style={{
        fontWeight: 900,
        fontSize: 28,
        letterSpacing: '-1px',
        display: 'flex',
        alignItems: 'center',
      }}>
        <span style={{
          background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          color: 'transparent',
          marginRight: 6,
        }}>ProMind</span>
        <span style={{ color: '#111', fontWeight: 800 }}>Metrics</span>
      </span>
    </span>
  );

  const items = [
    { label: 'Models', url: '/' },
    { label: 'Analysis', url: '/' },
    { label: 'Datasets', url: '/' },
    { label: 'Documentation', url: '/' },
    { label: 'About', url: '/' },
  ];

  const end = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span className="p-input-icon-left" style={{ marginRight: 8 }}>
        <i className="pi pi-search" />
        <InputText placeholder="Search models, datasets…" style={{ width: 220 }} />
      </span>
      <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: '#222', fontSize: 22, marginRight: 8 }}>
        <FaGithub />
      </a>
      <Button label="Sign In" className="p-button-text" style={{ fontWeight: 500, marginRight: 8 }} />
      <Button label="Get Started" className="p-button-raised p-button-primary" style={{ fontWeight: 700, borderRadius: 6 }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', width: '100%' }}>
      <Menubar model={items} start={logo} end={end} style={{ border: 'none', borderRadius: 0, background: '#fff', boxShadow: 'none', padding: '0 24px', minHeight: 56, flex: 1 }} />
    </div>
  );
}

export function AppFooter() {
  return (
    <footer style={{ background: '#fff', borderTop: '1px solid #eee', marginTop: 48 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '40px 24px 0 24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 32 }}>
        {/* Left: Logo and Description */}
        <div style={{ minWidth: 260, flex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: 22, marginBottom: 8 }}>
            <Avatar icon="pi pi-brain" shape="circle" style={{ backgroundColor: '#fff', color: '#222', marginRight: 8 }} />
            <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-1px', background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', color: 'transparent', marginRight: 6 }}>ProMind</span>
            <span style={{ color: '#111', fontWeight: 800 }}>Metrics</span>
          </div>
          <div style={{ color: '#555', fontSize: 16, marginBottom: 16 }}>
            Advanced sentiment analysis using multiple machine learning models for accurate emotion detection and text classification across various domains.
          </div>
          <div style={{ display: 'flex', gap: 18, fontSize: 22 }}>
            <a href="https://github.com/ambi1303/Multi-Model" target="_blank" rel="noopener noreferrer" style={{ color: '#222' }}><FaGithub /></a>
            <a href="/" style={{ color: '#222' }}><FaTwitter /></a>
            <a href="/" style={{ color: '#222' }}><FaLinkedin /></a>
          </div>
        </div>
        {/* Center: Models and Resources */}
        <div style={{ minWidth: 180, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Models</div>
          <div style={{ color: '#444', marginBottom: 6 }}>BERT</div>
          <div style={{ color: '#444', marginBottom: 6 }}>LSTM</div>
          <div style={{ color: '#444', marginBottom: 6 }}>Transformer</div>
          <div style={{ color: '#444', marginBottom: 6 }}>Ensemble</div>
          <div style={{ color: '#444', marginBottom: 6 }}>Model Comparison</div>
        </div>
        <div style={{ minWidth: 180, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Resources</div>
          <div style={{ color: '#444', marginBottom: 6 }}>Documentation</div>
          <div style={{ color: '#444', marginBottom: 6 }}>API Reference</div>
          <div style={{ color: '#444', marginBottom: 6 }}>Tutorials</div>
          <div style={{ color: '#444', marginBottom: 6 }}>Datasets</div>
          <div style={{ color: '#444', marginBottom: 6 }}>Research Papers</div>
        </div>
        <div style={{ minWidth: 180, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Support</div>
          <div style={{ color: '#444', marginBottom: 6 }}>Help Center</div>
          <div style={{ color: '#444', marginBottom: 6 }}>Community</div>
          <div style={{ color: '#444', marginBottom: 6 }}>Contact Us</div>
          <div style={{ color: '#444', marginBottom: 6 }}>Report Issues</div>
          <div style={{ color: '#444', marginBottom: 6 }}>Service Status</div>
        </div>
      </div>
      <Divider style={{ margin: '32px 0 0 0' }} />
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px 0 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ minWidth: 260, flex: 2 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Stay Updated</div>
          <div style={{ color: '#444', fontSize: 15 }}>Get the latest updates on new models and features.</div>
        </div>
        <form style={{ display: 'flex', gap: 0, minWidth: 320, flex: 1, maxWidth: 420 }} onSubmit={e => e.preventDefault()}>
          <InputText placeholder="Enter your email" style={{ flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }} />
          <Button type="submit" label="Subscribe" icon="pi pi-envelope" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, fontWeight: 700, minWidth: 120 }} />
        </form>
      </div>
      <Divider style={{ margin: '32px 0 0 0' }} />
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', color: '#888', fontSize: 15 }}>
        <div>© 2024 ProMind Metrics. All rights reserved.</div>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="/" style={{ color: '#888' }}>Privacy Policy</a>
          <a href="/" style={{ color: '#888' }}>Terms of Service</a>
          <a href="/" style={{ color: '#888' }}>Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
} 