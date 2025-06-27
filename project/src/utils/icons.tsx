// Lightweight icon imports using lucide-react instead of @mui/icons-material
// This prevents the "too many open files" error with Vite

import React from 'react';
import {
  Menu,
  X as Close,
  Home,
  BarChart3 as Dashboard,
  TrendingUp as Analytics,
  Video as VideoCall,
  Mic,
  MessageCircle as Chat,
  FileText as Assignment,
  Settings,
  HelpCircle as Help,
  User as AccountCircle,
  Bell as Notifications,
  Search,
  Filter as FilterList,
  MoreVertical as MoreVert,
  Sun as LightMode,
  Moon as DarkMode,
  Maximize as Fullscreen,
  Minimize as FullscreenExit,
  Play as PlayArrow,
  Pause,
  Square as Stop,
  Download,
  Upload,
  Save,
  Edit,
  Trash2 as Delete,
  Plus as Add,
  Minus as Remove,
  CheckCircle,
  AlertCircle as Error,
  AlertTriangle as Warning,
  Info,
  RotateCcw as CircularProgress,
  ArrowLeft as ArrowBack,
  ArrowRight as ArrowForward,
  ArrowUp as ArrowUpward,
  ArrowDown as ArrowDownward,
  RefreshCw as Refresh,
  Github,
  Twitter,
  Linkedin,
  Mail as Email,
  TrendingUp,
  TrendingDown,
  Activity as Timeline,
  BarChart3,
  PieChart,
  Donut as DonutLarge,
  Folder,
  File as InsertDriveFile,
  FileText as Description,
  Image,
  FileAudio as AudioFile,
  FileVideo as VideoFile,
  Volume2,
  Zap,
  Heart,
  Gauge as Speed,
  Minus,
  Users as People,
  Smile as EmojiEmotions,  
  Sparkles as AutoAwesome,
  MessageSquare as MessageOutlined,
  Frown as SentimentVeryDissatisfied,
  Meh as SentimentNeutral,
  MessageCircle as ChatBubbleOutline,
  Cloud as CloudUpload,
  Send,
  FileText as TextSnippet,
  Smile,
  Frown,
  Eye,
  Star,
  PartyPopper as Celebration,
  Timer,
  User as Person,
  Activity as Insights,
} from 'lucide-react';

// Icon size configuration
const ICON_SIZE = 20;

// Export icons as React components with consistent naming
export const MenuIcon: React.FC = () => <Menu size={ICON_SIZE} />;
export const CloseIcon: React.FC = () => <Close size={ICON_SIZE} />;
export const HomeIcon: React.FC = () => <Home size={ICON_SIZE} />;
export const DashboardIcon: React.FC = () => <Dashboard size={ICON_SIZE} />;
export const AnalyticsIcon: React.FC = () => <Analytics size={ICON_SIZE} />;
export const VideoCallIcon: React.FC = () => <VideoCall size={ICON_SIZE} />;
export const MicIcon: React.FC = () => <Mic size={ICON_SIZE} />;
export const ChatIcon: React.FC = () => <Chat size={ICON_SIZE} />;
export const AssignmentIcon: React.FC = () => <Assignment size={ICON_SIZE} />;
export const SettingsIcon: React.FC = () => <Settings size={ICON_SIZE} />;
export const HelpIcon: React.FC = () => <Help size={ICON_SIZE} />;
export const AccountCircleIcon: React.FC = () => <AccountCircle size={ICON_SIZE} />;
export const NotificationsIcon: React.FC = () => <Notifications size={ICON_SIZE} />;
export const SearchIcon: React.FC = () => <Search size={ICON_SIZE} />;
export const FilterListIcon: React.FC = () => <FilterList size={ICON_SIZE} />;
export const MoreVertIcon: React.FC = () => <MoreVert size={ICON_SIZE} />;

// Theme icons
export const LightModeIcon: React.FC = () => <LightMode size={ICON_SIZE} />;
export const DarkModeIcon: React.FC = () => <DarkMode size={ICON_SIZE} />;
export const FullscreenIcon: React.FC = () => <Fullscreen size={ICON_SIZE} />;
export const FullscreenExitIcon: React.FC = () => <FullscreenExit size={ICON_SIZE} />;

