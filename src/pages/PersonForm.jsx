import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2, Camera, Upload, X } from 'lucide-react';

const SOCIAL_SECURITY_OPTIONS = ["G0", "G1", "Emekli", "65 Maaşı", "Engelli Maaşı", "Bağkur", "SGK"];
const DISABILITY_OPTIONS = ["Yok", "Var"];
const CENTRAL_ASSISTANCE_OPTIONS = [
    "Engelli Aylığı", "Yaşlı Aylığı", "Şartlı Eğitim Sağlık",
    "Doğalgaz Tüketim Desteği", "Elektrik Tüketim Desteği", "SHÇEK", "E.V.E.K"
];
const ASSISTANCE_TYPES = [
    "Gida Yardimi", "Nakit Yardim", "Egitim Yardimi", "Giysi Yardimi",
    "Saglik Yardimi", "Kira Yardimi", "Komur Yardimi", "Tibbi Cihaz Yardimi",
    "Ev Onarim Yardimi", "Ev Esyasi Yardimi", "Aile Yardimi", "Tek Seferlik Yardim",
    "Yol Yardimi", "Universite Ogrencilerine Yonelik Yardim",
    "Sartli Egitim Saglik Yardimi", "Yasli Ayligi", "Engelli Ayligi",
    "Dogalgaz", "Diger Merkezi Yardimlar", "65'lik Maasi", "Diger"
];

