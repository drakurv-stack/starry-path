import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Welcome from "@/pages/welcome";
import Onboarding from "@/pages/onboarding";
import Personalize from "@/pages/personalize";
import Results from "@/pages/results";
import Home from "@/pages/home";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/welcome" />} />
      <Route path="/welcome" component={Welcome} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/personalize" component={Personalize} />
      <Route path="/results" component={Results} />
      <Route path="/home" component={Home} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
