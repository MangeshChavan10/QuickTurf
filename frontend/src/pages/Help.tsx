import { Header, Footer } from "../components/Navigation";
import { Search, ChevronDown, Plus, Minus, MessageSquare, Phone, Mail, FileQuestion, Bot } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function Help() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

  const allFaqs = [
    {
      q: "How do I confirm my booking?",
      a: "Once your payment goes through via UPI or Card, you'll get an instant confirmation right on screen — plus we'll email you a summary. You can also find all your bookings anytime under 'My Bookings'."
    },
    {
      q: "Can I cancel or reschedule my booking?",
      a: "Yes! You can reschedule up to 6 hours before your slot at no extra charge. For cancellations, refund terms depend on the venue's policy — you'll find those details on your booking confirmation."
    },
    {
      q: "What payment options do you support?",
      a: "We support all major UPI apps (Google Pay, PhonePe, Paytm), Credit & Debit cards, and Netbanking — all processed through a secure SSL-encrypted payment gateway."
    },
    {
      q: "Is lighting available for night sessions?",
      a: "Most turfs on QuickTurf come with LED floodlights for night play. Any extra lighting charges will be clearly shown at checkout before you pay."
    },
    {
      q: "Will I get a reminder before my game?",
      a: "Absolutely! We'll send you an email reminder 1 hour before your booking starts so you have plenty of time to gather your team and warm up."
    },
    {
      q: "What happens if a slot I booked gets cancelled?",
      a: "In the rare case a venue cancels your booking, we'll notify you immediately and process a full refund within 2-3 business days. We take this seriously."
    }
  ];

  const filteredFaqs = allFaqs.filter(faq => 
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-32 pb-24 w-full page-transition">
        {/* Search Hero */}
        <section className="bg-primary/5 py-24 mb-16 border-b border-surface-container">
           <div className="max-w-[1280px] mx-auto px-4 md:px-6 text-center">
              <h1 className="text-4xl md:text-6xl font-serif text-on-background mb-8 leading-tight">Got a question? <span className="text-primary italic">We've got you.</span></h1>
              <div className="max-w-2xl mx-auto relative group">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for bookings, venues, or policies..." 
                  className="w-full pl-14 pr-32 py-5 bg-white border border-surface-container rounded-full shadow-xl focus:ring-4 focus:ring-primary/10 outline-none transition-all group-hover:border-primary/50 text-base font-medium"
                />
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary w-6 h-6" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-white font-bold px-6 py-3 rounded-full text-sm shadow-md transition-all flex items-center justify-center">
                  {searchQuery ? `${filteredFaqs.length} Results` : 'Search'}
                </div>
              </div>
           </div>
        </section>

        <section className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            {/* FAQ Section */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center gap-3 mb-10">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary"><FileQuestion className="w-6 h-6" /></div>
                <h2 className="text-3xl font-serif font-bold text-on-background">
                  {searchQuery ? `Search Results for "${searchQuery}"` : "Frequently Asked Questions"}
                </h2>
              </div>

              <div className="space-y-4">
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq, i) => (
                    <div key={i} className="border border-surface-container rounded-[24px] bg-white overflow-hidden shadow-sm hover:shadow-md transition-all">
                      <button 
                        onClick={() => setOpenIndex(openIndex === i ? null : i)}
                        className="w-full flex items-center justify-between p-6 text-left"
                      >
                        <span className="font-sans font-bold text-lg md:text-xl text-on-background">{faq.q}</span>
                        <div className={`p-2 rounded-full transition-all ${openIndex === i ? 'bg-primary text-white' : 'bg-surface-container text-secondary'}`}>
                          {openIndex === i ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        </div>
                      </button>
                      <AnimatePresence>
                        {openIndex === i && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-6 pb-6"
                          >
                            <p className="text-secondary leading-relaxed font-medium opacity-80 border-t border-surface-container pt-4">
                              {faq.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-white border border-dashed border-surface-container rounded-[32px]">
                    <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                       <Search className="w-10 h-10 text-primary opacity-20" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-on-background mb-2">No results found</h3>
                    <p className="text-secondary mb-8">We couldn't find any FAQs matching your search.</p>
                    <button 
                      onClick={() => document.dispatchEvent(new CustomEvent('open-chatbot'))}
                      className="bg-on-background text-white px-8 py-4 rounded-full font-bold hover:bg-primary transition-all shadow-xl flex items-center gap-2 mx-auto"
                    >
                      <Bot className="w-5 h-5" />
                      Try asking our AI Assistant
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Support Channels */}
            <div className="space-y-8">
               <div className="bg-on-background rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-[60px] rounded-full"></div>
                  <h3 className="text-2xl font-serif font-bold mb-6">Can't find what you need?</h3>
                  <div className="space-y-6">
                     <div 
                        onClick={() => document.dispatchEvent(new CustomEvent('open-chatbot'))}
                        className="flex items-center gap-4 group cursor-pointer"
                     >
                        <div className="p-3 bg-white/10 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-lg"><Bot className="w-6 h-6" /></div>
                         <div><p className="font-bold text-base">Ask our AI</p><p className="text-[10px] text-white/50 uppercase tracking-widest">Get answers in seconds, 24/7</p></div>
                     </div>
                     <div className="flex items-center gap-4 group cursor-pointer">
                        <div className="p-3 bg-white/10 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-lg"><MessageSquare className="w-6 h-6" /></div>
                         <div><p className="font-bold text-base">Live Chat</p><p className="text-[10px] text-white/50 uppercase tracking-widest">Mon–Sat, 9am–10pm IST</p></div>
                     </div>
                     <div className="flex items-center gap-4 group cursor-pointer">
                        <div className="p-3 bg-white/10 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-lg"><Phone className="w-6 h-6" /></div>
                        <div><p className="font-bold text-base">+91 7058506250</p><p className="text-[10px] text-white/50 uppercase tracking-widest">Call our team</p></div>
                     </div>
                     <div className="flex items-center gap-4 group cursor-pointer">
                        <div className="p-3 bg-white/10 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-lg"><Mail className="w-6 h-6" /></div>
                        <div><p className="font-bold text-base">support@quickturf.in</p><p className="text-[10px] text-white/50 uppercase tracking-widest">Email anytime</p></div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
