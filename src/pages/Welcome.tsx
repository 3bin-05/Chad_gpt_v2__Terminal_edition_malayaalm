import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LetterGlitch from "@/components/LetterGlitch";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* LetterGlitch background */}
      <div className="fixed inset-0 z-0">
        <LetterGlitch
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={false}
          smooth={true}
        />
      </div>
      {/* CRT scanline effect overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)",
        }}
      />

      <div className="flex-1 flex items-center justify-center relative z-20">
        <div className="text-center space-y-8">
          <h1
            className="text-6xl font-mono font-bold text-primary animate-pulse"
            style={{ textShadow: "0 0 20px currentColor" }}
          >
            Welcome to ChadGPT v2
          </h1>
          <Button
            onClick={() => navigate("/terminal")}
            className="px-8 py-4 text-xl font-mono font-bold bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-full shadow-[0_0_20px_rgba(var(--primary),0.5)] hover:shadow-[0_0_30px_rgba(var(--primary),0.8)] hover:scale-105 transition-all duration-300 border-2 border-primary/50"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
