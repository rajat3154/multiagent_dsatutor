import React, { useState, useRef, useContext } from "react";
import {
  Send,
  Upload,
  FileText,
  Image,
  X,
  Bot,
  User,
  Sparkles,
  Lightbulb,
  Code2,
  Copy,
  Download,
  Brain,
  Zap,
  Crown,
  MessageSquare,
  BookOpen,
  ChevronRight,
  RotateCcw,
  Calendar,
  Target,
  BookMarked,
  CheckCircle,
  ArrowRight,
  Clock,
  BarChart3,
  PlayCircle,
  ExternalLink,
  ChevronLeft,
  Trophy,
  Star,
  Rocket,
  GraduationCap,
  Shield,
  Gem,
  PieChart,
  Flame,
  TrendingUp,
  Award,
  Edit3,
  Check,
  Search,
  Layers,
  Link2,
} from "lucide-react";
import Navbar from "@/shared/Navbar";
import { UserContext } from "@/contexts/UserContext";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

// Apply the same theme variables
const applyTheme = () => {
  const root = document.documentElement;
  root.style.setProperty("--color-bg", "#000000");
  root.style.setProperty("--color-text", "#ffffff");
  root.style.setProperty("--color-primary", "#F26B0A");
  root.style.setProperty("--font-main", "system-ui, -apple-system, sans-serif");
};

