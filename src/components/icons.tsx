import React from 'react';
import {
  Play,
  Pause,
  Flag,
  Trash2,
  ZoomIn,
  ZoomOut,
  Volume2,
  Settings,
  User,
  Plus,
  Sparkles,
  CircleHelp,
  FileText,
  X as XIconLucide,
  Search,
  Loader2,
} from 'lucide-react';

export const PlayIcon: React.FC = () => <Play className="w-6 h-6" />;
export const PauseIcon: React.FC = () => <Pause className="w-6 h-6" />;
export const MarkerIcon: React.FC = () => <Flag className="w-6 h-6" />;
export const TrashIcon: React.FC = () => <Trash2 className="w-5 h-5" />;
export const ZoomInIcon: React.FC = () => <ZoomIn className="w-6 h-6" />;
export const ZoomOutIcon: React.FC = () => <ZoomOut className="w-6 h-6" />;
export const VolumeIcon: React.FC = () => <Volume2 className="w-6 h-6" />;
export const SettingsIcon: React.FC = () => <Settings className="w-6 h-6" />;
export const UserIcon: React.FC = () => <User className="w-5 h-5" />;
export const PlusIcon: React.FC = () => <Plus className="w-5 h-5" />;
export const SparklesIcon: React.FC = () => <Sparkles className="w-5 h-5" />;
export const QuestionMarkIcon: React.FC = () => <CircleHelp className="w-4 h-4 text-gray-500 hover:text-gray-300" />;
export const LyricsIcon: React.FC = () => <FileText className="w-5 h-5" />;
export const XIcon: React.FC = () => <XIconLucide className="w-5 h-5" />;
export const SearchIcon: React.FC = () => <Search className="w-5 h-5" />;
export const SpinnerIcon: React.FC = () => <Loader2 className="h-5 w-5 animate-spin" />;
