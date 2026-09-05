import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Cart from "@/pages/Cart";
import Admin from "@/pages/Admin";
import { WelcomePopup } from "@/components/welcome-popup";
import ProductSaya from "@/pages/ProductSaya";
import Absensi from "@/pages/Absensi";
import DemoAbsensi from "@/pages/DemoAbsensi";
import FullAbsensi from "@/pages/FullAbsensi";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/cart" component={Cart} />
      <Route path="/admin" component={Admin} />
      <Route path="/product-saya" component={ProductSaya} />
      <Route path="/absensi" component={Absensi} />
      <Route path="/demo-absensi" component={DemoAbsensi} />
      <Route path="/absensi/full" component={FullAbsensi} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <WelcomePopup />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
