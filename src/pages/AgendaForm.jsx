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
    // Sort groups: Latest added/modified item determines group position (LIFO)
    const groupedItemsParams = items.reduce((acc, item) => {
        const personId = item.person.id;
        if (!acc[personId]) {
            acc[personId] = {
                person: item.person,
                assistances: [],
                latestDate: new Date(item.created_at || new Date().toISOString()).getTime(),
                isNew: item._isNew
            };
        }
        acc[personId].assistances.push(item);
        // Update latest date if this item is newer or it's a new item being added now
        const itemDate = item._isNew ? Date.now() : new Date(item.created_at || 0).getTime();
        if (itemDate > acc[personId].latestDate) {
            acc[personId].latestDate = itemDate;
            acc[personId].isNew = item._isNew;
        }
        return acc;
    }, {});

    const sortedGroups = Object.values(groupedItemsParams).sort((a, b) => b.latestDate - a.latestDate);

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header - Compact */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-900 border border-border p-4 rounded-xl shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/agendas')}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                            {isEditing ? 'Gündemi Düzenle' : 'Yeni Gündem'}
                        </h1>
                        <p className="text-muted-foreground text-xs font-medium">
                            {isEditing ? 'Gündem detaylarını yönetin' : 'Yeni toplantı oluşturun'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-bold">{Object.keys(groupedItemsParams).length} Hane</div>
                        <div className="text-xs text-muted-foreground">{items.length} Başvuru</div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Sidebar - Form (Compact) */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="sticky top-6">
                        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-border bg-muted/30">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <FileText size={16} className="text-primary" />
                                    Gündem Bilgileri
                                </h3>
                            </div>
                            <div className="p-4">
                                <form id="agenda-form" onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="title" className="text-xs font-medium text-muted-foreground uppercase">
                                            Başlık *
                                        </label>
                                        <input
                                            id="title"
                                            name="title"
                                            type="text"
                                            required
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:ring-1 focus:ring-primary"
                                            placeholder="Örn: Ekim Ayı Toplantısı"
                                            value={formData.title}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label htmlFor="meeting_date" className="text-xs font-medium text-muted-foreground uppercase">
                                            Tarih
                                        </label>
                                        <input
                                            id="meeting_date"
                                            name="meeting_date"
                                            type="date"
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:ring-1 focus:ring-primary"
                                            value={formData.meeting_date}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label htmlFor="description" className="text-xs font-medium text-muted-foreground uppercase">
                                            Açıklama
                                        </label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary resize-none"
                                            placeholder="Notlar..."
                                            value={formData.description}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <button
                                        form="agenda-form"
                                        type="submit"
                                        disabled={loading}
                                        className="w-full inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground font-medium h-10 text-sm shadow hover:bg-primary/90 transition-all gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                        {isEditing ? 'Kaydet' : 'Oluştur'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content - Applications */}
                <div className="lg:col-span-8 space-y-4">
                    {/* Search (Compact) */}
                    <div className="bg-card border border-border rounded-xl shadow-sm p-4 relative z-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="text"
                                className="pl-9 pr-4 flex h-10 w-full rounded-lg border border-input bg-background text-sm focus:ring-1 focus:ring-primary"
                                placeholder="Gündeme eklemek için isim veya dosya no..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="animate-spin text-primary" size={16} />
                                </div>
                            )}

                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-[100] max-h-60 overflow-auto">
                                    {searchResults.map(person => (
                                        <button
                                            key={person.id}
                                            onClick={() => addPersonToAgenda(person)}
                                            className="w-full flex items-center justify-between p-3 hover:bg-muted text-left border-b last:border-0 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    {person.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm">{person.full_name}</div>
                                                    <div className="text-xs text-muted-foreground">Dosya: {person.file_no}</div>
                                                </div>
                                            </div>
                                            <UserPlus size={16} className="text-primary" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Applications List (Dense) */}
                    <div className="space-y-3">
                        {sortedGroups.length === 0 ? (
                            <div className="text-center p-8 border-2 border-dashed border-border rounded-xl bg-muted/10">
                                <p className="text-sm text-muted-foreground">Henüz başvuru yok.</p>
                            </div>
                        ) : (
                            sortedGroups.map((group, groupIndex) => (
                                <div
                                    key={group.person.id}
                                    className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"
                                >
                                    {/* Group Header */}
                                    <div className="bg-muted/30 px-4 py-2 flex items-center justify-between border-b border-border">
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-sm text-foreground">{group.person.full_name}</span>
                                            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                                #{group.person.file_no}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => addAnotherAssistance(group.person)}
                                            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                                        >
                                            <PlusCircle size={14} />
                                            Ekle
                                        </button>
                                    </div>

                                    {/* Items List */}
                                    <div className="divide-y divide-border">
                                        {group.assistances.map((item, idx) => (
                                            <div key={item.id} className={`p-3 flex gap-4 items-start ${item._isNew ? 'bg-primary/5' : ''}`}>
                                                <div className="pt-1.5 text-xs text-muted-foreground font-mono w-4">
                                                    {idx + 1}
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-12 flex-1">
                                                    {/* Type */}
                                                    <div className="sm:col-span-3">
                                                        <select
                                                            className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-primary"
                                                            value={item.assistance_type || ''}
                                                            onChange={(e) => handleItemChange(item.id, 'assistance_type', e.target.value)}
                                                        >
                                                            {HELP_TYPES.map(type => (
                                                                <option key={type} value={type}>{type}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Date */}
                                                    <div className="sm:col-span-3">
                                                        <input
                                                            type="date"
                                                            className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-primary"
                                                            value={item.application_date ? item.application_date.split('T')[0] : ''}
                                                            onChange={(e) => handleItemChange(item.id, 'application_date', e.target.value)}
                                                        />
                                                    </div>

                                                    {/* Notes */}
                                                    <div className="sm:col-span-6">
                                                        <input
                                                            type="text"
                                                            className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-primary"
                                                            placeholder="Notlar..."
                                                            value={item.notes || ''}
                                                            onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleRemoveItem(item)}
                                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                                                    title="Sil"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
