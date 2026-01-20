import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Search, UserPlus, Trash2, CalendarDays, Loader2, Info, PlusCircle, Sparkles, Users, FileText, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

const SortableHousehold = ({ group, groupIndex, totalGroups, handleMoveGroup, addAnotherAssistance, handleItemChange, handleRemoveItem, HELP_TYPES }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: group.person.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        position: 'relative',
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
            {/* Group Header */}
            <div className="bg-muted/30 px-3 md:px-4 py-3 md:py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1.5 -ml-1 text-muted-foreground hover:text-foreground touch-none bg-muted/50 rounded-lg">
                        <GripVertical size={18} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1 min-w-0">
                        <span className="font-bold text-sm md:text-base text-foreground truncate">{group.person.full_name}</span>
                        <span className="w-fit text-[10px] md:text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground border">
                            #{group.person.file_no}
                        </span>
                    </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="flex items-center bg-muted rounded-xl border border-border p-1">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleMoveGroup(groupIndex, 'up'); }}
                            disabled={groupIndex === 0}
                            className="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 transition-colors"
                            title="Yukarı Taşı"
                        >
                            <ArrowUp size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleMoveGroup(groupIndex, 'down'); }}
                            disabled={groupIndex === totalGroups - 1}
                            className="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 transition-colors"
                            title="Aşağı Taşı"
                        >
                            <ArrowDown size={16} />
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => addAnotherAssistance(group.person)}
                        className="flex-1 sm:flex-none text-xs font-bold px-3 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                        <PlusCircle size={16} />
                        Ekle
                    </button>
                </div>
            </div>

            {/* Items List */}
            <div className="divide-y divide-border">
                {group.assistances.map((item, idx) => (
                    <div key={item.id} className={`p-4 flex flex-col sm:flex-row gap-4 items-stretch sm:items-start ${item._isNew ? 'bg-primary/5' : ''}`}>
                        <div className="hidden sm:block pt-1.5 text-xs text-muted-foreground font-mono w-4 shrink-0">
                            {idx + 1}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-12 flex-1">
                            {/* Type */}
                            <div className="sm:col-span-4 lg:col-span-3">
                                <label className="sm:hidden text-[10px] font-bold text-muted-foreground uppercase mb-1 block">YARDIM TÜRÜ</label>
                                <select
                                    className="flex h-10 sm:h-8 w-full rounded-xl sm:rounded-md border border-input bg-background px-3 sm:px-2 py-1 text-sm sm:text-xs focus:ring-2 focus:ring-primary/20 transition-all"
                                    value={item.assistance_type || ''}
                                    onChange={(e) => handleItemChange(item.id, 'assistance_type', e.target.value)}
                                >
                                    {HELP_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date */}
                            <div className="sm:col-span-4 lg:col-span-3">
                                <label className="sm:hidden text-[10px] font-bold text-muted-foreground uppercase mb-1 block">BAŞVURU TARİHİ</label>
                                <input
                                    type="date"
                                    className="flex h-10 sm:h-8 w-full rounded-xl sm:rounded-md border border-input bg-background px-3 sm:px-2 py-1 text-sm sm:text-xs focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    value={item.application_date ? item.application_date.split('T')[0] : ''}
                                    onChange={(e) => handleItemChange(item.id, 'application_date', e.target.value)}
                                />
                            </div>

                            {/* Notes */}
                            <div className="sm:col-span-4 lg:col-span-6 lg:flex gap-2">
                                <div className="flex-1">
                                    <label className="sm:hidden text-[10px] font-bold text-muted-foreground uppercase mb-1 block">NOTLAR</label>
                                    <input
                                        type="text"
                                        className="flex h-10 sm:h-8 w-full rounded-xl sm:rounded-md border border-input bg-background px-3 sm:px-2 py-1 text-sm sm:text-xs focus:ring-2 focus:ring-primary/20 transition-all"
                                        placeholder="Notlar..."
                                        value={item.notes || ''}
                                        onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item)}
                                    className="sm:hidden mt-3 w-full flex items-center justify-center gap-2 py-2 text-red-500 bg-red-50 rounded-xl text-xs font-bold transition-all"
                                >
                                    <Trash2 size={16} /> Başvuruyu Kaldır
                                </button>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => handleRemoveItem(item)}
                            className="hidden sm:flex p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Sil"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

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
            // Items are already sorted by backend (sort_order ASC, created_at DESC)
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

            // After saving all items, save the final order if editing
            const personIds = [];
            const seenOrder = new Set();
            items.forEach(item => {
                if (!seenOrder.has(item.person.id)) {
                    personIds.push(item.person.id);
                    seenOrder.add(item.person.id);
                }
            });
            if (personIds.length > 0) {
                await axios.post(`/api/agenda/${agendaId}/reorder`, { person_ids: personIds });
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
            assistance_type: "Nakit Yardımı",
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
            assistance_type: "Nakit Yardımı",
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

    // Group items by person for cleaner UI
    const groupsMap = new Map();
    items.forEach(item => {
        if (!groupsMap.has(item.person.id)) {
            groupsMap.set(item.person.id, {
                person: item.person,
                assistances: [],
            });
        }
        groupsMap.get(item.person.id).assistances.push(item);
    });

    const sortedGroups = Array.from(groupsMap.values());

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setItems((prevItems) => {
            const currentGroupsMap = new Map();
            prevItems.forEach(item => {
                const pid = item.person.id;
                if (!currentGroupsMap.has(pid)) currentGroupsMap.set(pid, []);
                currentGroupsMap.get(pid).push(item);
            });

            const pids = Array.from(currentGroupsMap.keys());
            const oldIndex = pids.indexOf(active.id);
            const newIndex = pids.indexOf(over.id);

            const newPids = arrayMove(pids, oldIndex, newIndex);
            const newItems = [];
            newPids.forEach(pid => {
                newItems.push(...currentGroupsMap.get(pid));
            });
            return newItems;
        });
    };

    const handleMoveGroup = (index, direction) => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === sortedGroups.length - 1) return;

        const newGroups = [...sortedGroups];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newGroups[index], newGroups[swapIndex]] = [newGroups[swapIndex], newGroups[index]];

        // Update items state based on new group order
        const newItems = [];
        newGroups.forEach(g => {
            newItems.push(...g.assistances);
        });
        setItems(newItems);
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

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header - Compact */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white dark:bg-gray-900 border border-border p-4 rounded-2xl shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/agendas')}
                        className="p-2 rounded-xl hover:bg-muted transition-colors active:scale-95"
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
                <div className="flex items-center justify-between sm:justify-end gap-6 bg-muted/30 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none">
                    <div className="text-left sm:text-right">
                        <div className="text-sm font-black text-primary">{sortedGroups.length} Hane</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase">{items.length} Başvuru</div>
                    </div>
                    <div className="sm:hidden">
                        {/* Mobile Status Indicator */}
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase">Yayında</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Sidebar - Form (Compact) */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="lg:sticky lg:top-6">
                        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-border bg-muted/30">
                                <h3 className="font-bold text-sm flex items-center gap-2">
                                    <FileText size={18} className="text-primary" />
                                    Gündem Bilgileri
                                </h3>
                            </div>
                            <div className="p-5">
                                <form id="agenda-form" onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label htmlFor="title" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                                            Gündem Başlığı *
                                        </label>
                                        <input
                                            id="title"
                                            name="title"
                                            type="text"
                                            required
                                            className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                            placeholder="Örn: Ekim Ayı Toplantısı"
                                            value={formData.title}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="meeting_date" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                                            Toplantı Tarihi
                                        </label>
                                        <input
                                            id="meeting_date"
                                            name="meeting_date"
                                            type="date"
                                            className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                            value={formData.meeting_date}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="description" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                                            Açıklama / Notlar
                                        </label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            className="flex min-h-[100px] w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all resize-none leading-relaxed"
                                            placeholder="Gündem hakkında ek bilgiler..."
                                            value={formData.description}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <button
                                        form="agenda-form"
                                        type="submit"
                                        disabled={loading}
                                        className="w-full inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold h-12 text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all gap-2 active:scale-95 disabled:scale-100 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        {isEditing ? 'Değişiklikleri Kaydet' : 'Gündemi Oluştur'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content - Applications */}
                <div className="lg:col-span-8 space-y-4">
                    {/* Search (Compact) */}
                    <div className="bg-card border border-border rounded-2xl shadow-sm p-4 relative z-50">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                type="text"
                                className="pl-11 pr-4 flex h-11 w-full rounded-xl border border-input bg-background/50 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                placeholder="Gündeme eklemek için isim veya dosya no..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searching && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <Loader2 className="animate-spin text-primary" size={18} />
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
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={sortedGroups.map(g => g.person.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-3">
                                        {sortedGroups.map((group, groupIndex) => (
                                            <SortableHousehold
                                                key={group.person.id}
                                                group={group}
                                                groupIndex={groupIndex}
                                                totalGroups={sortedGroups.length}
                                                handleMoveGroup={handleMoveGroup}
                                                addAnotherAssistance={addAnotherAssistance}
                                                handleItemChange={handleItemChange}
                                                handleRemoveItem={handleRemoveItem}
                                                HELP_TYPES={HELP_TYPES}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
