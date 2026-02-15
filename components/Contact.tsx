import React, { useState } from 'react';
import { ExternalLink, Mail, Phone, Calendar } from 'lucide-react';
import ndLogo from '../src/assets/nd-logo.png';

const SUBMIT_EVENT_URL = 'https://tally.so/r/wdKJ1N';
const CAL_URL = 'https://cal.com/kyleextrem';
const EMAIL = 'kyle@newcastledigest.com';

export const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Message from Newcastle Digest site`);
    const body = encodeURIComponent(
      `${message}\n\n---\nFrom: ${name}\nEmail: ${email}`
    );
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <section className="relative bg-[#18181e] text-white min-h-screen py-24 px-4 md:px-8 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(132,155,255,0.12),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_100%_50%,rgba(132,155,255,0.08),transparent_50%)] pointer-events-none" />

      {/* Background imagery - blurred */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1920&auto=format&fit=crop"
          alt=""
          className="w-full h-full object-cover opacity-[0.12] blur-[2px] scale-105"
        />
        <div className="absolute inset-0 bg-[#18181e]/85" />
      </div>

      <div className="container mx-auto relative z-10 max-w-6xl">
        {/* Hero */}
        <div className="mb-20 md:mb-28">
          <p className="font-mono-main text-xs uppercase tracking-[0.3em] text-[#849bff] mb-4">Get in touch</p>
          <h1 className="font-sans-main text-7xl md:text-8xl lg:text-[10rem] font-black uppercase leading-[0.8] tracking-tighter">
            Contact.
          </h1>
        </div>

        {/* Postcard-style contact form */}
        <div className="flex justify-center mb-24 md:mb-32">
          <div
            className="relative w-full max-w-2xl bg-[#faf9f6] text-[#251f18] rounded-[24px] md:rounded-[32px] shadow-2xl overflow-hidden transform md:rotate-[-0.5deg] hover:rotate-0 transition-transform duration-300"
            style={{ boxShadow: '0 32px 80px -24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset' }}
          >
            <div className="absolute top-6 right-6 w-16 h-16 rounded-full border-2 border-[#251f18]/20 flex items-center justify-center overflow-hidden bg-[#faf9f6] p-2">
              <img src={ndLogo} alt="Newcastle Digest" className="w-full h-full object-contain" />
            </div>
            <div className="p-8 md:p-12 lg:p-14">
              <h2 className="font-sans-main font-black text-2xl md:text-3xl uppercase tracking-tighter mb-2">
                Send a note
              </h2>
              <p className="font-serif-alt italic text-[#251f18]/70 mb-8">
                We'd love to hear from you. Tell us what you'd like to read, or just say hello.
              </p>
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div>
                  <label htmlFor="contact-name" className="block font-mono-main text-[10px] uppercase tracking-[0.2em] text-[#251f18]/60 mb-2">Your name</label>
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-transparent border-0 border-b-2 border-[#251f18]/20 pb-2 font-sans-main text-[#251f18] placeholder-[#251f18]/40 focus:border-[#849bff] focus:outline-none transition-colors"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block font-mono-main text-[10px] uppercase tracking-[0.2em] text-[#251f18]/60 mb-2">Email address</label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-transparent border-0 border-b-2 border-[#251f18]/20 pb-2 font-sans-main text-[#251f18] placeholder-[#251f18]/40 focus:border-[#849bff] focus:outline-none transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block font-mono-main text-[10px] uppercase tracking-[0.2em] text-[#251f18]/60 mb-2">Your message</label>
                  <textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={4}
                    className="w-full bg-transparent border-0 border-b-2 border-[#251f18]/20 pb-2 font-sans-main text-[#251f18] placeholder-[#251f18]/40 focus:border-[#849bff] focus:outline-none transition-colors resize-none"
                    placeholder="What's on your mind?"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-6 px-8 py-4 rounded-full border-2 border-[#251f18] font-mono-main text-[10px] uppercase tracking-widest text-[#251f18] hover:bg-[#251f18] hover:text-[#faf9f6] transition-all"
                >
                  Send message
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Three CTA sections with imagery */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {/* Submit an event */}
          <a
            href={SUBMIT_EVENT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-[24px] overflow-hidden bg-[#222228] border border-white/5 hover:border-[#849bff]/30 transition-all"
          >
            <div className="aspect-[4/3] overflow-hidden relative">
              <img
                src="/newcastle/204698-2-c7408bf5-95c7-4b0a-9fbe-778d60820d34.png"
                alt="Newcastle promenade and events"
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#222228] via-transparent to-transparent pointer-events-none" />
            </div>
            <div className="relative p-6 md:p-8 -mt-16">
              <div className="w-12 h-12 rounded-xl bg-[#849bff]/20 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-[#849bff]" />
              </div>
              <h3 className="font-sans-main font-black text-xl md:text-2xl uppercase tracking-tighter mb-3">
                Submit an event
              </h3>
              <p className="font-serif-alt italic text-white/70 text-sm md:text-base leading-snug mb-4">
                Have an event coming up? Submit it to be considered for inclusion in the newsletter!
              </p>
              <span className="inline-flex items-center gap-2 font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] group-hover:gap-3 transition-all">
                Submit event <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </div>
          </a>

          {/* Give us a call */}
          <a
            href={CAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-[24px] overflow-hidden bg-[#222228] border border-white/5 hover:border-[#849bff]/30 transition-all"
          >
            <div className="aspect-[4/3] overflow-hidden relative">
              <img
                src="/newcastle/205091-2-09d6d7c1-47e3-48d7-84a4-672f358f231d.png"
                alt="Newcastle city view"
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#222228] via-transparent to-transparent pointer-events-none" />
            </div>
            <div className="relative p-6 md:p-8 -mt-16">
              <div className="w-12 h-12 rounded-xl bg-[#849bff]/20 flex items-center justify-center mb-4">
                <Phone className="w-6 h-6 text-[#849bff]" />
              </div>
              <h3 className="font-sans-main font-black text-xl md:text-2xl uppercase tracking-tighter mb-3">
                Give us a call
              </h3>
              <p className="font-serif-alt italic text-white/70 text-sm md:text-base leading-snug mb-4">
                Whether you're launching a product, promoting an event, or building brand trust with locals, we're here to help.
              </p>
              <span className="inline-flex items-center gap-2 font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] group-hover:gap-3 transition-all">
                Book a call <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </div>
          </a>

          {/* Email us */}
          <a
            href={`mailto:${EMAIL}`}
            className="group block rounded-[24px] overflow-hidden bg-[#222228] border border-white/5 hover:border-[#849bff]/30 transition-all"
          >
            <div className="aspect-[4/3] overflow-hidden relative">
              <img
                src="/newcastle/205018-2-235f1443-d2ff-4aa1-9a4a-e579101948ed.png"
                alt="Newcastle ocean pool"
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#222228] via-transparent to-transparent pointer-events-none" />
            </div>
            <div className="relative p-6 md:p-8 -mt-16">
              <div className="w-12 h-12 rounded-xl bg-[#849bff]/20 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-[#849bff]" />
              </div>
              <h3 className="font-sans-main font-black text-xl md:text-2xl uppercase tracking-tighter mb-3">
                Email us
              </h3>
              <p className="font-serif-alt italic text-white/70 text-sm md:text-base leading-snug mb-4">
                Want to send us a hey, hi, hello, or let us know how we're doing? We'd love to hear from you!
              </p>
              <span className="inline-flex items-center gap-2 font-mono-main text-[10px] uppercase tracking-widest text-[#849bff] group-hover:gap-3 transition-all">
                {EMAIL} <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};
