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
import CoachPage from "@/pages/coach";
import LearnLibrary from "@/pages/learn/index";
import LessonDetail from "@/pages/learn/lesson";
import CommunityPage from "@/pages/community/index";
import DailyCheckin from "@/pages/daily/index";
import PanicButton from "@/pages/panic/index";
import SeedGarden from "@/pages/garden/index";
import GrowthTimeline from "@/pages/garden/timeline";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/welcome" />} />
      <Route path="/welcome" component={Welcome} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/personalize" component={Personalize} />
      <Route path="/results" component={Results} />
      <Route path="/home" component={Home} />
      <Route path="/coach" component={CoachPage} />
      <Route path="/learn" component={LearnLibrary} />
      <Route path="/learn/:lessonId" component={LessonDetail} />
      <Route path="/community" component={CommunityPage} />
      <Route path="/daily" component={DailyCheckin} />
      <Route path="/panic" component={PanicButton} />
      <Route path="/garden" component={SeedGarden} />
      <Route path="/timeline" component={GrowthTimeline} />

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
