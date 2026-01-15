import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Search, UserPlus, Trash2, CalendarDays, Loader2, Info, PlusCircle, Sparkles, Users, FileText } from 'lucide-react';

const HELP_TYPES = [
    "Gıda Yardımı",
    "Nakit Yardımı",
    "Eğitim Yardımı",
    "Giyim Yardımı",
    "Sağlık Yardımı",
    "Kira Yardımı",
    "Kömür Yardımı",
    "Tıbbi Cihaz Yardımı",
    "Ev Onarım Yardımı",
    "Ev Eşyası Yardımı",
    "Tek Seferlik Yardım",
    "Yol Yardımı",
    "Üniversite Öğrencilerine Yönelik Yardım",
    "Şartlı Eğitim Sağlık Yardımı",
    "Yaşlı Aylığı Yardımı",
    "Engelli Yardımı",
    "Doğalgaz Yardımı",
    "Diğer Yardım"
];

export function AgendaForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = !!id;

    const [formData, setFormData] = useState({
        title: '',
        meeting_date: '',
        description: ''
    });
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditing);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (isEditing) {
            fetchAgenda();
        }
    }, [id, isEditing]);

    const fetchAgenda = async () => {
        try {
            const response = await axios.get(`/api/agenda/${id}`);
            const data = response.data;
            setFormData({
                title: data.title || '',
                meeting_date: data.meeting_date ? data.meeting_date.split('T')[0] : '',
                description: data.description || ''
            });
            setItems(data.items || []);
        } catch (error) {
            console.error("Error fetching agenda:", error);
            alert("Gündem bilgileri yüklenirken bir hata oluştu.");
            navigate('/agendas');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let agendaId = id;
            if (isEditing) {
                await axios.post(`/api/agenda/${id}/update`, formData);
            } else {
                const res = await axios.post('/api/agenda/new', formData);
                agendaId = res.data.id;
            }

            // Save items
            for (const item of items) {
                if (item._isNew) {
                    await axios.post(`/api/agenda/${agendaId}/add_item`, {
                        person_id: item.person.id,
                        application_date: item.application_date,
                        assistance_type: item.assistance_type,
                        notes: item.notes
                    });
                } else if (item._isUpdated) {
                    await axios.post(`/api/agenda_item/${item.id}/update`, {
                        application_date: item.application_date,
                        assistance_type: item.assistance_type,
                        notes: item.notes
                    });
                }
            }

            navigate('/agendas');
        } catch (error) {
            console.error("Error saving agenda:", error);
            alert("Gündem kaydedilirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    // Search logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.length > 2) {
                performSearch();
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const performSearch = async () => {
        setSearching(true);
        try {
            const response = await axios.get(`/api/persons?search=${searchQuery}&per_page=5`);
            setSearchResults(response.data.persons);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setSearching(false);
        }
    };

    const addPersonToAgenda = (person) => {
        const newItem = {
            id: Date.now() + Math.random(),
            person_id: person.id,
            person: person,
            application_date: new Date().toISOString().split('T')[0],
            assistance_type: HELP_TYPES[0],
            notes: '',
            _isNew: true
        };
        setItems(prev => [newItem, ...prev]);
        setSearchQuery('');
        setSearchResults([]);
    };

    const addAnotherAssistance = (person) => {
        const newItem = {
            id: Date.now() + Math.random(),
            person_id: person.id,
            person: person,
            application_date: new Date().toISOString().split('T')[0],
            assistance_type: HELP_TYPES[0],
            notes: '',
            _isNew: true
        };
        setItems(prev => [...prev, newItem]);
    };

    const handleItemChange = (itemId, field, value) => {
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, [field]: value, _isUpdated: !item._isNew } : item
        ));
    };

    const handleRemoveItem = async (item) => {
        if (item._isNew) {
            setItems(prev => prev.filter(i => i.id !== item.id));
        } else {
            if (window.confirm("Bu başvuruyu gündemden kaldırmak istediğinize emin misiniz?")) {
                try {
                    await axios.delete(`/api/agenda_item/${item.id}`);
                    setItems(prev => prev.filter(i => i.id !== item.id));
                } catch (error) {
                    console.error("Error removing item:", error);
                    alert("Başvuru silinirken bir hata oluştu.");
                }
            }
        }
    };

    if (initialLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-16 space-y-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                </div>
                <p className="text-muted-foreground font-medium">Gündem yükleniyor...</p>
            </div>
        );
    }

    // Group items by person for cleaner UI
    const groupedItems = items.reduce((acc, item) => {
        const personId = item.person.id;
        if (!acc[personId]) {
            acc[personId] = {
                person: item.person,
                assistances: []
            };
        }
        acc[personId].assistances.push(item);
        return acc;
    }, {});

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 shadow-2xl">
                <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/agendas')}
                            className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all hover:scale-110"
                        >
                            <ArrowLeft className="text-white" size={24} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                                <Sparkles className="text-white" size={28} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-lg">
                                    {isEditing ? 'Gündemi Düzenle' : 'Yeni Gündem Oluştur'}
                                </h1>
                                <p className="text-indigo-100 text-sm font-medium mt-1">
                                    {isEditing ? 'Gündem bilgilerini ve başvuruları güncelleyin' : 'Toplantı için yeni bir gündem oluşturun'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Sidebar - Form */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="sticky top-6 space-y-6">
                        {/* Form Card */}
                        <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-lg overflow-hidden">
                            <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl">
                                        <FileText className="text-white" size={20} />
                                    </div>
                                    <h3 className="font-bold text-lg text-foreground">Gündem Bilgileri</h3>
                                </div>
                            </div>
                            <div className="p-6">
                                <form id="agenda-form" onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-2">
                                        <label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Gündem Başlığı *
                                        </label>
                                        <input
                                            id="title"
                                            name="title"
                                            type="text"
                                            required
                                            className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                            placeholder="Örn: Ekim Ayı Yardım Komitesi"
                                            value={formData.title}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="meeting_date" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Toplantı Tarihi
                                        </label>
                                        <input
                                            id="meeting_date"
                                            name="meeting_date"
                                            type="date"
                                            className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                            value={formData.meeting_date}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Açıklama
                                        </label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            className="flex min-h-[120px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                                            placeholder="Gündem ile ilgili notlar..."
                                            value={formData.description}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <button
                                        form="agenda-form"
                                        type="submit"
                                        disabled={loading}
                                        className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-6 py-3.5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={20} />
                                                Kaydediliyor...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={20} />
                                                {isEditing ? 'Değişiklikleri Kaydet' : 'Gündem Oluştur'}
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Stats Card */}
                        <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-indigo-500 to-purple-500 p-6 shadow-lg text-white">
                            <div className="flex items-center justify-between mb-4">
                                <Users size={28} className="text-white/80" />
                            </div>
                            <div className="text-4xl font-black mb-1">{Object.keys(groupedItems).length}</div>
                            <div className="text-sm font-semibold text-white/90">Toplam Hane</div>
                            <div className="mt-4 pt-4 border-t border-white/20">
                                <div className="text-2xl font-black mb-1">{items.length}</div>
                                <div className="text-xs font-semibold text-white/90">Toplam Başvuru</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content - Applications */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Search Section */}
                    <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-lg overflow-visible">
                        <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl">
                                    <Search className="text-white" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-foreground">Hane Ara ve Ekle</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">İsim veya dosya numarası ile arama yapın</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="relative z-[100]">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                <input
                                    type="text"
                                    className="pl-12 pr-4 flex h-12 w-full rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="Gündeme kişi eklemek için isim veya dosya no ile ara..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searching && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <Loader2 className="animate-spin text-indigo-600" size={20} />
                                    </div>
                                )}

                                {searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-[100] max-h-80 overflow-auto">
                                        {searchResults.map(person => (
                                            <button
                                                key={person.id}
                                                onClick={() => addPersonToAgenda(person)}
                                                className="w-full flex items-center justify-between p-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-left border-b last:border-0 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                                        {person.full_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-sm text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                            {person.full_name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Dosya No: {person.file_no} | TC: {person.social_security || '---'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <UserPlus size={18} className="text-indigo-600 dark:text-indigo-400" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Applications List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="font-bold text-xl flex items-center gap-3">
                                <span className="text-foreground">Başvurular</span>
                                <span className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 px-3 py-1 text-xs font-black text-white shadow-lg">
                                    {Object.keys(groupedItems).length} Hane
                                </span>
                            </h3>
                        </div>

                        {Object.keys(groupedItems).length === 0 ? (
                            <div className="rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 p-16 text-center">
                                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
                                    <Info className="text-indigo-600 dark:text-indigo-400" size={40} />
                                </div>
                                <p className="text-lg font-bold text-foreground">Henüz başvuru eklenmedi</p>
                                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                                    Yukarıdaki arama kutusunu kullanarak gündeme kişi ekleyebilirsiniz.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {Object.values(groupedItems).map((group, groupIndex) => (
                                    <div
                                        key={group.person.id}
                                        className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-lg overflow-hidden"
                                        style={{ animationDelay: `${groupIndex * 100}ms` }}
                                    >
                                        {/* Person Header */}
                                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                                                    {group.person.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-base text-foreground">{group.person.full_name}</div>
                                                    <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                                        Dosya: {group.person.file_no}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => addAnotherAssistance(group.person)}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold hover:shadow-lg transition-all hover:scale-105"
                                            >
                                                <PlusCircle size={14} />
                                                Yeni Yardım
                                            </button>
                                        </div>

                                        {/* Assistances */}
                                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {group.assistances.map((item, idx) => (
                                                <div
                                                    key={item.id}
                                                    className={`p-6 ${item._isNew ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                                                >
                                                    <div className="flex items-start justify-between gap-4 mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-xs font-black">
                                                                {idx + 1}
                                                            </span>
                                                            {item._isNew && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold">
                                                                    <Sparkles size={10} />
                                                                    Yeni
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveItem(item)}
                                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>

                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                                Yardım Türü
                                                            </label>
                                                            <select
                                                                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                                                                value={item.assistance_type || ''}
                                                                onChange={(e) => handleItemChange(item.id, 'assistance_type', e.target.value)}
                                                            >
                                                                {HELP_TYPES.map(type => (
                                                                    <option key={type} value={type}>{type}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                                Başvuru Tarihi
                                                            </label>
                                                            <input
                                                                type="date"
                                                                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                                                                value={item.application_date ? item.application_date.split('T')[0] : ''}
                                                                onChange={(e) => handleItemChange(item.id, 'application_date', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="sm:col-span-2 space-y-2">
                                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                                                Notlar / Karar
                                                            </label>
                                                            <textarea
                                                                className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                                                                placeholder="İnceleme notları, komisyon kararı vb..."
                                                                value={item.notes || ''}
                                                                onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
