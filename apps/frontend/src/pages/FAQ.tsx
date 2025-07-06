import React, { useState } from 'react';
import { HelpIcon } from '../utils/icons';
import { useTheme } from '../contexts/ThemeContext';
import Box from '@mui/material/Box';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

const FAQ: React.FC = () => {
  const { mode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
      question: "How accurate is the sentiment analysis?",
      answer: "Our AI models achieve 94.8% accuracy on average across all modalities. Video analysis reaches 96% accuracy, audio analysis 93%, and text analysis 95%. We continuously improve our models with new training data.",
      category: "accuracy",
      tags: ["Accuracy & Performance", "accuracy", "performance", "ai"]
    },
    {
      question: "What file formats are supported for analysis?",
      answer: "We support a wide range of file formats including MP4, AVI, MOV for video; MP3, WAV, M4A for audio; and TXT, PDF, DOC for text analysis.",
      category: "technical",
      tags: ["Technical", "formats", "upload", "files"]
    },
    {
      question: "Is my data secure and private?",
      answer: "Yes, we employ end-to-end encryption and strict data privacy measures. Your data is processed in secure environments and never shared with third parties.",
      category: "security",
      tags: ["Security & Privacy", "security", "privacy", "encryption"]
    }
  ];

  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Theme-aware colors
  const colors = {
    background: mode === 'dark' ? '#0B1121' : '#f8fafc',
    cardBackground: mode === 'dark' ? '#1E293B' : '#ffffff',
    inputBackground: mode === 'dark' ? '#1E293B' : '#f1f5f9',
    primaryText: mode === 'dark' ? '#FFFFFF' : '#0f172a',
    secondaryText: mode === 'dark' ? '#94A3B8' : '#64748b',
    placeholderText: mode === 'dark' ? '#64748B' : '#94a3b8',
    iconColor: mode === 'dark' ? '#64748B' : '#6b7280',
    borderColor: mode === 'dark' ? 'rgba(100, 116, 139, 0.2)' : 'rgba(203, 213, 225, 0.4)',
    focusRing: mode === 'dark' ? '#4f46e5' : '#3b82f6',
    tagPrimary: {
      bg: mode === 'dark' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(99, 102, 241, 0.1)',
      text: mode === 'dark' ? '#a5b4fc' : '#4f46e5'
    },
    tagSecondary: {
      bg: mode === 'dark' ? 'rgba(71, 85, 105, 0.5)' : 'rgba(148, 163, 184, 0.2)',
      text: mode === 'dark' ? '#94a3b8' : '#64748b'
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        bgcolor: colors.background,
        pt: 8,
        pb: 12,
        px: { xs: 2, md: 4 },
        transition: 'background-color 0.2s ease',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: '1280px', mx: 'auto' }}>
        {/* Header Section */}
        <Box 
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 3,
            mb: 8,
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              bgcolor: '#4F46E5',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <HelpIcon style={{ width: 32, height: 32, color: '#ffffff' }} />
          </Box>
          <Box>
            <Box
              component="h1"
              sx={{
                fontSize: { xs: '1.75rem', md: '2rem' },
                fontWeight: 600,
                color: colors.primaryText,
                mb: 1,
                lineHeight: 1.2,
                transition: 'color 0.2s ease',
              }}
            >
              Frequently Asked Questions
            </Box>
            <Box
              component="p"
              sx={{
                fontSize: '1rem',
                color: colors.secondaryText,
                lineHeight: 1.5,
                transition: 'color 0.2s ease',
              }}
            >
              Find answers to common questions about SentimentAI Pro
            </Box>
          </Box>
        </Box>

        {/* Search and Filter Section */}
        <Box 
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            gap: 3,
            mb: 8,
          }}
        >
          <Box sx={{ flex: 1, width: '100%' }}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
              }}
            >
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: colors.inputBackground,
                  borderRadius: '12px',
                  paddingLeft: '48px',
                  paddingRight: '16px',
                  color: colors.primaryText,
                  fontSize: '0.9375rem',
                  border: 'none',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => e.target.style.boxShadow = `0 0 0 1px ${colors.focusRing}`}
                onBlur={(e) => e.target.style.boxShadow = 'none'}
              />
              <Box
                sx={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: colors.iconColor,
                  display: 'flex',
                  pointerEvents: 'none',
                  transition: 'color 0.2s ease',
                }}
              >
                <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </Box>
            </Box>
          </Box>
          <Box sx={{ width: { xs: '100%', md: '300px' }, flexShrink: 0 }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: colors.inputBackground,
                borderRadius: '12px',
                padding: '0 16px',
                color: colors.primaryText,
                fontSize: '0.9375rem',
                border: 'none',
                outline: 'none',
                appearance: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => e.target.style.boxShadow = `0 0 0 1px ${colors.focusRing}`}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            >
              <option value="all">All Categories (10)</option>
              <option value="accuracy">Accuracy & Performance (1)</option>
              <option value="technical">Technical (1)</option>
              <option value="security">Security & Privacy (1)</option>
              <option value="analysis">Analysis & Results (1)</option>
              <option value="features">Features (3)</option>
              <option value="integration">Integration (1)</option>
              <option value="administration">Administration (1)</option>
              <option value="pricing">Pricing & Billing (1)</option>
            </select>
          </Box>
        </Box>

        {/* FAQ Items */}
        <Box sx={{ mb: 8 }}>
          {filteredFAQs.map((faq, index) => (
            <Box
              key={index}
              sx={{
                backgroundColor: colors.cardBackground,
                borderRadius: '16px',
                mb: 3,
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: mode === 'dark' 
                    ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                    : '0 4px 12px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <Box
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                sx={{
                  p: 4,
                  cursor: 'pointer',
                }}
              >
                <Box 
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 3,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Box 
                      component="h3" 
                      sx={{
                        color: colors.primaryText,
                        fontSize: '1rem',
                        fontWeight: 500,
                        mb: 2,
                        lineHeight: 1.5,
                        transition: 'color 0.2s ease',
                      }}
                    >
                      {faq.question}
                    </Box>
                    <Box 
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                      }}
                    >
                      {faq.tags.map((tag, tagIndex) => (
                        <Box
                          key={tagIndex}
                          component="span"
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '20px',
                            fontSize: '0.8125rem',
                            backgroundColor: tagIndex === 0 ? colors.tagPrimary.bg : colors.tagSecondary.bg,
                            color: tagIndex === 0 ? colors.tagPrimary.text : colors.tagSecondary.text,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {tag}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Box 
                    sx={{
                      color: colors.iconColor,
                      transform: expandedIndex === index ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24,
                      height: 24,
                      flexShrink: 0,
                    }}
                  >
                    <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </Box>
                </Box>
              </Box>
              <AnimatePresence>
                {expandedIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Box
                      sx={{
                        borderTop: `1px solid ${colors.borderColor}`,
                        p: 4,
                        color: colors.secondaryText,
                        fontSize: '0.9375rem',
                        lineHeight: 1.6,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {faq.answer}
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          ))}

          {filteredFAQs.length === 0 && (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                color: colors.secondaryText,
                transition: 'color 0.2s ease',
              }}
            >
              <Box component="h3" sx={{ fontSize: '1.25rem', fontWeight: 600, mb: 2 }}>
                No results found
              </Box>
              <Box component="p" sx={{ fontSize: '0.9375rem' }}>
                Try adjusting your search or filter to find what you're looking for.
              </Box>
            </Box>
          )}
        </Box>

        {/* Still Need Help Section */}
        <Box
          sx={{
            mt: 8,
            p: 6,
            backgroundColor: mode === 'dark' ? 'rgba(79, 70, 229, 0.05)' : 'rgba(239, 246, 255, 0.8)',
            borderRadius: '24px',
            textAlign: 'center',
            transition: 'background-color 0.2s ease',
          }}
        >
          <Box
            component="h2"
            sx={{
              fontSize: '1.75rem',
              fontWeight: 600,
              color: colors.primaryText,
              mb: 2,
              transition: 'color 0.2s ease',
            }}
          >
            Still need help?
          </Box>
          <Box
            component="p"
            sx={{
              fontSize: '1rem',
              color: colors.secondaryText,
              mb: 6,
              transition: 'color 0.2s ease',
            }}
          >
            Our support team is here to assist you 24/7
          </Box>

          <Box 
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 4,
            }}
          >
            {/* Live Chat */}
            <Box
              sx={{
                backgroundColor: mode === 'dark' ? colors.cardBackground : '#ffffff',
                borderRadius: '16px',
                p: 4,
                textAlign: 'center',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: mode === 'dark' 
                    ? '0 8px 24px rgba(0, 0, 0, 0.3)'
                    : '0 8px 24px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <svg style={{ width: 24, height: 24, color: '#3b82f6' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </Box>
              <Box
                component="h3"
                sx={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: colors.primaryText,
                  mb: 2,
                  transition: 'color 0.2s ease',
                }}
              >
                Live Chat
              </Box>
              <Box
                component="p"
                sx={{
                  fontSize: '0.875rem',
                  color: colors.secondaryText,
                  mb: 3,
                  transition: 'color 0.2s ease',
                }}
              >
                Get instant help from our support team
              </Box>
              <Box
                component="button"
                sx={{
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  px: 4,
                  py: 2,
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#2563eb',
                  },
                }}
              >
                Start Chat
              </Box>
            </Box>

            {/* Email Support */}
            <Box
              sx={{
                backgroundColor: mode === 'dark' ? colors.cardBackground : '#ffffff',
                borderRadius: '16px',
                p: 4,
                textAlign: 'center',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: mode === 'dark' 
                    ? '0 8px 24px rgba(0, 0, 0, 0.3)'
                    : '0 8px 24px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <svg style={{ width: 24, height: 24, color: '#10b981' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </Box>
              <Box
                component="h3"
                sx={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: colors.primaryText,
                  mb: 2,
                  transition: 'color 0.2s ease',
                }}
              >
                Email Support
              </Box>
              <Box
                component="p"
                sx={{
                  fontSize: '0.875rem',
                  color: colors.secondaryText,
                  mb: 3,
                  transition: 'color 0.2s ease',
                }}
              >
                Send us a detailed message
              </Box>
              <Box
                component="button"
                sx={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  px: 4,
                  py: 2,
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#059669',
                  },
                }}
              >
                Send Email
              </Box>
            </Box>

            {/* Documentation */}
            <Box
              sx={{
                backgroundColor: mode === 'dark' ? colors.cardBackground : '#ffffff',
                borderRadius: '16px',
                p: 4,
                textAlign: 'center',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: mode === 'dark' 
                    ? '0 8px 24px rgba(0, 0, 0, 0.3)'
                    : '0 8px 24px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <svg style={{ width: 24, height: 24, color: '#8b5cf6' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </Box>
              <Box
                component="h3"
                sx={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: colors.primaryText,
                  mb: 2,
                  transition: 'color 0.2s ease',
                }}
              >
                Documentation
              </Box>
              <Box
                component="p"
                sx={{
                  fontSize: '0.875rem',
                  color: colors.secondaryText,
                  mb: 3,
                  transition: 'color 0.2s ease',
                }}
              >
                Browse our comprehensive guides
              </Box>
              <Box
                component="button"
                sx={{
                  backgroundColor: '#8b5cf6',
                  color: '#ffffff',
                  px: 4,
                  py: 2,
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#7c3aed',
                  },
                }}
              >
                View Docs
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default FAQ;
