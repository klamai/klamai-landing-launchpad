
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { LogoutButton } from "@/components/LogoutButton";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold text-gray-900">YourApp</div>
        <div className="flex items-center">
          {user && (
            <span className="text-sm text-gray-600 mr-4">
              Welcome, {user.email}
            </span>
          )}
          <LogoutButton />
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Build Something
          <span className="text-blue-600"> Amazing</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Transform your ideas into reality with our powerful platform. 
          Start building today and see what's possible.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" className="px-8">
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Link to="/chat">
            <Button variant="outline" size="lg" className="px-8">
              Try Chat
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover the features that make our platform the perfect choice for your next project.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-8 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Lightning Fast</h3>
            <p className="text-gray-600">
              Built for speed and performance. Experience blazing fast load times and smooth interactions.
            </p>
          </div>
          
          <div className="text-center p-8 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Reliable</h3>
            <p className="text-gray-600">
              99.9% uptime guaranteed. Your applications will always be available when you need them.
            </p>
          </div>
          
          <div className="text-center p-8 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Team Friendly</h3>
            <p className="text-gray-600">
              Collaborate seamlessly with your team. Built-in tools for sharing and working together.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who are already building amazing things.
          </p>
          <Button size="lg" variant="secondary" className="px-8">
            Start Your Journey <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-gray-200 mt-20">
        <div className="text-center text-gray-600">
          <p>&copy; 2024 YourApp. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
