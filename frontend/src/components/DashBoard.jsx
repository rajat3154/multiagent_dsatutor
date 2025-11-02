import React, { useState, useEffect, useContext, useRef } from "react";
import {
  Trophy,
  BookOpen,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  Star,
  Award,
  Zap,
  Users,
  BarChart3,
  PieChart,
  Activity,
  ChevronRight,
  Bookmark,
  Code2,
  GraduationCap,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  Crown,
  Flame,
  Target as TargetIcon,
  Brain,
  Rocket,
  Sparkles,
  Shield,
  Lightbulb,
  Gem,
  Download,
  Filter,
  MoreHorizontal,
  Play,
  Pause,
  RotateCcw,
  Menu,
  X,
} from "lucide-react";
import Navbar from "@/shared/Navbar";
import { UserContext } from "@/contexts/UserContext";

// Line Chart Component
const LineChart = ({ data, height = 200, color = "text-blue-400" }) => {
  const validData = data && Array.isArray(data) ? data : [];
  const maxValue = Math.max(...validData.map(d => d.value || 0), 1);
  const minValue = Math.min(...validData.map(d => d.value || 0), 0);
  
  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
        <div className="text-center text-gray-500">
          <TrendingUp className="w-6 h-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  const getStrokeColor = () => {
    switch (color) {
      case "text-green-400": return "#34D399";
      case "text-blue-400": return "#60A5FA";
      case "text-purple-400": return "#A78BFA";
      case "text-orange-400": return "#FB923C";
      default: return "#60A5FA";
    }
  };

  // Calculate SVG path for the line
  const getPathData = () => {
    const points = validData.map((point, index) => {
      const x = (index / (validData.length - 1)) * 100;
      const y = 100 - ((point.value - minValue) / (maxValue - minValue)) * 100;
      return `${x},${y}`;
    });
    return `M ${points.join(" L ")}`;
  };

  // Calculate area under the line
  const getAreaData = () => {
    const points = validData.map((point, index) => {
      const x = (index / (validData.length - 1)) * 100;
      const y = 100 - ((point.value - minValue) / (maxValue - minValue)) * 100;
      return `${x},${y}`;
    });
    return `M ${points.join(" L ")} L 100,100 L 0,100 Z`;
  };

  return (
    <div className="relative" style={{ height: `${height}px` }}>
      <svg width="100%" height="100%" className="overflow-visible">
        {/* Gradient area under line */}
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={getStrokeColor()} stopOpacity="0.3" />
            <stop offset="100%" stopColor={getStrokeColor()} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Area */}
        <path
          d={getAreaData()}
          fill={`url(#gradient-${color})`}
          className="transition-all duration-1000 ease-out"
        />
        
        {/* Line */}
        <path
          d={getPathData()}
          fill="none"
          stroke={getStrokeColor()}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-1000 ease-out"
        />
        
        {/* Points */}
        {validData.map((point, index) => {
          const x = (index / (validData.length - 1)) * 100;
          const y = 100 - ((point.value - minValue) / (maxValue - minValue)) * 100;
          return (
            <circle
              key={index}
              cx={`${x}%`}
              cy={`${y}%`}
              r="2"
              fill={getStrokeColor()}
              className="transition-all duration-1000 ease-out"
            />
          );
        })}
      </svg>
      
      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
        {validData.length > 0 && (
          <>
            <span className="text-xs">{validData[0].label || ''}</span>
            <span className="text-xs">{validData[Math.floor(validData.length / 2)].label || ''}</span>
            <span className="text-xs">{validData[validData.length - 1].label || ''}</span>
          </>
        )}
      </div>
    </div>
  );
};

