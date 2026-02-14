'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, Recycle, ShieldCheck, ArrowRight, User, Layout, ScrollText } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useState, useEffect } from 'react';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (profile?.is_admin) {
          setIsAdmin(true);
        }
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] -z-10" />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-3 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center glass-morphism rounded-2xl px-4 md:px-8 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 premium-gradient rounded-lg flex items-center justify-center shrink-0">
              <Recycle className="text-white w-5 h-5" />
            </div>
            <span className="text-lg md:text-xl font-bold tracking-tight hidden sm:block">SemesterSwap</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link>
          </div>
          <div className="flex items-center gap-3 md:gap-4 ml-auto">
            {user ? (
              isAdmin ? (
                <Link href="/admin" className="flex items-center gap-2 bg-primary px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-semibold hover:opacity-90 transition-all whitespace-nowrap">
                  <ShieldCheck className="w-3 md:w-4 h-3 md:h-4 text-white" />
                  Admin Panel
                </Link>
              ) : (
                <Link href="/inventory" className="flex items-center gap-2 bg-white/5 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-semibold hover:bg-white/10 transition-all whitespace-nowrap">
                  <Layout className="w-3 md:w-4 h-3 md:h-4 text-primary" />
                  Inventory
                </Link>
              )
            ) : (
              <>
                <Link href="/auth" className="text-xs md:text-sm font-medium hover:text-white transition-colors whitespace-nowrap px-1">Sign In</Link>
                <Link href="/auth" className="bg-white text-black px-4 md:px-5 py-2 rounded-xl text-xs md:text-sm font-semibold hover:bg-neutral-200 transition-all whitespace-nowrap">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full glass-morphism text-xs font-semibold tracking-wider text-accent uppercase mb-6">
              Exclusive for your college
            </span>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] mb-8">
              Swap your gear, <br />
              <span className="text-gradient">Elevate your semester.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted mb-12">
              The premium marketplace for students to buy, sell, and swap academic essentials.
              Save money, reduce waste, and help your peers.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAdmin ? (
                <Link href="/admin" className="w-full sm:w-auto px-8 py-4 bg-primary rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all group">
                  Developer Dashboard
                  <ShieldCheck className="w-5 h-5" />
                </Link>
              ) : (
                <Link href="/marketplace" className="w-full sm:w-auto px-8 py-4 bg-primary rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all group">
                  Browse Marketplace
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}

              {user ? (
                !isAdmin && (
                  <Link href="/inventory" className="w-full sm:w-auto px-8 py-4 glass-morphism rounded-2xl font-bold hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                    <Layout className="w-5 h-5" />
                    My Inventory
                  </Link>
                )
              ) : (
                <Link href="/auth" className="w-full sm:w-auto px-8 py-4 glass-morphism rounded-2xl font-bold hover:bg-white/5 transition-all">
                  List an Item
                </Link>
              )}
            </div>
          </motion.div>

          {/* Stats/Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 text-left"
          >
            <div className="p-8 rounded-3xl glass-morphism">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <ShoppingBag className="text-primary w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Buy & Sell</h3>
              <p className="text-muted text-sm leading-relaxed">
                Find textbooks, drafters, and calculators at a fraction of the cost from seniors who no longer need them.
              </p>
            </div>
            <div className="p-8 rounded-3xl glass-morphism">
              <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="text-accent w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Verified Community</h3>
              <p className="text-muted text-sm leading-relaxed">
                A safe, internal environment restricted to verified college members. No outside interference.
              </p>
            </div>
            <div className="p-8 rounded-3xl glass-morphism">
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Recycle className="text-green-500 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Sustainable Future</h3>
              <p className="text-muted text-sm leading-relaxed">
                Reduce environmental waste by giving your old tools a second life with the next batch of students.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-32 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 premium-gradient rounded-md flex items-center justify-center">
              <Recycle className="text-white w-4 h-4" />
            </div>
            <span className="font-bold">SemesterSwap</span>
          </div>
          <p className="text-muted text-sm">© 2026 SemesterSwap. Built for students, by students.</p>
        </div>
      </footer>
    </div>
  );
}
