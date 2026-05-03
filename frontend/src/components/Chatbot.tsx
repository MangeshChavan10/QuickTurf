import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Bot, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const SYSTEM_INSTRUCTION = `You are the QuickTurf AI Assistant, a helpful chatbot for the QuickTurf website. Your goal is to answer user queries related to our turf in Solapur and general website policies.

AVAILABLE KNOWLEDGE:
Turf in Solapur:
1. Match Point Turf: Located at Civil Hospital Road, Solapur. Price: ₹1000/hour. Rating: 4.98. Features: High-grade artificial grass, professional floodlights for night sessions, and a dedicated trophy facility for tournaments. Amenities: Night LED Floodlights, Tournament Trophy Support, Changing Rooms, Free Parking, Drinking Water, First Aid.

Policies and FAQs:
- How to book: Select Match Point Turf, pick a date and time slot, and proceed to checkout.
- Confirmation: Instant confirmation ID after payment, also stored in 'My Bookings'.
- Cancellation/Rescheduling: Reschedule up to 6 hours before the match starts at no cost. Cancellations depend on venue policy.
- Payments: Supports UPI (Google Pay, PhonePe, Paytm), Credit/Debit cards, Netbanking.
- Lighting: Nominal fee for night sessions, calculated during checkout.
- Location: Located in Solapur, Maharashtra.

QuickTurf Mission & Partnerships:
- Vision: Athletic access, simplified. Connecting local talent and venue owners in Solapur.
- Venue Owners: Can join the network to host their turf, get real-time analytics, and management tools.
- Goal: To provide digital infrastructure for sports enthusiasts to spend zero minutes waiting and every minute playing.

Support Contact:
- Phone: +91 7058506250
- Email: support@quickturf.in
- Hours: 9am - 10pm

CONSTRAINTS:
- Answer ONLY based on the knowledge provided above. 
- If you don't know the answer, politely tell the user that you are only programmed to answer questions about QuickTurf and its venues.
- Keep responses concise and friendly.
- Use bullet points for lists.`;

interface Message {
  role: "user" | "bot";
  text: string;
}

interface ChatbotProps {
  initialOpen?: boolean;
}

export default function Chatbot({ initialOpen = false }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (initialOpen) {
      setIsOpen(true);
    }
    const handleOpen = () => setIsOpen(true);
    document.addEventListener('open-chatbot', handleOpen);
    return () => document.removeEventListener('open-chatbot', handleOpen);
  }, [initialOpen]);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hi! I'm your QuickTurf assistant. How can I help you regarding our venues or policies today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatbotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chatbotRef.current && !chatbotRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      // @ts-ignore
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "QuickTurf"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3-8b-instruct", // A fast, free/cheap model on OpenRouter
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION },
            ...messages.map(m => ({
              role: m.role === "user" ? "user" : "assistant",
              content: m.text
            })),
            { role: "user", content: userMessage }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      const botResponse = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that. Please try again.";
      setMessages(prev => [...prev, { role: "bot", text: botResponse }]);
    } catch (error: any) {
      console.error("Chatbot Error:", error);
      setMessages(prev => [...prev, { role: "bot", text: `I'm having trouble connecting to the AI right now. Error: ${error.message || 'Unknown error'}. Please check your console.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]" ref={chatbotRef}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[350px] md:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-surface-container flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 flex items-center justify-between" style={{background: 'linear-gradient(135deg, #0a1a0e 0%, #0f2a14 50%, #0a1a0e 100%)'}}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/30 rounded-full ring-1 ring-primary/40">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">QuickTurf Assistant</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    <p className="text-[10px] text-primary/80 font-bold uppercase tracking-widest">Online • AI Powered</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50 custom-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none shadow-md' 
                      : 'bg-white text-on-background rounded-tl-none border border-surface-container shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-surface-container shadow-sm">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-surface-container">
              <div className="relative">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything about QuickTurf..."
                  className="w-full pl-4 pr-12 py-3 bg-surface-container/50 border border-transparent rounded-xl focus:border-primary focus:bg-black focus:text-white outline-none transition-all text-sm font-medium focus:shadow-[0_0_15px_rgba(0,163,108,0.4)]"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary hover:text-white rounded-lg transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-primary"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[8px] text-secondary mt-2 text-center font-bold uppercase tracking-widest opacity-40">Powered by OpenRouter AI</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-4 rounded-full shadow-2xl transition-all flex items-center justify-center ${
          isOpen ? 'bg-white text-primary border border-primary/20' : 'bg-primary text-white'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-white"></span>
        )}
      </motion.button>
    </div>
  );
}
