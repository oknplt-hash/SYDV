import React, { useState, useEffect } from 'react';
import api from '../api';

import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, User, MapPin, Phone, Heart, Briefcase, Home, Users, FileText, Image, ArrowLeft, ArrowRight, GraduationCap, Baby, Shield, Info, Edit } from 'lucide-react';
import { PersonForm } from './PersonForm';

const TURKISH_MONTHS = [
    'OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN',
    'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'
];

function formatTurkishDate(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const day = date.getDate().toString().padStart(2, '0');
        const month = TURKISH_MONTHS[date.getMonth()];
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    } catch (e) {
        return dateStr;
    }
}

export function Presentation() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showImagePopup, setShowImagePopup] = useState(false);
    const [popupImageIndex, setPopupImageIndex] = useState(0);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        setPopupImageIndex(0);
    }, [currentIndex]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get(`/agenda/${id}/presentation?api=true`);
                setData(response.data);
            } catch (error) {
                console.error("Presentation error:", error);
                alert("Sunum verileri yüklenemedi.");
                navigate('/agendas');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    const refreshData = async () => {
        try {
            const response = await api.get(`/agenda/${id}/presentation?api=true`);
            setData(response.data);
        } catch (error) {
            console.error("Refresh error:", error);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showImagePopup) {
                // When popup is open, arrow keys navigate images
                if (e.key === 'ArrowRight') {
                    setPopupImageIndex(prev => {
                        const images = data?.slides[currentIndex]?.household_images;
                        if (images && images.length > 0) {
                            return prev < images.length - 1 ? prev + 1 : 0;
                        }
                        return prev;
                    });
                }
                if (e.key === 'ArrowLeft') {
                    setPopupImageIndex(prev => {
                        const images = data?.slides[currentIndex]?.household_images;
                        if (images && images.length > 0) {
                            return prev > 0 ? prev - 1 : images.length - 1;
                        }
                        return prev;
                    });
                }
                if (e.key === 'Escape') {
                    setShowImagePopup(false);
                }
            } else {
                // When popup is closed, arrow keys navigate slides
                if (e.key === 'ArrowRight') nextSlide();
                if (e.key === 'ArrowLeft') prevSlide();
                if (e.key === 'Escape') {
                    navigate('/agendas');
                }
            }
            if (e.key.toLowerCase() === 'f') {
                setShowImagePopup(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [data, currentIndex, showImagePopup]);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-semibold text-blue-600">Yükleniyor...</p>
            </div>
        </div>
    );

    if (!data || !data.slides || !data.slides.length) return (
        <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <p className="text-lg text-slate-500">Veri bulunamadı.</p>
        </div>
    );

    const slides = data.slides;
    const currentSlide = slides[currentIndex];
    const person = currentSlide.person;
    const isAbovePoverty = parseFloat(person.per_capita_income || 0) >= 9358.5;

    // Check for high-alert social security statuses
    const ss = (person.social_security || '').toLowerCase();
    const isHighAlertSS = ss.includes('bağkur') || ss.includes('sgk') || ss.includes('emekli') || ss.includes('emeki') || ss.includes('g1');

    const nextSlide = () => {
        if (currentIndex < slides.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setShowImagePopup(false);
        }
    };

    const prevSlide = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setShowImagePopup(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 z-[100] overflow-hidden flex flex-col font-sans select-none">

            {/* Main Content - NO HEADER */}
            <main className="flex-1 p-3 md:p-6 overflow-y-auto lg:overflow-hidden">
                <div className={`h-full max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-5 md:gap-6 p-2 md:p-2 rounded-2xl md:rounded-[2.5rem] transition-all duration-500 ${isAbovePoverty
                    ? 'ring-4 md:ring-8 ring-rose-500/20 shadow-[0_0_50px_rgba(244,63,94,0.15)] bg-rose-50/[0.02]'
                    : ''
                    }`}>

                    {/* Left Column - Profile Card */}
                    <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-5 lg:overflow-y-auto custom-scrollbar-hidden pr-0 lg:pr-1">

                        {/* Profile Card */}
                        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden shrink-0">
                            {/* Photo Header - Larger photo */}
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 pb-20 relative">
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                                    <div className="w-32 h-32 rounded-2xl bg-white p-1 shadow-xl">
                                        {person.has_profile_photo ? (
                                            <img src={`/api/person/${person.id}/profile_photo`} alt="" className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            <div className="w-full h-full rounded-xl bg-slate-100 flex items-center justify-center">
                                                <User size={40} className="text-slate-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Profile Info */}
                            <div className="pt-18 pb-5 px-5 text-center" style={{ paddingTop: '4.5rem' }}>
                                <h2 className="text-lg font-bold text-slate-800 mb-1">{person.full_name}</h2>
                                <p className="text-xs text-slate-500 mb-4">TC: {person.national_id}</p>

                                <div className="flex justify-center gap-2 mb-5">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold">{person.age || '?'} Yaş</span>
                                    <button
                                        onClick={() => setShowEditModal(true)}
                                        className="group flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-xs font-bold transition-all border border-transparent hover:border-indigo-200"
                                        title="Hane Bilgilerini Düzenle"
                                    >
                                        <Edit size={12} className="group-hover:scale-110 transition-transform" />
                                        <span>#{person.file_no}</span>
                                    </button>
                                </div>

                                {/* Quick Stats - 4 columns */}
                                <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-100">
                                    <div className="bg-slate-50 rounded-xl p-2 text-center">
                                        <Users size={16} className="mx-auto text-blue-500 mb-1" />
                                        <p className="text-base font-bold text-slate-800">{person.household_size}</p>
                                        <p className="text-[9px] text-slate-500 uppercase">Hane</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-2 text-center">
                                        <Baby size={16} className="mx-auto text-pink-500 mb-1" />
                                        <p className="text-base font-bold text-slate-800">{person.children_count || 0}</p>
                                        <p className="text-[9px] text-slate-500 uppercase">Çocuk</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-2 text-center">
                                        <GraduationCap size={16} className="mx-auto text-violet-500 mb-1" />
                                        <p className="text-base font-bold text-slate-800">{person.student_count || 0}</p>
                                        <p className="text-[9px] text-slate-500 uppercase">Öğrenci</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-2 text-center">
                                        <Heart size={16} className="mx-auto text-rose-500 mb-1" />
                                        <p className="text-base font-bold text-slate-800">{person.disability_status === 'Var' ? `%${person.disability_rate}` : '-'}</p>
                                        <p className="text-[9px] text-slate-500 uppercase">Engel</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-5 space-y-4 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                                    <Phone size={16} className="text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Telefon</p>
                                    <p className="text-sm font-medium text-slate-700">{person.phone || 'Kayıtsız'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                                    <MapPin size={16} className="text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Adres</p>
                                    <p className="text-sm font-medium text-slate-700 leading-snug">{person.address || 'Kayıtsız'}</p>
                                </div>
                            </div>
                            <div className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${isHighAlertSS ? 'bg-rose-50 border border-rose-100' : ''}`}>
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isHighAlertSS ? 'bg-rose-100' : 'bg-blue-50'}`}>
                                    <Shield size={16} className={isHighAlertSS ? 'text-rose-600' : 'text-blue-600'} />
                                </div>
                                <div>
                                    <p className={`text-[10px] uppercase font-semibold ${isHighAlertSS ? 'text-rose-400' : 'text-slate-400'}`}>Sosyal Güvence</p>
                                    <p className={`text-sm font-bold ${isHighAlertSS ? 'text-rose-700' : 'text-slate-700'}`}>{person.social_security || 'Kayıtsız'}</p>
                                </div>
                            </div>
                        </div>


                        {/* Household Photos - Moved here */}
                        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-5 shrink-0">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Image size={18} className="text-violet-600" />
                                    <h4 className="font-semibold text-slate-800">Hane Fotoğrafları</h4>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {currentSlide.household_images?.map((img, idx) => (
                                    <button
                                        key={img.id}
                                        onClick={() => { setPopupImageIndex(idx); setShowImagePopup(true); }}
                                        className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg hover:scale-110 hover:shadow-lg transition-all flex items-center justify-center"
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                                {(!currentSlide.household_images || currentSlide.household_images.length === 0) && (
                                    <p className="text-sm text-slate-400 italic">Fotoğraf yok.</p>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-300 mt-3 text-center">F tuşu ile galeri | Ok tuşları ile gezin</p>
                        </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="flex-1 flex flex-col gap-5 min-w-0">

                        {/* Request Card */}
                        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden shrink-0">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                        <FileText size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-100 font-medium">Yardım Talebi</p>
                                        <h3 className="text-lg font-bold text-white">{currentSlide.assistance_type}</h3>
                                    </div>
                                </div>
                                <span className="px-3 py-1.5 bg-white/20 backdrop-blur rounded-lg text-xs font-semibold text-white">
                                    {currentSlide.application_date}
                                </span>
                            </div>
                            <div className="p-6">
                                <p className="text-slate-600 leading-relaxed italic">
                                    "{currentSlide.notes || 'Açıklama bulunmuyor.'}"
                                </p>
                            </div>
                        </div>

                        <div className={`rounded-2xl shadow-md px-6 py-2.5 flex items-center justify-between shrink-0 border transition-all duration-300 ${isAbovePoverty
                            ? 'bg-rose-50 border-rose-200 shadow-rose-100/50'
                            : 'bg-emerald-50 border-emerald-200 shadow-emerald-100/50'
                            }`}>
                            <div className="flex items-center gap-8">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isAbovePoverty ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                                        <Briefcase size={16} className={isAbovePoverty ? 'text-rose-600' : 'text-emerald-600'} />
                                    </div>
                                    <div>
                                        <p className={`text-[9px] uppercase font-bold leading-none ${isAbovePoverty ? 'text-rose-400' : 'text-emerald-400'}`}>Toplam Gelir</p>
                                        <p className={`text-sm font-bold ${isAbovePoverty ? 'text-rose-900' : 'text-emerald-900'}`}>{parseFloat(person.household_income || 0).toLocaleString('tr-TR')} ₺</p>
                                    </div>
                                </div>
                                <div className={`w-px h-6 ${isAbovePoverty ? 'bg-rose-200' : 'bg-emerald-200'}`}></div>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isAbovePoverty ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                                        <Users size={16} className={isAbovePoverty ? 'text-rose-600' : 'text-emerald-600'} />
                                    </div>
                                    <div>
                                        <p className={`text-[9px] uppercase font-bold leading-none ${isAbovePoverty ? 'text-rose-400' : 'text-emerald-400'}`}>Kişi Başı Gelir</p>
                                        <p className={`text-sm font-bold ${isAbovePoverty ? 'text-rose-900' : 'text-emerald-900'}`}>{parseFloat(person.per_capita_income || 0).toLocaleString('tr-TR')} ₺</p>
                                    </div>
                                </div>
                            </div>

                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm ${isAbovePoverty ? 'bg-white border-rose-200' : 'bg-white border-emerald-200'}`}>
                                <div className={`w-2 h-2 rounded-full animate-pulse ${isAbovePoverty ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isAbovePoverty ? 'text-rose-700' : 'text-emerald-700'}`}>
                                    {isAbovePoverty ? 'Hane Muhtaçlık Sınırının Üzerinde' : 'Hane Muhtaçlık Sınırının Altında'}
                                </span>
                            </div>
                        </div>

                        {/* Middle Row */}
                        <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0">

                            {/* Investigation Report */}
                            <div className="flex-[3] bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 flex flex-col">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 shrink-0">
                                    <Home size={18} className="text-blue-600" />
                                    <h4 className="font-semibold text-slate-800">Sosyal İnceleme Raporu</h4>
                                </div>
                                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                    {person.household_description_lines?.map((line, lid) => (
                                        <div key={lid} className="flex gap-3 group">
                                            <div className="w-2 h-2 rounded-full bg-blue-200 mt-2 shrink-0 group-hover:bg-blue-500 transition-colors"></div>
                                            <p className="text-sm text-slate-600 leading-relaxed">{line}</p>
                                        </div>
                                    ))}
                                    {(!person.household_description_lines || person.household_description_lines.length === 0) && (
                                        <p className="text-sm text-slate-400 italic text-center py-8">Rapor kaydı bulunmuyor.</p>
                                    )}
                                </div>
                            </div>

                            {/* Aid Column */}
                            <div className="flex-[2] flex flex-col gap-5 min-h-0">
                                {/* Aid History */}
                                <div className="flex-1 bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 flex flex-col min-h-0">
                                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 shrink-0">
                                        <Briefcase size={18} className="text-emerald-600" />
                                        <h4 className="font-semibold text-slate-800">Kurum Yardım Geçmişi</h4>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                                        {currentSlide.assistance_records?.map((rec, rid) => (
                                            <div key={rid} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700">{rec.assistance_type}</p>
                                                    <p className="text-xs text-slate-400">{formatTurkishDate(rec.assistance_date)}</p>
                                                </div>
                                                <span className="px-3 py-1.5 bg-white rounded-lg text-sm font-bold text-emerald-600 shadow-sm">
                                                    {parseFloat(rec.assistance_amount).toLocaleString('tr-TR')} ₺
                                                </span>
                                            </div>
                                        ))}
                                        {(!currentSlide.assistance_records || currentSlide.assistance_records.length === 0) && (
                                            <p className="text-sm text-slate-400 italic text-center py-8">Kayıt yok.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Central Assistance Simplified */}
                                {currentSlide.central_assistance && currentSlide.central_assistance.length > 0 && (
                                    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-5 shrink-0">
                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                                            <Info size={16} className="text-violet-600" />
                                            <h4 className="text-sm font-semibold text-slate-800">Merkezi Yardımlar</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {currentSlide.central_assistance.map((item, idx) => (
                                                item ? (
                                                    <span key={idx} className="px-3 py-1 bg-violet-50 text-violet-600 rounded-lg text-xs font-bold border border-violet-100">
                                                        {typeof item === 'string' ? item : item.type || '-'}
                                                    </span>
                                                ) : null
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Progress Bar */}
            <div className="h-1 bg-slate-200 shrink-0">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                    style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
                ></div>
            </div>

            {/* Navigation Footer */}
            <div className="h-16 md:h-12 bg-white/90 backdrop-blur-xl border-t border-slate-200/50 flex items-center justify-between px-4 md:px-8 shrink-0">
                <button
                    onClick={prevSlide}
                    disabled={currentIndex === 0}
                    className="flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-2 h-full text-sm md:text-sm font-bold text-slate-600 hover:text-slate-800 disabled:opacity-30 transition-all border-r sm:border-r-0 border-slate-100"
                >
                    <ChevronLeft size={20} /> <span className="hidden sm:inline">Önceki</span>
                </button>
                <div className="flex-[2] sm:flex-none flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-6 px-4">
                    <button onClick={() => navigate('/agendas')} className="text-[10px] md:text-xs text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase tracking-wider">Çıkış</button>
                    <span className="text-xs md:text-sm font-black text-slate-700 whitespace-nowrap">{currentIndex + 1} / {slides.length}</span>
                </div>
                <button
                    onClick={nextSlide}
                    disabled={currentIndex === slides.length - 1}
                    className="flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-2 h-full text-sm md:text-sm font-bold text-blue-600 hover:text-blue-800 disabled:opacity-30 transition-all border-l sm:border-l-0 border-slate-100"
                >
                    <span className="hidden sm:inline">Sonraki</span> <ChevronRight size={20} />
                </button>
            </div>

            {/* Image Popup */}
            {showImagePopup && currentSlide.household_images && currentSlide.household_images.length > 0 && (
                <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex flex-col p-6">

                    {/* Modal Header */}
                    <div className="flex items-center justify-between mb-6 shrink-0">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-white">{person.full_name}</h2>
                            <span className="px-3 py-1 bg-white/10 rounded-lg text-sm text-white/80">
                                {popupImageIndex + 1} / {currentSlide.household_images.length}
                            </span>
                            <span className="text-xs text-white/50">← → ok tuşları ile gezin</span>
                        </div>
                        <button onClick={() => setShowImagePopup(false)} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Image Container */}
                    <div className="flex-1 flex items-center justify-center relative min-h-0">
                        <button
                            onClick={() => setPopupImageIndex(prev => prev > 0 ? prev - 1 : currentSlide.household_images.length - 1)}
                            className="absolute left-4 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all z-10"
                        >
                            <ArrowLeft size={28} />
                        </button>

                        <img
                            src={`/api/household_image/${currentSlide.household_images[popupImageIndex].id}`}
                            className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
                            alt=""
                        />

                        <button
                            onClick={() => setPopupImageIndex(prev => prev < currentSlide.household_images.length - 1 ? prev + 1 : 0)}
                            className="absolute right-4 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all z-10"
                        >
                            <ArrowRight size={28} />
                        </button>
                    </div>

                    {/* Thumbnail Strip */}
                    <div className="flex items-center justify-center gap-3 mt-6 shrink-0">
                        {currentSlide.household_images.map((img, idx) => (
                            <button
                                key={img.id}
                                onClick={() => setPopupImageIndex(idx)}
                                className={`w-12 h-12 rounded-xl font-bold text-lg transition-all flex items-center justify-center ${idx === popupImageIndex ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/50' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-5xl max-h-full overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b shrink-0 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                    <Edit size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Hane Bilgilerini Düzenle</h3>
                                    <p className="text-sm text-slate-500 font-medium">{person.full_name} - Dosya: #{person.file_no}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-slate-50/30">
                            <PersonForm
                                inlineId={person.id}
                                onClose={(saved) => {
                                    setShowEditModal(false);
                                    if (saved) refreshData();
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
                
                .custom-scrollbar-hidden::-webkit-scrollbar { width: 0px; background: transparent; }
            `}} />
        </div>
    );
}
