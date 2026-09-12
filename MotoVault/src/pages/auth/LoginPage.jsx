import React, { useState } from "react";
import LoginPageImg from "@/assets/LoginPage.png";
import Logo from "@/assets/Logo.png";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      if (!email || !password) {
        alert("Please fill in both email and password fields.");
        return;
      }
      // API will be added later
      console.log("Email:", email);
      console.log("Password:", password);
    } catch (error) {
      console.error("Error during login:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_20%_20%,#18345f_0%,#0b1d38_40%,#07152d_65%,#123f8a_100%)]">
      <div
        style={{ backgroundImage: `url(${LoginPageImg})` }}
        className="hidden md:block md:w-1/2 min-h-screen bg-cover bg-center"
      />

      <div className="w-full md:w-1/2 min-h-screen relative flex items-center justify-center px-8 lg:px-16 py-10 text-white">
        {/* Logo */}
        <img
          src={Logo}
          alt="MotoVault Logo"
          className="
    absolute
    top-8
    left-4
    lg:left-8
    w-52
    sm:w-60
    h-auto
  "
        />

        {/* Login Content */}
        <div className="w-full max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-semibold">WELCOME BACK!</h1>
          <p className="text-sm text-gray-200 mt-2">
            Sign in to continue to the MotoVault
          </p>
          {/* form... */}{" "}
          <form onSubmit={handleSubmit} className="mt-8">
            <div>
              <label htmlFor="email" className="block font-semibold mb-2">
                Email
              </label>

              <div className="relative">
                <Mail className="absolute left-4 top-0 h-12 w-5 text-gray-300" />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="
                    w-full h-12
                    rounded-xl
                    border border-gray-600
                    bg-transparent
                    pl-12 pr-5
                    text-white
                    placeholder:text-gray-500
                    outline-none
                    font-normal
                    transition
                    focus:border-primary
                    focus:ring-1 focus:ring-primary
                  "
                />
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="password" className="block font-semibold mb-2">
                Password
              </label>

              <div className="relative">
                {/* Lock Icon */}
                <Lock className="absolute left-4 top-0 h-12 w-5 text-gray-300" />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className=" w-full h-12  rounded-xl    border border-gray-600 bg-transparent
        pl-12 pr-12 text-white placeholder:text-gray-500 outline-none font-normal transition
        focus:border-primary focus:ring-1 focus:ring-primary"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-0 h-12 flex items-center text-gray-300 hover:text-white transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end mt-3">
              <button
                type="button"
                className="text-sm text-gray-300 hover:text-primary transition"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full
                mt-6
                h-12
                rounded-xl
                bg-primary
                text-white
                font-medium
                cursor-pointer
                transition-all
                duration-300
                hover:bg-[#d86b38]
                hover:text-white
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