// Action icons
export const PlayArrowIcon: React.FC = () => <PlayArrow size={ICON_SIZE} />;
export const PauseIcon: React.FC = () => <Pause size={ICON_SIZE} />;
export const StopIcon: React.FC = () => <Stop size={ICON_SIZE} />;
export const DownloadIcon: React.FC = () => <Download size={ICON_SIZE} />;
export const UploadIcon: React.FC = () => <Upload size={ICON_SIZE} />;
export const SaveIcon: React.FC = () => <Save size={ICON_SIZE} />;
export const EditIcon: React.FC = () => <Edit size={ICON_SIZE} />;
export const DeleteIcon: React.FC = () => <Delete size={ICON_SIZE} />;
export const AddIcon: React.FC = () => <Add size={ICON_SIZE} />;
export const RemoveIcon: React.FC = () => <Remove size={ICON_SIZE} />;

// Status icons
export const CheckCircleIcon: React.FC = () => <CheckCircle size={ICON_SIZE} />;
export const ErrorIcon: React.FC = () => <Error size={ICON_SIZE} />;
export const WarningIcon: React.FC = () => <Warning size={ICON_SIZE} />;
export const InfoIcon: React.FC = () => <Info size={ICON_SIZE} />;
export const CircularProgressIcon: React.FC = () => <CircularProgress size={ICON_SIZE} />;

// Navigation icons
export const ArrowBackIcon: React.FC = () => <ArrowBack size={ICON_SIZE} />;
export const ArrowForwardIcon: React.FC = () => <ArrowForward size={ICON_SIZE} />;
export const ArrowUpwardIcon: React.FC = () => <ArrowUpward size={ICON_SIZE} />;
export const ArrowDownwardIcon: React.FC = () => <ArrowDownward size={ICON_SIZE} />;
export const RefreshIcon: React.FC = () => <Refresh size={ICON_SIZE} />;

// Social icons
export const GitHub: React.FC = () => <Github size={ICON_SIZE} />;
export const TwitterIcon: React.FC = () => <Twitter size={ICON_SIZE} />;
export const LinkedInIcon: React.FC = () => <Linkedin size={ICON_SIZE} />;
export const EmailIcon: React.FC = () => <Email size={ICON_SIZE} />;

// Chart icons
export const TrendingUpIcon: React.FC = () => <TrendingUp size={ICON_SIZE} />;
export const TrendingDownIcon: React.FC = () => <TrendingDown size={ICON_SIZE} />;
export const TimelineIcon: React.FC = () => <Timeline size={ICON_SIZE} />;
export const BarChartIcon: React.FC = () => <BarChart3 size={ICON_SIZE} />;
export const PieChartIcon: React.FC = () => <PieChart size={ICON_SIZE} />;
export const DonutLargeIcon: React.FC = () => <DonutLarge size={ICON_SIZE} />;

// File icons
export const FolderIcon: React.FC = () => <Folder size={ICON_SIZE} />;
export const InsertDriveFileIcon: React.FC = () => <InsertDriveFile size={ICON_SIZE} />;
export const DescriptionIcon: React.FC = () => <Description size={ICON_SIZE} />;
export const ImageIcon: React.FC = () => <Image size={ICON_SIZE} />;
export const AudioFileIcon: React.FC = () => <AudioFile size={ICON_SIZE} />;
export const VideoFileIcon: React.FC = () => <VideoFile size={ICON_SIZE} />;

// Audio-specific icons
export const VolumeUpIcon: React.FC = () => <Volume2 size={ICON_SIZE} />;

// Additional icons for dashboard
export const ZapIcon: React.FC = () => <Zap size={ICON_SIZE} />;
export const HeartIcon: React.FC = () => <Heart size={ICON_SIZE} />;
export const SpeedIcon: React.FC = () => <Speed size={ICON_SIZE} />;
export const MinusIcon: React.FC = () => <Minus size={ICON_SIZE} />;
export const PeopleIcon: React.FC = () => <People size={ICON_SIZE} />;
export const EmojiEmotionsIcon: React.FC = () => <EmojiEmotions size={ICON_SIZE} />;
export const AutoAwesomeIcon: React.FC = () => <AutoAwesome size={ICON_SIZE} />;
export const MessageOutlinedIcon: React.FC = () => <MessageOutlined size={ICON_SIZE} />;
export const SentimentVeryDissatisfiedIcon: React.FC = () => <SentimentVeryDissatisfied size={ICON_SIZE} />;
export const SentimentDissatisfiedIcon: React.FC = () => <SentimentVeryDissatisfied size={ICON_SIZE} />;
export const SentimentNeutralIcon: React.FC = () => <SentimentNeutral size={ICON_SIZE} />;
export const ChatBubbleOutlineIcon: React.FC = () => <ChatBubbleOutline size={ICON_SIZE} />;
export const CloudUploadIcon: React.FC = () => <CloudUpload size={ICON_SIZE} />;
export const SendIcon: React.FC = () => <Send size={ICON_SIZE} />;

