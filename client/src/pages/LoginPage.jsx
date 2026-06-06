import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    userType: "user", // user, agent, admin
  });
  const [formError, setFormError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setFormError("Email and password are required");
      return;
    }

    const result = await login(
      formData.email,
      formData.password,
      formData.userType,
    );

    if (result.success) {
      navigate(
        formData.userType === "admin"
          ? "/admin"
          : formData.userType === "agent"
            ? "/agent"
            : "/user",
      );
    } else {
      setFormError(result.error || "Login failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-center mb-6">Login to B1G CRM</h2>

      {(error || formError) && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
          {error || formError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          User Type
        </label>
        <select
          name="userType"
          value={formData.userType}
          onChange={handleChange}
          className="input"
        >
          <option value="user">User (Tenant)</option>
          <option value="agent">Agent</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="your@email.com"
          className="input"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Password
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          className="input"
          required
        />
      </div>

      <button type="submit" className="btn-primary w-full" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </button>

      <p className="text-center text-gray-400 text-sm">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-primary-500 hover:text-primary-400"
        >
          Register here
        </Link>
      </p>
    </form>
  );
}
