'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import {
    Search,
    Filter,
    Plus,
    ArrowUpRight,
    LayoutGrid,
    List as ListIcon,
    Tag,
    Clock,
    Mail,
    Phone,
    Heart,
    LogOut,
    Bookmark,
    ShoppingBag,
    X,
    User,
    Package,
    IndianRupee,
    Layers,
    Info,
    Flag,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['All', 'Textbooks', 'Tools', 'Stationery', 'Electronics', 'Others'];

export default function Marketplace() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedImageItem, setSelectedImageItem] = useState<any>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [savedIds, setSavedIds] = useState<string[]>([]);
    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const router = useRouter();

    const supabase = createClient();

    useEffect(() => {
        checkUserStatus();
        fetchItems();
        fetchSavedItems();

        // REAL-TIME: Listen for marketplace updates
        const channel = supabase
            .channel('marketplace_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
                fetchItems();
                fetchSavedItems();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []); // This useEffect runs once on mount for initial setup and realtime listener

    // This useEffect runs when selectedCategory changes to re-fetch items based on category
    useEffect(() => {
        fetchItems();
    }, [selectedCategory]);

    const checkUserStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.replace('/auth');
            return;
        }

        setUser(user);
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin, full_name')
            .eq('id', user.id)
            .single();

        if (profile) {
            setUser({ ...user, full_name: profile.full_name });
        }

        if (profile?.is_admin) {
            setIsAdmin(true);
            router.replace('/admin');
            return;
        }
        setIsAdmin(false);
    };

    const fetchSavedItems = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Only fetch items that are NOT sold
        const { data } = await supabase
            .from('saved_items')
            .select(`
                item_id,
                item:items!saved_items_item_id_fkey(is_sold)
            `)
            .eq('user_id', user.id);

        if (data) {
            const activeIds = data
                .filter((d: any) => d.item && d.item.is_sold === false)
                .map((d: any) => d.item_id);
            setSavedIds(activeIds);
        }
    };

    const fetchItems = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        let query = supabase
            .from('items')
            .select(`
                *,
                seller:profiles!items_seller_id_fkey(full_name, department, email, phone)
            `)
            .eq('is_sold', false)
            .ilike('category', selectedCategory === 'All' ? '%' : selectedCategory);

        // Filter out my own items
        if (user) {
            query = query.neq('seller_id', user.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching items:', error);
        } else {
            setItems(data || []);
        }
        setLoading(false);
    };

    const toggleSave = async (itemId: string) => {
        if (!user) return alert('Please login to add items to checkout');

        try {
            if (savedIds.includes(itemId)) {
                const { error } = await supabase.from('saved_items').delete().eq('user_id', user.id).eq('item_id', itemId);
                if (error) throw error;
                setSavedIds(savedIds.filter(id => id !== itemId));
            } else {
                const { error } = await supabase.from('saved_items').insert({ user_id: user.id, item_id: itemId });
                if (error) throw error;
                setSavedIds([...savedIds, itemId]);
            }
        } catch (error: any) {
            console.error('Checkout error detail:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            alert(`Purchase error: ${error.message || 'Please check if database table is ready.'}`);
        }
    };

    const reportItem = async (itemId: string, itemTitle: string) => {
        if (!user) return alert('Please login to report items');

        const reason = prompt(`Why are you reporting "${itemTitle}"? (e.g. Spam, Inappropriate Image, Wrong Price)`);
        if (!reason) return;

        try {
            const { error } = await supabase
                .from('reports')
                .insert({
                    item_id: itemId,
                    reporter_id: user.id,
                    reason: reason
                });

            if (error) throw error;
            alert('Thank you. The developers have been notified and will review this listing shortly.');
        } catch (error: any) {
            console.error('Report error:', error);
            alert('Failed to send report. Please try again.');
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/auth';
    };

    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading || isAdmin === null || isAdmin === true) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pt-24 pb-12 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold mb-1">Marketplace</h1>
                            <div className="flex items-center gap-2">
                                <p className="text-muted text-sm">Find what you need for this semester.</p>
                                <span className="w-1 h-1 bg-white/20 rounded-full" />
                                <p className="text-primary text-sm font-bold">
                                    {user?.full_name || user?.email?.split('@')[0] || 'Student'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/inventory" className="bg-white/5 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-white/10 transition-all border border-white/10">
                            <Package className="w-5 h-5 text-primary" />
                            My Inventory
                        </Link>
                        <Link href="/saved" className="bg-white/5 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-white/10 transition-all border border-white/10 relative group">
                            <ShoppingBag className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
                            My Checkout
                            {savedIds.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-accent text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg shadow-accent/20 animate-in zoom-in duration-300">
                                    {savedIds.length}
                                </span>
                            )}
                        </Link>
                        <Link href="/list-item" className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                            <Plus className="w-5 h-5" />
                            List New Item
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col lg:row gap-6 mb-12">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search textbooks, drafters, calculators..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === cat
                                    ? 'bg-white text-black'
                                    : 'bg-white/5 border border-white/10 text-muted hover:border-white/20'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}`}
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}`}
                        >
                            <ListIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Items Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="aspect-[4/5] rounded-3xl bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : filteredItems.length > 0 ? (
                    <motion.div
                        layout
                        className={viewMode === 'grid'
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                            : "flex flex-col gap-4"
                        }
                    >
                        <AnimatePresence>
                            {filteredItems.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`group relative glass-morphism rounded-3xl overflow-hidden hover:border-primary/30 transition-all ${viewMode === 'list' ? 'flex items-center p-4 gap-6' : ''}`}
                                >
                                    <div className={viewMode === 'grid' ? "aspect-square relative overflow-hidden group/img cursor-zoom-in" : "w-32 h-32 relative rounded-2xl overflow-hidden flex-shrink-0 group/img cursor-zoom-in"}>
                                        <img
                                            src={item.images?.[0] || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=600&auto=format&fit=crop'}
                                            alt={item.title}
                                            onClick={() => {
                                                setSelectedImageItem(item);
                                                setCurrentImageIndex(0);
                                            }}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                                            <span className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-wider text-white border border-white/10">
                                                {item.condition}
                                            </span>
                                            {item.images?.length > 1 && (
                                                <span className="w-fit px-2 py-1 bg-primary/20 backdrop-blur-md rounded-lg text-[9px] font-black text-primary border border-primary/20">
                                                    1 / {item.images.length} PHOTOS
                                                </span>
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                            <Maximize2 className="w-6 h-6 text-white" />
                                        </div>
                                        <button
                                            onClick={() => toggleSave(item.id)}
                                            className={`absolute top-4 right-4 p-2.5 rounded-xl backdrop-blur-md border transition-all ${savedIds.includes(item.id)
                                                ? 'bg-accent border-accent text-white'
                                                : 'bg-black/50 border-white/10 text-white hover:bg-white/10'
                                                }`}
                                        >
                                            {savedIds.includes(item.id) ? (
                                                <ShoppingBag className="w-4 h-4 fill-current" />
                                            ) : (
                                                <Plus className="w-4 h-4" />
                                            )}
                                        </button>

                                        {/* Moderate/Report Button */}
                                        <button
                                            onClick={() => reportItem(item.id, item.title)}
                                            className="absolute top-4 left-1/2 -translate-x-1/2 p-2 bg-black/50 backdrop-blur-md rounded-lg border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:border-red-500"
                                            title="Report Spam"
                                        >
                                            <Flag className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <div className="p-6 flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-primary uppercase tracking-widest">{item.category}</span>
                                            <span className="text-xl font-black text-white">₹{item.price}</span>
                                        </div>
                                        <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">{item.title}</h3>
                                        <p className="text-muted text-sm line-clamp-2 mb-4">{item.description}</p>

                                        <div className="flex border-t border-white/5 pt-4 items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs text-accent font-bold">
                                                    {item.seller?.full_name?.[0] || 'U'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-white font-bold leading-tight">{item.seller?.full_name || 'Anonymous Student'}</span>
                                                    <span className="text-[10px] text-muted leading-tight">{item.seller?.department || 'General'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={`tel:${item.seller?.phone}`}
                                                    className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg text-primary transition-all flex items-center justify-center"
                                                    title={`Call ${item.seller?.phone}`}
                                                >
                                                    <Phone className="w-3.5 h-3.5" />
                                                </a>
                                                <a
                                                    href={`mailto:${item.seller?.email}?subject=SemesterSwap: Interest in ${item.title}`}
                                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-white transition-all flex items-center gap-1.5"
                                                >
                                                    <Mail className="w-3 h-3 text-muted" />
                                                    Email
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <Search className="w-8 h-8 text-muted" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No items found</h3>
                        <p className="text-muted max-w-xs mx-auto text-sm">Try adjusting your search or filters to find what you're looking for.</p>
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
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-1">{selectedImageItem.title}</h2>
                                        <div className="flex items-center gap-4 text-muted">
                                            <span className="text-primary font-black">₹{selectedImageItem.price}</span>
                                            <span className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                                            <span className="uppercase text-[10px] tracking-widest font-black">{selectedImageItem.category}</span>
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
