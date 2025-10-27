import React, { useState, useEffect, useContext, useRef } from "react";
import {
  User,
  Settings,
  Bell,
  BookOpen,
  ChevronRight,
  Edit3,
  Search,
  Download,
  Calendar,
  Clock as ClockIcon,
  Target,
  Zap,
  Star,
  FileText,
  X,
  CheckCircle,
  Code,
  Mail,
  Menu,
  ArrowLeft,
  TrendingUp,
  Bookmark,
  Code2,
  Play,
  Lightbulb,
  AlertCircle,
  Trophy,
  Flag,
  Clock,
  ChevronUp,
  ChevronDown,
  BarChart3,
  Cpu,
  Copy,
  Check,
  BarChart,
  PieChart,
  Award,
  Calendar as CalendarIcon,
  Eye,
  Map,
  GraduationCap,
  CheckSquare,
  Target as TargetIcon,
  Book,
  Video,
  Link as LinkIcon,
  Trash2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import Navbar from "@/shared/Navbar";
import { UserContext } from "@/contexts/UserContext";

const Profile = () => {
  const { user } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState("learned-concepts");
  const [userData, setUserData] = useState(null);
  const [learnedConcepts, setLearnedConcepts] = useState([]);
  const [savedProblems, setSavedProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedSolvedProblem, setSelectedSolvedProblem] = useState(null);
  const [selectedQuizAttempt, setSelectedQuizAttempt] = useState(null);
  const [selectedLearningPath, setSelectedLearningPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConceptList, setShowConceptList] = useState(true);
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // Check mobile view on resize and initial load
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 1280);
      if (window.innerWidth < 1280) {
        setShowConceptList(
          !selectedItem && !selectedProblem && !selectedSolvedProblem && !selectedQuizAttempt && !selectedLearningPath
        );
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [selectedItem, selectedProblem, selectedSolvedProblem, selectedQuizAttempt, selectedLearningPath]);

  // Get token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem("token");
  };

  // Fetch user profile and data
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      if (!token) {
        throw new Error("Please log in to view your profile");
      }

      // Fetch user profile
      const profileResponse = await fetch(`${API_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error("Failed to fetch profile data");
      }

      const profileData = await profileResponse.json();
      setUserData(profileData);

      // Fetch learned concepts
      const conceptsResponse = await fetch(`${API_URL}/api/my-concepts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (conceptsResponse.ok) {
        const conceptsData = await conceptsResponse.json();
        setLearnedConcepts(conceptsData.concepts || []);
      }

      // Fetch saved problems
      await fetchSavedProblems(token);

      // Fetch solved problems
      await fetchSolvedProblems(token);

      // Fetch quiz attempts
      await fetchQuizAttempts(token);

      // Fetch learning paths
      await fetchLearningPaths(token);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLearningPaths = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/learning-paths`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLearningPaths(data.learning_paths || []);
      } else {
        console.error("Failed to fetch learning paths:", response.status);
        setLearningPaths([]);
      }
    } catch (err) {
      console.error("Error fetching learning paths:", err);
      setLearningPaths([]);
    }
  };

  const fetchSavedProblems = async (token) => {
    try {
      const profileResponse = await fetch(`${API_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const savedProblemIds = profileData.profile?.saved_problems || [];

        if (savedProblemIds.length > 0) {
          const problemsPromises = savedProblemIds.map(async (problemId) => {
            try {
              const response = await fetch(
                `${API_URL}/api/problem/${problemId}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                const problemData = await response.json();
                return {
                  ...problemData,
                  created_at:
                    problemData.created_at || new Date().toISOString(),
                };
              } else if (response.status === 404) {
                console.warn(`Problem ${problemId} not found, skipping`);
                return null;
              } else {
                console.warn(
                  `Failed to fetch problem ${problemId}: ${response.status}`
                );
                return null;
              }
            } catch (error) {
              console.error(`Error fetching problem ${problemId}:`, error);
              return null;
            }
          });

          const problems = await Promise.all(problemsPromises);
          const validProblems = problems.filter((problem) => problem !== null);
          setSavedProblems(validProblems);
        } else {
          setSavedProblems([]);
        }
      }
    } catch (err) {
      console.error("Error fetching saved problems:", err);
      setSavedProblems([]);
    }
  };

  const fetchSolvedProblems = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/solved-problems`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSolvedProblems(data.solved_problems || []);
      } else {
        console.error("Failed to fetch solved problems:", response.status);
        setSolvedProblems([]);
      }
    } catch (err) {
      console.error("Error fetching solved problems:", err);
      setSolvedProblems([]);
    }
  };

  const fetchQuizAttempts = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/quiz/attempts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQuizAttempts(data.attempts || []);
      } else {
        console.error("Failed to fetch quiz attempts:", response.status);
        setQuizAttempts([]);
      }
    } catch (err) {
      console.error("Error fetching quiz attempts:", err);
      setQuizAttempts([]);
    }
  };

  useEffect(() => {
    if (user.isLoggedIn) {
      fetchUserData();
    }
  }, [user.isLoggedIn]);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setSelectedProblem(null);
    setSelectedSolvedProblem(null);
    setSelectedQuizAttempt(null);
    setSelectedLearningPath(null);
    if (isMobileView) {
      setShowConceptList(false);
    }
  };

  const handleProblemClick = (problem) => {
    setSelectedProblem(problem);
    setSelectedItem(null);
    setSelectedSolvedProblem(null);
    setSelectedQuizAttempt(null);
    setSelectedLearningPath(null);
    if (isMobileView) {
      setShowConceptList(false);
    }
  };

  const handleSolvedProblemClick = (problem) => {
    setSelectedSolvedProblem(problem);
    setSelectedItem(null);
    setSelectedProblem(null);
    setSelectedQuizAttempt(null);
    setSelectedLearningPath(null);
    if (isMobileView) {
      setShowConceptList(false);
    }
  };

  const handleQuizAttemptClick = (attempt) => {
    setSelectedQuizAttempt(attempt);
    setSelectedItem(null);
    setSelectedProblem(null);
    setSelectedSolvedProblem(null);
    setSelectedLearningPath(null);
    if (isMobileView) {
      setShowConceptList(false);
    }
  };

  const handleLearningPathClick = (path) => {
    setSelectedLearningPath(path);
    setSelectedItem(null);
    setSelectedProblem(null);
    setSelectedSolvedProblem(null);
    setSelectedQuizAttempt(null);
    if (isMobileView) {
      setShowConceptList(false);
    }
  };

  const handleBackToList = () => {
    setShowConceptList(true);
    setSelectedItem(null);
    setSelectedProblem(null);
    setSelectedSolvedProblem(null);
    setSelectedQuizAttempt(null);
    setSelectedLearningPath(null);
  };

  const handleDownload = (item) => {
    const content =
      item.markdown_content || `# ${item.title}\n\n${item.content}`;
    const filename = `${item.title.toLowerCase().replace(/\s+/g, "-")}.md`;

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteLearningPath = async (pathId) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/learning-paths/${pathId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setLearningPaths(learningPaths.filter(path => path.id !== pathId));
        if (selectedLearningPath?.id === pathId) {
          setSelectedLearningPath(null);
        }
      } else {
        throw new Error("Failed to delete learning path");
      }
    } catch (err) {
      console.error("Error deleting learning path:", err);
      alert("Failed to delete learning path");
    }
  };

  const filteredItems = learnedConcepts.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProblems = savedProblems.filter(
    (problem) =>
      problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSolvedProblems = solvedProblems.filter(
    (problem) =>
      problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      problem.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredQuizAttempts = quizAttempts.filter(
    (attempt) =>
      attempt.quiz_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (attempt.quiz_data?.title && attempt.quiz_data.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredLearningPaths = learningPaths.filter(
    (path) =>
      path.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      path.level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate statistics
  const totalQuizzes = quizAttempts.length;
  const averageScore = totalQuizzes > 0 
    ? quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalQuizzes 
    : 0;
  const bestScore = totalQuizzes > 0 
    ? Math.max(...quizAttempts.map(attempt => attempt.score)) 
    : 0;
  const quizzesPassed = totalQuizzes > 0 
    ? quizAttempts.filter(attempt => attempt.score >= 70).length 
    : 0;

  const MarkdownRenderer = ({ content }) => {
    if (!content) return null;

    return (
      <div className="markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            h1: ({ node, ...props }) => (
              <h1
                className="text-2xl font-bold mt-6 mb-4 text-[var(--color-primary)]"
                {...props}
              />
            ),
            h2: ({ node, ...props }) => (
              <h2
                className="text-xl font-bold mt-6 mb-3 text-[var(--color-primary)]"
                {...props}
              />
            ),
            h3: ({ node, ...props }) => (
              <h3
                className="text-lg font-semibold mt-4 mb-2 text-[var(--color-primary)]"
                {...props}
              />
            ),
            p: ({ node, ...props }) => (
              <p className="mb-4 leading-relaxed text-base" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className="list-disc list-inside mb-4 space-y-1" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol
                className="list-decimal list-inside mb-4 space-y-1"
                {...props}
              />
            ),
            li: ({ node, ...props }) => <li className="ml-4" {...props} />,
            code: ({ node, inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <div className="my-4">
                  <div className="flex justify-between items-center bg-gray-800 px-4 py-2 text-sm text-gray-400 rounded-t-lg">
                    <span>{match[1]}</span>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(String(children))
                      }
                      className="hover:text-white transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                  <pre
                    className={`${className} overflow-x-auto p-4 bg-gray-900 text-sm rounded-b-lg`}
                    {...props}
                  >
                    <code className={className}>{children}</code>
                  </pre>
                </div>
              ) : (
                <code
                  className="bg-gray-800 px-1.5 py-0.5 rounded text-sm text-[var(--color-primary)]"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-4 border-[var(--color-primary)] pl-4 italic my-4 text-gray-400"
                {...props}
              />
            ),
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto my-4">
                <table
                  className="w-full border-collapse border border-gray-600 text-sm"
                  {...props}
                />
              </div>
            ),
            th: ({ node, ...props }) => (
              <th
                className="border border-gray-600 px-3 py-2 bg-gray-800 font-semibold text-left"
                {...props}
              />
            ),
            td: ({ node, ...props }) => (
              <td className="border border-gray-600 px-3 py-2" {...props} />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  // Problem Details Component
  const ProblemDetails = ({ problem }) => {
    const [copiedSections, setCopiedSections] = useState({});
    const [expandedSections, setExpandedSections] = useState({
      description: true,
      examples: true,
      constraints: true,
      starterCode: false,
      optimalSolution: false
    });

    if (!problem) {
      return (
        <div className="h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-lg">No problem selected</p>
            <p className="text-sm mt-2">Select a problem to view details</p>
          </div>
        </div>
      );
    }

    const copyToClipboard = async (text, section) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedSections(prev => ({ ...prev, [section]: true }));
        setTimeout(() => {
          setCopiedSections(prev => ({ ...prev, [section]: false }));
        }, 2000);
      } catch (error) {
        console.error('Failed to copy text:', error);
      }
    };

    const toggleSection = (section) => {
      setExpandedSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    };

    const highlightCode = (code, language = 'python') => {
      const keywords = {
        'python': ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from', 'as', 'with', 'in', 'is', 'and', 'or', 'not', 'True', 'False', 'None'],
        'javascript': ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'import', 'export', 'class', 'async', 'await', 'this'],
        'java': ['public', 'private', 'class', 'static', 'void', 'int', 'String', 'if', 'else', 'for', 'while', 'return', 'new']
      };

      const langKeywords = keywords[language?.toLowerCase()] || keywords.python;
      
      return code.split('\n').map((line, lineIndex) => (
        <div key={lineIndex} className="flex">
          <span className="text-gray-500 text-xs w-8 select-none mr-2 flex-shrink-0">
            {lineIndex + 1}
          </span>
          <span className="flex-1">
            {line.split(/(\s+)/).map((word, wordIndex) => {
              const cleanWord = word.trim();
              const isKeyword = langKeywords.includes(cleanWord);
              const isString = /^["'`]/.test(cleanWord) || /["'`]$/.test(cleanWord);
              const isNumber = /^\d+$/.test(cleanWord);
              const isComment = cleanWord.startsWith('#') || cleanWord.startsWith('//');

              let className = 'text-white';
              if (isKeyword) className = 'text-blue-400 font-medium';
              if (isString) className = 'text-green-400';
              if (isNumber) className = 'text-orange-400';
              if (isComment) className = 'text-gray-500';

              return (
                <span
                  key={wordIndex}
                  className={className}
                >
                  {word}
                </span>
              );
            })}
          </span>
        </div>
      ));
    };

    const problemStats = {
      acceptance: Math.floor(Math.random() * 30) + 60,
      frequency: Math.floor(Math.random() * 5) + 1,
      companies: ['Google', 'Amazon', 'Microsoft', 'Facebook', 'Apple'].slice(0, Math.floor(Math.random() * 3) + 1)
    };

    return (
      <div className="h-full overflow-y-auto custom-scrollbar pr-2">
        <div className="bg-black rounded-xl p-6 mb-6 border border-gray-700/50">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent flex-1">
                  {problem.title}
                </h1>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                  problem.difficulty === "easy"
                    ? "bg-green-500/20 text-green-300 border-green-500/40 shadow-lg shadow-green-500/10"
                    : problem.difficulty === "medium"
                    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40 shadow-lg shadow-yellow-500/10"
                    : "bg-red-500/20 text-red-300 border-red-500/40 shadow-lg shadow-red-500/10"
                }`}>
                  {problem.difficulty?.charAt(0).toUpperCase() + problem.difficulty?.slice(1)}
                </span>
                
                <span className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/40 shadow-lg shadow-blue-500/10 flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  {problem.data_structure || "Algorithm"}
                </span>

                <span className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/40 shadow-lg shadow-purple-500/10 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  {problemStats.acceptance}% Acceptance
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-950 rounded-lg p-3 text-center border border-gray-700/50">
                  <div className="text-blue-400 font-bold text-lg">{problemStats.frequency}/5</div>
                  <div className="text-gray-400 text-xs">Frequency</div>
                </div>
                <div className="bg-gray-950 rounded-lg p-3 text-center border border-gray-700/50">
                  <div className="text-green-400 font-bold text-lg">{problemStats.acceptance}%</div>
                  <div className="text-gray-400 text-xs">Acceptance</div>
                </div>
                <div className="bg-gray-950 rounded-lg p-3 text-center border border-gray-700/50">
                  <div className="text-orange-400 font-bold text-lg text-sm">
                    {problem.difficulty === 'easy' ? 'O(n)' : problem.difficulty === 'medium' ? 'O(n log n)' : 'O(n²)'}
                  </div>
                  <div className="text-gray-400 text-xs">Time</div>
                </div>
                <div className="bg-gray-950 rounded-lg p-3 text-center border border-gray-700/50">
                  <div className="text-purple-400 font-bold text-lg text-sm">
                    {problem.difficulty === 'easy' ? 'O(1)' : problem.difficulty === 'medium' ? 'O(n)' : 'O(n)'}
                  </div>
                  <div className="text-gray-400 text-xs">Space</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mb-6">
          <button
            onClick={() => window.open(`/coding-practice`, "_blank")}
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 transform duration-200"
          >
            <Play className="w-5 h-5 mr-2" />
            Solve This Problem
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-black rounded-xl border border-gray-700/50 overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
              onClick={() => toggleSection('description')}
            >
              <h3 className="text-lg font-bold flex items-center text-white">
                <BookOpen className="w-5 h-5 mr-3 text-[var(--color-primary)]" />
                Problem Description
              </h3>
              {expandedSections.description ? 
                <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                <ChevronDown className="w-5 h-5 text-gray-400" />
              }
            </div>
            {expandedSections.description && (
              <div className="p-4 pt-0">
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {problem.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {problem.examples && problem.examples.length > 0 && (
            <div className="bg-black rounded-xl border border-gray-700/50 overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
                onClick={() => toggleSection('examples')}
              >
                <h3 className="text-lg font-bold flex items-center text-white">
                  <FileText className="w-5 h-5 mr-3 text-[var(--color-primary)]" />
                  Examples ({problem.examples.length})
                </h3>
                {expandedSections.examples ? 
                  <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                }
              </div>
              {expandedSections.examples && (
                <div className="p-4 pt-0 space-y-4">
                  {problem.examples.map((example, idx) => (
                    <div
                      key={idx}
                      className="bg-black rounded-lg p-4 hover:border-gray-600 transition-colors"
                    >
                      <div className="mb-3">
                        <span className="text-sm font-semibold text-gray-300 bg-gray-800 px-3 py-1 rounded-full">
                          Example {idx + 1}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-sm text-gray-400 mb-2 flex items-center">
                            <FileText className="w-4 h-4 mr-1" />
                            Input
                          </div>
                          <div className="bg-gray-950 rounded p-3 font-mono text-sm text-white border border-gray-700">
                            {example.input}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-2 flex items-center">
                            <Check className="w-4 h-4 mr-1" />
                            Expected Output
                          </div>
                          <div className="bg-gray-950 rounded p-3 font-mono text-sm text-white border border-gray-700">
                            {example.expected_output}
                          </div>
                        </div>
                      </div>
                      
                      {example.explanation && (
                        <div>
                          <div className="text-sm text-gray-400 mb-2 flex items-center">
                            <Lightbulb className="w-4 h-4 mr-1" />
                            Explanation
                          </div>
                          <p className="text-sm text-gray-300 bg-gray-800/50 rounded p-3 border border-gray-700">
                            {example.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {problem.constraints && problem.constraints.length > 0 && (
            <div className="bg-black rounded-xl border border-gray-700/50 overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
                onClick={() => toggleSection('constraints')}
              >
                <h3 className="text-lg font-bold flex items-center text-white">
                  <AlertCircle className="w-5 h-5 mr-3 text-[var(--color-primary)]" />
                  Constraints
                </h3>
                {expandedSections.constraints ? 
                  <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                }
              </div>
              {expandedSections.constraints && (
                <div className="p-4 pt-0">
                  <ul className="space-y-2">
                    {problem.constraints.map((constraint, idx) => (
                      <li key={idx} className="flex items-start text-gray-300 text-sm">
                        <span className="text-red-400 mr-2 mt-1">•</span>
                        <span className="font-mono">{constraint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {problem.starter_code && (
            <div className="bg-black rounded-xl border border-gray-700/50 overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
                onClick={() => toggleSection('starterCode')}
              >
                <h3 className="text-lg font-bold flex items-center text-white">
                  <Code2 className="w-5 h-5 mr-3 text-[var(--color-primary)]" />
                  Starter Code
                </h3>
                {expandedSections.starterCode ? 
                  <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                }
              </div>
              {expandedSections.starterCode && (
                <div className="p-4 pt-0">
                  <div className="bg-black rounded-lg overflow-hidden border border-gray-700">
                    <div className="flex justify-between items-center bg-gray-950 px-4 py-3 border-b border-gray-700">
                      <span className="text-sm text-gray-300 flex items-center">
                        <Code2 className="w-4 h-4 mr-2" />
                        {problem.language || 'Python'}
                      </span>
                      <button
                        onClick={() => copyToClipboard(problem.starter_code, 'starter')}
                        className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-600 hover:border-gray-400"
                      >
                        {copiedSections.starter ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        {copiedSections.starter ? 'Copied!' : 'Copy Code'}
                      </button>
                    </div>
                    <div className="p-4 overflow-x-auto">
                      <pre className="text-sm text-white font-mono">
                        {highlightCode(problem.starter_code, problem.language)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {problem.optimal_solution && (
            <div className="bg-black rounded-xl border border-gray-700/50 overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
                onClick={() => toggleSection('optimalSolution')}
              >
                <h3 className="text-lg font-bold flex items-center text-white">
                  <Lightbulb className="w-5 h-5 mr-3 text-yellow-400" />
                  Optimal Solution
                </h3>
                {expandedSections.optimalSolution ? 
                  <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                }
              </div>
              {expandedSections.optimalSolution && (
                <div className="p-4 pt-0 space-y-4">
                  <div className="bg-black rounded-lg overflow-hidden border border-gray-700">
                    <div className="flex justify-between items-center bg-gray-950 px-4 py-3 border-b border-gray-700">
                      <span className="text-sm text-gray-300 flex items-center">
                        <Code2 className="w-4 h-4 mr-2" />
                        {problem.language || 'Python'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(problem.optimal_solution, 'optimal')}
                          className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-600 hover:border-gray-400"
                        >
                          {copiedSections.optimal ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedSections.optimal ? 'Copied!' : 'Copy Code'}
                        </button>
                      </div>
                    </div>
                    <div className="p-4 overflow-x-auto">
                      <pre className="text-sm text-white font-mono">
                        {highlightCode(problem.optimal_solution, problem.language)}
                      </pre>
                    </div>
                  </div>
                  
                  {problem.optimal_explanation && (
                    <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-xl p-5">
                      <h5 className="font-bold text-yellow-300 mb-3 text-sm flex items-center">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Why This Solution is Optimal
                      </h5>
                      <p className="text-yellow-200 text-sm leading-relaxed">
                        {problem.optimal_explanation}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
                      <div className="flex items-center text-white text-sm font-medium mb-2">
                        <Clock className="w-4 h-4 mr-2 text-blue-400" />
                        Time Complexity
                      </div>
                      <div className="font-mono text-blue-300 text-lg font-bold text-center">
                        {problem.difficulty === 'easy' ? 'O(n)' : problem.difficulty === 'medium' ? 'O(n log n)' : 'O(n²)'}
                      </div>
                    </div>
                    <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50">
                      <div className="flex items-center text-white text-sm font-medium mb-2">
                        <Cpu className="w-4 h-4 mr-2 text-purple-400" />
                        Space Complexity
                      </div>
                      <div className="font-mono text-purple-300 text-lg font-bold text-center">
                        {problem.difficulty === 'easy' ? 'O(1)' : problem.difficulty === 'medium' ? 'O(n)' : 'O(n)'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Solved Problem Details Component
  const SolvedProblemDetails = ({ problem }) => {
    const [copiedSections, setCopiedSections] = useState({});
    const [expandedSections, setExpandedSections] = useState({
      description: true,
      examples: true,
      constraints: true,
      starterCode: false,
      solution: true,
      testResults: true,
      efficiency: true,
      optimalSolution: false
    });
    const [activeTab, setActiveTab] = useState('overview');
    const codeRefs = useRef({});

    if (!problem) {
      return (
        <div className="h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-lg">No problem selected</p>
            <p className="text-sm mt-2">Select a solved problem to view details</p>
          </div>
        </div>
      );
    }

    const parseJSONField = (field, defaultValue = []) => {
      try {
        return field ? JSON.parse(field) : defaultValue;
      } catch (error) {
        console.error(`Error parsing JSON field:`, error);
        return defaultValue;
      }
    };

    const examples = parseJSONField(problem.examples);
    const constraints = parseJSONField(problem.constraints);
    const executionResult = parseJSONField(problem.execution_result, {});
    const testCases = executionResult?.test_cases || [];

    const passedTests = testCases.filter(tc => tc.passed).length;
    const totalTests = testCases.length;
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 100;

    const copyToClipboard = async (text, section) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedSections(prev => ({ ...prev, [section]: true }));
        setTimeout(() => {
          setCopiedSections(prev => ({ ...prev, [section]: false }));
        }, 2000);
      } catch (error) {
        console.error('Failed to copy text:', error);
      }
    };

    const toggleSection = (section) => {
      setExpandedSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    };

    const highlightCode = (code, language) => {
      const keywords = {
        'python': ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from', 'as', 'with'],
        'javascript': ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'import', 'export', 'class'],
        'java': ['public', 'private', 'class', 'static', 'void', 'int', 'String', 'if', 'else', 'for', 'while', 'return']
      };

      const langKeywords = keywords[language?.toLowerCase()] || [];
      
      return code.split('\n').map((line, lineIndex) => (
        <div key={lineIndex} className="flex">
          <span className="text-gray-500 text-xs w-8 select-none mr-2">{lineIndex + 1}</span>
          <span className="flex-1">
            {line.split(/(\s+)/).map((word, wordIndex) => {
              const isKeyword = langKeywords.includes(word.trim());
              return (
                <span
                  key={wordIndex}
                  className={isKeyword ? 'text-blue-400' : 'text-white'}
                >
                  {word}
                </span>
              );
            })}
          </span>
        </div>
      ));
    };

    const formatComplexity = (complexity) => {
      if (!complexity) return 'N/A';
      return complexity.replace(/O\(/g, 'O(').replace(/\^/g, '^');
    };

    const getPerformanceRating = (efficiency) => {
      if (!efficiency) return null;
      
      const timeOptimal = efficiency.time_complexity === efficiency.optimal_time_complexity;
      const spaceOptimal = efficiency.space_complexity === efficiency.optimal_space_complexity;
      
      if (timeOptimal && spaceOptimal) return { rating: 'Excellent', color: 'text-green-400', bg: 'bg-green-500/20' };
      if (timeOptimal || spaceOptimal) return { rating: 'Good', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
      return { rating: 'Needs Improvement', color: 'text-orange-400', bg: 'bg-orange-500/20' };
    };

    const performanceRating = getPerformanceRating(executionResult.efficiency);

    return (
      <div className="h-full overflow-y-auto custom-scrollbar pr-2">
        <div className="bg-black rounded-xl p-6 mb-6 border border-gray-700/50">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {problem.title}
                </h1>
                <div className="flex items-center bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                  <Trophy className="w-4 h-4 mr-2" />
                  Solved
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                  problem.difficulty === "easy"
                    ? "bg-green-500/20 text-green-300 border-green-500/40 shadow-lg shadow-green-500/10"
                    : problem.difficulty === "medium"
                    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40 shadow-lg shadow-yellow-500/10"
                    : "bg-red-500/20 text-red-300 border-red-500/40 shadow-lg shadow-red-500/10"
                }`}>
                  {problem.difficulty?.charAt(0).toUpperCase() + problem.difficulty?.slice(1)}
                </span>
                
                <span className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/40 shadow-lg shadow-blue-500/10 flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  {problem.language}
                </span>
                
                {problem.solved_at && (
                  <span className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/40 shadow-lg shadow-purple-500/10 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Solved {new Date(problem.solved_at).toLocaleDateString()}
                  </span>
                )}

                {performanceRating && (
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${performanceRating.bg} ${performanceRating.color} border-current/40 shadow-lg shadow-current/10 flex items-center gap-2`}>
                    <Zap className="w-4 h-4" />
                    {performanceRating.rating}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-950 rounded-lg p-3 text-center border border-gray-700/50">
                  <div className="text-green-400 font-bold text-lg">{passedTests}/{totalTests}</div>
                  <div className="text-gray-400 text-xs">Tests Passed</div>
                </div>
                <div className="bg-gray-950 rounded-lg p-3 text-center border border-gray-700/50">
                  <div className="text-blue-400 font-bold text-lg">{passRate}%</div>
                  <div className="text-gray-400 text-xs">Success Rate</div>
                </div>
                {executionResult.efficiency && (
                  <>
                    <div className="bg-gray-950 rounded-lg p-3 text-center border border-gray-700/50">
                      <div className="text-purple-400 font-bold text-lg text-sm">
                        {formatComplexity(executionResult.efficiency.time_complexity)}
                      </div>
                      <div className="text-gray-400 text-xs">Time</div>
                    </div>
                    <div className="bg-gray-950 rounded-lg p-3 text-center border border-gray-700/50">
                      <div className="text-orange-400 font-bold text-lg text-sm">
                        {formatComplexity(executionResult.efficiency.space_complexity)}
                      </div>
                      <div className="text-gray-400 text-xs">Space</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-black rounded-xl border border-gray-700/50 overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
              onClick={() => toggleSection('description')}
            >
              <h3 className="text-lg font-bold flex items-center text-white">
                <BookOpen className="w-5 h-5 mr-3 text-[var(--color-primary)]" />
                Problem Description
              </h3>
              {expandedSections.description ? 
                <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                <ChevronDown className="w-5 h-5 text-gray-400" />
              }
            </div>
            {expandedSections.description && (
              <div className="p-4 pt-0">
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {problem.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {examples.length > 0 && (
            <div className="bg-black rounded-xl border border-gray-700/50 overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
                onClick={() => toggleSection('examples')}
              >
                <h3 className="text-lg font-bold flex items-center text-white">
                  <FileText className="w-5 h-5 mr-3 text-[var(--color-primary)]" />
                  Examples ({examples.length})
                </h3>
                {expandedSections.examples ? 
                  <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                }
              </div>
              {expandedSections.examples && (
                <div className="p-4 pt-0 space-y-4">
                  {examples.map((example, idx) => (
                    <div
                      key={idx}
                      className="bg-black rounded-lg p-4 border border-black  transition-colors"
                    >
                      <div className="mb-3">
                        <span className="text-sm font-semibold text-gray-300 bg-gray-800 px-3 py-1 rounded-full">
                          Example {idx + 1}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-sm text-gray-400 mb-2 flex items-center">
                            <FileText className="w-4 h-4 mr-1" />
                            Input
                          </div>
                          <div className="bg-gray-950 rounded p-3 font-mono text-sm text-white border border-gray-700">
                            {example.input}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-2 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Expected Output
                          </div>
                          <div className="bg-gray-950 rounded p-3 font-mono text-sm text-white border border-gray-700">
                            {example.expected_output}
                          </div>
                        </div>
                      </div>
                      {example.explanation && (
                        <div>
                          <div className="text-sm text-gray-400 mb-2 flex items-center">
                            <Lightbulb className="w-4 h-4 mr-1" />
                            Explanation
                          </div>
                          <p className="text-sm text-gray-300 bg-gray-800/50 rounded p-3 border border-gray-700">
                            {example.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {constraints.length > 0 && (
            <div className="bg-black rounded-xl border border-gray-700/50 overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
                onClick={() => toggleSection('constraints')}
              >
                <h3 className="text-lg font-bold flex items-center text-white">
                  <AlertCircle className="w-5 h-5 mr-3 text-[var(--color-primary)]" />
                  Constraints
                </h3>
                {expandedSections.constraints ? 
                  <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                }
              </div>
              {expandedSections.constraints && (
                <div className="p-4 pt-0">
                  <ul className="space-y-2">
                    {constraints.map((constraint, idx) => (
                      <li key={idx} className="flex items-start text-gray-300 text-sm">
                        <span className="text-red-400 mr-2 mt-1">•</span>
                        <span>{constraint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {executionResult && (
            <div className="bg-black rounded-xl border border-gray-700/50 overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
                onClick={() => toggleSection('testResults')}
              >
                <h3 className="text-lg font-bold flex items-center text-white">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                  Test Results ({passedTests}/{totalTests} Passed)
                </h3>
                {expandedSections.testResults ? 
                  <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                }
              </div>
              {expandedSections.testResults && (
                <div className="p-4 pt-0 space-y-6">
                  <div className="bg-black  border border-green-500/30 rounded-xl p-6 text-center">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h4 className="text-2xl font-bold text-green-400 mb-2">
                      Solution Accepted!
                    </h4>
                    <p className="text-green-300">
                      Your solution passed all {totalTests} test cases successfully.
                    </p>
                    <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${passRate}%` }}
                      ></div>
                    </div>
                  </div>

                  {testCases.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="font-semibold text-white flex items-center">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Detailed Results
                      </h5>
                      {testCases.map((testCase, idx) => (
                        <div
                          key={idx}
                          className={`border rounded-xl p-4 transition-all hover:scale-[1.02] ${
                            testCase.passed
                              ? "border-green-500/30 bg-black hover:bg-green-500/10"
                              : "border-red-500/30 bg-red-500/5 hover:bg-red-500/10"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              {testCase.passed ? (
                                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                              ) : (
                                <X className="w-5 h-5 text-red-500 mr-3" />
                              )}
                              <span className="font-semibold text-white">
                                Test Case {idx + 1}
                              </span>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                testCase.passed
                                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {testCase.passed ? "PASSED" : "FAILED"}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
                                Input
                              </div>
                              <div className="bg-gray-950 rounded p-3 font-mono text-white break-all border border-gray-700">
                                {testCase.input}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
                                Expected
                              </div>
                              <div className="bg-gray-950 rounded p-3 font-mono text-white break-all border border-gray-700">
                                {testCase.expected_output}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider">
                                Your Output
                              </div>
                              <div
                                className={`rounded p-3 font-mono break-all border ${
                                  testCase.passed
                                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                                    : "bg-red-500/10 text-red-400 border-red-500/20"
                                }`}
                              >
                                {testCase.actual_output}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {executionResult.efficiency && (
            <div className="bg-black rounded-xl border border-gray-700/50 overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
                onClick={() => toggleSection('efficiency')}
              >
                <h3 className="text-lg font-bold flex items-center text-white">
                  <TrendingUp className="w-5 h-5 mr-3 text-purple-400" />
                  Efficiency Analysis
                </h3>
                {expandedSections.efficiency ? 
                  <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                }
              </div>
              {expandedSections.efficiency && (
                <div className="p-4 pt-0 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-black rounded-xl p-5 border border-gray-700/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-white font-semibold flex items-center">
                          <Clock className="w-5 h-5 mr-2 text-blue-400" />
                          Time Complexity
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="text-gray-400 text-sm mb-2">Your Solution</div>
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 font-mono text-blue-300 text-center text-lg font-bold">
                            {formatComplexity(executionResult.efficiency.time_complexity)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm mb-2">Optimal Solution</div>
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 font-mono text-green-300 text-center text-lg font-bold">
                            {formatComplexity(executionResult.efficiency.optimal_time_complexity)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black rounded-xl p-5 border border-gray-700/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-white font-semibold flex items-center">
                          <Cpu className="w-5 h-5 mr-2 text-orange-400" />
                          Space Complexity
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="text-gray-400 text-sm mb-2">Your Solution</div>
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 font-mono text-blue-300 text-center text-lg font-bold">
                            {formatComplexity(executionResult.efficiency.space_complexity)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm mb-2">Optimal Solution</div>
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 font-mono text-green-300 text-center text-lg font-bold">
                            {formatComplexity(executionResult.efficiency.optimal_space_complexity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {executionResult.efficiency.comparison && (
                    <div className="bg-black border border-purple-500/20 rounded-xl p-5">
                      <h5 className="font-bold text-purple-300 mb-3 text-sm flex items-center">
                        <Zap className="w-4 h-4 mr-2" />
                        Performance Analysis
                      </h5>
                      <p className="text-purple-200 text-sm leading-relaxed">
                        {executionResult.efficiency.comparison}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="bg-black rounded-xl border border-gray-700/50 overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
              onClick={() => toggleSection('solution')}
            >
              <h3 className="text-lg font-bold flex items-center text-white">
                <Code2 className="w-5 h-5 mr-3 text-green-400" />
                Your Solution
              </h3>
              <div className="flex items-center gap-2">
                {expandedSections.solution ? 
                  <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                }
              </div>
            </div>
            {expandedSections.solution && (
              <div className="p-4 pt-0">
                <div className="bg-black rounded-lg overflow-hidden border border-gray-700">
                  <div className="flex justify-between items-center bg-gray-950 px-4 py-3 border-b border-gray-700">
                    <span className="text-sm text-gray-300 flex items-center">
                      <Code2 className="w-4 h-4 mr-2" />
                      {problem.language}
                    </span>
                    <button
                      onClick={() => copyToClipboard(problem.user_solution, 'solution')}
                      className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-600 hover:border-gray-400"
                    >
                      {copiedSections.solution ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      {copiedSections.solution ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                  <div className="p-4 overflow-x-auto">
                    <pre className="text-sm text-white font-mono">
                      {highlightCode(problem.user_solution, problem.language)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {problem.optimal_solution && (
            <div className="bg-black rounded-xl border border-gray-700/50 overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
                onClick={() => toggleSection('optimalSolution')}
              >
                <h3 className="text-lg font-bold flex items-center text-white">
                  <Lightbulb className="w-5 h-5 mr-3 text-yellow-400" />
                  Optimal Solution
                </h3>
                {expandedSections.optimalSolution ? 
                  <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                }
              </div>
              {expandedSections.optimalSolution && (
                <div className="p-4 pt-0 space-y-4">
                  <div className="bg-black rounded-lg overflow-hidden border border-gray-700">
                    <div className="flex justify-between items-center bg-gray-950 px-4 py-3 border-b border-gray-700">
                      <span className="text-sm text-gray-300 flex items-center">
                        <Code2 className="w-4 h-4 mr-2" />
                        {problem.language}
                      </span>
                      <button
                        onClick={() => copyToClipboard(problem.optimal_solution, 'optimal')}
                        className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-600 hover:border-gray-400"
                      >
                        {copiedSections.optimal ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        {copiedSections.optimal ? 'Copied!' : 'Copy Code'}
                      </button>
                    </div>
                    <div className="p-4 overflow-x-auto">
                      <pre className="text-sm text-white font-mono">
                        {highlightCode(problem.optimal_solution, problem.language)}
                      </pre>
                    </div>
                  </div>
                  
                  {problem.optimal_explanation && (
                    <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-xl p-5">
                      <h5 className="font-bold text-yellow-300 mb-3 text-sm flex items-center">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Why This is Optimal
                      </h5>
                      <p className="text-yellow-200 text-sm leading-relaxed">
                        {problem.optimal_explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-700/30 text-center">
            <p className="text-gray-400 text-sm">
              Problem solved on {problem.solved_at ? new Date(problem.solved_at).toLocaleDateString() : 'Unknown date'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Quiz Attempt Details Component
  const QuizAttemptDetails = ({ attempt }) => {
    const [expandedSections, setExpandedSections] = useState({
      overview: true,
      questions: true,
      evaluation: true
    });

    if (!attempt) {
      return (
        <div className="h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <BarChart className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-lg">No quiz attempt selected</p>
            <p className="text-sm mt-2">Select a quiz attempt to view details</p>
          </div>
        </div>
      );
    }

    const toggleSection = (section) => {
      setExpandedSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    };

    const getScoreColor = (score) => {
      if (score >= 90) return "from-yellow-400 to-orange-500";
      if (score >= 80) return "from-purple-400 to-pink-500";
      if (score >= 70) return "from-blue-400 to-cyan-500";
      if (score >= 60) return "from-green-400 to-emerald-500";
      return "from-orange-400 to-red-500";
    };

    const getPerformanceRating = (score) => {
      if (score >= 90) return { text: "Excellent", icon: Trophy, color: "text-yellow-400" };
      if (score >= 80) return { text: "Great", icon: Award, color: "text-purple-400" };
      if (score >= 70) return { text: "Good", icon: TrendingUp, color: "text-blue-400" };
      if (score >= 60) return { text: "Average", icon: CheckCircle, color: "text-green-400" };
      return { text: "Needs Practice", icon: Target, color: "text-orange-400" };
    };

    const performance = getPerformanceRating(attempt.score);
    const PerformanceIcon = performance.icon;

    return (
      <div className="h-full overflow-y-auto custom-scrollbar pr-2">
        <div className="bg-black rounded-xl p-6 mb-6 border border-gray-700/50">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {attempt.quiz_data?.title || "Quiz Results"}
                </h1>
                <div className={`flex items-center bg-gradient-to-r ${getScoreColor(attempt.score)} text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg`}>
                  <PerformanceIcon className="w-4 h-4 mr-2" />
                  {performance.text}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/40 shadow-lg shadow-blue-500/10">
                  Score: {attempt.score}%
                </span>
                <span className="px-3 py-1.5 bg-green-500/20 text-green-300 rounded-full text-sm font-medium border border-green-500/40 shadow-lg shadow-green-500/10">
                  Correct: {attempt.correct_answers}/{attempt.total_questions}
                </span>
                {attempt.attempted_at && (
                  <span className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/40 shadow-lg shadow-purple-500/10 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {new Date(attempt.attempted_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-950 rounded-lg p-3 text-center border border-gray-700/50">
                  <div className="text-blue-400 font-bold text-lg">{attempt.score}%</div>
                  <div className="text-gray-400 text-xs">Overall Score</div>
                </div>
                <div className="bg-gray-950 rounded-lg p-3 text-center border border-gray-700/50">
                  <div className="text-green-400 font-bold text-lg">{attempt.correct_answers}/{attempt.total_questions}</div>
                  <div className="text-gray-400 text-xs">Correct Answers</div>
                </div>
                <div className="bg-gray-950 rounded-lg p-3 text-center border border-gray-700/50">
                  <div className="text-purple-400 font-bold text-lg">
                    {Math.round((attempt.correct_answers / attempt.total_questions) * 100)}%
                  </div>
                  <div className="text-gray-400 text-xs">Accuracy</div>
                </div>
                <div className="bg-gray-950 rounded-lg p-3 text-center border border-gray-700/50">
                  <div className="text-orange-400 font-bold text-lg">
                    {attempt.score >= 70 ? "Passed" : "Failed"}
                  </div>
                  <div className="text-gray-400 text-xs">Status</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Overview Section */}
          <div className="bg-black rounded-xl border border-gray-700/50 overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
              onClick={() => toggleSection('overview')}
            >
              <h3 className="text-lg font-bold flex items-center text-white">
                <BarChart className="w-5 h-5 mr-3 text-[var(--color-primary)]" />
                Performance Overview
              </h3>
              {expandedSections.overview ? 
                <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                <ChevronDown className="w-5 h-5 text-gray-400" />
              }
            </div>
            {expandedSections.overview && (
              <div className="p-4 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-white mb-3">Score Distribution</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">Your Score</span>
                          <span className="text-white font-semibold">{attempt.score}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div 
                            className={`bg-gradient-to-r ${getScoreColor(attempt.score)} h-3 rounded-full transition-all duration-1000`}
                            style={{ width: `${attempt.score}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">Passing Threshold</span>
                          <span className="text-white font-semibold">70%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: '70%' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-3">Quick Stats</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Questions:</span>
                        <span className="text-white">{attempt.total_questions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Correct Answers:</span>
                        <span className="text-green-400">{attempt.correct_answers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Incorrect Answers:</span>
                        <span className="text-red-400">{attempt.total_questions - attempt.correct_answers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Accuracy Rate:</span>
                        <span className="text-blue-400">
                          {Math.round((attempt.correct_answers / attempt.total_questions) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Questions & Answers Section */}
          <div className="bg-black rounded-xl border border-gray-700/50 overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
              onClick={() => toggleSection('questions')}
            >
              <h3 className="text-lg font-bold flex items-center text-white">
                <FileText className="w-5 h-5 mr-3 text-[var(--color-primary)]" />
                Questions & Answers ({attempt.quiz_data?.questions?.length || 0})
              </h3>
              {expandedSections.questions ? 
                <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                <ChevronDown className="w-5 h-5 text-gray-400" />
              }
            </div>
            {expandedSections.questions && attempt.quiz_data?.questions && (
              <div className="p-4 pt-0 space-y-4">
                {attempt.quiz_data.questions.map((question, index) => {
                  const userAnswer = attempt.user_answers?.[question.id];
                  const isCorrect = userAnswer === question.correct_answer;
                  const feedback = attempt.evaluation_result?.feedback?.[question.id];

                  return (
                    <div
                      key={question.id}
                      className="bg-black rounded-lg p-4 border border-gray-700/30 hover:border-gray-600/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isCorrect
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {isCorrect ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </div>
                          <span className="text-white font-semibold">
                            Question {index + 1}
                          </span>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isCorrect
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {isCorrect ? "Correct" : "Incorrect"}
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-gray-300 text-sm mb-3">
                          {question.question}
                        </p>
                        
                        {question.type === "mcq" && question.options && (
                          <div className="space-y-2">
                            <div className="text-sm text-gray-400">Options:</div>
                            {question.options.map((option, optIndex) => {
                              const isSelected = userAnswer === optIndex;
                              const isCorrectOption = optIndex === question.correct_answer;
                              
                              return (
                                <div
                                  key={optIndex}
                                  className={`p-2 rounded border text-sm ${
                                    isCorrectOption
                                      ? "bg-green-500/10 border-green-500/30 text-green-300"
                                      : isSelected
                                      ? "bg-red-500/10 border-red-500/30 text-red-300"
                                      : "bg-gray-800/30 border-gray-600/30 text-gray-300"
                                  }`}
                                >
                                  {option}
                                  {isCorrectOption && (
                                    <CheckCircle className="w-3 h-3 inline ml-2" />
                                  )}
                                  {isSelected && !isCorrectOption && (
                                    <X className="w-3 h-3 inline ml-2" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {question.type === "text" && (
                          <div className="space-y-2">
                            <div className="text-sm text-gray-400">Your Answer:</div>
                            <div className="p-2 bg-gray-800/30 rounded border border-gray-600/30 text-gray-300 text-sm">
                              {userAnswer || "No answer provided"}
                            </div>
                            <div className="text-sm text-gray-400">Correct Answer:</div>
                            <div className="p-2 bg-green-500/10 rounded border border-green-500/30 text-green-300 text-sm">
                              {question.correct_answer}
                            </div>
                          </div>
                        )}
                      </div>

                      {feedback && (
                        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-3">
                          <div className="flex items-center mb-2">
                            <Lightbulb className="w-4 h-4 text-blue-400 mr-2" />
                            <span className="text-blue-400 font-medium text-sm">Feedback</span>
                          </div>
                          <p className="text-gray-200 text-sm">{feedback}</p>
                        </div>
                      )}

                      {question.explanation && (
                        <div className="mt-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-3">
                          <div className="flex items-center mb-2">
                            <BookOpen className="w-4 h-4 text-green-400 mr-2" />
                            <span className="text-green-400 font-medium text-sm">Explanation</span>
                          </div>
                          <p className="text-gray-200 text-sm">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Evaluation & Feedback Section */}
          <div className="bg-black rounded-xl border border-gray-700/50 overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
              onClick={() => toggleSection('evaluation')}
            >
              <h3 className="text-lg font-bold flex items-center text-white">
                <Award className="w-5 h-5 mr-3 text-[var(--color-primary)]" />
                Evaluation & Recommendations
              </h3>
              {expandedSections.evaluation ? 
                <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                <ChevronDown className="w-5 h-5 text-gray-400" />
              }
            </div>
            {expandedSections.evaluation && attempt.evaluation_result && (
              <div className="p-4 pt-0 space-y-4">
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center">
                    <Target className="w-4 h-4 mr-2 text-purple-400" />
                    Overall Performance
                  </h4>
                  <p className="text-gray-200 text-sm">
                    {attempt.evaluation_result.recommendation || 
                      `You scored ${attempt.score}% on this quiz. ${
                        attempt.score >= 70 
                          ? "Great job! You have a solid understanding of this topic."
                          : "Keep practicing to improve your understanding of this topic."
                      }`}
                  </p>
                </div>

                {attempt.evaluation_result.feedback && Object.keys(attempt.evaluation_result.feedback).length > 0 && (
                  <div>
                    <h4 className="font-semibold text-white mb-3">Detailed Feedback</h4>
                    <div className="space-y-3">
                      {Object.entries(attempt.evaluation_result.feedback).map(([questionId, feedback]) => {
                        const question = attempt.quiz_data?.questions?.find(q => q.id === parseInt(questionId));
                        return (
                          <div key={questionId} className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-white font-medium text-sm">
                                Q{attempt.quiz_data?.questions?.findIndex(q => q.id === parseInt(questionId)) + 1}:
                              </span>
                              <span className="text-gray-300 text-sm truncate flex-1">
                                {question?.question?.substring(0, 50)}...
                              </span>
                            </div>
                            <p className="text-gray-200 text-sm">{feedback}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Learning Path Details Component
  const LearningPathDetails = ({ path }) => {
    const [expandedDays, setExpandedDays] = useState({});

    if (!path) {
      return (
        <div className="h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Map className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-lg">No learning path selected</p>
            <p className="text-sm mt-2">Select a learning path to view details</p>
          </div>
        </div>
      );
    }

    const toggleDay = (dayIndex) => {
      setExpandedDays(prev => ({
        ...prev,
        [dayIndex]: !prev[dayIndex]
      }));
    };

    const learningPlan = path.learning_plan || {};

    return (
      <div className="h-full overflow-y-auto custom-scrollbar pr-2">
        <div className="bg-black rounded-xl p-6 mb-6 border border-gray-700/50">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {path.topic} Learning Path
                </h1>
                <div className="flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  {path.level}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/40 shadow-lg shadow-blue-500/10">
                  {learningPlan.day_wise_plan?.length || 0} Days
                </span>
                <span className="px-3 py-1.5 bg-green-500/20 text-green-300 rounded-full text-sm font-medium border border-green-500/40 shadow-lg shadow-green-500/10">
                  {learningPlan.objectives?.length || 0} Objectives
                </span>
                {path.created_at && (
                  <span className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/40 shadow-lg shadow-purple-500/10 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Created {new Date(path.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              {learningPlan.overview && (
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
                  <h3 className="font-bold text-blue-300 mb-2 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Overview
                  </h3>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    {learningPlan.overview}
                  </p>
                </div>
              )}
            </div>

            {path.image_url && (
              <div className="lg:w-48 lg:h-48 flex-shrink-0">
                <img
                  src={path.image_url}
                  alt={path.topic}
                  className="w-full h-full object-cover rounded-xl border border-gray-600/50"
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Objectives */}
          {learningPlan.objectives && learningPlan.objectives.length > 0 && (
            <div className="bg-black rounded-xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center text-white">
                <TargetIcon className="w-5 h-5 mr-3 text-green-400" />
                Learning Objectives
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {learningPlan.objectives.map((objective, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-gray-800/30 rounded-lg border border-gray-600/30"
                  >
                    <CheckSquare className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{objective}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Day-wise Plan */}
          {learningPlan.day_wise_plan && learningPlan.day_wise_plan.length > 0 && (
            <div className="bg-black rounded-xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center text-white">
                <CalendarIcon className="w-5 h-5 mr-3 text-yellow-400" />
                Learning Schedule ({learningPlan.day_wise_plan.length} Days)
              </h3>
              <div className="space-y-4">
                {learningPlan.day_wise_plan.map((day, index) => (
                  <div
                    key={index}
                    className="border border-gray-600/30 rounded-xl overflow-hidden hover:border-gray-500/50 transition-colors"
                  >
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer bg-gray-800/20 hover:bg-gray-700/30 transition-colors"
                      onClick={() => toggleDay(index)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          {day.day || index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{day.focus}</h4>
                          <p className="text-gray-400 text-sm">{day.explanation}</p>
                        </div>
                      </div>
                      {expandedDays[index] ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    
                    {expandedDays[index] && (
                      <div className="p-4 bg-gray-900/20 border-t border-gray-600/30">
                        {/* Subtopics */}
                        {day.subtopics && day.subtopics.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-medium text-gray-300 mb-2 flex items-center">
                              <Book className="w-4 h-4 mr-2" />
                              Topics to Cover:
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {day.subtopics.map((subtopic, subIndex) => (
                                <span
                                  key={subIndex}
                                  className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs border border-blue-500/30"
                                >
                                  {subtopic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Practice Exercises */}
                        {day.practice && day.practice.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-300 mb-2 flex items-center">
                              <Target className="w-4 h-4 mr-2" />
                              Practice Exercises:
                            </h5>
                            <ul className="space-y-2">
                              {day.practice.map((exercise, exIndex) => (
                                <li key={exIndex} className="flex items-start space-x-2 text-sm text-gray-400">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 flex-shrink-0"></div>
                                  <span>{exercise}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Resources */}
          {learningPlan.recommended_resources && learningPlan.recommended_resources.length > 0 && (
            <div className="bg-black rounded-xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center text-white">
                <LinkIcon className="w-5 h-5 mr-3 text-purple-400" />
                Recommended Resources
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {learningPlan.recommended_resources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 border border-gray-600/30 rounded-xl hover:border-purple-500/50 hover:bg-purple-500/10 transition-all group"
                  >
                    <div className="flex items-start space-x-3">
                      {resource.type === "video" ? (
                        <Video className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Book className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <h5 className="font-medium text-white group-hover:text-purple-300 transition-colors">
                          {resource.title}
                        </h5>
                        <p className="text-gray-400 text-sm mt-1 capitalize">
                          {resource.type} • {resource.platform || "External Resource"}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Problems to Strengthen Concepts */}
          {learningPlan.problems_to_strengthen_concepts && learningPlan.problems_to_strengthen_concepts.length > 0 && (
            <div className="bg-black rounded-xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center text-white">
                <Code2 className="w-5 h-5 mr-3 text-green-400" />
                Practice Problems
              </h3>
              <div className="space-y-3">
                {learningPlan.problems_to_strengthen_concepts.map((problem, index) => (
                  <a
                    key={index}
                    href={problem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 border border-gray-600/30 rounded-xl hover:border-green-500/50 hover:bg-green-500/10 transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h5 className="font-medium text-white group-hover:text-green-300 transition-colors">
                          {problem.title}
                        </h5>
                        <div className="flex items-center space-x-3 mt-2">
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs border border-blue-500/30">
                            {problem.platform}
                          </span>
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs border border-purple-500/30">
                            {problem.concept}
                          </span>
                        </div>
                      </div>
                      <Play className="w-4 h-4 text-gray-400 group-hover:text-green-400 transition-colors" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Final Assessment */}
          {learningPlan.final_assessment && (
            <div className="bg-black rounded-xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center text-white">
                <Award className="w-5 h-5 mr-3 text-yellow-400" />
                Final Assessment
              </h3>
              <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-xl p-4">
                <p className="text-yellow-200 text-sm leading-relaxed">
                  {learningPlan.final_assessment}
                </p>
              </div>
            </div>
          )}

          {/* Sources */}
          {path.sources && path.sources.length > 0 && (
            <div className="bg-black rounded-xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center text-white">
                <LinkIcon className="w-5 h-5 mr-3 text-blue-400" />
                Additional Resources
              </h3>
              <div className="space-y-2">
                {path.sources.map((source, index) => (
                  <a
                    key={index}
                    href={source.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 border border-gray-600/30 rounded-lg hover:border-blue-500/50 hover:bg-blue-500/10 transition-all group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 group-hover:text-blue-300 transition-colors text-sm">
                        {source.title}
                      </span>
                      <LinkIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-700/50">
            <button
              onClick={() => handleDeleteLearningPath(path.id)}
              className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Learning Path
            </button>
            <div className="text-gray-400 text-sm">
              Created on {new Date(path.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-[var(--font-main)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading your profile...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-[var(--font-main)] flex items-center justify-center">
          <div className="text-center">
            <div className="bg-red-900/20 border border-red-800/50 p-6 rounded-xl max-w-md mx-4">
              <div className="text-red-400 text-lg font-medium mb-2">Error</div>
              <p className="text-gray-400">{error}</p>
              <button
                onClick={fetchUserData}
                className="mt-4 bg-[var(--color-primary)] hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors w-full"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!userData) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-[var(--font-main)] flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400">No user data found</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-[var(--font-main)]">
        <div className="max-w-full mx-auto py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
          {/* Top Row - Compact Profile and Stats */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 my-8">
            {/* Profile Section */}
            <div className="xl:col-span-1 bg-black rounded-2xl border border-gray-700/50 p-6 flex flex-col justify-center h-full">
              <div className="flex items-center gap-4">
                <img
                  src={userData.profilePhoto || "/default-avatar.png"}
                  alt={userData.name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-[var(--color-primary)]/30 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl md:text-2xl font-bold mb-1 truncate">
                    {userData.name}
                  </h1>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center text-gray-300 text-sm md:text-base">
                      <Mail className="w-4 h-4 mr-1 text-[var(--color-primary)]" />
                      <span className="truncate">{userData.email}</span>
                    </div>
                    <div className="px-3 py-1 bg-[var(--color-primary)]/20 text-[var(--color-primary)] rounded-full text-sm md:text-base font-medium border border-[var(--color-primary)]/30">
                      {userData.level || "Beginner"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="xl:col-span-2 bg-black rounded-2xl border border-gray-700/50 p-6 h-full flex items-center justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full">
                {[
                  {
                    icon: Trophy,
                    value: solvedProblems.length,
                    label: "Solved",
                    color: "text-green-400",
                  },
                  {
                    icon: Target,
                    value: totalQuizzes,
                    label: "Quizzes",
                    color: "text-blue-400",
                  },
                  {
                    icon: BookOpen,
                    value: learnedConcepts.length,
                    label: "Topics",
                    color: "text-purple-400",
                  },
                  {
                    icon: Bookmark,
                    value: savedProblems.length,
                    label: "Saved",
                    color: "text-yellow-400",
                  },
                ].map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={idx}
                      className="bg-black rounded-xl border border-gray-700/50 p-6 flex flex-col items-center justify-center text-center"
                    >
                      <Icon className={`w-6 h-6 mb-2 ${card.color}`} />
                      <div
                        className={`text-lg md:text-2xl font-bold ${card.color}`}
                      >
                        {card.value}
                      </div>
                      <div className="text-sm md:text-base text-gray-400">
                        {card.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Second Row - Horizontal Tabs */}
          <div className="bg-black rounded-2xl border border-gray-700/50 p-1 mb-6">
            <div className="grid grid-cols-5 gap-1">
              <button
                className={`py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === "learned-concepts"
                    ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30 shadow-lg"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                }`}
                onClick={() => setActiveTab("learned-concepts")}
              >
                <div className="flex items-center justify-center space-x-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Concepts</span>
                </div>
              </button>
              <button
                className={`py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === "saved-problems"
                    ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30 shadow-lg"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                }`}
                onClick={() => setActiveTab("saved-problems")}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Bookmark className="w-4 h-4" />
                  <span>Saved Problems</span>
                </div>
              </button>
              <button
                className={`py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === "solved-problems"
                    ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30 shadow-lg"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                }`}
                onClick={() => setActiveTab("solved-problems")}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Trophy className="w-4 h-4" />
                  <span>Solved Problems</span>
                </div>
              </button>
              <button
                className={`py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === "quiz-attempts"
                    ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30 shadow-lg"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                }`}
                onClick={() => setActiveTab("quiz-attempts")}
              >
                <div className="flex items-center justify-center space-x-2">
                  <BarChart className="w-4 h-4" />
                  <span>Quiz History</span>
                </div>
              </button>
              <button
                className={`py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === "learning-paths"
                    ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30 shadow-lg"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                }`}
                onClick={() => setActiveTab("learning-paths")}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Map className="w-4 h-4" />
                  <span>Learning Paths</span>
                </div>
              </button>
            </div>
          </div>

          {/* Bottom Row - Content Area */}
          {activeTab === "learned-concepts" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-[500px]">
              {/* Concept List */}
              <div
                className={`xl:col-span-1 bg-black rounded-2xl border border-gray-700/50 p-4 flex flex-col ${
                  isMobileView &&
                  (selectedItem || selectedProblem || selectedSolvedProblem || selectedQuizAttempt || selectedLearningPath)
                    ? "hidden"
                    : "block"
                }`}
              >
                <div className="mb-4">
                  <h3 className="font-bold text-lg mb-3">Learned Concepts</h3>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search concepts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-8 h-full flex items-center justify-center">
                      <div>
                        <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <h4 className="text-base font-medium text-gray-400 mb-2">
                          {searchQuery
                            ? "No concepts found"
                            : "No concepts learned yet"}
                        </h4>
                        <p className="text-gray-500 text-sm">
                          {searchQuery
                            ? "Try a different search term"
                            : "Start learning to see concepts here."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 h-full overflow-y-auto custom-scrollbar-thin">
                      {filteredItems.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                            selectedItem?.id === item.id
                              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-lg"
                              : "border-gray-600/30 hover:border-gray-500/50 bg-black hover:bg-gray-800/20"
                          }`}
                          onClick={() => handleItemClick(item)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm mb-2 line-clamp-2">
                                {item.title}
                              </h4>
                              <div className="flex flex-wrap gap-1 mb-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    item.difficulty === "beginner"
                                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                      : item.difficulty === "intermediate"
                                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                                  }`}
                                >
                                  {item.difficulty}
                                </span>
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium border border-blue-500/30">
                                  {item.language}
                                </span>
                              </div>
                              <div className="flex items-center text-xs text-gray-400">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(item.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <ChevronRight
                              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 mt-1 ${
                                selectedItem?.id === item.id
                                  ? "text-[var(--color-primary)]"
                                  : ""
                              }`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Markdown Content */}
              <div
                className={`xl:col-span-2 bg-black rounded-2xl border border-gray-700/50 p-4 flex flex-col ${
                  isMobileView &&
                  !selectedItem &&
                  !selectedProblem &&
                  !selectedSolvedProblem &&
                  !selectedQuizAttempt &&
                  !selectedLearningPath
                    ? "hidden"
                    : "block"
                }`}
              >
                {/* Mobile Back Button */}
                {isMobileView &&
                  (selectedItem ||
                    selectedProblem ||
                    selectedSolvedProblem ||
                    selectedQuizAttempt ||
                    selectedLearningPath) && (
                    <button
                      onClick={handleBackToList}
                      className="flex items-center space-x-2 mb-4 p-2 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors w-fit"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="text-sm">Back to List</span>
                    </button>
                  )}

                {selectedItem ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 pb-4 border-b border-gray-700/50">
                      <div className="flex-1">
                        <h1 className="text-xl font-bold mb-2">
                          {selectedItem.title}
                        </h1>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              selectedItem.difficulty === "beginner"
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : selectedItem.difficulty === "intermediate"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {selectedItem.difficulty}
                          </span>
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium border border-blue-500/30">
                            {selectedItem.language}
                          </span>
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium border border-purple-500/30">
                            {new Date(
                              selectedItem.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(selectedItem)}
                        className="flex items-center justify-center px-3 py-2 bg-[var(--color-primary)] hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto mt-2 sm:mt-0"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </button>
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <div className="h-full overflow-y-auto custom-scrollbar pr-2">
                        <MarkdownRenderer
                          content={
                            selectedItem.markdown_content ||
                            selectedItem.content
                          }
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <h4 className="text-lg font-medium text-gray-400 mb-2">
                        {isMobileView ? "Select a Concept" : "Select a Concept"}
                      </h4>
                      <p className="text-gray-500 text-sm">
                        {isMobileView
                          ? "Tap on a concept from the list to view its content"
                          : "Choose a concept from the list to view its detailed content here."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Saved Problems Tab */}
          {activeTab === "saved-problems" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-[500px]">
              {/* Problems List */}
              <div
                className={`xl:col-span-1 bg-black rounded-2xl border border-gray-700/50 p-4 flex flex-col ${
                  isMobileView &&
                  (selectedItem || selectedProblem || selectedSolvedProblem || selectedQuizAttempt || selectedLearningPath)
                    ? "hidden"
                    : "block"
                }`}
              >
                <div className="mb-4">
                  <h3 className="font-bold text-lg mb-3">
                    Saved Problems ({savedProblems.length})
                  </h3>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search problems..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {filteredProblems.length === 0 ? (
                    <div className="text-center py-8 h-full flex items-center justify-center">
                      <div>
                        <Bookmark className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <h4 className="text-base font-medium text-gray-400 mb-2">
                          {searchQuery
                            ? "No problems found"
                            : "No saved problems yet"}
                        </h4>
                        <p className="text-gray-500 text-sm">
                          {searchQuery
                            ? "Try a different search term"
                            : "Save problems from coding practice to see them here."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 h-full overflow-y-auto custom-scrollbar-thin">
                      {filteredProblems.map((problem) => (
                        <div
                          key={problem.id}
                          className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                            selectedProblem?.id === problem.id
                              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-lg"
                              : "border-gray-600/30 hover:border-gray-500/50 bg-black hover:bg-gray-800/20"
                          }`}
                          onClick={() => handleProblemClick(problem)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm mb-2 line-clamp-2">
                                {problem.title}
                              </h4>
                              <div className="flex flex-wrap gap-1 mb-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    problem.difficulty === "easy"
                                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                      : problem.difficulty === "medium"
                                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                                  }`}
                                >
                                  {problem.difficulty}
                                </span>
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium border border-blue-500/30">
                                  {problem.data_structure || "Algorithm"}
                                </span>
                              </div>
                              <div className="flex items-center text-xs text-gray-400">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(
                                  problem.created_at
                                ).toLocaleDateString()}
                              </div>
                            </div>
                            <ChevronRight
                              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 mt-1 ${
                                selectedProblem?.id === problem.id
                                  ? "text-[var(--color-primary)]"
                                  : ""
                              }`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Problem Details */}
              <div
                className={`xl:col-span-2 bg-black rounded-2xl border border-gray-700/50 p-4 flex flex-col ${
                  isMobileView &&
                  !selectedItem &&
                  !selectedProblem &&
                  !selectedSolvedProblem &&
                  !selectedQuizAttempt &&
                  !selectedLearningPath
                    ? "hidden"
                    : "block"
                }`}
              >
                {/* Mobile Back Button */}
                {isMobileView &&
                  (selectedItem ||
                    selectedProblem ||
                    selectedSolvedProblem ||
                    selectedQuizAttempt ||
                    selectedLearningPath) && (
                    <button
                      onClick={handleBackToList}
                      className="flex items-center space-x-2 mb-4 p-2 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors w-fit"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="text-sm">Back to List</span>
                    </button>
                  )}

                {selectedProblem ? (
                  <ProblemDetails problem={selectedProblem} />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Code2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <h4 className="text-lg font-medium text-gray-400 mb-2">
                        {isMobileView ? "Select a Problem" : "Select a Problem"}
                      </h4>
                      <p className="text-gray-500 text-sm">
                        {isMobileView
                          ? "Tap on a problem from the list to view its details"
                          : "Choose a problem from the list to view its detailed description and solution."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Solved Problems Tab */}
          {activeTab === "solved-problems" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-[500px]">
              {/* Solved Problems List */}
              <div
                className={`xl:col-span-1 bg-black rounded-2xl border border-gray-700/50 p-4 flex flex-col ${
                  isMobileView &&
                  (selectedItem || selectedProblem || selectedSolvedProblem || selectedQuizAttempt || selectedLearningPath)
                    ? "hidden"
                    : "block"
                }`}
              >
                <div className="mb-4">
                  <h3 className="font-bold text-lg mb-3">
                    Solved Problems ({solvedProblems.length})
                  </h3>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search solved problems..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {filteredSolvedProblems.length === 0 ? (
                    <div className="text-center py-8 h-full flex items-center justify-center">
                      <div>
                        <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <h4 className="text-base font-medium text-gray-400 mb-2">
                          {searchQuery
                            ? "No solved problems found"
                            : "No problems solved yet"}
                        </h4>
                        <p className="text-gray-500 text-sm">
                          {searchQuery
                            ? "Try a different search term"
                            : "Solve problems in coding practice to see them here."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 h-full overflow-y-auto custom-scrollbar-thin">
                      {filteredSolvedProblems.map((problem) => (
                        <div
                          key={problem.solved_id}
                          className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                            selectedSolvedProblem?.solved_id ===
                            problem.solved_id
                              ? "border-green-500 bg-green-500/10 shadow-lg"
                              : "border-gray-600/30 hover:border-gray-500/50 bg-black hover:bg-gray-800/20"
                          }`}
                          onClick={() => handleSolvedProblemClick(problem)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-sm line-clamp-2">
                                  {problem.title}
                                </h4>
                                <Trophy className="w-3 h-3 text-green-400 flex-shrink-0" />
                              </div>
                              <div className="flex flex-wrap gap-1 mb-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    problem.difficulty === "easy"
                                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                      : problem.difficulty === "medium"
                                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                                  }`}
                                >
                                  {problem.difficulty}
                                </span>
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium border border-blue-500/30">
                                  {problem.language}
                                </span>
                              </div>
                              <div className="flex items-center text-xs text-gray-400">
                                <Calendar className="w-3 h-3 mr-1" />
                                {problem.solved_at
                                  ? new Date(
                                      problem.solved_at
                                    ).toLocaleDateString()
                                  : "Recently solved"}
                              </div>
                            </div>
                            <ChevronRight
                              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 mt-1 ${
                                selectedSolvedProblem?.solved_id ===
                                problem.solved_id
                                  ? "text-green-400"
                                  : ""
                              }`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Solved Problem Details */}
              <div
                className={`xl:col-span-2 bg-black rounded-2xl border border-gray-700/50 p-4 flex flex-col ${
                  isMobileView &&
                  !selectedItem &&
                  !selectedProblem &&
                  !selectedSolvedProblem &&
                  !selectedQuizAttempt &&
                  !selectedLearningPath
                    ? "hidden"
                    : "block"
                }`}
              >
                {/* Mobile Back Button */}
                {isMobileView &&
                  (selectedItem ||
                    selectedProblem ||
                    selectedSolvedProblem ||
                    selectedQuizAttempt ||
                    selectedLearningPath) && (
                    <button
                      onClick={handleBackToList}
                      className="flex items-center space-x-2 mb-4 p-2 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors w-fit"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="text-sm">Back to List</span>
                    </button>
                  )}

                {selectedSolvedProblem ? (
                  <SolvedProblemDetails problem={selectedSolvedProblem} />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <h4 className="text-lg font-medium text-gray-400 mb-2">
                        {isMobileView
                          ? "Select a Solved Problem"
                          : "Select a Solved Problem"}
                      </h4>
                      <p className="text-gray-500 text-sm">
                        {isMobileView
                          ? "Tap on a solved problem from the list to view its details"
                          : "Choose a solved problem from the list to view your solution and test results."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quiz Attempts Tab */}
          {activeTab === "quiz-attempts" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-[500px]">
              {/* Quiz Attempts List */}
              <div
                className={`xl:col-span-1 bg-black rounded-2xl border border-gray-700/50 p-4 flex flex-col ${
                  isMobileView &&
                  (selectedItem || selectedProblem || selectedSolvedProblem || selectedQuizAttempt || selectedLearningPath)
                    ? "hidden"
                    : "block"
                }`}
              >
                <div className="mb-4">
                  <h3 className="font-bold text-lg mb-3">
                    Quiz History ({quizAttempts.length})
                  </h3>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search quiz attempts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {filteredQuizAttempts.length === 0 ? (
                    <div className="text-center py-8 h-full flex items-center justify-center">
                      <div>
                        <BarChart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <h4 className="text-base font-medium text-gray-400 mb-2">
                          {searchQuery
                            ? "No quiz attempts found"
                            : "No quiz attempts yet"}
                        </h4>
                        <p className="text-gray-500 text-sm">
                          {searchQuery
                            ? "Try a different search term"
                            : "Complete quizzes to see your attempts here."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 h-full overflow-y-auto custom-scrollbar-thin">
                      {filteredQuizAttempts.map((attempt) => {
                        const getScoreColor = (score) => {
                          if (score >= 90) return "text-yellow-400";
                          if (score >= 80) return "text-purple-400";
                          if (score >= 70) return "text-blue-400";
                          if (score >= 60) return "text-green-400";
                          return "text-orange-400";
                        };

                        return (
                          <div
                            key={attempt.id}
                            className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                              selectedQuizAttempt?.id === attempt.id
                                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-lg"
                                : "border-gray-600/30 hover:border-gray-500/50 bg-black hover:bg-gray-800/20"
                            }`}
                            onClick={() => handleQuizAttemptClick(attempt)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm mb-2 line-clamp-2">
                                  {attempt.quiz_data?.title || "Quiz Attempt"}
                                </h4>
                                <div className="flex flex-wrap gap-1 mb-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(attempt.score)} bg-gray-800/50`}>
                                    Score: {attempt.score}%
                                  </span>
                                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium border border-blue-500/30">
                                    {attempt.correct_answers}/{attempt.total_questions} Correct
                                  </span>
                                </div>
                                <div className="flex items-center text-xs text-gray-400">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {attempt.attempted_at
                                    ? new Date(attempt.attempted_at).toLocaleDateString()
                                    : "Recently attempted"}
                                </div>
                              </div>
                              <ChevronRight
                                className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 mt-1 ${
                                  selectedQuizAttempt?.id === attempt.id
                                    ? "text-[var(--color-primary)]"
                                    : ""
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Quiz Attempt Details */}
              <div
                className={`xl:col-span-2 bg-black rounded-2xl border border-gray-700/50 p-4 flex flex-col ${
                  isMobileView &&
                  !selectedItem &&
                  !selectedProblem &&
                  !selectedSolvedProblem &&
                  !selectedQuizAttempt &&
                  !selectedLearningPath
                    ? "hidden"
                    : "block"
                }`}
              >
                {/* Mobile Back Button */}
                {isMobileView &&
                  (selectedItem ||
                    selectedProblem ||
                    selectedSolvedProblem ||
                    selectedQuizAttempt ||
                    selectedLearningPath) && (
                    <button
                      onClick={handleBackToList}
                      className="flex items-center space-x-2 mb-4 p-2 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors w-fit"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="text-sm">Back to List</span>
                    </button>
                  )}

                {selectedQuizAttempt ? (
                  <QuizAttemptDetails attempt={selectedQuizAttempt} />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <BarChart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <h4 className="text-lg font-medium text-gray-400 mb-2">
                        {isMobileView
                          ? "Select a Quiz Attempt"
                          : "Select a Quiz Attempt"}
                      </h4>
                      <p className="text-gray-500 text-sm">
                        {isMobileView
                          ? "Tap on a quiz attempt from the list to view its details"
                          : "Choose a quiz attempt from the list to view your performance and results."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Learning Paths Tab */}
          {activeTab === "learning-paths" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-[500px]">
              {/* Learning Paths List */}
              <div
                className={`xl:col-span-1 bg-black rounded-2xl border border-gray-700/50 p-4 flex flex-col ${
                  isMobileView &&
                  (selectedItem || selectedProblem || selectedSolvedProblem || selectedQuizAttempt || selectedLearningPath)
                    ? "hidden"
                    : "block"
                }`}
              >
                <div className="mb-4">
                  <h3 className="font-bold text-lg mb-3">
                    Learning Paths ({learningPaths.length})
                  </h3>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search learning paths..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {filteredLearningPaths.length === 0 ? (
                    <div className="text-center py-8 h-full flex items-center justify-center">
                      <div>
                        <Map className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <h4 className="text-base font-medium text-gray-400 mb-2">
                          {searchQuery
                            ? "No learning paths found"
                            : "No learning paths yet"}
                        </h4>
                        <p className="text-gray-500 text-sm">
                          {searchQuery
                            ? "Try a different search term"
                            : "Generate learning paths from the AI Mentor to see them here."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 h-full overflow-y-auto custom-scrollbar-thin">
                      {filteredLearningPaths.map((path) => (
                        <div
                          key={path.id}
                          className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                            selectedLearningPath?.id === path.id
                              ? "border-blue-500 bg-blue-500/10 shadow-lg"
                              : "border-gray-600/30 hover:border-gray-500/50 bg-black hover:bg-gray-800/20"
                          }`}
                          onClick={() => handleLearningPathClick(path)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm mb-2 line-clamp-2">
                                {path.topic}
                              </h4>
                              <div className="flex flex-wrap gap-1 mb-2">
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium border border-blue-500/30">
                                  {path.level}
                                </span>
                                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium border border-purple-500/30">
                                  {path.learning_plan?.day_wise_plan?.length || 0} Days
                                </span>
                              </div>
                              <div className="flex items-center text-xs text-gray-400">
                                <Calendar className="w-3 h-3 mr-1" />
                                {path.created_at
                                  ? new Date(path.created_at).toLocaleDateString()
                                  : "Recently created"}
                              </div>
                            </div>
                            <ChevronRight
                              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 mt-1 ${
                                selectedLearningPath?.id === path.id
                                  ? "text-blue-400"
                                  : ""
                              }`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Learning Path Details */}
              <div
                className={`xl:col-span-2 bg-black rounded-2xl border border-gray-700/50 p-4 flex flex-col ${
                  isMobileView &&
                  !selectedItem &&
                  !selectedProblem &&
                  !selectedSolvedProblem &&
                  !selectedQuizAttempt &&
                  !selectedLearningPath
                    ? "hidden"
                    : "block"
                }`}
              >
                {/* Mobile Back Button */}
                {isMobileView &&
                  (selectedItem ||
                    selectedProblem ||
                    selectedSolvedProblem ||
                    selectedQuizAttempt ||
                    selectedLearningPath) && (
                    <button
                      onClick={handleBackToList}
                      className="flex items-center space-x-2 mb-4 p-2 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors w-fit"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="text-sm">Back to List</span>
                    </button>
                  )}

                {selectedLearningPath ? (
                  <LearningPathDetails path={selectedLearningPath} />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Map className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <h4 className="text-lg font-medium text-gray-400 mb-2">
                        {isMobileView
                          ? "Select a Learning Path"
                          : "Select a Learning Path"}
                      </h4>
                      <p className="text-gray-500 text-sm">
                        {isMobileView
                          ? "Tap on a learning path from the list to view its details"
                          : "Choose a learning path from the list to view the detailed curriculum and resources."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;