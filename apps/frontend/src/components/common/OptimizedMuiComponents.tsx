// Optimized MUI imports - import only what we need
// This reduces bundle size by avoiding importing the entire @mui/material library

// Core components (most commonly used)
export { 
  Box, 
  Container, 
  Grid, 
  Stack,
  Paper,
  Card,
  CardContent,
  CardActions
} from '@mui/material';

// Typography
export { 
  Typography 
} from '@mui/material';

// Form components (lazy loaded when needed)
export { 
  Button,
  IconButton,
  TextField,
  FormControl,
  FormLabel,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  Slider
} from '@mui/material';

// Feedback components
export { 
  Alert,
  CircularProgress,
  LinearProgress,
  Skeleton,
  Snackbar
} from '@mui/material';

// Navigation components
export { 
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Tabs,
  Tab
} from '@mui/material';

// Data display components
export { 
  Chip,
  Avatar,
  Badge,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';

// Layout components
export { 
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Modal,
  Backdrop,
  Fade,
  Collapse
} from '@mui/material'; 