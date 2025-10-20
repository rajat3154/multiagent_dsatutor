import React, { useState, useEffect, useRef, useContext } from "react";
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  FileText,
  Target,
  Zap,
  Clock,
  Star,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Download,
  Share2,
  Copy,
  RotateCcw,
  Settings,
  X,
  Edit3,
  Check,
  Menu,
  Search,
  ExternalLink,
  Layers,
  Link2,
  Globe,
  Book,
  FileSearch,
  Cpu,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { applyTheme } from "./theme";
import Navbar from "@/shared/Navbar";
import { UserContext } from "@/contexts/UserContext";

const TopicUnderstanding = () => {
  const { user } = useContext(UserContext);

  useEffect(() => {
    applyTheme();
  }, []);

  const [dataStructures, setDataStructures] = useState([
    {
      id: 1,
      name: "Arrays",
      open: false,
      subtopics: [
        { id: 11, name: "Introduction to Arrays" },
        { id: 12, name: "Array Operations" },
        { id: 13, name: "Multi-dimensional Arrays" },
        { id: 14, name: "Dynamic Arrays" },
        { id: 15, name: "Array Problems & Patterns" },
      ],
    },
    {
      id: 2,
      name: "Linked Lists",
      open: false,
      subtopics: [
        { id: 21, name: "Singly Linked Lists" },
        { id: 22, name: "Doubly Linked Lists" },
        { id: 23, name: "Circular Linked Lists" },
        { id: 24, name: "Linked List Operations" },
        { id: 25, name: "Advanced Linked List Problems" },
      ],
    },
    {
      id: 3,
      name: "Stacks",
      open: false,
      subtopics: [
        { id: 31, name: "Introduction to Stacks" },
        { id: 32, name: "Implementation (Array & Linked List)" },
        { id: 33, name: "Applications of Stacks" },
        { id: 34, name: "Stack Problems (Parentheses, Next Greater)" },
      ],
    },
    {
      id: 4,
      name: "Queues",
      open: false,
      subtopics: [
        { id: 41, name: "Introduction to Queues" },
        { id: 42, name: "Circular Queue" },
        { id: 43, name: "Deque (Double-Ended Queue)" },
        { id: 44, name: "Priority Queue" },
        { id: 45, name: "Queue Problems" },
      ],
    },
    {
      id: 5,
      name: "Trees",
      open: false,
      subtopics: [
        { id: 51, name: "Binary Trees" },
        { id: 52, name: "Binary Search Trees (BST)" },
        { id: 53, name: "Tree Traversals (DFS, BFS)" },
        { id: 54, name: "Heaps" },
        { id: 55, name: "Advanced Trees (AVL, Segment Tree, Trie)" },
      ],
    },
  ]);

  const [selectedTopic, setSelectedTopic] = useState("Arrays");
  const [selectedSubtopic, setSelectedSubtopic] = useState("Dynamic Arrays");
  const [language, setLanguage] = useState("python");
  const [difficulty, setDifficulty] = useState("beginner");
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState(null);
  const [markdownContent, setMarkdownContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingTitle, setStreamingTitle] = useState("");
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [isEditingSubtopic, setIsEditingSubtopic] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [customSubtopic, setCustomSubtopic] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSources, setShowSources] = useState(false);
  const [sources, setSources] = useState([]);
  const [currentStage, setCurrentStage] = useState("");
  const [searchProgress, setSearchProgress] = useState([]);
  const streamingIndexRef = useRef(0);
  const streamingIntervalRef = useRef(null);
  const topicInputRef = useRef(null);
  const subtopicInputRef = useRef(null);
  const contentEndRef = useRef(null);
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const languages = [
    { id: "python", name: "Python" },
    { id: "java", name: "Java" },
    { id: "javascript", name: "JavaScript" },
    { id: "c++", name: "C++" },
  ];

  const difficulties = [
    { id: "beginner", name: "Beginner" },
    { id: "intermediate", name: "Intermediate" },
    { id: "advanced", name: "Advanced" },
  ];

  // Search stages configuration
  const searchStages = [
    {
      id: "analyzing",
      name: "Analyzing Topic",
      description: "Understanding the concept and key terms",
      icon: FileSearch,
      color: "text-blue-400",
      bgColor: "bg-blue-500",
    },
    {
      id: "wikipedia",
      name: "Searching Wikipedia",
      description: "Looking for academic definitions and explanations",
      icon: Book,
      color: "text-green-400",
      bgColor: "bg-green-500",
    },
    {
      id: "arxiv",
      name: "Searching Research Papers",
      description: "Finding relevant academic papers and studies",
      icon: FileText,
      color: "text-purple-400",
      bgColor: "bg-purple-500",
    },
    {
      id: "web",
      name: "Web Search",
      description: "Gathering practical examples and tutorials",
      icon: Globe,
      color: "text-orange-400",
      bgColor: "bg-orange-500",
    },
    {
      id: "synthesizing",
      name: "Synthesizing Information",
      description: "Combining sources and generating explanation",
      icon: Cpu,
      color: "text-pink-400",
      bgColor: "bg-pink-500",
    },
    {
      id: "generating",
      name: "Generating Content",
      description: "Creating the final explanation with code examples",
      icon: Sparkles,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500",
    },
  ];

  // Get token from localStorage using UserContext
  const getAuthToken = () => {
    return localStorage.getItem("token");
  };

  const filteredDataStructures = dataStructures
    .map((ds) => ({
      ...ds,
      subtopics: ds.subtopics.filter(
        (subtopic) =>
          subtopic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ds.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((ds) => ds.subtopics.length > 0);

  const toggleDropdown = (id) => {
    setDataStructures(
      dataStructures.map((ds) =>
        ds.id === id ? { ...ds, open: !ds.open } : ds
      )
    );
  };

  const categorizeSources = (sources) => {
    const categorized = {
      wikipedia: [],
      arxiv: [],
      web: [],
    };

    sources.forEach((source) => {
      const link = source.link?.toLowerCase() || "";
      if (link.includes("wikipedia.org")) {
        categorized.wikipedia.push({ ...source, type: "wikipedia" });
      } else if (link.includes("arxiv.org")) {
        categorized.arxiv.push({ ...source, type: "arxiv" });
      } else {
        categorized.web.push({ ...source, type: "web" });
      }
    });

    return categorized;
  };

  const simulateSearchProgress = () => {
    setSearchProgress([]);
    let currentIndex = 0;

    const progressInterval = setInterval(() => {
      if (currentIndex < searchStages.length) {
        const stage = searchStages[currentIndex];
        setCurrentStage(stage.id);
        setSearchProgress((prev) => [...prev, stage.id]);
        currentIndex++;
      } else {
        clearInterval(progressInterval);
      }
    }, 1200);

    return progressInterval;
  };

  const streamResponse = (title, text, sources = []) => {
    setIsStreaming(true);
    setStreamingTitle(title);
    setStreamingContent("");
    setSources(sources);
    streamingIndexRef.current = 0;

    clearInterval(streamingIntervalRef.current);

    streamingIntervalRef.current = setInterval(() => {
      if (streamingIndexRef.current < text.length) {
        setStreamingContent((prev) => prev + text[streamingIndexRef.current]);
        streamingIndexRef.current++;
      } else {
        clearInterval(streamingIntervalRef.current);
        setIsStreaming(false);
        setContent({
          title: title,
          content: text,
          sources: sources,
        });
      }
    }, 10);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setShowSources(false);
    setCurrentStage("");
    setSearchProgress([]);

    const token = getAuthToken();
    if (!token) {
      setError("Please log in to generate explanations");
      setIsGenerating(false);
      return;
    }

    // Start simulating search progress
    const progressInterval = simulateSearchProgress();

    try {
      const response = await fetch(`${API_URL}/api/generate-explaination`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          concept: selectedSubtopic,
          language: language,
          difficulty: difficulty,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        throw new Error("Failed to generate explanation");
      }

      const data = await response.json();

      // Clear the progress simulation
      clearInterval(progressInterval);
      setCurrentStage("generating");
      setSearchProgress(searchStages.map((stage) => stage.id));

      if (data.markdown_content) {
        setMarkdownContent(data.markdown_content);
      } else {
        setMarkdownContent(`# ${data.title}\n\n${data.content}`);
      }

      // Use the sources from the response or fallback to default ones
      const responseSources = data.sources || [
        {
          title: "Stack Data Structure",
          link: "https://www.geeksforgeeks.org/dsa/stack-data-structure/",
        },
        {
          title: "Stack (abstract data type)",
          link: "https://en.wikipedia.org/wiki/Stack_(abstract_data_type)",
        },
        {
          title: "Stack Algorithm",
          link: "https://www.tutorialspoint.com/data_structures_algorithms/stack_algorithm.htm",
        },
        {
          title: "Efficient Stack Implementations - Research Paper",
          link: "https://arxiv.org/abs/2105.12345",
        },
        {
          title: "DSA Stacks Tutorial",
          link: "https://www.w3schools.com/dsa/dsa_data_stacks.php",
        },
      ];

      streamResponse(data.title, data.content, responseSources);
    } catch (err) {
      clearInterval(progressInterval);
      setCurrentStage("");
      setSearchProgress([]);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (markdownContent) {
      const blob = new Blob([markdownContent], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedSubtopic
        .toLowerCase()
        .replace(/\s+/g, "-")}-explanation.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleEditTopic = () => {
    setCustomTopic(selectedTopic);
    setIsEditingTopic(true);
    setTimeout(() => {
      topicInputRef.current?.focus();
      topicInputRef.current?.select();
    }, 10);
  };

  const handleSaveTopic = () => {
    if (customTopic.trim()) {
      setSelectedTopic(customTopic.trim());
    }
    setIsEditingTopic(false);
  };

  const handleEditSubtopic = () => {
    setCustomSubtopic(selectedSubtopic);
    setIsEditingSubtopic(true);
    setTimeout(() => {
      subtopicInputRef.current?.focus();
      subtopicInputRef.current?.select();
    }, 10);
  };

  const handleSaveSubtopic = () => {
    if (customSubtopic.trim()) {
      setSelectedSubtopic(customSubtopic.trim());
    }
    setIsEditingSubtopic(false);
  };

  const handleKeyPress = (e, type) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (type === "topic") {
        handleSaveTopic();
      } else {
        handleSaveSubtopic();
      }
    } else if (e.key === "Escape") {
      if (type === "topic") {
        setIsEditingTopic(false);
      } else {
        setIsEditingSubtopic(false);
      }
    }
  };

  const handleTopicSelect = (topic, subtopic) => {
    setSelectedTopic(topic);
    setSelectedSubtopic(subtopic);
    setIsSidebarOpen(false);
    setIsEditingTopic(false);
    setIsEditingSubtopic(false);
  };

  // Scroll to bottom when content updates
  useEffect(() => {
    if (contentEndRef.current && (isStreaming || content)) {
      contentEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamingContent, content, isStreaming]);

  const SourcesPanel = ({ sources, isOpen, onClose }) => {
    if (!isOpen) return null;

    const categorizedSources = categorizeSources(sources);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-black text-white border border-gray-700 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-lg font-bold flex items-center">
              <Layers className="w-5 h-5 mr-2 text-[var(--color-primary)]" />
              Research Sources
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {/* Wikipedia Sources */}
            {categorizedSources.wikipedia.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <Book className="w-5 h-5 text-green-400 mr-2" />
                  <h4 className="font-semibold text-green-400">Wikipedia</h4>
                  <span className="ml-2 text-xs bg-green-900 text-green-300 px-2 py-1 rounded-full">
                    {categorizedSources.wikipedia.length} sources
                  </span>
                </div>
                <div className="grid gap-3">
                  {categorizedSources.wikipedia.map((source, index) => (
                    <SourceCard
                      key={index}
                      source={source}
                      index={index}
                      type="wikipedia"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ArXiv Sources */}
            {categorizedSources.arxiv.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <FileText className="w-5 h-5 text-purple-400 mr-2" />
                  <h4 className="font-semibold text-purple-400">
                    Research Papers
                  </h4>
                  <span className="ml-2 text-xs bg-purple-900 text-purple-300 px-2 py-1 rounded-full">
                    {categorizedSources.arxiv.length} sources
                  </span>
                </div>
                <div className="grid gap-3">
                  {categorizedSources.arxiv.map((source, index) => (
                    <SourceCard
                      key={index}
                      source={source}
                      index={index}
                      type="arxiv"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Web Sources */}
            {categorizedSources.web.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <Globe className="w-5 h-5 text-blue-400 mr-2" />
                  <h4 className="font-semibold text-blue-400">Web Resources</h4>
                  <span className="ml-2 text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded-full">
                    {categorizedSources.web.length} sources
                  </span>
                </div>
                <div className="grid gap-3">
                  {categorizedSources.web.map((source, index) => (
                    <SourceCard
                      key={index}
                      source={source}
                      index={index}
                      type="web"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400 text-center">
                These sources were used to generate the explanation above.
                Always verify information from multiple references.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SourceCard = ({ source, index, type }) => {
    const getTypeColor = (type) => {
      switch (type) {
        case "wikipedia":
          return "border-green-500/30 hover:border-green-400";
        case "arxiv":
          return "border-purple-500/30 hover:border-purple-400";
        case "web":
          return "border-blue-500/30 hover:border-blue-400";
        default:
          return "border-gray-600 hover:border-gray-500";
      }
    };

    const getTypeIcon = (type) => {
      switch (type) {
        case "wikipedia":
          return Book;
        case "arxiv":
          return FileText;
        case "web":
          return Globe;
        default:
          return ExternalLink;
      }
    };

    const IconComponent = getTypeIcon(type);

    return (
      <div
        className={`bg-gray-900 rounded-lg p-4 border ${getTypeColor(
          type
        )} transition-colors group`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${
                  type === "wikipedia"
                    ? "bg-green-500"
                    : type === "arxiv"
                    ? "bg-purple-500"
                    : "bg-blue-500"
                }`}
              >
                {index + 1}
              </div>
              <h4 className="font-semibold text-sm group-hover:text-[var(--color-primary)] transition-colors">
                {source.title}
              </h4>
            </div>
            <p className="text-gray-400 text-xs mb-3 line-clamp-2">
              {source.link}
            </p>
            <div className="flex items-center justify-between">
              <a
                href={source.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 text-xs font-medium"
              >
                <IconComponent className="w-3 h-3 mr-1" />
                Visit Source
              </a>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  type === "wikipedia"
                    ? "bg-green-900/50 text-green-300"
                    : type === "arxiv"
                    ? "bg-purple-900/50 text-purple-300"
                    : "bg-blue-900/50 text-blue-300"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SearchStageLoader = () => {
    if (!isGenerating) return null;

    return (
      <div className="flex flex-col items-center justify-center min-h-96 py-8">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-[var(--color-primary)]/20 rounded-full blur-lg animate-pulse"></div>
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-[var(--color-primary)]/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin"></div>
            <div className="absolute inset-3 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
              <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-ping"></div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-2xl">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-[var(--color-primary)] mb-2">
              Researching {selectedSubtopic}
            </h3>
            <p className="text-gray-400 text-sm">
              Gathering the best information from multiple sources...
            </p>
          </div>

          <div className="space-y-3">
            {searchStages.map((stage, index) => {
              const isActive = stage.id === currentStage;
              const isCompleted = searchProgress.includes(stage.id);
              const StageIcon = stage.icon;

              return (
                <div
                  key={stage.id}
                  className={`flex items-center p-4 rounded-lg border transition-all duration-500 ${
                    isActive
                      ? "bg-gray-800 border-[var(--color-primary)]/50 shadow-lg shadow-[var(--color-primary)]/10"
                      : isCompleted
                      ? "bg-gray-800/50 border-green-500/20"
                      : "bg-gray-900/30 border-gray-700/30 opacity-60"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-all duration-500 ${
                      isActive
                        ? `${stage.bgColor} text-white scale-110`
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-gray-600 text-gray-400"
                    }`}
                  >
                    <StageIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`font-semibold text-sm transition-colors ${
                          isActive
                            ? stage.color
                            : isCompleted
                            ? "text-green-400"
                            : "text-gray-400"
                        }`}
                      >
                        {stage.name}
                      </span>
                      <div className="flex items-center">
                        {isActive && (
                          <div className="flex space-x-1 mr-2">
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 0.2}s` }}
                              />
                            ))}
                          </div>
                        )}
                        {isCompleted && (
                          <Check className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">{stage.description}</p>
                    {isActive && (
                      <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
                        <div
                          className="bg-[var(--color-primary)] h-1 rounded-full animate-pulse"
                          style={{ width: "70%" }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const MarkdownRenderer = ({ content, isStreaming }) => {
    if (!content) return null;

    return (
      <div className="markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            h1: ({ node, ...props }) => (
              <h1
                className="text-xl sm:text-2xl font-bold mt-6 sm:mt-8 mb-3 sm:mb-4 text-[var(--color-primary)] border-b border-gray-700 pb-2"
                {...props}
              />
            ),
            h2: ({ node, ...props }) => (
              <h2
                className="text-lg sm:text-xl font-bold mt-6 sm:mt-8 mb-3 sm:mb-4 flex items-center border-b border-gray-700 pb-2"
                {...props}
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[var(--color-primary)]" />
                {props.children}
              </h2>
            ),
            h3: ({ node, ...props }) => (
              <h3
                className="text-base sm:text-lg font-semibold mt-4 sm:mt-6 mb-2 sm:mb-3 text-[var(--color-primary)]"
                {...props}
              />
            ),
            p: ({ node, ...props }) => (
              <p
                className="mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base"
                {...props}
              />
            ),
            ul: ({ node, ...props }) => (
              <ul
                className="list-disc list-inside mb-3 sm:mb-4 space-y-1 text-sm sm:text-base"
                {...props}
              />
            ),
            ol: ({ node, ...props }) => (
              <ol
                className="list-decimal list-inside mb-3 sm:mb-4 space-y-1 text-sm sm:text-base"
                {...props}
              />
            ),
            li: ({ node, ...props }) => (
              <li className="ml-3 sm:ml-4" {...props} />
            ),
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto my-4 sm:my-6 text-sm">
                <table
                  className="w-full border-collapse border border-gray-600 min-w-[500px]"
                  {...props}
                />
              </div>
            ),
            th: ({ node, ...props }) => (
              <th
                className="border border-gray-600 px-2 sm:px-4 py-1 sm:py-2 bg-gray-800 font-semibold text-left text-xs sm:text-sm"
                {...props}
              />
            ),
            td: ({ node, ...props }) => (
              <td
                className="border border-gray-600 px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm"
                {...props}
              />
            ),
            code: ({ node, inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <div className="code-block-wrapper my-4 sm:my-6">
                  <div className="flex justify-between items-center bg-gray-800 px-3 sm:px-4 py-1 sm:py-2 text-xs text-gray-400">
                    <span>{match[1]}</span>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(String(children))
                      }
                      className="hover:text-white transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <pre
                    className={`${className} overflow-x-auto p-3 sm:p-4 bg-gray-900 text-xs sm:text-sm`}
                    {...props}
                  >
                    <code className={className}>{children}</code>
                  </pre>
                </div>
              ) : (
                <code
                  className="bg-gray-800 px-1.5 py-0.5 rounded text-xs sm:text-sm text-[var(--color-primary)]"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-4 border-[var(--color-primary)] pl-3 sm:pl-4 italic my-3 sm:my-4 text-gray-400 text-sm sm:text-base"
                {...props}
              />
            ),
            a: ({ node, ...props }) => (
              <a
                className="text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 underline text-sm sm:text-base"
                {...props}
              />
            ),
            strong: ({ node, ...props }) => (
              <strong className="font-bold text-blue-400" {...props} />
            ),
          }}
        >
          {isStreaming ? content + "▌" : content}
        </ReactMarkdown>
      </div>
    );
  };

  const isAuthenticated = user.isLoggedIn;

  return (
    <>
      <Navbar />
      <div className="flex h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-[var(--font-main)] overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Full screen on mobile */}
        <div
          className={`
          fixed lg:static inset-y-0 left-0 z-50 w-full lg:w-64 bg-black border-r border-gray-800 flex flex-col overflow-hidden custom-scrollbar
          transform transition-transform duration-300 ease-in-out
          ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
        >
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Data Structures</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-1 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400">Select a topic to explore</p>

            {/* Search Bar */}
            <div className="mt-3 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-2">
              {filteredDataStructures.map((ds) => (
                <div key={ds.id} className="mb-1">
                  <button
                    className="w-full text-left p-3 rounded-lg flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                    onClick={() => toggleDropdown(ds.id)}
                  >
                    <span className="font-medium text-sm sm:text-base">
                      {ds.name}
                    </span>
                    {ds.open ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {ds.open && (
                    <div className="ml-3 sm:ml-4 pl-2 border-l border-gray-700">
                      {ds.subtopics.map((subtopic) => (
                        <button
                          key={subtopic.id}
                          className={`w-full text-left p-2 rounded-lg transition-colors text-xs sm:text-sm ${
                            selectedSubtopic === subtopic.name
                              ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]"
                              : "hover:bg-gray-800/30"
                          }`}
                          onClick={() =>
                            handleTopicSelect(ds.name, subtopic.name)
                          }
                        >
                          {subtopic.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Configuration Panel - Always Open */}
          <div className="w-full lg:w-1/3 p-3 sm:p-4 lg:p-6 border-r border-gray-800 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-bold flex items-center text-sm sm:text-base">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[var(--color-primary)]" />
                Configuration
              </h3>
            </div>

            <div className="bg-black p-3 sm:p-4 lg:p-5 rounded-xl mb-4 sm:mb-6">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2 flex items-center justify-between">
                    <span>Topic</span>
                    {!isEditingTopic && (
                      <button
                        onClick={handleEditTopic}
                        className="text-gray-400 hover:text-[var(--color-primary)] p-1"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                  </label>
                  {isEditingTopic ? (
                    <div className="flex items-center gap-2">
                      <input
                        ref={topicInputRef}
                        type="text"
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, "topic")}
                        className="w-full p-2 sm:p-3 bg-gray-950 border border-[var(--color-primary)]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm sm:text-base"
                      />
                      <button
                        onClick={handleSaveTopic}
                        className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded-lg"
                      >
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="w-full p-2 sm:p-3 bg-gray-950 border border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 transition-colors text-sm sm:text-base"
                      onClick={handleEditTopic}
                    >
                      {selectedTopic}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2 flex items-center justify-between">
                    <span>Subtopic</span>
                    {!isEditingSubtopic && (
                      <button
                        onClick={handleEditSubtopic}
                        className="text-gray-400 hover:text-[var(--color-primary)] p-1"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                  </label>
                  {isEditingSubtopic ? (
                    <div className="flex items-center gap-2">
                      <input
                        ref={subtopicInputRef}
                        type="text"
                        value={customSubtopic}
                        onChange={(e) => setCustomSubtopic(e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, "subtopic")}
                        className="w-full p-2 sm:p-3 bg-gray-950 border border-[var(--color-primary)]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm sm:text-base"
                      />
                      <button
                        onClick={handleSaveSubtopic}
                        className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded-lg"
                      >
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="w-full p-2 sm:p-3 bg-gray-950 border border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 transition-colors text-sm sm:text-base"
                      onClick={handleEditSubtopic}
                    >
                      {selectedSubtopic}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">
                    Programming Language
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.id}
                        className={`p-2 rounded-lg border transition-colors text-xs ${
                          language === lang.id
                            ? "bg-[var(--color-primary)]/20 border-[var(--color-primary)]/50"
                            : "bg-gray-950 border-gray-600 hover:bg-gray-600"
                        }`}
                        onClick={() => setLanguage(lang.id)}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-1 sm:gap-2">
                    {difficulties.map((diff) => (
                      <button
                        key={diff.id}
                        className={`p-2 rounded-lg border transition-colors text-xs ${
                          difficulty === diff.id
                            ? "bg-[var(--color-primary)]/20 border-[var(--color-primary)]/50"
                            : "bg-gray-950 border-gray-600 hover:bg-gray-600"
                        }`}
                        onClick={() => setDifficulty(diff.id)}
                      >
                        <span className="block text-xs mb-1">
                          {diff.id === "beginner" && "🌱"}
                          {diff.id === "intermediate" && "🚀"}
                          {diff.id === "advanced" && "🔥"}
                        </span>
                        <span className="text-xs">{diff.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-medium py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  onClick={handleGenerate}
                  disabled={isGenerating || isStreaming || !isAuthenticated}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  {isGenerating || isStreaming ? (
                    <>
                      <div className="relative z-10 flex items-center">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span className="text-xs sm:text-sm">
                          {isStreaming ? "Streaming..." : "Researching..."}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 relative z-10" />
                      <span className="relative z-10">
                        {isAuthenticated
                          ? "Generate Explanation"
                          : "Please Log In"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-gray-800/50 p-3 sm:p-4 lg:p-5 rounded-xl">
              <h3 className="font-bold mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[var(--color-primary)]" />
                Pro Tips
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li className="flex items-start">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Select specific topics for focused learning</span>
                </li>
                <li className="flex items-start">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Choose your preferred programming language</span>
                </li>
                <li className="flex items-start">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Adjust difficulty based on your knowledge</span>
                </li>
                <li className="flex items-start">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    Generated explanations are saved to your learning history
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Content Display */}
          <div className="w-full lg:w-2/3 p-3 sm:p-4 lg:p-6 overflow-y-auto custom-scrollbar">
            {error && (
              <div className="bg-red-900/20 border border-red-800/50 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6">
                <div className="flex items-center text-red-300">
                  <X className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="font-medium text-sm sm:text-base">
                    Error
                  </span>
                </div>
                <p className="text-red-300 mt-2 text-xs sm:text-sm">{error}</p>
              </div>
            )}

            {isGenerating && !isStreaming ? (
              <SearchStageLoader />
            ) : isStreaming || content ? (
              <div className="prose prose-invert max-w-none">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold mb-2">
                      {isStreaming ? streamingTitle : content.title}
                    </h1>
                    <div className="flex items-center text-xs sm:text-sm text-gray-400 flex-wrap gap-1 sm:gap-2">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        AI-Generated
                      </span>
                      <span>•</span>
                      <span>
                        {difficulty.charAt(0).toUpperCase() +
                          difficulty.slice(1)}{" "}
                        level
                      </span>
                      <span>•</span>
                      <span>
                        {languages.find((l) => l.id === language)?.name}{" "}
                        examples
                      </span>
                      {isAuthenticated && (
                        <>
                          <span>•</span>
                          <span className="text-green-400 text-xs">
                            Saved to profile
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSources(true)}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors flex items-center text-xs"
                      title="View Sources"
                    >
                      <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
                      onClick={handleGenerate}
                      disabled={isGenerating || isStreaming || !isAuthenticated}
                      title="Regenerate"
                    >
                      <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                {isStreaming ? (
                  <MarkdownRenderer
                    content={streamingContent}
                    isStreaming={true}
                  />
                ) : (
                  <MarkdownRenderer
                    content={content.content}
                    isStreaming={false}
                  />
                )}

                {/* Sources button at the bottom */}
                <div className="mt-8 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => setShowSources(true)}
                    className="inline-flex items-center text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 font-medium text-sm"
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    View Research Sources ({sources.length})
                  </button>
                </div>

                <div ref={contentEndRef} />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center mt-40">
                <div className="text-center max-w-md px-4">
                  <div className="bg-gray-800/50 p-4 sm:p-5 rounded-full inline-block mb-3 sm:mb-4">
                    <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--color-primary)]" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold mb-2">
                    Welcome to Topic Explanations
                  </h2>
                  <p className="text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">
                    {isAuthenticated
                      ? `Hi ${user.name}! Select a data structure, subtopic, programming language, and difficulty level to get started. Your progress will be saved to your learning history.`
                      : "Please log in to access AI-powered explanations and track your learning progress."}
                  </p>
                  <button
                    className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-medium py-2 px-3 sm:py-2 sm:px-4 rounded-lg transition-colors flex items-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    onClick={handleGenerate}
                    disabled={!isAuthenticated}
                  >
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    {isAuthenticated ? "Generate Explanation" : "Please Log In"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sources Modal */}
      <SourcesPanel
        sources={sources}
        isOpen={showSources}
        onClose={() => setShowSources(false)}
      />

      {/* CSS for styling */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(55, 65, 81, 0.3);
          border-radius: 2px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.5);
          border-radius: 2px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.7);
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        /* Mobile-specific optimizations */
        @media (max-width: 640px) {
          .markdown-content pre {
            font-size: 0.75rem;
          }

          .markdown-content table {
            font-size: 0.7rem;
          }

          .markdown-content code {
            word-break: break-word;
          }
        }

        @media (max-width: 768px) {
          .prose {
            font-size: 0.875rem;
          }

          .prose h1 {
            font-size: 1.25rem;
          }

          .prose h2 {
            font-size: 1.125rem;
          }

          .prose h3 {
            font-size: 1rem;
          }
        }
      `}</style>
    </>
  );
};

export default TopicUnderstanding;
