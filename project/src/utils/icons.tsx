// Lightweight icon imports using lucide-react instead of @mui/icons-material
// This prevents the "too many open files" error with Vite

import React from 'react';
import {
  Menu,
  X,
  Home,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Video,
  Mic,
  MessageCircle,
  FileText,
  Settings,
  HelpCircle,
  User,
  Bell,
  Search,
  Filter,
  MoreVertical,
  Sun,
  Moon,
  Maximize,
  Minimize,
  Play,
  Pause,
  Square,
  Download,
  Upload,
  Save,
  Edit,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  PieChart,
  Activity,
  Folder,
  File,
  Image,
  FileAudio,
  FileVideo,
  Volume2,
  Zap,
  Heart,
  Users,
  Smile,
  Sparkles,
  Frown,
  Eye,
  Star,
  Timer,
  Cloud,
  Send,
  Github,
  Twitter,
  Linkedin,
} from 'lucide-react';

// Icon size configuration
const ICON_SIZE = 20;

// Core icons
export const MenuIcon: React.FC = () => <Menu size={ICON_SIZE} />;
export const CloseIcon: React.FC = () => <X size={ICON_SIZE} />;
export const HomeIcon: React.FC = () => <Home size={ICON_SIZE} />;
export const DashboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <BarChart3 {...props} />;
export const AnalyticsIcon: React.FC = () => <TrendingUp size={ICON_SIZE} />;
export const VideoCallIcon: React.FC = () => <Video size={ICON_SIZE} />;
export const MicIcon: React.FC = () => <Mic size={ICON_SIZE} />;
export const ChatIcon: React.FC = () => <MessageCircle size={ICON_SIZE} />;
export const AssignmentIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <FileText {...props} />;
export const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Settings {...props} />;
export const HelpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <HelpCircle {...props} />;
export const AccountCircleIcon: React.FC = () => <User size={ICON_SIZE} />;
export const NotificationsIcon: React.FC = () => <Bell size={ICON_SIZE} />;
export const SearchIcon: React.FC = () => <Search size={ICON_SIZE} />;
export const FilterListIcon: React.FC = () => <Filter size={ICON_SIZE} />;
export const MoreVertIcon: React.FC = () => <MoreVertical size={ICON_SIZE} />;

// Theme icons
export const LightModeIcon: React.FC = () => <Sun size={ICON_SIZE} />;
export const DarkModeIcon: React.FC = () => <Moon size={ICON_SIZE} />;
export const FullscreenIcon: React.FC = () => <Maximize size={ICON_SIZE} />;
export const FullscreenExitIcon: React.FC = () => <Minimize size={ICON_SIZE} />;

// Action icons
export const PlayArrowIcon: React.FC = () => <Play size={ICON_SIZE} />;
export const PauseIcon: React.FC = () => <Pause size={ICON_SIZE} />;
export const StopIcon: React.FC = () => <Square size={ICON_SIZE} />;
export const DownloadIcon: React.FC = () => <Download size={ICON_SIZE} />;
export const UploadIcon: React.FC = () => <Upload size={ICON_SIZE} />;
export const SaveIcon: React.FC = () => <Save size={ICON_SIZE} />;
export const EditIcon: React.FC = () => <Edit size={ICON_SIZE} />;
export const DeleteIcon: React.FC = () => <Trash2 size={ICON_SIZE} />;
export const AddIcon: React.FC = () => <Plus size={ICON_SIZE} />;
export const RemoveIcon: React.FC = () => <Minus size={ICON_SIZE} />;

// Status icons with forwardRef for MUI compatibility
export const CheckCircleIcon = React.forwardRef<SVGSVGElement, React.ComponentProps<typeof CheckCircle>>((props, ref) => (
  <CheckCircle ref={ref} size={ICON_SIZE} {...props} />
));
export const ErrorIcon: React.FC = () => <AlertCircle size={ICON_SIZE} />;
export const WarningIcon: React.FC = () => <AlertTriangle size={ICON_SIZE} />;
export const InfoIcon: React.FC = () => <Info size={ICON_SIZE} />;
export const CircularProgressIcon: React.FC = () => <RotateCcw size={ICON_SIZE} />;

