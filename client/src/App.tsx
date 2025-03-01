import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Nav from "@/components/nav";
import Home from "@/pages/home";
import Chat from "@/pages/chat";
import Quiz from "@/pages/quiz";
import Learn from "@/pages/learn";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/chat/:topicId" component={Chat} />
      <Route path="/quiz/:topicId" component={Quiz} />
      <Route path="/learn/:topicId" component={Learn} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Nav />
        <main className="container mx-auto px-4 py-8">
          <Router />
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;