const AIMentor = () => {
  const { user } = useContext(UserContext);
  const [activeMode, setActiveMode] = useState(null);
  const [query, setQuery] = useState("");
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Learning Path States - FIXED: Proper initial state
  const [learningForm, setLearningForm] = useState({
    topic: "",
    subtopics: "",
    level: "Beginner",
  });

  const [learningPath, setLearningPath] = useState(null);
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [isEditingSubtopic, setIsEditingSubtopic] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [customSubtopic, setCustomSubtopic] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const topicInputRef = useRef(null);
  const subtopicInputRef = useRef(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL;
  const isAuthenticated = user.isLoggedIn;

  // Apply theme on component mount
  React.useEffect(() => {
    applyTheme();
  }, []);

  // Initialize highlight.js
  React.useEffect(() => {
    hljs.configure({
      languages: [
        "javascript",
        "python",
        "java",
        "cpp",
        "c",
        "html",
        "css",
        "typescript",
        "php",
        "ruby",
        "go",
        "rust",
        "sql",
      ],
    });
  }, []);

  // Get authentication token
  const getAuthToken = () => {
    return localStorage.getItem("token");
  };

  // Scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  // Highlight code blocks
  const highlightCode = (code, language = "") => {
    try {
      if (language && hljs.getLanguage(language)) {
        return hljs.highlight(code, { language }).value;
      } else {
        const result = hljs.highlightAuto(code);
        return result.value;
      }
    } catch (e) {
      return hljs.highlightAuto(code).value;
    }
  };

  // Edit handlers - FIXED: Proper state updates
  const handleEditTopic = () => {
    setCustomTopic(learningForm.topic);
    setIsEditingTopic(true);
    setTimeout(() => {
      topicInputRef.current?.focus();
      topicInputRef.current?.select();
    }, 10);
  };

  const handleSaveTopic = () => {
    if (customTopic.trim()) {
      setLearningForm((prev) => ({ ...prev, topic: customTopic.trim() }));
    }
    setIsEditingTopic(false);
  };

  const handleEditSubtopic = () => {
    setCustomSubtopic(learningForm.subtopics);
    setIsEditingSubtopic(true);
    setTimeout(() => {
      subtopicInputRef.current?.focus();
      subtopicInputRef.current?.select();
    }, 10);
  };

  const handleSaveSubtopic = () => {
    if (customSubtopic.trim()) {
      setLearningForm((prev) => ({
        ...prev,
        subtopics: customSubtopic.trim(),
      }));
    }
    setIsEditingSubtopic(false);
  };

  // Handle key press for form inputs (topic and subtopic)
  const handleFormKeyPress = (e, type) => {
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

  // Format AI response to handle code blocks with syntax highlighting
  const formatResponse = (text) => {
    if (!text) return null;

    const elements = [];
    let currentIndex = 0;
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    let match;
    let lastIndex = 0;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      const textBefore = text.slice(lastIndex, match.index);
      if (textBefore.trim()) {
        elements.push(...formatTextContent(textBefore));
      }

      // Add code block
      const language = match[1] || "";
      const codeContent = match[2].trim();

      elements.push(
        <CodeBlock
          key={`code-${currentIndex}`}
          code={codeContent}
          language={language}
        />
      );

      lastIndex = match.index + match[0].length;
      currentIndex++;
    }

    // Add remaining text after last code block
    const remainingText = text.slice(lastIndex);
    if (remainingText.trim()) {
      elements.push(...formatTextContent(remainingText));
    }

    return elements;
  };

  // Format regular text content with markdown support
  const formatTextContent = (text) => {
    const blocks = text.split(/(^|\n)---\s*\n/);

    const elements = [];
    let blockIndex = 0;

    blocks.forEach((block, index) => {
      if (index % 3 === 2) {
        elements.push(
          <hr
            key={`hr-${blockIndex}`}
            className="my-4 border-t border-gray-700"
          />
        );
        blockIndex++;
        return;
      }

      if (!block.trim()) return;

      const lines = block.split("\n");
      let currentListItems = [];

      lines.forEach((line, lineIndex) => {
        const lineKey = `${blockIndex}-${lineIndex}`;

        if (!line.trim()) {
          if (elements.length > 0 && !currentListItems.length) {
            elements.push(<div key={`empty-${lineKey}`} className="h-2" />);
          }
          return;
        }

        if (line.trim() === "---") {
          elements.push(
            <hr
              key={`hr-inline-${lineKey}`}
              className="my-4 border-t border-gray-700"
            />
          );
          return;
        }

        // Process markdown formatting
        let formattedLine = line
          // Headers
          .replace(
            /^#### (.*$)/gim,
            '<h4 class="text-lg font-bold text-white mt-4 mb-2">$1</h4>'
          )
          .replace(
            /^### (.*$)/gim,
            '<h3 class="text-xl font-bold text-white mt-4 mb-2">$1</h3>'
          )
          .replace(
            /^## (.*$)/gim,
            '<h2 class="text-2xl font-bold text-white mt-5 mb-2">$1</h2>'
          )
          .replace(
            /^# (.*$)/gim,
            '<h1 class="text-3xl font-bold text-white mt-5 mb-3">$1</h1>'
          )

          // Bold and italic
          .replace(/\*\*\*(.*?)\*\*\*/gim, "<strong><em>$1</em></strong>")
          .replace(
            /\*\*(.*?)\*\*/gim,
            '<strong class="font-semibold text-white">$1</strong>'
          )
          .replace(/\*(.*?)\*/gim, '<em class="italic text-gray-300">$1</em>')

          // Inline code
          .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')

          // Lists
          .replace(/^\s*[\-\*\+]\s+(.*)/gm, '<li class="my-1">$1</li>')
          .replace(/^\s*\d+\.\s+(.*)/gm, '<li class="my-1">$1</li>')

          // Blockquotes
          .replace(
            /^>\s+(.*)/gm,
            '<blockquote class="border-l-4 border-[var(--color-primary)] pl-4 my-3 text-gray-300 italic bg-gray-950/30 py-2 rounded-r">$1</blockquote>'
          )

          // Links
          .replace(
            /\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 underline">$1</a>'
          );

        // Check line types
        const isListItem =
          line.trim().match(/^[\-\*\+]\s/) || line.trim().match(/^\d+\.\s/);
        const isHeader = line.trim().match(/^#{1,6}\s/);
        const isBlockquote = line.trim().match(/^>\s/);

        if (isListItem) {
          currentListItems.push(
            <div
              key={lineKey}
              className="text-gray-200 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formattedLine }}
            />
          );
        } else {
          if (currentListItems.length > 0) {
            elements.push(
              <ul key={`list-${blockIndex}`} className="my-2 ml-4 space-y-1">
                {currentListItems}
              </ul>
            );
            currentListItems = [];
          }

          if (isHeader || isBlockquote) {
            elements.push(
              <div
                key={lineKey}
                className="text-gray-200 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formattedLine }}
              />
            );
          } else {
            elements.push(
              <div
                key={lineKey}
                className="text-gray-200 leading-relaxed my-1.5"
                dangerouslySetInnerHTML={{ __html: formattedLine }}
              />
            );
          }
        }
      });

      if (currentListItems.length > 0) {
        elements.push(
          <ul key={`list-final-${blockIndex}`} className="my-2 ml-4 space-y-1">
            {currentListItems}
          </ul>
        );
      }

      blockIndex++;
    });

    return elements;
  };

  // Code Block Component
  const CodeBlock = ({ code, language }) => {
    const highlightedCode = highlightCode(code, language);
    const detectedLanguage =
      language || hljs.highlightAuto(code).language || "text";

    return (
      <div className="my-6 rounded-xl overflow-hidden border border-gray-700 bg-gray-950">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-950 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-mono text-gray-300 capitalize">
              {detectedLanguage}
            </span>
          </div>
          <button
            onClick={() => copyToClipboard(code)}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors rounded bg-gray-700 hover:bg-gray-600"
          >
            <Copy className="w-3 h-3" />
            <span>Copy</span>
          </button>
        </div>

        <pre className="p-4 overflow-x-auto text-sm leading-6 font-mono bg-gray-950">
          <code
            className={`hljs language-${detectedLanguage} block`}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>
      </div>
    );
  };

  // Enhanced CSS for code blocks and markdown
  React.useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .inline-code {
        background: rgba(139, 92, 246, 0.2);
        color: rgb(196, 181, 253);
        padding: 0.2rem 0.4rem;
        border-radius: 0.375rem;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.9em;
        border: 1px solid rgba(139, 92, 246, 0.3);
      }
      
      pre {
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
      }
      
      .hljs {
        background: transparent !important;
        padding: 0 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Handle file upload
  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith("image/")) {
        setImage(selectedFile);
        setFile(null);
      } else {
        setFile(selectedFile);
        setImage(null);
      }
    }
  };

  // Handle image upload
  const handleImageUpload = (event) => {
    const selectedImage = event.target.files[0];
    if (selectedImage && selectedImage.type.startsWith("image/")) {
      setImage(selectedImage);
      setFile(null);
    }
  };

  // Remove uploaded file/image
  const removeAttachment = () => {
    setImage(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  // Copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Download conversation
  const downloadConversation = () => {
    const conversationText = conversation
      .map(
        (msg) => `${msg.role === "user" ? "You" : "Mentor AI"}: ${msg.content}`
      )
      .join("\n\n");

    const blob = new Blob([conversationText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mentor-ai-conversation.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Send message to AI Mentor
  const sendMessage = async () => {
    if (!query.trim() && !image && !file) return;
    if (!isAuthenticated) {
      setError("Please log in to use AI Mentor");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const userMessage = {
      role: "user",
      content: query,
      timestamp: new Date().toISOString(),
      image: image ? URL.createObjectURL(image) : null,
      file: file ? { name: file.name, type: file.type } : null,
      rawContent: query,
    };

    setConversation((prev) => [...prev, userMessage]);

    try {
      const formData = new FormData();
      formData.append("query", query);
      if (image) formData.append("image", image);
      if (file) formData.append("file", file);

      const response = await fetch(`${API_URL}/api/mentor/solve-doubt`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to get mentor response");
      }

      const data = await response.json();

      const aiMessage = {
        role: "assistant",
        content: data.mentor_message,
        timestamp: new Date().toISOString(),
        mode: data.mode,
        rawContent: data.mentor_message,
      };

      setConversation((prev) => [...prev, aiMessage]);
      setQuery("");
      removeAttachment();
    } catch (err) {
      setError(err.message);
      console.error("Error sending message:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Format learning plan to ensure consistent structure
  const formatLearningPlan = (plan) => {
    if (!plan) {
      return {
        overview: "No learning plan generated.",
        objectives: [],
        recommended_resources: [],
        day_wise_plan: [],
        problems_to_strengthen_concepts: [],
        final_assessment: "No assessment provided.",
      };
    }

    if (typeof plan === "string") {
      return {
        overview: plan,
        objectives: [],
        recommended_resources: [],
        day_wise_plan: [],
        problems_to_strengthen_concepts: [],
        final_assessment: "No assessment provided.",
      };
    }

    return {
      overview: plan.overview || "No overview provided",
      objectives: Array.isArray(plan.objectives) ? plan.objectives : [],
      recommended_resources: Array.isArray(plan.recommended_resources)
        ? plan.recommended_resources.map((resource) => ({
            type: resource.type || "article",
            title: resource.title || "Untitled Resource",
            url: resource.url || "#",
          }))
        : [],
      day_wise_plan: Array.isArray(plan.day_wise_plan)
        ? plan.day_wise_plan.map((day, index) => ({
            day: day.day || index + 1,
            focus: day.focus || day.topic || "No focus specified",
            subtopics: Array.isArray(day.subtopics) ? day.subtopics : [],
            explanation: day.explanation || "No explanation provided",
            practice: Array.isArray(day.practice)
              ? day.practice
              : Array.isArray(day.practice_activities)
              ? day.practice_activities
              : [],
          }))
        : [],
      problems_to_strengthen_concepts: Array.isArray(
        plan.problems_to_strengthen_concepts
      )
        ? plan.problems_to_strengthen_concepts.map((problem) => ({
            title: problem.title || "Untitled Problem",
            platform: problem.platform || "Unknown Platform",
            url: problem.url || problem.link || "#",
            concept: problem.concept || "General Concept",
          }))
        : [],
      final_assessment:
        typeof plan.final_assessment === "object"
          ? JSON.stringify(plan.final_assessment)
          : plan.final_assessment || "No final assessment provided.",
    };
  };

  // Generate Learning Path - FIXED: Proper validation
  const generateLearningPath = async () => {
    const topic = learningForm.topic.trim();
    
    console.log("Current learningForm:", learningForm);
    console.log("Topic value:", topic);
    
    if (!topic) {
      setError("Please enter a topic");
      return;
    }

    if (!isAuthenticated) {
      setError("Please log in to generate learning paths");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      return;
    }

    setIsGeneratingPath(true);
    setError(null);

    try {
      const payload = {
        topic: topic,
        subtopics: learningForm.subtopics
          ? learningForm.subtopics.split(",").map((s) => s.trim())
          : [],
        level: learningForm.level,
      };

      console.log("Sending learning path request:", payload);

      const response = await fetch(`${API_URL}/api/mentor/learning-path`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate learning path");
      }

      const data = await response.json();

      console.log("Received learning path:", data);

      // Create complete learning path object with properly formatted data
      const completeLearningPath = {
        topic: data.topic || topic,
        level: data.level || learningForm.level,
        image_url:
          data.image_url ||
          "https://miro.medium.com/1*hZ3m0uurJl2VZ8nDYdu5QA.png",
        sources: Array.isArray(data.sources) ? data.sources : [],
        learning_plan: formatLearningPlan(data.learning_plan || data),
      };

      setLearningPath(completeLearningPath);
    } catch (err) {
      setError(err.message);
      console.error("Error generating learning path:", err);
    } finally {
      setIsGeneratingPath(false);
    }
  };

  // Clear conversation
  const clearConversation = () => {
    setConversation([]);
    setError(null);
  };

  // Clear learning path
  const clearLearningPath = () => {
    setLearningPath(null);
    setLearningForm({
      topic: "",
      subtopics: "",
      level: "Beginner",
    });
  };

  // Handle key press for message input (Enter to send)
  const handleMessageKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Sample starter questions
  const starterQuestions = [
    "How do I fix this React useEffect infinite loop?",
    "Explain Python list comprehensions with examples",
    "What's the difference between let, const, and var in JavaScript?",
    "How do I center a div with CSS?",
    "Can you help me understand recursion?",
  ];

  const handleStarterQuestion = (question) => {
    setQuery(question);
  };

  // Resource type icons
  const getResourceIcon = (type) => {
    switch (type) {
      case "video":
        return (
          <div className="w-10 h-10 bg-gray-950 rounded-xl flex items-center justify-center">
            <PlayCircle className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
        );
      case "article":
        return (
          <div className="w-10 h-10 bg-gray-950 rounded-xl flex items-center justify-center">
            <BookMarked className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
        );
      case "practice":
        return (
          <div className="w-10 h-10 bg-gray-950 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
        );
      case "discussion":
        return (
          <div className="w-10 h-10 bg-gray-950 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
        );
      case "interactive":
        return (
          <div className="w-10 h-10 bg-gray-950 rounded-xl flex items-center justify-center">
            <Code2 className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-950 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
        );
    }
  };

  // Get resource type label
  const getResourceTypeLabel = (type) => {
    switch (type) {
      case "video":
        return "Video Tutorial";
      case "article":
        return "Article";
      case "practice":
        return "Practice Platform";
      case "discussion":
        return "Community Discussion";
      case "interactive":
        return "Interactive Tutorial";
      default:
        return "Resource";
    }
  };

  // Back to mode selection
  const backToModeSelection = () => {
    setActiveMode(null);
    setConversation([]);
    setLearningPath(null);
    setError(null);
  };

  return (
    <>
      <Navbar />
      <div className="flex h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-[var(--font-main)] overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="p-4 border-b border-gray-800 bg-black flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {activeMode && (
                <button
                  onClick={backToModeSelection}
                  className="p-2 rounded-lg bg-gray-950 hover:bg-gray-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <div className="p-2 bg-gray-950 rounded-lg">
                <Brain className="w-5 h-5 text-[var(--color-primary)]" />
              </div>
              <div>
                <h1 className="text-lg font-bold">AI Coding Mentor</h1>
                <p className="text-xs text-gray-400">
                  {activeMode === "doubt"
                    ? "Get instant help with your coding problems"
                    : activeMode === "learning"
                    ? "Create personalized learning paths"
                    : "Get personalized guidance and structured learning paths"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {conversation.length > 0 && activeMode === "doubt" && (
                <>
                  <button
                    onClick={downloadConversation}
                    className="flex items-center space-x-1 px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors text-xs"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export</span>
                  </button>
                  <button
                    onClick={clearConversation}
                    className="flex items-center space-x-1 px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors text-xs"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </>
              )}
              {learningPath && activeMode === "learning" && (
                <button
                  onClick={clearLearningPath}
                  className="flex items-center space-x-1 px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors text-xs"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>New Path</span>
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {!activeMode ? (
              // Enhanced Mode Selection Cards
              <div className="h-full flex items-center justify-center p-4 md:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 w-full max-w-6xl">
                  {/* Doubt Solving Card - Enhanced */}
                  <div
                    onClick={() => setActiveMode("doubt")}
                    className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
                  >
                    <div className="bg-black rounded-3xl p-8 md:p-10 border-2 border-gray-800 hover:border-[var(--color-primary)]/60 transition-all duration-300 h-full shadow-2xl hover:shadow-[var(--color-primary)]/10">
                      <div className="text-center">
                        {/* Enhanced Icon Container */}
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-900 to-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:from-[var(--color-primary)]/20 group-hover:to-[var(--color-primary)]/5 transition-all duration-300 border border-gray-800 group-hover:border-[var(--color-primary)]/30 shadow-lg">
                          <MessageSquare className="w-12 h-12 text-[var(--color-primary)] group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        
                        {/* Enhanced Title */}
                        <h3 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                          Doubt Solving
                        </h3>
                        
                        {/* Enhanced Description */}
                        <p className="text-gray-400 text-base md:text-lg mb-6 leading-relaxed">
                          Get instant, personalized help with coding problems, debugging, 
                          and concept explanations with step-by-step guidance and real-time solutions.
                        </p>

                        {/* Feature Highlights */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full"></div>
                            <span>Code Debugging</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full"></div>
                            <span>File Upload</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full"></div>
                            <span>Step-by-Step</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full"></div>
                            <span>Real-time Help</span>
                          </div>
                        </div>

                        {/* Enhanced CTA */}
                        <div className="flex items-center justify-center space-x-2 text-[var(--color-primary)] group-hover:text-[var(--color-primary)]/80 transition-colors">
                          <span className="font-semibold text-lg">Start Solving</span>
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Learning Path Card - Enhanced */}
                  <div
                    onClick={() => setActiveMode("learning")}
                    className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
                  >
                    <div className="bg-black rounded-3xl p-8 md:p-10 border-2 border-gray-800 hover:border-[var(--color-primary)]/60 transition-all duration-300 h-full shadow-2xl hover:shadow-[var(--color-primary)]/10">
                      <div className="text-center">
                        {/* Enhanced Icon Container */}
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-900 to-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:from-[var(--color-primary)]/20 group-hover:to-[var(--color-primary)]/5 transition-all duration-300 border border-gray-800 group-hover:border-[var(--color-primary)]/30 shadow-lg">
                          <BookMarked className="w-12 h-12 text-[var(--color-primary)] group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        
                        {/* Enhanced Title */}
                        <h3 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                          Learning Path
                        </h3>
                        
                        {/* Enhanced Description */}
                        <p className="text-gray-400 text-base md:text-lg mb-6 leading-relaxed">
                          Create personalized learning journeys with structured plans, 
                          curated resources, practice exercises, and progress tracking.
                        </p>

                        {/* Feature Highlights */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full"></div>
                            <span>Structured Plans</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full"></div>
                            <span>Curated Resources</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full"></div>
                            <span>Practice Exercises</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full"></div>
                            <span>Progress Tracking</span>
                          </div>
                        </div>

                        {/* Enhanced CTA */}
                        <div className="flex items-center justify-center space-x-2 text-[var(--color-primary)] group-hover:text-[var(--color-primary)]/80 transition-colors">
                          <span className="font-semibold text-lg">Start Learning</span>
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeMode === "doubt" ? (
              /* Doubt Solving Interface - Mobile Responsive */
              <div className="h-full flex flex-col lg:flex-row">
                {/* Left Panel - Input Section */}
                <div className="w-full lg:w-1/4 border-b lg:border-b-0 lg:border-r border-gray-800 bg-black flex flex-col">
                  <div className="p-4 border-b border-gray-800">
                    <h2 className="text-lg font-bold mb-2 flex items-center">
                      <MessageSquare className="w-5 h-5 text-[var(--color-primary)] mr-2" />
                      Ask Your Question
                    </h2>
                    <p className="text-gray-400 text-xs">
                      Describe your coding problem or upload files for help
                    </p>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {/* Error Display */}
                    {error && (
                      <div className="bg-red-900/20 border border-red-800/50 p-3 rounded-lg">
                        <div className="flex items-center text-red-300">
                          <X className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">{error}</span>
                        </div>
                      </div>
                    )}

                    {/* Attachment Preview */}
                    {(image || file) && (
                      <div>
                        <div className="flex items-center space-x-2 p-3 bg-gray-950 rounded-lg border border-gray-700">
                          {image ? (
                            <>
                              <Image className="w-4 h-4 text-[var(--color-primary)]" />
                              <span className="text-sm text-gray-300 flex-1">
                                {image.name}
                              </span>
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                              <span className="text-sm text-gray-300 flex-1">
                                {file.name}
                              </span>
                            </>
                          )}
                          <button
                            onClick={removeAttachment}
                            className="p-1 hover:bg-gray-950 rounded transition-colors"
                          >
                            <X className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Text Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Your Question
                      </label>
                      <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={handleMessageKeyPress}
                        placeholder="Describe your coding problem, paste code, or ask for explanations..."
                        className="w-full h-32 p-3 bg-gray-950 border border-gray-700 rounded-lg focus:outline-none focus:border-[var(--color-primary)] resize-none custom-scrollbar text-white placeholder-gray-400 text-sm"
                        disabled={isLoading}
                      />
                    </div>

                    {/* File Upload Buttons */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Attach Files
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="file"
                          ref={imageInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          onClick={() => imageInputRef.current?.click()}
                          className="flex-1 p-3 bg-gray-950 border border-gray-700 rounded-lg hover:border-[var(--color-primary)] transition-colors flex items-center justify-center space-x-2 text-sm"
                        >
                          <Image className="w-4 h-4 text-[var(--color-primary)]" />
                          <span className="text-gray-300">Image</span>
                        </button>

                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 p-3 bg-gray-950 border border-gray-700 rounded-lg hover:border-[var(--color-primary)] transition-colors flex items-center justify-center space-x-2 text-sm"
                        >
                          <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                          <span className="text-gray-300">File</span>
                        </button>
                      </div>
                    </div>

                    {/* Starter Questions */}
                    <div className="hidden lg:block">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Quick Start Questions
                      </label>
                      <div className="space-y-2">
                        {starterQuestions.map((question, index) => (
                          <button
                            key={index}
                            onClick={() => handleStarterQuestion(question)}
                            className="w-full p-3 text-left bg-gray-950 border border-gray-700 rounded-lg hover:border-[var(--color-primary)] transition-colors text-xs text-gray-300 hover:text-white"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Send Button */}
                    <button
                      onClick={sendMessage}
                      disabled={(!query.trim() && !image && !file) || isLoading}
                      className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:border-gray-800 rounded-lg transition-colors font-medium text-sm flex items-center justify-center space-x-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Getting Answer...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Question</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right Panel - Conversation */}
                <div className="flex-1 flex flex-col">
                  {/* Conversation Header */}
                  <div className="p-4 border-b border-gray-800 bg-black">
                    <h2 className="text-lg font-bold mb-2 flex items-center">
                      <Bot className="w-5 h-5 text-[var(--color-primary)] mr-2" />
                      Conversation with Mentor AI
                    </h2>
                    <p className="text-gray-400 text-xs">
                      {conversation.length > 0
                        ? `${conversation.length} messages`
                        : "Your conversation will appear here"}
                    </p>
                  </div>

                  {/* Conversation Area - Full Width */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {conversation.length === 0 ? (
                      // Empty State
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-gray-950 rounded-xl flex items-center justify-center border border-gray-700">
                          <MessageSquare className="w-8 h-8 text-[var(--color-primary)]" />
                        </div>
                        <h3 className="text-lg font-bold">
                          Start a Conversation
                        </h3>
                        <p className="text-gray-400 text-sm max-w-md">
                          Ask your first question or use one of the quick start
                          questions to begin
                        </p>
                      </div>
                    ) : (
                      // Conversation Messages - Full Width
                      <div className="w-full space-y-4">
                        {conversation.map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${
                              message.role === "user"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-full lg:max-w-4xl rounded-lg p-4 border ${
                                message.role === "user"
                                  ? "bg-gray-950 border-gray-700"
                                  : "bg-gray-950 border-gray-700"
                              }`}
                            >
                              {/* Message Header */}
                              <div className="flex items-center space-x-2 mb-3">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    message.role === "user"
                                      ? "bg-[var(--color-primary)]"
                                      : "bg-gray-700"
                                  }`}
                                >
                                  {message.role === "user" ? (
                                    <User className="w-4 h-4 text-white" />
                                  ) : (
                                    <Bot className="w-4 h-4 text-white" />
                                  )}
                                </div>
                                <div>
                                  <span className="font-medium text-sm">
                                    {message.role === "user"
                                      ? "You"
                                      : "Mentor AI"}
                                  </span>
                                  {message.mode && (
                                    <span className="ml-2 px-2 py-1 bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/30 rounded-full text-xs text-[var(--color-primary)]">
                                      {message.mode}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {/* Attachments */}
                              {message.image && (
                                <div className="mb-3">
                                  <img
                                    src={message.image}
                                    alt="Uploaded"
                                    className="max-w-full lg:max-w-xs rounded-lg border border-gray-600"
                                  />
                                </div>
                              )}
                              {message.file && (
                                <div className="mb-3 flex items-center space-x-2 p-2 bg-gray-950 rounded border border-gray-700">
                                  <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                                  <span className="text-sm text-gray-300">
                                    {message.file.name}
                                  </span>
                                </div>
                              )}
                              {/* Message Content with Proper Formatting */}
                              <div className="text-gray-200 leading-relaxed space-y-2 text-sm">
                                {message.role === "assistant"
                                  ? formatResponse(message.content)
                                  : message.content
                                      .split("\n")
                                      .map((line, i) => (
                                        <div key={i} className="my-1">
                                          {line}
                                        </div>
                                      ))}
                              </div>
                              {/* Copy Button for AI Messages */}
                              {message.role === "assistant" && (
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      message.rawContent || message.content
                                    )
                                  }
                                  className="mt-3 flex items-center space-x-1 px-2 py-1 bg-gray-950 rounded text-xs text-gray-400 hover:text-white transition-colors border border-gray-700"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Response</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Loading Indicator */}
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="max-w-full lg:max-w-4xl rounded-lg p-4 bg-gray-950 border border-gray-700">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
                                  <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce"></div>
                                  <div
                                    className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce"
                                    style={{ animationDelay: "0.1s" }}
                                  ></div>
                                  <div
                                    className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce"
                                    style={{ animationDelay: "0.2s" }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Learning Path Interface - Mobile Responsive */
              <div className="h-full flex flex-col lg:flex-row">
                {/* Left Panel - Input Section */}
                <div className="w-full lg:w-1/4 border-b lg:border-b-0 lg:border-r border-gray-800 bg-black flex flex-col">
                  <div className="p-4 border-b border-gray-800">
                    <h2 className="text-lg font-bold mb-2 flex items-center">
                      <BookMarked className="w-5 h-5 text-[var(--color-primary)] mr-2" />
                      Create Learning Path
                    </h2>
                    <p className="text-gray-400 text-xs">
                      Generate personalized learning plans for any topic
                    </p>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {!learningPath ? (
                      // Learning Path Form - SIMPLIFIED VERSION
                      <div className="space-y-4">
                        {/* Error Display */}
                        {error && (
                          <div className="bg-red-900/20 border border-red-800/50 p-3 rounded-lg">
                            <div className="flex items-center text-red-300">
                              <X className="w-4 h-4 mr-2" />
                              <span className="text-sm font-medium">
                                {error}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Topic Input - SIMPLIFIED: Direct input without edit mode */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Topic *
                          </label>
                          <input
                            type="text"
                            value={learningForm.topic}
                            onChange={(e) => setLearningForm(prev => ({
                              ...prev,
                              topic: e.target.value
                            }))}
                            className="w-full p-3 bg-gray-950 border border-gray-700 rounded-lg focus:outline-none focus:border-[var(--color-primary)] text-sm"
                            placeholder="Enter your topic (e.g., Arrays, Strings, OOP)"
                          />
                        </div>

                        {/* Subtopic Input - SIMPLIFIED: Direct input without edit mode */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Specific Subtopics (Optional)
                          </label>
                          <input
                            type="text"
                            value={learningForm.subtopics}
                            onChange={(e) => setLearningForm(prev => ({
                              ...prev,
                              subtopics: e.target.value
                            }))}
                            className="w-full p-3 bg-gray-950 border border-gray-700 rounded-lg focus:outline-none focus:border-[var(--color-primary)] text-sm"
                            placeholder="e.g., sorting, searching, operations"
                          />
                        </div>

                        {/* Level Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Your Current Level
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {["Beginner", "Intermediate", "Advanced"].map(
                              (level) => (
                                <button
                                  key={level}
                                  onClick={() =>
                                    setLearningForm({
                                      ...learningForm,
                                      level,
                                    })
                                  }
                                  className={`p-3 border rounded-lg transition-colors text-sm ${
                                    learningForm.level === level
                                      ? "bg-[var(--color-primary)]/20 border-[var(--color-primary)]/50"
                                      : "bg-gray-950 border-gray-700 hover:border-gray-600"
                                  }`}
                                >
                                  {level}
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        {/* Generate Button - FIXED: Now properly enabled when topic has value */}
                        <button
                          onClick={generateLearningPath}
                          disabled={!learningForm.topic.trim() || isGeneratingPath}
                          className={`
                            w-full py-3 rounded-lg font-medium text-sm 
                            flex items-center justify-center space-x-2
                            transition-all duration-200
                            ${!learningForm.topic.trim() || isGeneratingPath
                              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                              : "bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                            }
                          `}
                        >
                          {isGeneratingPath ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Generating Learning Path...</span>
                            </>
                          ) : (
                            <>
                              <Rocket className="w-4 h-4" />
                              <span>Generate Learning Path</span>
                            </>
                          )}
                        </button>

                        {/* Debug Info - Remove in production */}
                        <div className="bg-gray-950 p-2 rounded text-xs text-gray-400">
                          <div>Topic: "{learningForm.topic}"</div>
                          <div>Topic trimmed: "{learningForm.topic.trim()}"</div>
                          <div>Is topic empty: {!learningForm.topic.trim() ? "Yes" : "No"}</div>
                        </div>
                      </div>
                    ) : (
                      // Learning Path Actions
                      <div className="space-y-4">
                        <div className="text-center p-4 bg-green-900/10 border border-green-800/50 rounded-lg">
                          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                          <h3 className="font-semibold text-sm">
                            Path Generated!
                          </h3>
                          <p className="text-gray-400 text-xs">
                            Your personalized learning path is ready to explore
                          </p>
                        </div>

                        <div className="space-y-2">
                          <button
                            onClick={clearLearningPath}
                            className="w-full py-2 bg-gray-950 border border-gray-700 rounded-lg hover:border-[var(--color-primary)] transition-colors text-[var(--color-primary)] font-medium text-sm"
                          >
                            Create New Path
                          </button>
                          <button
                            onClick={downloadConversation}
                            className="w-full py-2 bg-gray-950 border border-gray-700 rounded-lg hover:border-[var(--color-primary)] transition-colors text-[var(--color-primary)] font-medium text-sm"
                          >
                            Export Path
                          </button>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-gray-950 border border-gray-700 rounded-lg p-3">
                          <h4 className="font-semibold text-white mb-2 text-sm">
                            Path Overview
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="text-center">
                              <div className="text-[var(--color-primary)] font-semibold">
                                {learningPath.learning_plan?.day_wise_plan
                                  ?.length || 0}
                              </div>
                              <div className="text-gray-400">Days</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[var(--color-primary)] font-semibold">
                                {learningPath.learning_plan?.objectives
                                  ?.length || 0}
                              </div>
                              <div className="text-gray-400">Objectives</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[var(--color-primary)] font-semibold">
                                {learningPath.learning_plan
                                  ?.problems_to_strengthen_concepts?.length ||
                                  0}
                              </div>
                              <div className="text-gray-400">Problems</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[var(--color-primary)] font-semibold">
                                {learningPath.sources?.length || 0}
                              </div>
                              <div className="text-gray-400">Sources</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel - Learning Path Display */}
                <div className="flex-1 flex flex-col">
                  {/* Learning Path Header */}
                  <div className="p-4 border-b border-gray-800 bg-black">
                    <h2 className="text-lg font-bold mb-2 flex items-center">
                      <BookMarked className="w-5 h-5 text-[var(--color-primary)] mr-2" />
                      {learningPath
                        ? `${learningPath.topic} Learning Path`
                        : "Learning Path Preview"}
                    </h2>
                    <p className="text-gray-400 text-xs">
                      {learningPath
                        ? `Level: ${learningPath.level} • ${
                            learningPath.learning_plan?.day_wise_plan?.length ||
                            0
                          } days • ${
                            learningPath.learning_plan
                              ?.problems_to_strengthen_concepts?.length || 0
                          } practice problems`
                        : "Your generated learning path will appear here"}
                    </p>
                  </div>

                  {/* Learning Path Content - Full Width */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {!learningPath ? (
                      // Empty State
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-gray-950 rounded-xl flex items-center justify-center border border-gray-700">
                          <BookMarked className="w-8 h-8 text-[var(--color-primary)]" />
                        </div>
                        <h3 className="text-lg font-bold">Create Your Path</h3>
                        <p className="text-gray-400 text-sm max-w-md">
                          Fill out the form to generate a personalized learning
                          path for your chosen topic
                        </p>
                      </div>
                    ) : (
                      // Learning Path Display - Full Width
                      <div className="w-full space-y-6">
                        {/* Header with Image */}
                        {learningPath.image_url && (
                          <div className="flex justify-center mb-6">
                            <img
                              src={learningPath.image_url}
                              alt={learningPath.topic}
                              className="max-w-full lg:max-w-4xl w-full rounded-lg border border-gray-600"
                            />
                          </div>
                        )}

                        {/* Overview */}
                        <div className="bg-gray-950 border border-gray-700 rounded-lg p-4">
                          <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                            <Target className="w-5 h-5 text-[var(--color-primary)] mr-2" />
                            Overview
                          </h3>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {learningPath.learning_plan?.overview}
                          </p>
                        </div>

                        {/* Sources */}
                        {learningPath.sources &&
                          learningPath.sources.length > 0 && (
                            <div className="bg-gray-950 border border-gray-700 rounded-lg p-4">
                              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                                <BookMarked className="w-5 h-5 text-[var(--color-primary)] mr-2" />
                                Research Sources
                              </h3>
                              <div className="grid grid-cols-1 gap-3">
                                {learningPath.sources.map((source, index) => (
                                  <a
                                    key={index}
                                    href={source.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 bg-gray-950 rounded border border-gray-700 hover:border-[var(--color-primary)] transition-colors group"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-white group-hover:text-[var(--color-primary)] transition-colors truncate text-sm font-medium">
                                        {source.title}
                                      </h4>
                                      <p className="text-gray-400 text-xs truncate">
                                        {source.link}
                                      </p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[var(--color-primary)] transition-colors flex-shrink-0 ml-2" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Objectives & Resources Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Objectives */}
                          <div className="bg-gray-950 border border-gray-700 rounded-lg p-4">
                            <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                              <CheckCircle className="w-5 h-5 text-[var(--color-primary)] mr-2" />
                              Learning Objectives
                            </h3>
                            <ul className="space-y-2">
                              {learningPath.learning_plan?.objectives?.map(
                                (objective, index) => (
                                  <li
                                    key={index}
                                    className="flex items-start space-x-2 text-gray-300 text-sm"
                                  >
                                    <div className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full mt-2 flex-shrink-0"></div>
                                    <span className="leading-relaxed">
                                      {objective}
                                    </span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>

                          {/* Recommended Resources */}
                          <div className="bg-gray-950 border border-gray-700 rounded-lg p-4">
                            <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                              <BookMarked className="w-5 h-5 text-[var(--color-primary)] mr-2" />
                              Recommended Resources
                            </h3>
                            <div className="space-y-2">
                              {learningPath.learning_plan?.recommended_resources?.map(
                                (resource, index) => (
                                  <a
                                    key={index}
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-3 p-3 bg-gray-950 rounded border border-gray-700 hover:border-[var(--color-primary)] transition-colors group"
                                  >
                                    {getResourceIcon(resource.type)}
                                    <div className="flex-1 min-w-0">
                                      <div className="text-white group-hover:text-[var(--color-primary)] transition-colors truncate text-sm font-medium">
                                        {resource.title}
                                      </div>
                                      <div className="text-gray-400 text-xs capitalize">
                                        {getResourceTypeLabel(resource.type)}
                                      </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" />
                                  </a>
                                )
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Day-wise Plan */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-bold text-white flex items-center">
                            <Calendar className="w-5 h-5 text-[var(--color-primary)] mr-2" />
                            Day-wise Learning Plan
                          </h3>
                          {learningPath.learning_plan?.day_wise_plan?.map(
                            (day, index) => (
                              <div
                                key={index}
                                className="bg-gray-950 border border-gray-700 rounded-lg p-4 hover:border-[var(--color-primary)] transition-colors"
                              >
                                <div className="flex items-center space-x-3 mb-4">
                                  <div className="w-12 h-12 bg-[var(--color-primary)] rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="font-bold text-white text-sm">
                                      Day {day.day}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="text-base font-semibold text-white mb-1">
                                      {day.focus}
                                    </h4>
                                    <div className="flex items-center space-x-2 text-gray-400 text-xs">
                                      <Clock className="w-3 h-3" />
                                      <span>Daily Focus</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <h5 className="font-semibold text-gray-300 mb-2 flex items-center text-sm">
                                      <BookOpen className="w-4 h-4 mr-1 text-[var(--color-primary)]" />
                                      Subtopics Covered
                                    </h5>
                                    <div className="flex flex-wrap gap-1">
                                      {day.subtopics?.map(
                                        (subtopic, subIndex) => (
                                          <span
                                            key={subIndex}
                                            className="px-2 py-1 bg-gray-950 rounded text-gray-300 border border-gray-700 text-xs"
                                          >
                                            {subtopic}
                                          </span>
                                        )
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <h5 className="font-semibold text-gray-300 mb-2 flex items-center text-sm">
                                      <Target className="w-4 h-4 mr-1 text-[var(--color-primary)]" />
                                      Practice Exercises
                                    </h5>
                                    <ul className="space-y-1">
                                      {day.practice?.map(
                                        (exercise, exIndex) => (
                                          <li
                                            key={exIndex}
                                            className="text-gray-400 text-xs flex items-start space-x-1"
                                          >
                                            <div className="w-1 h-1 bg-[var(--color-primary)] rounded-full mt=2 flex-shrink-0"></div>
                                            <span className="leading-relaxed">
                                              {exercise}
                                            </span>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                </div>

                                {day.explanation && (
                                  <div className="p-3 bg-black rounded border border-gray-900">
                                    <p className="text-gray-300 text-xs leading-relaxed">
                                      <strong className="text-white">
                                        📚 Learning Context:
                                      </strong>{" "}
                                      {day.explanation}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>

                        {/* Practice Problems */}
                        {learningPath.learning_plan
                          ?.problems_to_strengthen_concepts?.length > 0 && (
                          <div className="bg-gray-950 border border-gray-700 rounded-lg p-4">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                              <BarChart3 className="w-5 h-5 text-[var(--color-primary)] mr-2" />
                              Practice Problems
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {learningPath.learning_plan.problems_to_strengthen_concepts.map(
                                (problem, index) => (
                                  <a
                                    key={index}
                                    href={problem.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-gray-950 border border-gray-700 rounded-lg p-3 hover:border-[var(--color-primary)] transition-colors group"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <h4 className="font-semibold text-white group-hover:text-[var(--color-primary)] transition-colors line-clamp-2 text-sm">
                                        {problem.title}
                                      </h4>
                                      <div className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300 flex-shrink-0 ml-2">
                                        {problem.platform}
                                      </div>
                                    </div>
                                    <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                                      {problem.concept}
                                    </p>
                                    <div className="flex items-center text-[var(--color-primary)] text-sm font-medium">
                                      <span>Solve Problem</span>
                                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                  </a>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* Final Assessment */}
                        {learningPath.learning_plan?.final_assessment && (
                          <div className="bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-lg p-4">
                            <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                              <Crown className="w-5 h-5 text-[var(--color-primary)] mr-2" />
                              Final Assessment & Goals
                            </h3>
                            <p className="text-gray-300 leading-relaxed text-sm">
                              {learningPath.learning_plan.final_assessment}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Custom Scrollbar Styles */}
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
        `}</style>
      </div>
    </>
  );
};

export default AIMentor;