// Progress Chart (Bar Chart) - Mobile Optimized
const ProgressChart = ({ data, height = 120 }) => {
  const validData = data && Array.isArray(data) ? data : [];
  const maxActivity = Math.max(...validData.map(d => d.activity || 0), 1);
  
  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
        <div className="text-center text-gray-500">
          <Calendar className="w-6 h-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No activity data</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-end justify-between gap-0.5" style={{ height: `${height}px` }}>
      {validData.map((day, index) => (
        <div key={index} className="flex-1 flex flex-col items-center group relative min-w-0">
          <div
            className="w-full bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t transition-all duration-500 ease-out hover:from-blue-400 hover:to-cyan-400 cursor-pointer"
            style={{ 
              height: `${Math.min(((day.activity || 0) / maxActivity) * 100, 100)}%`,
              minHeight: '3px'
            }}
          ></div>
          <div className="text-[10px] text-gray-500 mt-1">
            {day.date ? new Date(day.date).getDate() : '?'}
          </div>
          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs z-10 min-w-28">
            <div className="font-medium text-white text-xs">
              {day.date ? new Date(day.date).toLocaleDateString() : 'Unknown date'}
            </div>
            <div className="text-blue-400 text-xs">{day.activity || 0} activities</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const DonutChart = ({ percentage, color = "text-green-400", size = 120, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className={`${color} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xl md:text-2xl font-bold ${color}`}>
          {typeof percentage === 'number' ? percentage.toFixed(2) : '0.00'}%
        </span>
      </div>
    </div>
  );
};

const RadialProgress = ({ percentage, label, color = "text-blue-400", size = 80 }) => {
  const radius = (size - 6) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            className="text-gray-700"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className={`${color} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">
            {typeof percentage === 'number' ? percentage.toFixed(2) : '0.00'}%
          </span>
        </div>
      </div>
      <span className="text-xs text-gray-400 mt-2 text-center px-1">{label}</span>
    </div>
  );
};

const DifficultyBarChart = ({ distribution }) => {
  const difficulties = ['easy', 'medium', 'hard'];
  const colors = {
    easy: 'from-green-400 to-emerald-400',
    medium: 'from-yellow-400 to-amber-400',
    hard: 'from-red-400 to-pink-400'
  };

  const maxCount = Math.max(...Object.values(distribution || {}).map(d => d.count || 0), 1);

  return (
    <div className="space-y-3">
      {difficulties.map(difficulty => {
        const data = (distribution && distribution[difficulty]) || { count: 0, percentage: 0 };
        return (
          <div key={difficulty} className="flex items-center space-x-2">
            <div className="w-12 text-xs text-gray-300 capitalize">{difficulty}</div>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{data.count || 0} problems</span>
                <span className="text-gray-400">
                  {typeof data.percentage === 'number' ? data.percentage.toFixed(2) : '0.00'}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${colors[difficulty]} transition-all duration-1000 ease-out`}
                  style={{ width: `${((data.count || 0) / maxCount) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ScoreDistributionChart = ({ distribution }) => {
  const ranges = [
    { range: '90-100', color: 'from-green-400 to-emerald-400', label: 'Excellent' },
    { range: '80-89', color: 'from-blue-400 to-cyan-400', label: 'Great' },
    { range: '70-79', color: 'from-purple-400 to-pink-400', label: 'Good' },
    { range: '60-69', color: 'from-yellow-400 to-orange-400', label: 'Average' },
    { range: '0-59', color: 'from-red-400 to-pink-400', label: 'Needs Work' }
  ];

  const total = Object.values(distribution || {}).reduce((sum, count) => sum + (count || 0), 0) || 1;

  return (
    <div className="space-y-3">
      {ranges.map(({ range, color, label }) => {
        const count = (distribution && distribution[range]) || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        
        return (
          <div key={range} className="flex items-center space-x-2">
            <div className="w-12 text-xs text-gray-300">{range}</div>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{count} quizzes</span>
                <span className="text-gray-400">{percentage.toFixed(2)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${color} transition-all duration-1000 ease-out`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AnimatedCounter = ({ value, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let start = 0;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration, isVisible]);

  return <span ref={ref}>{count}</span>;
};

// Compact Recent Activity Component
const CompactActivityItem = ({ activity, index }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case "concept":
        return <BookOpen className="w-3 h-3 text-blue-400" />;
      case "problem":
        return <Code2 className="w-3 h-3 text-green-400" />;
      case "quiz":
        return <Target className="w-3 h-3 text-purple-400" />;
      case "learning_path":
        return <GraduationCap className="w-3 h-3 text-orange-400" />;
      default:
        return <Activity className="w-3 h-3 text-gray-400" />;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center space-x-3 py-2 px-2 hover:bg-gray-800/30 rounded-lg transition-colors group">
      <div className="flex-shrink-0">
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{activity.description}</p>
        <p className="text-gray-400 text-xs">{formatTime(activity.timestamp)}</p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useContext(UserContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("30d");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const getAuthToken = () => {
    return localStorage.getItem("token");
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      if (!token) {
        throw new Error("Please log in to view dashboard");
      }

      const response = await fetch(`${API_URL}/api/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.isLoggedIn) {
      fetchDashboardData();
    }
  }, [user.isLoggedIn]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-black text-white">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading your analytics dashboard...</p>
                <p className="text-gray-500 text-sm mt-2">Crunching the numbers</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-black text-white">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="bg-red-900/20 border border-red-800/50 rounded-2xl p-6 text-center">
              <XCircle className="w-12 h-12 md:w-16 md:h-16 text-red-400 mx-auto mb-4" />
              <div className="text-red-400 text-lg font-medium mb-2">Error Loading Dashboard</div>
              <p className="text-gray-400 mb-4 text-sm">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors text-sm"
              >
                <RotateCcw className="w-4 h-4 inline mr-2" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const {
    user_stats,
    learning_stats,
    problem_stats,
    quiz_stats,
    recent_activity,
    progress_overview,
  } = dashboardData;

  const calculateSkillProgress = () => {
    const points = user_stats.total_points || 0;
    if (points > 500) return 100;
    if (points > 200) return Math.min(((points - 200) / 300) * 100, 100);
    if (points > 50) return Math.min(((points - 50) / 150) * 100, 100);
    return Math.min((points / 50) * 100, 100);
  };

  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'advanced':
        return 'from-purple-500 to-pink-500 text-purple-400';
      case 'intermediate':
        return 'from-blue-500 to-cyan-500 text-blue-400';
      case 'beginner+':
        return 'from-green-500 to-emerald-500 text-green-400';
      default:
        return 'from-gray-500 to-gray-600 text-gray-400';
    }
  };

  // Sample data for line charts
  const performanceData = [
    { label: 'W1', value: 65 },
    { label: 'W2', value: 72 },
    { label: 'W3', value: 68 },
    { label: 'W4', value: 85 },
    { label: 'W5', value: 78 },
    { label: 'W6', value: 92 },
    { label: 'W7', value: 88 },
  ];

  const progressData = [
    { label: 'Jan', value: 20 },
    { label: 'Feb', value: 35 },
    { label: 'Mar', value: 45 },
    { label: 'Apr', value: 60 },
    { label: 'May', value: 75 },
    { label: 'Jun', value: 85 },
    { label: 'Jul', value: 95 },
  ];

  // Ensure we have data for the chart
  const chartData = progress_overview?.daily_activity || Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
    activity: Math.floor(Math.random() * 10)
  }));

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black  text-white">
        {/* Header */}
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="flex items-center justify-between w-full lg:w-auto mb-4 lg:mb-0">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={user_stats.profilephoto || "/default-avatar.png"}
                    alt={user_stats.name}
                    className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-blue-500/50 object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full p-1 border-2 border-gray-900">
                    <Crown className="w-2 h-2 md:w-3 md:h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Analytics
                  </h1>
                  <p className="text-gray-400 flex items-center space-x-1 md:space-x-2 mt-0.5 text-sm">
                    <span>Welcome, {user_stats.name?.split(' ')[0]}</span>
                    <span>•</span>
                    <span className={`bg-gradient-to-r ${getLevelColor(user_stats.skill_level)} bg-clip-text text-transparent font-medium text-xs md:text-sm`}>
                      {user_stats.skill_level}
                    </span>
                  </p>
                </div>
              </div>
              
              {/* Mobile Menu Button */}
              <button 
                className="lg:hidden p-2 rounded-lg border border-gray-700/50 bg-gray-800/50 text-gray-400 hover:text-white transition-all"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Action Buttons - Hidden on mobile, visible on desktop */}
            <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} lg:flex items-center space-x-2 justify-end mt-4 lg:mt-0`}>
              <button className="p-2 rounded-lg border border-gray-700/50 bg-gray-800/50 text-gray-400 hover:text-white transition-all text-sm">
                <Filter className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              
              <button className="p-2 rounded-lg border border-gray-700/50 bg-gray-800/50 text-gray-400 hover:text-white transition-all text-sm">
                <Download className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>

          {/* Key Performance Indicators - Mobile Optimized */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl md:rounded-2xl p-4 md:p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
              </div>
              <div className="text-xl md:text-3xl font-bold text-white mb-1">
                <AnimatedCounter value={learning_stats.total_concepts} />
              </div>
              <div className="text-blue-300 text-xs md:text-sm">Concepts</div>
              <div className="text-xs text-blue-400/70 mt-0.5 hidden md:block">Knowledge Foundation</div>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/20 rounded-xl md:rounded-2xl p-4 md:p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <Code2 className="w-6 h-6 md:w-8 md:h-8 text-green-400" />
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
              </div>
              <div className="text-xl md:text-3xl font-bold text-white mb-1">
                <AnimatedCounter value={problem_stats.solved_count} />
              </div>
              <div className="text-green-300 text-xs md:text-sm">Solved</div>
              <div className="text-xs text-green-400/70 mt-0.5 hidden md:block">Problems Solved</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 border border-purple-500/20 rounded-xl md:rounded-2xl p-4 md:p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <Target className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
              </div>
              <div className="text-xl md:text-3xl font-bold text-white mb-1">
                <AnimatedCounter value={quiz_stats.total_attempts} />
              </div>
              <div className="text-purple-300 text-xs md:text-sm">Quizzes</div>
              <div className="text-xs text-purple-400/70 mt-0.5 hidden md:block">Completed</div>
            </div>

            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-xl md:rounded-2xl p-4 md:p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <Award className="w-6 h-6 md:w-8 md:h-8 text-cyan-400" />
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
              </div>
              <div className="text-xl md:text-3xl font-bold text-white mb-1">
                <AnimatedCounter value={user_stats.total_points} />
              </div>
              <div className="text-cyan-300 text-xs md:text-sm">XP</div>
              <div className="text-xs text-cyan-400/70 mt-0.5 hidden md:block">Total Points</div>
            </div>
          </div>

          {/* Main Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Learning Activity & Consistency */}
            <div className="lg:col-span-2 bg-black/40 border border-gray-700/50 rounded-xl md:rounded-2xl p-4 md:p-6 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-bold flex items-center mb-2 sm:mb-0">
                  <Activity className="w-5 h-5 md:w-6 md:h-6 text-blue-400 mr-2 md:mr-3" />
                  Learning Activity
                </h2>
                <div className="flex space-x-1 md:space-x-2">
                  {["7d", "30d", "90d"].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-2 py-1 md:px-3 md:py-1 rounded-lg text-xs md:text-sm font-medium transition-all ${
                        timeRange === range
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                          : "bg-gray-800/50 text-gray-400 hover:text-white"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Progress Chart */}
              <div className="mb-4 md:mb-6">
                <ProgressChart 
                  data={timeRange === "7d" ? chartData.slice(-7) : 
                        timeRange === "30d" ? chartData.slice(-14) : 
                        chartData.slice(-14)} 
                  height={120}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                <div className="text-center p-3 md:p-4 bg-gray-800/30 rounded-lg md:rounded-xl border border-gray-700/50">
                  <div className="text-lg md:text-2xl font-bold text-green-400 flex items-center justify-center">
                    <Flame className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                    {learning_stats.current_streak || 0}
                  </div>
                  <div className="text-gray-400 text-xs md:text-sm">Current Streak</div>
                </div>
                <div className="text-center p-3 md:p-4 bg-gray-800/30 rounded-lg md:rounded-xl border border-gray-700/50">
                  <div className="text-lg md:text-2xl font-bold text-purple-400">
                    {learning_stats.max_streak || 0}
                  </div>
                  <div className="text-gray-400 text-xs md:text-sm">Max Streak</div>
                </div>
                <div className="text-center p-3 md:p-4 bg-gray-800/30 rounded-lg md:rounded-xl border border-gray-700/50">
                  <div className="text-lg md:text-2xl font-bold text-blue-400">
                    {typeof learning_stats.consistency_rate === 'number' ? learning_stats.consistency_rate.toFixed(2) : '0.00'}%
                  </div>
                  <div className="text-gray-400 text-xs md:text-sm">Consistency</div>
                </div>
              </div>
            </div>

            {/* Skill Progress Overview */}
            <div className="bg-black/40 border border-gray-700/50 rounded-xl md:rounded-2xl p-4 md:p-6 backdrop-blur-sm">
              <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-400 mr-2 md:mr-3" />
                Skill Progress
              </h2>
              <div className="flex flex-col items-center mb-4 md:mb-6">
                <DonutChart 
                  percentage={calculateSkillProgress()} 
                  color="text-green-400"
                  size={100}
                />
                <div className="text-center mt-3 md:mt-4">
                  <div className="text-lg md:text-2xl font-bold text-white">{user_stats.skill_level}</div>
                  <div className="text-gray-400 text-sm">{user_stats.total_points} XP</div>
                  <div className="text-xs text-green-400/70 mt-1 hidden md:block">Overall Mastery Level</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                <RadialProgress 
                  percentage={learning_stats.consistency_rate || 0} 
                  label="Learning"
                  color="text-blue-400"
                  size={60}
                />
                <RadialProgress 
                  percentage={problem_stats.success_rate || 0} 
                  label="Problems"
                  color="text-green-400"
                  size={60}
                />
                <RadialProgress 
                  percentage={quiz_stats.success_rate || 0} 
                  label="Quizzes"
                  color="text-purple-400"
                  size={60}
                />
              </div>
            </div>
          </div>

          {/* Performance Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Performance Trend */}
            <div className="bg-black/40 border border-gray-700/50 rounded-xl md:rounded-2xl p-4 md:p-6 backdrop-blur-sm">
              <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-400 mr-2 md:mr-3" />
                Performance Trend
              </h2>
              <LineChart 
                data={performanceData} 
                height={160}
                color="text-green-400"
              />
              <div className="mt-3 md:mt-4 text-center">
                <div className="text-lg md:text-2xl font-bold text-green-400">
                  {typeof quiz_stats.average_score === 'number' ? quiz_stats.average_score.toFixed(2) : '0.00'}%
                </div>
                <div className="text-gray-400 text-sm">Average Score</div>
              </div>
            </div>

            {/* Progress Over Time */}
            <div className="bg-black/40 border border-gray-700/50 rounded-xl md:rounded-2xl p-4 md:p-6 backdrop-blur-sm">
              <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center">
                <Activity className="w-5 h-5 md:w-6 md:h-6 text-blue-400 mr-2 md:mr-3" />
                Progress Over Time
              </h2>
              <LineChart 
                data={progressData} 
                height={160}
                color="text-blue-400"
              />
              <div className="mt-3 md:mt-4 text-center">
                <div className="text-lg md:text-2xl font-bold text-blue-400">
                  {calculateSkillProgress().toFixed(2)}%
                </div>
                <div className="text-gray-400 text-sm">Skill Progress</div>
              </div>
            </div>
          </div>

          {/* Detailed Performance Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Problem Solving Analytics */}
            <div className="bg-black/40 border border-gray-700/50 rounded-xl md:rounded-2xl p-4 md:p-6 backdrop-blur-sm">
              <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center">
                <Code2 className="w-5 h-5 md:w-6 md:h-6 text-green-400 mr-2 md:mr-3" />
                Problem Solving
              </h2>
              <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
                <div className="text-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                  <div className="text-lg md:text-2xl font-bold text-green-400">{problem_stats.solved_count || 0}</div>
                  <div className="text-green-300 text-xs md:text-sm">Solved</div>
                </div>
                <div className="text-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                  <div className="text-lg md:text-2xl font-bold text-yellow-400">{problem_stats.saved_count || 0}</div>
                  <div className="text-yellow-300 text-xs md:text-sm">Saved</div>
                </div>
                <div className="text-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                  <div className="text-lg md:text-2xl font-bold text-blue-400">
                    {typeof problem_stats.success_rate === 'number' ? problem_stats.success_rate.toFixed(2) : '0.00'}%
                  </div>
                  <div className="text-blue-300 text-xs md:text-sm">Success</div>
                </div>
              </div>
              <div className="mb-3 md:mb-4">
                <h3 className="text-md md:text-lg font-semibold text-gray-300 mb-2 md:mb-3">Difficulty</h3>
                <DifficultyBarChart distribution={problem_stats.difficulty_distribution} />
              </div>
            </div>

            {/* Quiz Performance Analytics */}
            <div className="bg-black/40 border border-gray-700/50 rounded-xl md:rounded-2xl p-4 md:p-6 backdrop-blur-sm">
              <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center">
                <Target className="w-5 h-5 md:w-6 md:h-6 text-purple-400 mr-2 md:mr-3" />
                Quiz Performance
              </h2>
              <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
                <div className="text-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                  <div className="text-lg md:text-2xl font-bold text-purple-400">
                    {typeof quiz_stats.average_score === 'number' ? quiz_stats.average_score.toFixed(2) : '0.00'}%
                  </div>
                  <div className="text-purple-300 text-xs md:text-sm">Avg Score</div>
                </div>
                <div className="text-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                  <div className="text-lg md:text-2xl font-bold text-blue-400">{quiz_stats.passed_quizzes || 0}</div>
                  <div className="text-blue-300 text-xs md:text-sm">Passed</div>
                </div>
                <div className="text-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                  <div className="text-lg md:text-2xl font-bold text-green-400">
                    {typeof quiz_stats.success_rate === 'number' ? quiz_stats.success_rate.toFixed(2) : '0.00'}%
                  </div>
                  <div className="text-green-300 text-xs md:text-sm">Success</div>
                </div>
              </div>
              <div className="mb-3 md:mb-4">
                <h3 className="text-md md:text-lg font-semibold text-gray-300 mb-2 md:mb-3">Score Distribution</h3>
                <ScoreDistributionChart distribution={quiz_stats.score_distribution} />
              </div>
            </div>
          </div>

          {/* Bottom Section with Learning Progress and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Learning Progress Details */}
            <div className="lg:col-span-2 bg-black/40 border border-gray-700/50 rounded-xl md:rounded-2xl p-4 md:p-6 backdrop-blur-sm">
              <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center">
                <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-blue-400 mr-2 md:mr-3" />
                Learning Progress
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <div className="text-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                  <div className="text-lg md:text-2xl font-bold text-blue-400">{learning_stats.total_concepts || 0}</div>
                  <div className="text-blue-300 text-xs md:text-sm">Concepts</div>
                  <div className="text-xs text-gray-500 mt-0.5 hidden md:block">Mastered</div>
                </div>
                <div className="text-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                  <div className="text-lg md:text-2xl font-bold text-cyan-400">{learning_stats.total_learning_paths || 0}</div>
                  <div className="text-cyan-300 text-xs md:text-sm">Paths</div>
                  <div className="text-xs text-gray-500 mt-0.5 hidden md:block">Completed</div>
                </div>
                <div className="text-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                  <div className="text-lg md:text-2xl font-bold text-green-400">{learning_stats.active_days || 0}</div>
                  <div className="text-green-300 text-xs md:text-sm">Active Days</div>
                  <div className="text-xs text-gray-500 mt-0.5 hidden md:block">This Month</div>
                </div>
              </div>
              
              <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg md:rounded-xl">
                <h3 className="font-semibold text-white mb-1 md:mb-2 text-sm md:text-base">Learning Insights</h3>
                <p className="text-gray-300 text-xs md:text-sm">
                  You're maintaining a {typeof learning_stats.consistency_rate === 'number' ? learning_stats.consistency_rate.toFixed(2) : '0.00'}% consistency rate. 
                  {learning_stats.current_streak > 7 ? " Great job on your learning streak!" : " Keep building your learning habit!"}
                </p>
              </div>
            </div>

            {/* Compact Recent Activity */}
            <div className="bg-black/40 border border-gray-700/50 rounded-xl md:rounded-2xl p-4 md:p-6 backdrop-blur-sm">
              <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 md:w-6 md:h-6 text-blue-400 mr-2 md:mr-3" />
                  Recent Activity
                </div>
                <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                  Last 7 days
                </span>
              </h2>
              <div className="space-y-1 max-h-60 md:max-h-80 overflow-y-auto">
                {recent_activity && recent_activity.length > 0 ? (
                  recent_activity.slice(0, 6).map((activity, index) => (
                    <CompactActivityItem 
                      key={index} 
                      activity={activity} 
                      index={index} 
                    />
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <Activity className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </div>
              {recent_activity && recent_activity.length > 6 && (
                <div className="mt-3 text-center">
                  <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    View all activities →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;