'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import {
    Camera,
    Tag,
    IndianRupee,
    Layers,
    Info,
    ChevronLeft,
    X,
    Loader2,
    Plus,
    User,
    Phone
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['Textbooks', 'Tools', 'Stationery', 'Electronics', 'Lab Gear', 'Others'];
const CONDITIONS = ['New', 'Like New', 'Used', 'Well Worn'];

export default function ListPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: 'Textbooks',
        condition: 'Like New',
        fullName: '',
        phone: ''
    });
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);

    const supabase = createClient();

    useState(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('full_name, phone')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setFormData(prev => ({
                        ...prev,
                        fullName: data.full_name || '',
                        phone: data.phone || ''
                    }));
                }
            }
        };
        fetchProfile();
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + images.length > 5) {
            alert('Max 5 images allowed');
            return;
        }
        setImages([...images, ...files]);
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        const newPreviews = [...previews];
        newImages.splice(index, 1);
        newPreviews.splice(index, 1);
        setImages(newImages);
        setPreviews(newPreviews);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in to list an item');

            // 1. Update Profile (Name and Phone are mandatory)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.fullName,
                    phone: formData.phone
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            const uploadedUrls: string[] = [];

            // 2. Upload images to Supabase Storage
            for (const image of images) {
                const fileExt = image.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('item-images')
                    .upload(filePath, image);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('item-images')
                    .getPublicUrl(filePath);

                uploadedUrls.push(publicUrl);
            }

            // 3. Insert into database
            const { error: dbError } = await supabase
                .from('items')
                .insert({
                    seller_id: user.id,
                    title: formData.title,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    category: formData.category,
                    condition: formData.condition,
                    images: uploadedUrls
                });

            if (dbError) throw dbError;

            router.push('/marketplace');
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pt-24 pb-12 px-6">
            <div className="max-w-3xl mx-auto">
                <Link href="/marketplace" className="inline-flex items-center gap-2 text-muted hover:text-white transition-colors mb-8">
                    <ChevronLeft className="w-5 h-5" />
                    Back to Marketplace
                </Link>

                <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-2">List an Item</h1>
                    <p className="text-muted">Turn your old gear into cash for other students.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Image Upload */}
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-white flex items-center gap-2">
                            <Camera className="w-4 h-4 text-primary" />
                            Item Photos
                        </label>
                        <p className="text-[10px] text-muted uppercase font-black tracking-widest">Sellers who upload 3-4 images sell 2x faster.</p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {previews.map((preview, i) => (
                                <div key={i} className="aspect-square relative rounded-2xl overflow-hidden group border border-white/10">
                                    <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(i)}
                                        className="absolute top-2 right-2 p-1 bg-black/50 backdrop-blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            ))}
                            {previews.length < 5 && (
                                <label className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all">
                                    <Plus className="w-6 h-6 text-muted" />
                                    <span className="text-[10px] uppercase font-bold text-muted">Add Photo</span>
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6 glass-morphism p-8 rounded-3xl">
                        <div className="border-b border-white/5 pb-6 mb-6">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary mb-6">Seller Identification</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted uppercase tracking-wider">Your Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                        <input
                                            required
                                            placeholder="John Doe"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted uppercase tracking-wider">WhatsApp / Mobile Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                        <input
                                            required
                                            type="tel"
                                            placeholder="+91 98765 43210"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Item Title</label>
                            <div className="relative">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                <input
                                    required
                                    placeholder="e.g. Engineering Drawing Drafter"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Price */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Price (₹)</label>
                            <div className="relative">
                                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                <input
                                    required
                                    type="number"
                                    placeholder="0.00"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Category & Condition */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted uppercase tracking-wider">Category</label>
                                <div className="relative">
                                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm appearance-none focus:outline-none focus:border-primary/50 transition-all"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted uppercase tracking-wider">Condition</label>
                                <div className="relative">
                                    <Info className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm appearance-none focus:outline-none focus:border-primary/50 transition-all"
                                        value={formData.condition}
                                        onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                    >
                                        {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Description</label>
                            <textarea
                                required
                                rows={4}
                                placeholder="Mention details like brand, age, or specific semester it's for..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-primary/50 transition-all resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full premium-gradient py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 hover:shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish Listing'}
                    </button>
                </form>
            </div>
        </div>
    );
}