export const TextSnippetIcon: React.FC = () => <TextSnippet size={ICON_SIZE} />;
export const MoodIcon: React.FC = () => <EmojiEmotions size={ICON_SIZE} />;

// Additional missing icons for ChatTab
export const MessageCircleIcon: React.FC = () => <Chat size={ICON_SIZE} />;
export const SmileIcon: React.FC = () => <Smile size={ICON_SIZE} />;
export const FrownIcon: React.FC = () => <Frown size={ICON_SIZE} />;
export const BarChart3Icon: React.FC = () => <BarChart3 size={ICON_SIZE} />;
export const EyeIcon: React.FC = () => <Eye size={ICON_SIZE} />;


export const StarIcon: React.FC = () => <Star size={ICON_SIZE} />;
export const CelebrationIcon: React.FC = () => <Celebration size={ICON_SIZE} />;
export const TimerIcon: React.FC = () => <Timer size={ICON_SIZE} />;
export const PersonIcon: React.FC = () => <Person size={ICON_SIZE} />;
export const InsightsIcon: React.FC = () => <Insights size={ICON_SIZE} />;

// Additional icons for Enhanced Burnout Survey
export const WorkIcon: React.FC = () => <Settings size={ICON_SIZE} />; // Using Settings as Work icon
export const PsychologyIcon: React.FC = () => <Timeline size={ICON_SIZE} />; // Using Timeline as Psychology icon
export const AssessmentIcon: React.FC = () => <BarChart3 size={ICON_SIZE} />; // Using BarChart3 as Assessment icon
export const RestartAltIcon: React.FC = () => <Refresh size={ICON_SIZE} />; // Using Refresh as RestartAlt icon
export const LightbulbIcon: React.FC = () => <Zap size={ICON_SIZE} />; // Using Zap as Lightbulb icon
export const BusinessIcon: React.FC = () => <Folder size={ICON_SIZE} />; // Using Folder as Business icon
export const ScaleIcon: React.FC = () => <BarChart3 size={ICON_SIZE} />; // Using BarChart3 as Scale icon
export const ScheduleIcon: React.FC = () => <Timer size={ICON_SIZE} />; // Using Timer as Schedule icon

// Utility function to get icon by name (returns React component)
export const getIcon = (iconName: string): React.FC => {
  const iconMap: Record<string, React.FC> = {
    menu: MenuIcon,
    close: CloseIcon,
    home: HomeIcon,
    dashboard: DashboardIcon,
    analytics: AnalyticsIcon,
    videoCall: VideoCallIcon,
    mic: MicIcon,
    chat: ChatIcon,
    assignment: AssignmentIcon,
    settings: SettingsIcon,
    help: HelpIcon,
    account: AccountCircleIcon,
    notifications: NotificationsIcon,
    search: SearchIcon,
    filter: FilterListIcon,
    more: MoreVertIcon,
    lightMode: LightModeIcon,
    darkMode: DarkModeIcon,
    play: PlayArrowIcon,
    pause: PauseIcon,
    stop: StopIcon,
    download: DownloadIcon,
    upload: UploadIcon,
    save: SaveIcon,
    edit: EditIcon,
    delete: DeleteIcon,
    add: AddIcon,
    remove: RemoveIcon,
    check: CheckCircleIcon,
    error: ErrorIcon,
    warning: WarningIcon,
    info: InfoIcon,
    loading: CircularProgressIcon,
    back: ArrowBackIcon,
    forward: ArrowForwardIcon,
    up: ArrowUpwardIcon,
    down: ArrowDownwardIcon,
    refresh: RefreshIcon,
    github: GitHub,
    twitter: TwitterIcon,
    linkedin: LinkedInIcon,
    email: EmailIcon,
    trendingUp: TrendingUpIcon,
    trendingDown: TrendingDownIcon,
    timeline: TimelineIcon,
    barChart: BarChartIcon,
    pieChart: PieChartIcon,
    donut: DonutLargeIcon,
    folder: FolderIcon,
    file: InsertDriveFileIcon,
    document: DescriptionIcon,
    image: ImageIcon,
    audio: AudioFileIcon,
    videoFile: VideoFileIcon,
  };

  return iconMap[iconName] || InfoIcon;
}; 

export { Menu };
