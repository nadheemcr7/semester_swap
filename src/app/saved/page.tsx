'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import {
    Trash2,
    ArrowLeft,
    Phone,
    Mail,
    ShoppingBag,
    CheckCircle2,
    History,
    X,
    ChevronLeft,
    ChevronRight,
    Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function SavedItems() {
    const [items, setItems] = useState<any[]>([]);
    const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
    const [selectedImageItem, setSelectedImageItem] = useState<any>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
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

        // Fetch In-Cart Items
        const { data: cartData, error: cartError } = await supabase
            .from('saved_items')
            .select(`
                item:items (
                    *,
                    seller:profiles!items_seller_id_fkey(full_name, department, email, phone)
                )
            `)
            .eq('user_id', user.id);

        // Fetch Purchase History
        const { data: historyData } = await supabase
            .from('sales_history')
            .select('*')
            .eq('buyer_id', user.id)
            .order('sold_at', { ascending: false });

        if (cartError) {
            console.error('Error fetching checkout items:', cartError);
        } else {
            const validItems = cartData?.map((d: any) => d.item).filter((i: any) => i !== null && i.is_sold === false) || [];
            setItems(validItems);
            setPurchaseHistory(historyData || []);
        }
        setLoading(false);
    };

    const removeItem = async (itemId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('saved_items')
            .delete()
            .eq('user_id', user.id)
            .eq('item_id', itemId);

        if (!error) {
            setItems(items.filter(i => i.id !== itemId));
        }
    };

    return (
        <div className="min-h-screen bg-background pt-24 pb-12 px-6">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-12">
                    <Link href="/marketplace" className="p-2 bg-white/5 rounded-xl text-muted hover:text-white transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-bold mb-1">My Checkout</h1>
                            {items.length > 0 && (
                                <span className="bg-accent/20 text-accent text-sm px-3 py-1 rounded-full font-black border border-accent/20">
                                    {items.length} {items.length === 1 ? 'item' : 'items'}
                                </span>
                            )}
                        </div>
                        <p className="text-muted text-sm">Review your cart and manage your purchase history.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/5 rounded-3xl animate-pulse" />)}
                    </div>
                ) : (
                    <div className="space-y-20">
                        {/* Section: Active Cart */}
                        <div>
                            {items.length > 0 ? (
                                <div className="grid gap-6">
                                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary mb-2">Items in Cart</h2>
                                    <AnimatePresence>
                                        {items.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="glass-morphism rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 group border border-white/5 hover:border-primary/20 transition-all"
                                            >
                                                <div
                                                    onClick={() => {
                                                        setSelectedImageItem(item);
                                                        setCurrentImageIndex(0);
                                                    }}
                                                    className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 relative cursor-zoom-in group/img"
                                                >
                                                    <img
                                                        src={item.images?.[0] || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=200&auto=format&fit=crop'}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover transition-transform group-hover/img:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                        <Maximize2 className="w-5 h-5 text-white" />
                                                    </div>
                                                </div>

                                                <div className="flex-1 text-center md:text-left">
                                                    <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                                                        <h3 className="text-xl font-bold">{item.title}</h3>
                                                        <span className="text-white font-black text-lg">₹{item.price}</span>
                                                    </div>
                                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-2">
                                                        <div className="flex items-center justify-center md:justify-start gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">
                                                                {item.seller?.full_name?.[0] || 'S'}
                                                            </div>
                                                            <span className="text-xs text-white font-bold">{item.seller?.full_name}</span>
                                                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                                                            <span className="text-[10px] text-muted uppercase font-bold">{item.seller?.department}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col gap-2">
                                                        <a
                                                            href={`https://wa.me/${item.seller?.phone?.replace(/[^0-9]/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-6 py-2.5 bg-green-500 text-white rounded-xl font-bold text-xs hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <Phone className="w-3.5 h-3.5" />
                                                            WhatsApp
                                                        </a>
                                                        <a
                                                            href={`tel:${item.seller?.phone}`}
                                                            className="px-6 py-2.5 bg-white text-black rounded-xl font-bold text-xs hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <Phone className="w-3.5 h-3.5" />
                                                            Direct Call
                                                        </a>
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            ) : purchaseHistory.length === 0 && (
                                <div className="text-center py-20 glass-morphism rounded-[40px] border-2 border-dashed border-white/5">
                                    <ShoppingBag className="w-16 h-16 text-muted mx-auto mb-6" />
                                    <h2 className="text-2xl font-bold mb-2">Cart is empty</h2>
                                    <p className="text-muted max-w-sm mx-auto mb-8">Tap the [+] icon on products to add them to your checkout list.</p>
                                    <Link href="/marketplace" className="inline-flex bg-white text-black px-8 py-4 rounded-2xl font-bold hover:bg-neutral-200 transition-all">
                                        Browse Marketplace
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Section: Purchase History */}
                        {purchaseHistory.length > 0 && (
                            <div>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <History className="text-primary w-5 h-5" />
                                    </div>
                                    <h2 className="text-2xl font-bold">Purchase History</h2>
                                </div>
                                <div className="grid gap-4">
                                    {purchaseHistory.map((purchase) => (
                                        <div key={purchase.id} className="glass-morphism rounded-3xl p-6 flex items-center justify-between border border-white/5 bg-white/[0.01]">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                                                    <CheckCircle2 className="text-green-500 w-8 h-8 opacity-50" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg mb-1">{purchase.title}</h3>
                                                    <div className="flex items-center gap-3 text-xs text-muted">
                                                        <span className="bg-white/10 text-white px-2 py-0.5 rounded-md font-bold uppercase">Bought</span>
                                                        <span>From {purchase.seller_name}</span>
                                                        <span className="w-1 h-1 bg-white/20 rounded-full" />
                                                        <span>{new Date(purchase.sold_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-white">₹{purchase.price}</p>
                                                <p className="text-[10px] text-muted uppercase tracking-widest font-bold">Paid Price</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {/* Image Lightbox Modal */}
                <AnimatePresence>
                    {selectedImageItem && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6"
                        >
                            <button
                                onClick={() => setSelectedImageItem(null)}
                                className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all z-[110]"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="max-w-5xl w-full relative group">
                                <motion.div
                                    key={currentImageIndex}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="aspect-video md:aspect-[16/9] rounded-[40px] overflow-hidden bg-white/5 border border-white/10"
                                >
                                    <img
                                        src={selectedImageItem.images?.[currentImageIndex]}
                                        className="w-full h-full object-contain"
                                        alt={selectedImageItem.title}
                                    />
                                </motion.div>

                                {/* Navigation Arrows */}
                                {selectedImageItem.images?.length > 1 && (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : selectedImageItem.images.length - 1));
                                            }}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-black/50 backdrop-blur-xl rounded-full text-white hover:bg-primary hover:scale-110 transition-all shadow-2xl"
                                        >
                                            <ChevronLeft className="w-8 h-8" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCurrentImageIndex((prev) => (prev < selectedImageItem.images.length - 1 ? prev + 1 : 0));
                                            }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-black/50 backdrop-blur-xl rounded-full text-white hover:bg-primary hover:scale-110 transition-all shadow-2xl"
                                        >
                                            <ChevronRight className="w-8 h-8" />
                                        </button>
                                    </>
                                )}

                                {/* Bottom Info Bar */}
                                <div className="absolute -bottom-20 left-0 right-0 flex justify-between items-end">
                                    <div className="max-w-md">
                                        <h2 className="text-2xl font-bold text-white mb-1 truncate">{selectedImageItem.title}</h2>
                                        <div className="flex items-center gap-4 text-muted">
                                            <span className="text-primary font-black">₹{selectedImageItem.price}</span>
                                            <span className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                                            <span className="uppercase text-[10px] tracking-widest font-black">Quantity 1 Available</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedImageItem.images?.map((_: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-8 bg-primary' : 'w-2 bg-white/20'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
