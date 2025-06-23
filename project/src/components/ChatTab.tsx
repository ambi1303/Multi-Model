import React, { useState } from 'react';
import { Box, Button, Typography, Paper, TextField, CircularProgress, Grid, Tabs, Tab, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { analyzeSingleChatMessage, analyzeBatchChatMessages } from '../services/api';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart as RLineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const ChatTab: React.FC = () => {
  const [tab, setTab] = useState<'single' | 'batch'>('single');
  // Single message state
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  // Batch state
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<any>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchFileName, setBatchFileName] = useState('');

  // Tab switch
  const handleTabChange = (_: any, value: string) => {
    setTab(value as 'single' | 'batch');
    setResult(null);
    setBatchResult(null);
    setBatchError(null);
    setBatchFileName('');
  };

  // Single message submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await analyzeSingleChatMessage({ text });
      setResult(data);
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Batch file upload
  const handleBatchFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setBatchError(null);
    setBatchResult(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setBatchFileName(file.name);
    setBatchLoading(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      let messages = json.messages || [];
      if (json.person_id) {
        messages = messages.map((msg: any) => ({ ...msg, person_id: json.person_id }));
      }
      messages = messages.map((msg: any) => ({ ...msg, timestamp: msg.timestamp || new Date().toISOString() }));
      const data = await analyzeBatchChatMessages(messages);
      setBatchResult(data);
    } catch (err: any) {
      setBatchError('Invalid file or analysis failed. ' + (err.message || ''));
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Single Message" value="single" />
        <Tab label="Batch Analysis" value="batch" />
      </Tabs>
      {tab === 'single' && (
        <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
          <form onSubmit={handleSingleSubmit}>
            <Typography variant="h5" sx={{ mb: 2 }}>Analyze Single Message</Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type your message here..."
              disabled={loading}
              sx={{ mb: 2 }}
            />
            <Button type="submit" variant="contained" disabled={loading || !text.trim()}>
              {loading ? <CircularProgress size={24} /> : 'Analyze'}
            </Button>
          </form>
          {result && (
            <Box sx={{ mt: 3 }}>
              {result.error ? (
                <Alert severity="error">{result.error}</Alert>
              ) : (
                <Box>
                  <Typography variant="subtitle1">Primary Emotion: <b>{result.primary_emotion}</b></Typography>
                  <Typography variant="subtitle1">Sentiment Score: <b>{result.sentiment_score}</b></Typography>
                  <Typography variant="subtitle1">Mental State: <b>{result.mental_state}</b></Typography>
                </Box>
              )}
            </Box>
          )}
        </Paper>
      )}
      {tab === 'batch' && (
        <Paper sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
          <Typography variant="h5" sx={{ mb: 2 }}>Batch Chat Analysis</Typography>
          <Button variant="outlined" component="label" sx={{ mb: 2 }}>
            Upload JSON File
            <input type="file" accept="application/json" hidden onChange={handleBatchFileChange} />
          </Button>
          {batchFileName && <Typography variant="body2" sx={{ mb: 2 }}>File: {batchFileName}</Typography>}
          {batchLoading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />}
          {batchError && <Alert severity="error">{batchError}</Alert>}
          {batchResult && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>📊 Batch Analysis Summary</Typography>
              <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#495057' }}>
                      📝 Total Messages:
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#6c757d' }}>
                      {batchResult.summary.total_messages}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#495057', mb: 1 }}>
                      🧠 Mental State Distribution:
                    </Typography>
                    <Box sx={{ ml: 2 }}>
                      {Object.entries(batchResult.summary.mental_state_distribution || {}).map(([state, count]) => (
                        <Typography key={state} variant="body2" sx={{ color: '#6c757d', mb: 0.5 }}>
                          • <strong>{state}:</strong> {String(count)}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#495057' }}>
                      💭 Average Sentiment:
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#6c757d' }}>
                      {batchResult.summary.average_sentiment}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#495057' }}>
                      😊 Most Common Emotion:
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#6c757d' }}>
                      {batchResult.summary.most_common_emotion}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#495057', mb: 1 }}>
                      ⏰ Time Span:
                    </Typography>
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="body2" sx={{ color: '#6c757d', mb: 0.5 }}>
                        <strong>From:</strong> {batchResult.summary.time_span?.start}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6c757d' }}>
                        <strong>To:</strong> {batchResult.summary.time_span?.end}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
              {Array.isArray(batchResult.analyzed_messages) && batchResult.analyzed_messages.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6">Per-Message Analysis</Typography>
                  <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Timestamp</TableCell>
                          <TableCell>Text</TableCell>
                          <TableCell>Person ID</TableCell>
                          <TableCell>Sentiment Score</TableCell>
                          <TableCell>Primary Emotion</TableCell>
                          <TableCell>Emotion Score</TableCell>
                          <TableCell>Mental State</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {batchResult.analyzed_messages.map((msg: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{msg.timestamp}</TableCell>
                            <TableCell>{msg.text}</TableCell>
                            <TableCell>{msg.person_id}</TableCell>
                            <TableCell>{((msg.sentiment_score + 1) / 2 * 100).toFixed(0)}%</TableCell>
                            <TableCell>{msg.primary_emotion}</TableCell>
                            <TableCell>{(msg.emotion_score * 100).toFixed(0)}%</TableCell>
                            <TableCell>{msg.mental_state}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Mental State Distribution Pie Chart */}
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6">Mental State Distribution</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(batchResult.analyzed_messages.reduce((acc: any, msg: any) => {
                            acc[msg.mental_state] = (acc[msg.mental_state] || 0) + 1;
                            return acc;
                          }, {})).map(([name, value]) => ({ name, value }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          label
                        >
                          {Object.keys(batchResult.analyzed_messages.reduce((acc: any, msg: any) => {
                            acc[msg.mental_state] = (acc[msg.mental_state] || 0) + 1;
                            return acc;
                          }, {})).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFF', '#FF6699'][index % 6]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>

                  {/* Sentiment Trend Line Chart */}
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6">Sentiment Score Trend Over Time</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <RLineChart
                        data={batchResult.analyzed_messages
                          .map((msg: any) => ({
                            timestamp: new Date(msg.timestamp).toLocaleString(),
                            sentiment_score: msg.sentiment_score
                          }))
                          .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                        }
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" angle={-45} textAnchor="end" height={60} />
                        <YAxis domain={[-1, 1]} />
                        <RechartsTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="sentiment_score" stroke="#8884d8" activeDot={{ r: 8 }} />
                      </RLineChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default ChatTab; 