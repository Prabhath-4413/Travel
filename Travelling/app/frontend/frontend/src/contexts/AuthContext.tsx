import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  userId: number;
  name: string;
  email: string;
  role: "user" | "admin";
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Initialize state from localStorage synchronously
const getInitialUser = (): User | null => {
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser && parsedUser.userId && parsedUser.role) {
        console.log("Initial user from localStorage:", parsedUser);
        return parsedUser;
      }
    }
  } catch (error) {
    console.error("Error parsing initial user data:", error);
  }
  return null;
};

const getInitialToken = (): string | null => {
  return localStorage.getItem("token");
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [token, setToken] = useState<string | null>(getInitialToken);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Validate stored data on mount
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser || !parsedUser.userId || !parsedUser.role) {
          console.error("Invalid user data in localStorage, clearing");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("refreshToken");
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error("Error validating stored user data:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("refreshToken");
        setUser(null);
        setToken(null);
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid email or password");
        }
        throw new Error("Login failed. Please try again.");
      }

      const data = await response.json();

      if (!data.accessToken && !data.token) {
        throw new Error("Invalid response from server");
      }

      const accessToken = data.accessToken || data.token;
      const refreshToken = data.refreshToken;

      const userData: User = {
        userId: data.userId,
        name: data.name,
        email: email,
        role: data.role,
      };

      console.log("Login successful, user data:", userData);

      setToken(accessToken);
      setUser(userData);

      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      console.log("User data saved to localStorage");
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Please make sure the backend is running.",
        );
      }
      throw error;
    }
  };

  const googleLogin = async (credential: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/google`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ credential }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Google login failed");
      }

      const data = await response.json();

      if (!data.accessToken && !data.token) {
        throw new Error("Invalid response from server");
      }

      const accessToken = data.accessToken || data.token;
      const refreshToken = data.refreshToken;

      const userData: User = {
        userId: data.userId,
        name: data.name,
        email: data.email,
        role: data.role,
        picture: data.picture,
      };

      console.log("Google login successful, user data:", userData);

      setToken(accessToken);
      setUser(userData);

      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      console.log("User data saved to localStorage");
    } catch (error) {
      console.error("Google login error:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Please make sure the backend is running.",
        );
      }
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refreshToken");
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    googleLogin,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