export function PersonForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isEditing = !!id;

    const [formData, setFormData] = useState({
        file_no: location.state?.file_no || '',
        full_name: '',
        national_id: '',
        birth_date: '',
        spouse_name: '',
        household_size: '',
        children_count: '',
        student_count: '',
        phone: '',
        address: '',
        social_security: '',
        disability_status: 'Yok',
        disability_rate: '',
        household_description: '',
        household_income: '',
        per_capita_income: '',
        central_assistance: [],
    });

    const [assistanceRecords, setAssistanceRecords] = useState([]);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
    const [householdImages, setHouseholdImages] = useState([]);
    const [householdImagesPreviews, setHouseholdImagesPreviews] = useState([]);
    const [existingHouseholdImages, setExistingHouseholdImages] = useState([]);
    const [deleteImageIds, setDeleteImageIds] = useState([]);

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditing);
    const [fileNoStatus, setFileNoStatus] = useState({ status: 'idle', person: null });

    useEffect(() => {
        if (isEditing) {
            const fetchPerson = async () => {
                try {
                    const response = await axios.get(`/api/person/${id}`);
                    const data = response.data;
                    setFormData({
                        file_no: data.file_no || '',
                        full_name: data.full_name || '',
                        national_id: data.national_id || '',
                        birth_date: data.birth_date || '',
                        spouse_name: data.spouse_name || '',
                        household_size: data.household_size || '',
                        children_count: data.children_count || '',
                        student_count: data.student_count || '',
                        phone: data.phone || '',
                        address: data.address || '',
                        social_security: data.social_security || '',
                        disability_status: data.disability_status || 'Yok',
                        disability_rate: data.disability_rate || '',
                        household_description: data.household_description || '',
                        household_income: data.household_income || '',
                        per_capita_income: data.per_capita_income || '',
                        central_assistance: data.central_assistance || [],
                    });
                    setAssistanceRecords(data.assistance_records || []);
                    setExistingHouseholdImages(data.household_images || []);
                    if (data.has_profile_photo) {
                        setProfilePhotoPreview(`/api/person/${id}/profile_photo`);
                    }
                } catch (error) {
                    console.error("Error fetching person:", error);
                    alert("Kişi bilgileri yüklenirken bir hata oluştu.");
                    navigate('/persons');
                } finally {
                    setInitialLoading(false);
                }
            };
            fetchPerson();
        }
    }, [id, isEditing, navigate]);

    useEffect(() => {
        if (isEditing || !formData.file_no || formData.file_no.length < 3) {
            setFileNoStatus({ status: 'idle', person: null });
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setFileNoStatus({ status: 'checking', person: null });
            try {
                const response = await axios.get(`/api/persons/check/${formData.file_no}`);
                if (response.data.exists) {
                    setFileNoStatus({ status: 'exists', person: response.data.person });
                } else {
                    setFileNoStatus({ status: 'available', person: null });
                }
            } catch (error) {
                console.error("Error checking file no:", error);
                setFileNoStatus({ status: 'idle', person: null });
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [formData.file_no, isEditing]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox' && name === 'central_assistance') {
            const updated = checked
                ? [...formData.central_assistance, value]
                : formData.central_assistance.filter(item => item !== value);
            setFormData(prev => ({ ...prev, central_assistance: updated }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleProfilePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePhoto(file);
            setProfilePhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleHouseholdImagesChange = (e) => {
        const files = Array.from(e.target.files);
        setHouseholdImages(prev => [...prev, ...files]);
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setHouseholdImagesPreviews(prev => [...prev, ...newPreviews]);
    };

    const removeNewHouseholdImage = (index) => {
        setHouseholdImages(prev => prev.filter((_, i) => i !== index));
        setHouseholdImagesPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingHouseholdImage = (imageId) => {
        setExistingHouseholdImages(prev => prev.filter(img => img.id !== imageId));
        setDeleteImageIds(prev => [...prev, imageId]);
    };

    const addAssistanceRecord = () => {
        setAssistanceRecords(prev => [...prev, { assistance_type: '', assistance_date: '', assistance_amount: '' }]);
    };

    const removeAssistanceRecord = (index) => {
        setAssistanceRecords(prev => prev.filter((_, i) => i !== index));
    };

    const handleAssistanceChange = (index, field, value) => {
        const updated = [...assistanceRecords];
        updated[index][field] = value;
        setAssistanceRecords(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (fileNoStatus.status === 'exists') {
            alert(`Bu dosya numarası (${formData.file_no}) zaten ${fileNoStatus.person.full_name} adına kayıtlı! Lütfen farklı bir numara giriniz.`);
            return;
        }

        setLoading(true);

        const submitData = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'central_assistance') {
                const ca = Array.isArray(formData[key]) ? formData[key] : [];
                ca.forEach(val => submitData.append('central_assistance', val));
            } else {
                submitData.append(key, formData[key] || '');
            }
        });

        if (profilePhoto) {
            submitData.append('profile_photo', profilePhoto);
        }

        if (Array.isArray(householdImages)) {
            householdImages.forEach(file => {
                submitData.append('household_images', file);
            });
        }

        if (Array.isArray(assistanceRecords)) {
            assistanceRecords.forEach(rec => {
                submitData.append('assistance_type[]', rec.assistance_type || '');
                submitData.append('assistance_date[]', rec.assistance_date || '');
                submitData.append('assistance_amount[]', rec.assistance_amount || '');
            });
        }

        if (Array.isArray(deleteImageIds)) {
            deleteImageIds.forEach(imgId => {
                submitData.append('delete_image_ids', imgId);
            });
        }

        try {
            const isProd = import.meta.env.PROD;
            const baseUrl = isProd ? '' : 'http://localhost:5000';
            const endpoint = isEditing ? `/api/person/${id}/edit?api=true` : `/api/person/new?api=true`;
            const fullUrl = `${baseUrl}${endpoint}`;

            console.log("Submitting to API URL:", fullUrl);

            await axios.post(fullUrl, submitData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 30000
            });
            navigate('/persons');
        } catch (error) {
            console.error("Error saving person:", error);
            const msg = error.response?.data?.error || "Kişi kaydedilirken bir hata oluştu.";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse text-lg font-medium">Yükleniyor...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto pb-20 px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/persons')}
                        className="p-2.5 rounded-full hover:bg-secondary transition-all hover:scale-105"
                    >
                        <ArrowLeft size={20} className="text-muted-foreground" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            {isEditing ? 'Haneyi Düzenle' : 'Yeni Hane Oluştur'}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Lütfen tüm hane bilgilerini eksiksiz giriniz.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Profil ve Temel Bilgiler */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Profil Fotoğrafı */}
                        <div className="rounded-2xl border bg-card text-card-foreground shadow-sm p-6 overflow-hidden relative group">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Camera size={18} className="text-primary" />
                                Profil Fotoğrafı
                            </h3>
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="relative w-40 h-40 rounded-3xl border-2 border-dashed border-muted-foreground/20 overflow-hidden bg-muted/30 flex items-center justify-center group">
                                    {profilePhotoPreview ? (
                                        <img src={profilePhotoPreview} alt="Profil" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <Upload size={40} className="text-muted-foreground/30" />
                                    )}
                                    <label className="absolute inset-0 cursor-pointer bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white text-xs font-semibold px-3 py-1.5 bg-primary/80 rounded-full">Fotoğraf Seç</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoChange} />
                                    </label>
                                </div>
                                <p className="text-xs text-muted-foreground text-center">
                                    PNG, JPG veya JPEG (Max 5MB)
                                </p>
                            </div>
                        </div>

                        {/* Fiziksel Dosya ve Kimlik */}
                        <div className="rounded-2xl border bg-card text-card-foreground shadow-sm p-6 space-y-5">
                            <h3 className="font-bold text-lg border-b pb-3 mb-2">Kimlik & Erişim</h3>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dosya No *</label>
                                <div className="relative">
                                    <input
                                        name="file_no"
                                        required
                                        className={`flex h-11 w-full rounded-xl border px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all ${fileNoStatus.status === 'exists' ? 'border-red-500 bg-red-50' :
                                            fileNoStatus.status === 'available' ? 'border-green-500 bg-green-50' :
                                                'border-input bg-background/50'
                                            }`}
                                        placeholder="S-1234"
                                        value={formData.file_no}
                                        onChange={handleChange}
                                    />
                                    {fileNoStatus.status === 'checking' && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                                {fileNoStatus.status === 'exists' && (
                                    <div className="p-3 rounded-lg bg-red-100 border border-red-200 text-red-700 text-xs font-medium animate-in fade-in slide-in-from-top-2">
                                        ⚠️ Bu numara <strong>{fileNoStatus.person.full_name}</strong> adına zaten kayıtlı!
                                    </div>
                                )}
                                {fileNoStatus.status === 'available' && (
                                    <div className="text-[10px] text-green-600 font-bold px-1">
                                        ✓ Bu numara kullanılabilir.
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ad Soyad *</label>
                                <input
                                    name="full_name"
                                    required
                                    className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">T.C. Kimlik No</label>
                                <input
                                    name="national_id"
                                    maxLength={11}
                                    className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    value={formData.national_id}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Doğum Tarihi</label>
                                <input
                                    type="date"
                                    name="birth_date"
                                    className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    value={formData.birth_date}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Telefon</label>
                                <input
                                    name="phone"
                                    className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    placeholder="05xx xxx xx xx"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Detaylı Hane Bilgileri */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="rounded-2xl border bg-card text-card-foreground shadow-sm p-6 space-y-6">
                            <h3 className="font-bold text-xl border-b pb-4">Hane ve Sosyo-Ekonomik Durum</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Eşinin Adı Soyadı</label>
                                    <input
                                        name="spouse_name"
                                        className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        value={formData.spouse_name}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sosyal Güvence</label>
                                    <select
                                        name="social_security"
                                        className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        value={formData.social_security}
                                        onChange={handleChange}
                                    >
                                        <option value="">Seçiniz</option>
                                        {SOCIAL_SECURITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hane Nüfusu</label>
                                    <input
                                        type="number"
                                        name="household_size"
                                        className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm"
                                        value={formData.household_size}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Çocuk Sayısı</label>
                                    <input
                                        type="number"
                                        name="children_count"
                                        className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm"
                                        value={formData.children_count}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Öğrenci Sayısı</label>
                                    <input
                                        type="number"
                                        name="student_count"
                                        className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm"
                                        value={formData.student_count}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Engel Durumu</label>
                                    <select
                                        name="disability_status"
                                        className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm"
                                        value={formData.disability_status}
                                        onChange={handleChange}
                                    >
                                        {DISABILITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {formData.disability_status === 'Var' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Engel Oranı (%)</label>
                                        <input
                                            name="disability_rate"
                                            placeholder="40"
                                            className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm"
                                            value={formData.disability_rate}
                                            onChange={handleChange}
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hane Aylık Gelir</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="household_income"
                                        className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm"
                                        value={formData.household_income}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kişi Başı Gelir</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="per_capita_income"
                                        className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm"
                                        value={formData.per_capita_income}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Adres</label>
                                <textarea
                                    name="address"
                                    className="flex min-h-[100px] w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm"
                                    value={formData.address}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Merkezi Yardımlar */}
                        <div className="rounded-2xl border bg-card text-card-foreground shadow-sm p-6 space-y-4">
                            <h3 className="font-bold text-lg border-b pb-3">Alınan Merkezi Yardımlar</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {CENTRAL_ASSISTANCE_OPTIONS.map(opt => (
                                    <label key={opt} className="flex items-center gap-3 p-3 rounded-xl border border-input bg-background/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                                        <input
                                            type="checkbox"
                                            name="central_assistance"
                                            value={opt}
                                            checked={formData.central_assistance.includes(opt)}
                                            onChange={handleChange}
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary shadow-sm"
                                        />
                                        <span className="text-sm font-medium">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Açıklama */}
                        <div className="rounded-2xl border bg-card text-card-foreground shadow-sm p-6 space-y-4">
                            <h3 className="font-bold text-lg border-b pb-3">Hane Sosyal İnceleme Notları</h3>
                            <textarea
                                name="household_description"
                                className="flex min-h-[150px] w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm leading-relaxed"
                                placeholder="Hane ziyareti notları, genel durum değerlendirmesi..."
                                value={formData.household_description}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Hane Fotoğrafları */}
                <div className="rounded-2xl border bg-card text-card-foreground shadow-sm p-6 space-y-6">
                    <div className="flex items-center justify-between border-b pb-4">
                        <h3 className="font-bold text-xl flex items-center gap-2">
                            <Upload size={22} className="text-primary" />
                            Hane Fotoğrafları
                        </h3>
                        <label className="inline-flex items-center justify-center rounded-xl text-sm font-bold bg-secondary hover:bg-secondary/80 h-10 px-4 transition-all cursor-pointer">
                            Seç ve Yükle
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleHouseholdImagesChange} />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {/* Mevcutlar */}
                        {existingHouseholdImages.map((img) => (
                            <div key={img.id} className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-muted shadow-sm transition-all hover:shadow-md">
                                <img src={`/api/household_image/${img.id}/thumb`} alt="Hane" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                <button
                                    type="button"
                                    onClick={() => removeExistingHouseholdImage(img.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                >
                                    <X size={14} strokeWidth={3} />
                                </button>
                            </div>
                        ))}
                        {/* Yeniler */}
                        {householdImagesPreviews.map((preview, idx) => (
                            <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-primary/20 shadow-sm animate-in fade-in zoom-in duration-300">
                                <img src={preview} alt="Yeni Hane" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                    <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Yüklenecek</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeNewHouseholdImage(idx)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                >
                                    <X size={14} strokeWidth={3} />
                                </button>
                            </div>
                        ))}
                        {existingHouseholdImages.length === 0 && householdImagesPreviews.length === 0 && (
                            <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-muted/20 text-muted-foreground/50">
                                <Upload size={40} className="mb-2 opacity-20" />
                                <p className="text-sm font-medium">Henüz fotoğraf eklenmemiş</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Geçmiş Yardımlar */}
                <div className="rounded-2xl border bg-card text-card-foreground shadow-sm p-6 space-y-6">
                    <div className="flex items-center justify-between border-b pb-4">
                        <h3 className="font-bold text-xl">Daha Önce Aldığı Yardımlar</h3>
                        <button
                            type="button"
                            onClick={addAssistanceRecord}
                            className="inline-flex items-center justify-center rounded-xl text-sm font-bold bg-primary/10 text-primary hover:bg-primary/20 h-10 px-4 transition-all gap-2"
                        >
                            <Plus size={18} />
                            Satır Ekle
                        </button>
                    </div>

                    <div className="space-y-4">
                        {assistanceRecords.length > 0 ? (
                            <div className="hidden md:grid grid-cols-12 gap-4 px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                <div className="col-span-1">No</div>
                                <div className="col-span-4">Yardım Türü</div>
                                <div className="col-span-3">Tarih</div>
                                <div className="col-span-3">Miktar (TL)</div>
                                <div className="col-span-1"></div>
                            </div>
                        ) : null}

                        {assistanceRecords.map((rec, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-2xl border bg-background/50 items-center animate-in slide-in-from-left-4 duration-300">
                                <div className="md:col-span-1 font-bold text-primary flex items-center md:justify-center">
                                    <span className="md:hidden mr-2">Kayit #:</span> #{idx + 1}
                                </div>
                                <div className="md:col-span-4">
                                    <select
                                        className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                        value={rec.assistance_type}
                                        onChange={(e) => handleAssistanceChange(idx, 'assistance_type', e.target.value)}
                                    >
                                        <option value="">Seçiniz</option>
                                        {ASSISTANCE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-3">
                                    <input
                                        type="month"
                                        className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                        value={rec.assistance_date}
                                        onChange={(e) => handleAssistanceChange(idx, 'assistance_date', e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                        value={rec.assistance_amount}
                                        onChange={(e) => handleAssistanceChange(idx, 'assistance_amount', e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-1 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => removeAssistanceRecord(idx)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {assistanceRecords.length === 0 && (
                            <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-muted/20 text-muted-foreground/50">
                                <p className="text-sm font-medium">Kayıtlı yardım geçmişi yok.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t z-50">
                    <div className="max-w-5xl mx-auto flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/persons')}
                            className="inline-flex items-center justify-center rounded-xl text-sm font-bold h-12 px-8 border border-input bg-background hover:bg-secondary transition-all"
                        >
                            Vazgeç
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center rounded-xl text-sm font-bold h-12 px-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Kaydediliyor...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Save size={18} />
                                    Kaydı Tamamla
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