// Navigation icons
export const ArrowBackIcon: React.FC = () => <ArrowLeft size={ICON_SIZE} />;
export const ArrowForwardIcon: React.FC = () => <ArrowRight size={ICON_SIZE} />;
export const ArrowUpwardIcon: React.FC = () => <ArrowUp size={ICON_SIZE} />;
export const ArrowDownwardIcon: React.FC = () => <ArrowDown size={ICON_SIZE} />;
export const RefreshIcon: React.FC = () => <RefreshCw size={ICON_SIZE} />;

// Chart and data icons
export const TrendingUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <TrendingUp {...props} />;
export const TrendingDownIcon: React.FC = () => <TrendingDown size={ICON_SIZE} />;
export const TimelineIcon: React.FC = () => <Activity size={ICON_SIZE} />;
export const BarChartIcon: React.FC = () => <BarChart3 size={ICON_SIZE} />;
export const PieChartIcon: React.FC = () => <PieChart size={ICON_SIZE} />;

// File icons
export const FolderIcon: React.FC = () => <Folder size={ICON_SIZE} />;
export const InsertDriveFileIcon: React.FC = () => <File size={ICON_SIZE} />;
export const ImageIcon: React.FC = () => <Image size={ICON_SIZE} />;
export const AudioFileIcon: React.FC = () => <FileAudio size={ICON_SIZE} />;
export const VideoFileIcon: React.FC = () => <FileVideo size={ICON_SIZE} />;

// Essential additional icons
export const VolumeUpIcon: React.FC = () => <Volume2 size={ICON_SIZE} />;
export const ZapIcon: React.FC = () => <Zap size={ICON_SIZE} />;
export const HeartIcon: React.FC = () => <Heart size={ICON_SIZE} />;
export const PeopleIcon: React.FC = () => <Users size={ICON_SIZE} />;
export const EmojiEmotionsIcon: React.FC = () => <Smile size={ICON_SIZE} />;
export const AutoAwesomeIcon: React.FC = () => <Sparkles size={ICON_SIZE} />;
export const SmileIcon: React.FC = () => <Smile size={ICON_SIZE} />;
export const FrownIcon: React.FC = () => <Frown size={ICON_SIZE} />;
export const EyeIcon: React.FC = () => <Eye size={ICON_SIZE} />;
export const StarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Star {...props} />;
export const TimerIcon: React.FC = () => <Timer size={ICON_SIZE} />;
export const CloudUploadIcon: React.FC = () => <Cloud size={ICON_SIZE} />;
export const SendIcon: React.FC = () => <Send size={ICON_SIZE} />;

// Social media icons
export const GitHub: React.FC = () => <Github size={ICON_SIZE} />;
export const TwitterIcon: React.FC = () => <Twitter size={ICON_SIZE} />;
export const LinkedInIcon: React.FC = () => <Linkedin size={ICON_SIZE} />;

// Survey-specific icons (reusing existing icons)
export const WorkIcon: React.FC = () => <Settings size={ICON_SIZE} />;
export const PsychologyIcon: React.FC = () => <Activity size={ICON_SIZE} />;
export const AssessmentIcon: React.FC = () => <BarChart3 size={ICON_SIZE} />;
export const RestartAltIcon: React.FC = () => <RefreshCw size={ICON_SIZE} />;
export const LightbulbIcon: React.FC = () => <Zap size={ICON_SIZE} />;
export const BusinessIcon: React.FC = () => <Folder size={ICON_SIZE} />;
export const ScaleIcon: React.FC = () => <BarChart3 size={ICON_SIZE} />;
export const ScheduleIcon: React.FC = () => <Timer size={ICON_SIZE} />;

// Aliases for backward compatibility
export const MessageCircleIcon = ChatIcon;
export const BarChart3Icon = BarChartIcon;
export const PersonIcon = AccountCircleIcon;
export const InsightsIcon = TimelineIcon;
export const TextSnippetIcon = AssignmentIcon;
export const MoodIcon = EmojiEmotionsIcon;
export const SpeedIcon = ZapIcon;
export const MinusIcon = RemoveIcon;

// Export Menu for backward compatibility
export { Menu };
