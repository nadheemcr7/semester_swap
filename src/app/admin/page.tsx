'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import {
    CheckCircle2,
    Trash2,
    Lock,
    AlertTriangle,
    Flag,
    ShieldCheck,
    History as HistoryIcon,
    Users,
    ShoppingBag,
    Search,
    Eye,
    Check,
    XCircle,
    X,
    ChevronLeft,
    ChevronRight,
    Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function AdminDashboard() {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [stats, setStats] = useState<any>({ total: 0, sold: 0, active: 0, users: 0 });
    const [history, setHistory] = useState<any[]>([]);
    const [usersList, setUsersList] = useState<any[]>([]);
    const [liveItems, setLiveItems] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [selectedImageItem, setSelectedImageItem] = useState<any>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        checkAdmin();

        // REAL-TIME: Listen for any changes in the database
        const channel = supabase
            .channel('admin_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => fetchAdminData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchAdminData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => fetchAdminData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_history' }, () => fetchAdminData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setIsAdmin(false);
            setLoading(false);
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (profile?.is_admin) {
            setIsAdmin(true);
            fetchAdminData();
        } else {
            setIsAdmin(false);
            setLoading(false);
        }
    };

    const fetchAdminData = async () => {
        // 1. Fetch Stats & Users
        const { data: items } = await supabase.from('items').select('*, seller:profiles!items_seller_id_fkey(full_name, email)');
        const { data: profiles, count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact' });
        const { count: totalSales } = await supabase.from('sales_history').select('*', { count: 'exact', head: true });

        const activeList = items?.filter((i: any) => !i.is_sold) || [];
        const total = activeList.length || 0;

        setStats({
            total: total + (totalSales || 0),
            sold: totalSales || 0,
            active: total,
            users: usersCount || 0
        });

        setUsersList(profiles || []);
        setLiveItems(activeList);

        // 2. Fetch Permanent Sales History
        const { data: historyData } = await supabase
            .from('sales_history')
            .select('*')
            .order('sold_at', { ascending: false });

        setHistory(historyData || []);

        // 3. Fetch Spam Reports
        const { data: reportData } = await supabase
            .from('reports')
            .select(`
                *,
                item:items(title, images),
                reporter:profiles(full_name, email)
            `)
            .order('created_at', { ascending: false });

        setReports(reportData || []);
        setLoading(false);
    };

    const deleteListing = async (itemId: string) => {
        if (!itemId) return;
        if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;

        // Use 'count' to verify if the row was actually removed
        const { error, status } = await supabase
            .from('items')
            .delete()
            .eq('id', itemId);

        if (error) {
            alert(`Database Error: ${error.message} (Code: ${error.code})`);
            console.error('Delete error Details:', error);
        } else if (status === 204 || status === 200) {
            // Success! Refresh data
            await fetchAdminData();
            alert('Listing successfully removed from the marketplace.');
        } else {
            alert('Permission Denied: You might not have the correct RLS policies to delete this item.');
        }
    };

    const dismissReport = async (reportId: string) => {
        const { error } = await supabase
            .from('reports')
            .delete()
            .eq('id', reportId);

        if (error) {
            alert('Error dismissing report: ' + error.message);
        } else {
            fetchAdminData();
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (isAdmin === false) return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
            <div className="text-center glass-morphism p-12 rounded-[40px] max-w-md">
                <Lock className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
                <p className="text-muted mb-8">This dashboard is restricted to developers and authorized administrators only.</p>
                <Link href="/" className="inline-flex bg-white text-black px-8 py-4 rounded-2xl font-bold hover:bg-neutral-200 transition-all">
                    Back to Home
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background pt-24 pb-12 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 premium-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <ShieldCheck className="text-white w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold mb-1">Developer Admin</h1>
                            <p className="text-muted text-sm">Permanent history and system monitoring.</p>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            window.location.href = '/auth';
                        }}
                        className="bg-red-500/10 text-red-500 px-6 py-3 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                    >
                        <Lock className="w-5 h-5" />
                        Developer Logout
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Total Historical Listings', value: stats.total, icon: ShoppingBag, color: 'text-primary' },
                        { label: 'Completed Sales', value: stats.sold, icon: CheckCircle2, color: 'text-green-500' },
                        { label: 'Current Live Items', value: stats.active, icon: HistoryIcon, color: 'text-accent' },
                        { label: 'Total Students', value: stats.users, icon: Users, color: 'text-white' }
                    ].map((s, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="glass-morphism p-6 rounded-3xl"
                        >
                            <s.icon className={`w-8 h-8 ${s.color} mb-4`} />
                            <p className="text-muted text-sm font-medium mb-1">{s.label}</p>
                            <h2 className="text-3xl font-bold">{s.value}</h2>
                        </motion.div>
                    ))}
                </div>

                {/* Section: User Management */}
                <div className="glass-morphism rounded-[40px] overflow-hidden mb-12">
                    <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <Users className="text-primary w-6 h-6" />
                            Registered Students
                        </h2>
                        <span className="text-[10px] bg-primary/20 text-primary px-3 py-1 rounded-full font-black uppercase">Directory</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/[0.02] text-muted text-[10px] uppercase tracking-widest font-bold">
                                    <th className="px-8 py-5">Student Name</th>
                                    <th className="px-8 py-5">Contact Details</th>
                                    <th className="px-8 py-5">Role</th>
                                    <th className="px-8 py-5">Joined Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {usersList.map((usr) => (
                                    <tr key={usr.id} className="hover:bg-white/[0.01] transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary font-bold">
                                                    {usr.full_name?.[0] || 'S'}
                                                </div>
                                                <p className="font-bold text-sm text-white">{usr.full_name || 'New Student'}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-medium text-white">{usr.email}</p>
                                            <p className="text-[10px] text-muted">{usr.phone || 'No phone provided'}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            {usr.is_admin ? (
                                                <span className="px-3 py-1 bg-primary text-[10px] font-bold rounded-lg uppercase text-white">Developer</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-white/10 text-[10px] font-bold rounded-lg uppercase text-muted">Student</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-xs text-muted">
                                            {new Date(usr.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Section: Live Marketplace Listings */}
                <div className="glass-morphism rounded-[40px] overflow-hidden mb-12">
                    <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <ShoppingBag className="text-primary w-6 h-6" />
                            Live Marketplace Listings
                        </h2>
                        <span className="text-[10px] bg-green-500/20 text-green-500 px-3 py-1 rounded-full font-black uppercase">Active Now</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/[0.02] text-muted text-[10px] uppercase tracking-widest font-bold">
                                    <th className="px-8 py-5">Product</th>
                                    <th className="px-8 py-5">Seller</th>
                                    <th className="px-8 py-5">Category & Condition</th>
                                    <th className="px-8 py-5">Price</th>
                                    <th className="px-8 py-5">Date Posted</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {liveItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/[0.01] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    onClick={() => {
                                                        setSelectedImageItem(item);
                                                        setCurrentImageIndex(0);
                                                    }}
                                                    className="w-16 h-16 rounded-2xl overflow-hidden bg-white/5 border border-white/5 flex-shrink-0 cursor-zoom-in group/img relative"
                                                >
                                                    <img src={item.images?.[0]} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform" alt="" />
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                        <Maximize2 className="w-4 h-4 text-white" />
                                                    </div>
                                                </div>
                                                <div className="max-w-[200px]">
                                                    <p className="font-bold text-sm text-white truncate">{item.title}</p>
                                                    <p className="text-[10px] text-muted line-clamp-2 mt-1 leading-relaxed">{item.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-medium text-white">{item.seller?.full_name || 'Student'}</p>
                                            <p className="text-[10px] text-muted font-mono">{item.seller?.email}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="w-fit px-2.5 py-1 bg-white/5 text-[10px] font-bold rounded-lg uppercase text-muted border border-white/5">{item.category}</span>
                                                <span className="w-fit px-2.5 py-0.5 bg-primary/10 text-primary text-[9px] font-black rounded-md uppercase tracking-tighter">{item.condition}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 font-black text-sm text-white">₹{item.price}</td>
                                        <td className="px-8 py-6 text-xs text-muted whitespace-nowrap">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => deleteListing(item.id)}
                                                className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-lg shadow-red-500/10"
                                                title="Remove Listing"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {liveItems.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center text-muted text-sm italic">
                                            The marketplace is currently empty.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Section: Spam Reports */}
                {reports.length > 0 && (
                    <div className="glass-morphism rounded-[40px] overflow-hidden mb-12 border border-red-500/20">
                        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-red-500/[0.02]">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <AlertTriangle className="text-red-500 w-6 h-6" />
                                Community Spam Reports
                            </h2>
                            <span className="text-[10px] bg-red-500/20 text-red-500 px-3 py-1 rounded-full font-black uppercase">Requires Action</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/[0.02] text-muted text-[10px] uppercase tracking-widest font-bold">
                                        <th className="px-8 py-5">Target Item</th>
                                        <th className="px-8 py-5">Reporter</th>
                                        <th className="px-8 py-5">Reason / Complaint</th>
                                        <th className="px-8 py-5">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {reports.map((report) => (
                                        <tr key={report.id} className="hover:bg-white/[0.01] transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        onClick={() => {
                                                            setSelectedImageItem(report.item);
                                                            setCurrentImageIndex(0);
                                                        }}
                                                        className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/5 cursor-zoom-in group/img relative"
                                                    >
                                                        <img src={report.item?.images?.[0]} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform" alt="" />
                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                            <Maximize2 className="w-3 h-3 text-white" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-white">{report.item?.title || 'Deleted Item'}</p>
                                                        <button
                                                            onClick={() => window.open(`/marketplace`, '_blank')}
                                                            className="text-[9px] text-primary hover:underline flex items-center gap-1 uppercase font-bold"
                                                        >
                                                            <Eye className="w-2.5 h-2.5" /> View in store
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-medium text-white">{report.reporter?.full_name}</p>
                                                <p className="text-[10px] text-muted">{report.reporter?.email}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl max-w-xs">
                                                    <p className="text-xs text-red-400 italic font-medium">"{report.reason}"</p>
                                                    <p className="text-[9px] text-muted mt-2 uppercase font-bold">{new Date(report.created_at).toLocaleString()}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        onClick={() => deleteListing(report.item_id)}
                                                        className="w-full py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Delete Item
                                                    </button>
                                                    <button
                                                        onClick={() => dismissReport(report.id)}
                                                        className="w-full py-2 bg-white/5 text-white/50 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" /> False Report
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                <div className="glass-morphism rounded-[40px] overflow-hidden">
                    <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <ShoppingBag className="text-accent w-6 h-6" />
                            Administrative Ledger
                        </h2>
                        <span className="text-[10px] bg-accent/20 text-accent px-3 py-1 rounded-full font-black uppercase">Archive</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/[0.02] text-muted text-[10px] uppercase tracking-widest font-bold">
                                    <th className="px-8 py-5">Product Info</th>
                                    <th className="px-8 py-5">Seller Details</th>
                                    <th className="px-8 py-5">Buyer Details</th>
                                    <th className="px-8 py-5">Price</th>
                                    <th className="px-8 py-5">Sold Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {history.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/[0.01] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                    <ShoppingBag className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm tracking-tight">{item.title}</p>
                                                    <span className="text-[10px] text-primary uppercase font-bold">{item.category}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-white">{item.seller_name}</p>
                                            <p className="text-[10px] text-muted">{item.seller_email}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            {item.buyer_name ? (
                                                <>
                                                    <p className="text-sm font-bold text-accent">{item.buyer_name}</p>
                                                    <p className="text-[10px] text-muted">{item.buyer_email}</p>
                                                </>
                                            ) : (
                                                <p className="text-xs italic text-muted/50">Details pending via student contact</p>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-black text-white">₹{item.price}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-muted leading-tight">{new Date(item.sold_at).toLocaleDateString()}</span>
                                                <span className="text-[9px] text-muted leading-tight opacity-50">{new Date(item.sold_at).toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-50">
                                                <HistoryIcon className="w-12 h-12" />
                                                <p className="text-muted text-sm font-medium">Clear ledger. No transactions found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Developer Image Lightbox */}
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
                                            <span className="text-primary font-black uppercase text-xs tracking-widest">{selectedImageItem.category}</span>
                                            <span className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                                            <span className="text-white font-bold">₹{selectedImageItem.price}</span>
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
