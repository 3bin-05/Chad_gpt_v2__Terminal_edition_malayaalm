import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { Volume2, VolumeX, HelpCircle, Coffee, Skull } from "lucide-react";
import { toast } from "sonner";
import LetterGlitch from "./LetterGlitch";

interface Message {
  type: "user" | "system" | "roast";
  content: string;
  timestamp: Date;
}

const INTENSITY_LABELS = ["mild", "spicy", "hardcore"] as const;
type Intensity = (typeof INTENSITY_LABELS)[number];

const Terminal = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "system",
      content: "KāṭṭiRoast v1.0 initialized...",
      timestamp: new Date(),
    },
    {
      type: "system",
      content: "Type your message and press ENTER to get roasted in Malayalam!",
      timestamp: new Date(),
    },
    {
      type: "system",
      content: "Type 'help' for commands",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [intensity, setIntensity] = useState<number>(1);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const speakMalayalam = (text: string) => {
    if (!ttsEnabled || !("speechSynthesis" in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ml-IN";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    // Try to find a Malayalam voice
    const voices = window.speechSynthesis.getVoices();
    const malayalamVoice = voices.find((voice) => voice.lang.startsWith("ml"));

    if (malayalamVoice) {
      utterance.voice = malayalamVoice;
      console.log("Using Malayalam voice:", malayalamVoice.name);
    } else {
      console.warn("No Malayalam voice found, using default voice");
      toast.error("Malayalam voice not available. Using default voice.");
    }

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event.error);
      toast.error("Failed to speak. Check browser voice settings.");
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleCommand = (cmd: string) => {
    const lower = cmd.toLowerCase().trim();

    if (lower === "help") {
      setMessages((prev) => [
        ...prev,
        {
          type: "system",
          content: "Available commands:",
          timestamp: new Date(),
        },
        {
          type: "system",
          content: "• help - Show this help",
          timestamp: new Date(),
        },
        {
          type: "system",
          content: "• clear - Clear terminal",
          timestamp: new Date(),
        },
        {
          type: "system",
          content: "• intensity [mild|spicy|hardcore] - Set roast intensity",
          timestamp: new Date(),
        },
        {
          type: "system",
          content: "• Just type anything else to get roasted!",
          timestamp: new Date(),
        },
      ]);
      return true;
    }

    if (lower === "clear") {
      setMessages([
        { type: "system", content: "Terminal cleared.", timestamp: new Date() },
      ]);
      return true;
    }

    if (lower.startsWith("intensity ")) {
      const level = lower.split(" ")[1];
      const idx = INTENSITY_LABELS.indexOf(level as Intensity);
      if (idx !== -1) {
        setIntensity(idx);
        setMessages((prev) => [
          ...prev,
          {
            type: "system",
            content: `Intensity set to: ${INTENSITY_LABELS[idx]}`,
            timestamp: new Date(),
          },
        ]);
        return true;
      }
    }

    return false;
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        content: userMessage,
        timestamp: new Date(),
      },
    ]);
    setInput("");

    // Check if it's a command
    if (handleCommand(userMessage)) {
      return;
    }

    setIsLoading(true);

    try {
      const currentIntensity = INTENSITY_LABELS[intensity];

      const { data, error } = await supabase.functions.invoke("roast", {
        body: {
          userText: userMessage,
          intensity: currentIntensity,
          variants: 1,
        },
      });

      if (error) throw error;

      if (data?.error) {
        if (data.filtered) {
          setMessages((prev) => [
            ...prev,
            {
              type: "system",
              content: `Error: ${data.error}`,
              timestamp: new Date(),
            },
          ]);
        } else {
          throw new Error(data.error);
        }
        return;
      }

      const roast = data.reply;
      setMessages((prev) => [
        ...prev,
        {
          type: "roast",
          content: roast,
          timestamp: new Date(),
        },
      ]);

      // Speak the roast
      speakMalayalam(roast);
    } catch (error) {
      console.error("Roast error:", error);
      toast.error("Failed to generate roast. Please try again.");
      setMessages((prev) => [
        ...prev,
        {
          type: "system",
          content: "ERROR: Failed to connect to roasting engine",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 relative">
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
        <Card className="w-full max-w-4xl h-[80vh] bg-card/80 backdrop-blur-sm border-2 border-primary/30 shadow-[0_0_30px_rgba(var(--terminal-green)/0.3)] flex flex-col overflow-hidden">
          {/* Terminal header */}
          <div className="bg-secondary border-b-2 border-primary/30 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive"></div>
              <div className="w-3 h-3 rounded-full bg-warning"></div>
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="ml-4 font-mono text-sm text-primary">
                TErMInAl POwErED bY Chad-gpt v2.0
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className="h-8 w-8 text-primary hover:text-primary-foreground hover:bg-primary"
              >
                {ttsEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCommand("help")}
                className="h-8 w-8 text-primary hover:text-primary-foreground hover:bg-primary"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
              <a
                href="https://www.linkedin.com/in/ebin-reji"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 flex items-center justify-center text-primary hover:text-primary-foreground hover:bg-primary rounded-md transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/_simply._.ebin_/?igsh=MWZkOTdoZnJvOG1pdw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 flex items-center justify-center text-primary hover:text-primary-foreground hover:bg-primary rounded-md transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="m16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://github.com/3bin-05"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 flex items-center justify-center text-primary hover:text-primary-foreground hover:bg-primary rounded-md transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Intensity control */}
          <div className="bg-secondary/50 border-b border-primary/20 px-4 py-3">
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-muted-foreground">
                InTEnSItY:
              </span>
              <div className="flex-1 max-w-md">
                <Slider
                  value={[intensity]}
                  onValueChange={(v) => setIntensity(v[0])}
                  max={2}
                  step={1}
                  className="cursor-pointer"
                />
              </div>
              <span className="font-mono text-sm text-primary min-w-[80px]">
                [{INTENSITY_LABELS[intensity].toUpperCase()}]
              </span>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`animate-in fade-in duration-200 ${
                  msg.type === "roast"
                    ? "text-accent font-bold text-base"
                    : msg.type === "user"
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
                style={{
                  textShadow:
                    msg.type === "roast" ? "0 0 10px currentColor" : undefined,
                }}
              >
                <span className="text-muted-foreground text-xs">
                  [{msg.timestamp.toLocaleTimeString()}]
                </span>{" "}
                <span className="text-primary/60">
                  {msg.type === "user"
                    ? "you: "
                    : msg.type === "roast"
                    ? "Chad-gpt😈: "
                    : ">>"}
                </span>{" "}
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="text-accent animate-pulse">
                <span className="text-muted-foreground text-xs">
                  [{new Date().toLocaleTimeString()}]
                </span>{" "}
                <span className="text-primary/60">&gt;&gt;</span> Chad-gpt
                ചിന്തിക്കുകയാണു...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t-2 border-primary/30 bg-secondary/50 p-4">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-primary text-sm">you: </span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="TrY yoUr BeSt...."
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
                autoFocus
              />
              <span className="w-2 h-4 bg-primary animate-[blink_1s_infinite]"></span>
            </div>
          </div>
        </Card>
      </div>
      {/* Footer */}
      <div className="mt-4 flex items-center justify-center gap-2 font-mono text-sm text-primary">
        <span>MaDe uNdEr eXAm STrEsS aNd LoTS Of CoFfEe</span>
        <Coffee className="h-4 w-4" />
      </div>
    </div>
  );
};

export default Terminal;
