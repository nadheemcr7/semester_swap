'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import {
    Package,
    CheckCircle2,
    Clock,
    Trash2,
    Plus,
    ChevronRight,
    ArrowLeft,
    History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function Inventory() {
    const [items, setItems] = useState<any[]>([]);
    const [soldHistory, setSoldHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '/auth';
            return;
        }

        // Fetch Active Inventory
        const { data: inventoryData } = await supabase
            .from('items')
            .select('*')
            .eq('seller_id', user.id)
            .eq('is_sold', false)
            .order('created_at', { ascending: false });

        // Fetch Sold History
        const { data: historyData } = await supabase
            .from('sales_history')
            .select('*')
            .eq('seller_id', user.id)
            .order('sold_at', { ascending: false });

        setItems(inventoryData || []);
        setSoldHistory(historyData || []);
        setLoading(false);
    };

    const markAsSold = async (id: string) => {
        const { error } = await supabase
            .from('items')
            .update({
                is_sold: true,
                sold_at: new Date().toISOString()
            })
            .eq('id', id);

        if (!error) fetchData();
    };

    const deleteItem = async (id: string) => {
        const { error } = await supabase
            .from('items')
            .delete()
            .eq('id', id);

        if (!error) fetchData();
    };

    return (
        <div className="min-h-screen bg-background pt-24 pb-12 px-6">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="flex items-center gap-4">
                        <Link href="/marketplace" className="p-2 bg-white/5 rounded-xl text-muted hover:text-white transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-bold mb-1">My Inventory</h1>
                            <p className="text-muted text-sm">Manage your listings and track sales.</p>
                        </div>
                    </div>
                    <Link href="/list-item" className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                        <Plus className="w-5 h-5" />
                        List New Item
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl animate-pulse" />)}
                    </div>
                ) : items.length > 0 ? (
                    <div className="grid gap-6">
                        <AnimatePresence>
                            {items.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="glass-morphism rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-white/20 transition-all border border-white/5"
                                >
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 relative">
                                        <img
                                            src={item.images?.[0] || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=200&auto=format&fit=crop'}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    <div className="flex-1 text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                                            <h3 className="text-xl font-bold">{item.title}</h3>
                                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-md uppercase tracking-wider">Active</span>
                                        </div>
                                        <p className="text-sm text-muted mb-2 line-clamp-1">{item.description}</p>
                                        <div className="flex items-center justify-center md:justify-start gap-4 text-xs font-medium text-muted">
                                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(item.created_at).toLocaleDateString()}</span>
                                            <span className="text-white">₹{item.price}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => markAsSold(item.id)}
                                            className="px-6 py-3 bg-white text-black rounded-2xl font-bold text-sm hover:bg-neutral-200 transition-all flex items-center gap-2"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Mark Sold
                                        </button>
                                        <button
                                            onClick={() => deleteItem(item.id)}
                                            className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : !loading && soldHistory.length === 0 && (
                    <div className="text-center py-20 glass-morphism rounded-[40px] border-dashed border-2 border-white/5">
                        <Package className="w-16 h-16 text-muted mx-auto mb-6" />
                        <h2 className="text-2xl font-bold mb-2">No active listings</h2>
                        <p className="text-muted max-w-sm mx-auto mb-8">You haven't posted any products yet. Start selling to clear out your room!</p>
                        <Link href="/list-item" className="inline-flex bg-white text-black px-8 py-4 rounded-2xl font-bold hover:bg-neutral-200 transition-all">
                            Create First Listing
                        </Link>
                    </div>
                )}

                {/* Sales History Section */}
                {soldHistory.length > 0 && (
                    <div className="mt-20">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <History className="text-green-500 w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-bold">Sales History</h2>
                        </div>
                        <div className="grid gap-4">
                            {soldHistory.map((sale) => (
                                <div key={sale.id} className="glass-morphism rounded-3xl p-6 flex items-center justify-between border border-green-500/10 bg-green-500/[0.02]">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                                            <Package className="text-muted w-8 h-8 opacity-20" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg mb-1">{sale.title}</h3>
                                            <div className="flex items-center gap-3 text-xs text-muted">
                                                <span className="bg-green-500/10 text-green-500 px-2 py-0.5 rounded-md font-bold uppercase">Sold</span>
                                                <span>Sold on {new Date(sale.sold_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-white">₹{sale.price}</p>
                                        <p className="text-[10px] text-muted uppercase tracking-widest font-bold">Revenue Generated</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
