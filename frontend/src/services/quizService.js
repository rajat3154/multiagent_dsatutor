import { getAuthToken } from './authService';

const API_URL = import.meta.env.VITE_BACKEND_URL;

// Quiz Attempts API Service
export const quizService = {
  // Get all quiz attempts for the current user
  async getQuizAttempts() {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/quiz/attempts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch quiz attempts: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
      throw error;
    }
  },

  // Get specific quiz attempt details
  async getQuizAttemptDetails(attemptId) {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/quiz/attempts/${attemptId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Quiz attempt not found');
        }
        throw new Error(`Failed to fetch quiz attempt details: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching quiz attempt details:', error);
      throw error;
    }
  },

  // Get user quiz statistics
  async getQuizStatistics() {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/quiz/statistics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch quiz statistics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching quiz statistics:', error);
      throw error;
    }
  },

  // Delete a quiz attempt
  async deleteQuizAttempt(attemptId) {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/quiz/attempts/${attemptId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Quiz attempt not found');
        }
        throw new Error(`Failed to delete quiz attempt: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting quiz attempt:', error);
      throw error;
    }
  },

  // Generate a new quiz
  async generateQuiz(quizData) {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/generate-quizzes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizData),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate quiz: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw error;
    }
  },

  // Evaluate quiz answers
  async evaluateQuiz(quizId, answers) {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/evaluate-quiz/${quizId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: answers,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to evaluate quiz: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error evaluating quiz:', error);
      throw error;
    }
  },
};

// Hook for using quiz attempts in React components
export const useQuizAttempts = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAttempts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await quizService.getQuizAttempts();
      setAttempts(data.attempts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, []);

  const refetch = () => {
    fetchAttempts();
  };

  return { attempts, loading, error, refetch };
};