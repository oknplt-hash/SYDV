import React, { useState, useEffect } from 'react';
import api from '../api';

import { Search, ChevronLeft, ChevronRight, Edit, Trash2, UserPlus, Users, Plus, X, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

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

export function Persons() {
    const [persons, setPersons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        total_pages: 1,
        total_count: 0
    });
    const [error, setError] = useState(null);
    const [searchPerformed, setSearchPerformed] = useState(false);
    const [showAddToAgendaModal, setShowAddToAgendaModal] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [agendas, setAgendas] = useState([]);
    const [loadingAgendas, setLoadingAgendas] = useState(false);
    const [selectedAgendaId, setSelectedAgendaId] = useState('');
    const [assistanceItems, setAssistanceItems] = useState([{
        assistance_type: "Nakit Yardımı",
        application_date: new Date().toISOString().split('T')[0],
        notes: ''
    }]);
    const navigate = useNavigate();

    const fetchPersons = async (page = 1, search = searchTerm) => {
        setLoading(true);
        setError(null);
        setSearchPerformed(!!search);
        try {
            const response = await api.get(`/persons?page=${page}&search=${searchTerm}`)
            if (!response.data || !response.data.persons) {
                throw new Error("Veri formatı geçersiz");
            }
            setPersons(response.data.persons);
            setPagination({
                page: response.data.page,
                total_pages: response.data.total_pages,
                total_count: response.data.total_count
            });
        } catch (error) {
            console.error("Error fetching persons:", error);
            const errorMessage = error.response?.data?.error || error.message;
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchPersons(1, searchTerm);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchPersons(1, searchTerm);
    };

    const handleEdit = (id) => {
        navigate(`/person/${id}/edit`);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
        try {
            await api.delete(`/person/${id}`);
            fetchPersons(pagination.page);
        } catch (error) {
            console.error("Error deleting person:", error);
            alert("Silme işlemi başarısız oldu.");
        }
    };

    const handleAddToAgenda = async (person) => {
        setSelectedPerson(person);
        setShowAddToAgendaModal(true);
        setLoadingAgendas(true);
        setAssistanceItems([{
            assistance_type: "Nakit Yardımı",
            application_date: new Date().toISOString().split('T')[0],
            notes: ''
        }]);
        try {
            const response = await api.get('/agendas');
            const agendasData = response.data.agendas;
            setAgendas(agendasData);
            // Set the most recent agenda as default
            if (agendasData.length > 0) {
                setSelectedAgendaId(agendasData[0].id.toString());
            }
        } catch (error) {
            console.error("Error fetching agendas:", error);
            alert("Gündemler yüklenirken bir hata oluştu.");
        } finally {
            setLoadingAgendas(false);
        }
    };

    const addAssistanceItem = () => {
        setAssistanceItems([...assistanceItems, {
            assistance_type: "Nakit Yardımı",
            application_date: new Date().toISOString().split('T')[0],
            notes: ''
        }]);
    };

    const removeAssistanceItem = (index) => {
        setAssistanceItems(assistanceItems.filter((_, i) => i !== index));
    };

    const updateAssistanceItem = (index, field, value) => {
        const updated = [...assistanceItems];
        updated[index][field] = value;
        setAssistanceItems(updated);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const addPersonToAgenda = async () => {
        if (!selectedAgendaId) {
            alert("Lütfen bir gündem seçin");
            return;
        }

        setIsSubmitting(true);
        try {
            // Add all assistance items
            for (const item of assistanceItems) {
                await api.post(`/agenda/${selectedAgendaId}/add_item`, {
                    person_id: selectedPerson.id,
                    application_date: item.application_date,
                    assistance_type: item.assistance_type,
                    notes: item.notes
                });
            }

            setShowAddToAgendaModal(false);
            setSelectedPerson(null);
            setSelectedAgendaId('');
            setAssistanceItems([{
                assistance_type: "Nakit Yardımı",
                application_date: new Date().toISOString().split('T')[0],
                notes: ''
            }]);
            alert(`${selectedPerson.full_name} için ${assistanceItems.length} başvuru başarıyla gündeme eklendi!`);
        } catch (error) {
            console.error("Error adding to agenda:", error);
            alert("Gündeme eklenirken bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (error) {
        return (
            <div className="p-8 text-center text-red-500">
                <h3 className="font-bold">Bir hata oluştu</h3>
                <p>{error}</p>
                <button onClick={() => fetchPersons(1)} className="mt-4 underline">Tekrar Dene</button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="w-full lg:w-auto">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Haneler</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Sisteme kayıtlı {pagination.total_count} hane bulunuyor
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <form onSubmit={handleSearch} className="relative flex-1 sm:min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="search"
                            placeholder="Hane ara..."
                            className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </form>
                    <button
                        onClick={() => navigate('/person/new')}
                        className="inline-flex items-center justify-center rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        <UserPlus size={18} />
                        <span>Yeni Hane</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-sm text-muted-foreground font-medium">Yükleniyor...</p>
                    </div>
                ) : persons.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed p-12 text-center bg-card/50">
                        {searchPerformed && searchTerm ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 bg-muted rounded-full">
                                    <Search size={32} className="text-muted-foreground" />
                                </div>
                                <div className="text-muted-foreground">
                                    <p className="font-bold text-lg">Sonuç bulunamadı</p>
                                    <p className="text-sm mt-1">"{searchTerm}" için herhangi bir hane kaydı mevcut değil.</p>
                                </div>
                                <button
                                    onClick={() => navigate('/person/new', { state: { file_no: searchTerm } })}
                                    className="inline-flex items-center justify-center rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 gap-2"
                                >
                                    <Plus size={18} />
                                    Yeni Hane Olarak Kaydet
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Users size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                                <p className="font-semibold text-lg">Henüz hane bulunmuyor</p>
                                <p className="text-sm text-muted-foreground">Sisteme ilk hane kaydını ekleyerek başlayın.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block rounded-2xl border bg-card shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b bg-muted/30">
                                        <tr>
                                            <th className="h-12 px-4 text-left font-bold text-slate-700">Dosya No</th>
                                            <th className="h-12 px-4 text-left font-bold text-slate-700">Ad Soyad</th>
                                            <th className="h-12 px-4 text-left font-bold text-slate-700">Telefon</th>
                                            <th className="h-12 px-4 text-left font-bold text-slate-700">Sosyal Güvence</th>
                                            <th className="h-12 px-4 text-left font-bold text-slate-700">Kayıt Tarihi</th>
                                            <th className="h-12 px-4 text-right font-bold text-slate-700">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {persons.map((person) => (
                                            <tr key={person.id} className="hover:bg-muted/30 transition-colors group">
                                                <td className="p-4 font-bold text-primary">#{person.file_no}</td>
                                                <td className="p-4 font-semibold text-slate-900">{person.full_name}</td>
                                                <td className="p-4 text-slate-600">{person.phone || "-"}</td>
                                                <td className="p-4">
                                                    <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium">
                                                        {person.social_security || "Kayıtsız"}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-500">
                                                    {person.created_at ? new Date(person.created_at).toLocaleDateString('tr-TR') : "-"}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleAddToAgenda(person)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:shadow-lg transition-all"
                                                        >
                                                            <Plus size={14} /> Gündem
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(person.id)}
                                                            className="p-1.5 border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(person.id)}
                                                            className="p-1.5 border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden grid gap-4">
                            {persons.map((person) => (
                                <div key={person.id} className="bg-white rounded-2xl border p-5 space-y-4 shadow-sm active:scale-[0.98] transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="min-w-[3.5rem] h-10 px-2.5 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm border border-indigo-100 shrink-0 shadow-sm shadow-indigo-50/50">
                                                #{person.file_no}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 leading-none mb-1.5">{person.full_name}</h3>
                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {person.created_at ? new Date(person.created_at).toLocaleDateString('tr-TR') : "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                            {person.social_security || "Güvencesiz"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 py-2 border-y border-slate-50">
                                        <div className="flex-1">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Telefon</p>
                                            <p className="text-sm font-medium text-slate-700">{person.phone || "Kayıtlı değil"}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAddToAgenda(person)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-md shadow-primary/10 transition-all"
                                        >
                                            <Plus size={16} /> Gündeme Ekle
                                        </button>
                                        <button
                                            onClick={() => handleEdit(person.id)}
                                            className="w-11 h-11 flex items-center justify-center border border-slate-100 bg-slate-50 text-slate-600 rounded-xl transition-all"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(person.id)}
                                            className="w-11 h-11 flex items-center justify-center border border-red-50 bg-red-50 text-red-600 rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Pagination */}
            {!loading && persons.length > 0 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Toplam {pagination.total_pages} sayfadan {pagination.page}. sayfa gösteriliyor
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 disabled:opacity-50 disabled:pointer-events-none"
                            disabled={pagination.page <= 1}
                            onClick={() => fetchPersons(pagination.page - 1)}
                        >
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Önceki
                        </button>
                        <button
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-4 disabled:opacity-50 disabled:pointer-events-none"
                            disabled={pagination.page >= pagination.total_pages}
                            onClick={() => fetchPersons(pagination.page + 1)}
                        >
                            Sonraki
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Add to Agenda Modal */}
            {showAddToAgendaModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <div>
                                <h3 className="text-base font-semibold">Gündeme Ekle</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {selectedPerson?.full_name} - Dosya: {selectedPerson?.file_no}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddToAgendaModal(false)}
                                className="rounded-md p-1.5 hover:bg-accent"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {loadingAgendas ? (
                                <div className="flex items-center justify-center p-8">
                                    <div className="text-center">
                                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                        <p className="text-sm text-muted-foreground">Gündemler yükleniyor...</p>
                                    </div>
                                </div>
                            ) : agendas.length === 0 ? (
                                <div className="text-center p-8">
                                    <p className="font-medium">Henüz gündem yok</p>
                                    <p className="text-sm text-muted-foreground mt-2">Önce bir gündem oluşturmalısınız</p>
                                    <button
                                        onClick={() => navigate('/agenda/new')}
                                        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                                    >
                                        Yeni Gündem Oluştur
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Agenda Selection */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium">Gündem Seçin</label>
                                        <select
                                            value={selectedAgendaId}
                                            onChange={(e) => setSelectedAgendaId(e.target.value)}
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            {agendas.map((agenda) => (
                                                <option key={agenda.id} value={agenda.id}>
                                                    {agenda.title} ({agenda.item_count || 0} madde)
                                                    {agenda.meeting_date ? ` - ${new Date(agenda.meeting_date).toLocaleDateString('tr-TR')}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Assistance Items */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-medium">Yardım Başvuruları</label>
                                            <button
                                                onClick={addAssistanceItem}
                                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                            >
                                                <Plus size={12} />
                                                Yeni Başvuru
                                            </button>
                                        </div>

                                        {assistanceItems.map((item, index) => (
                                            <div key={index} className="p-3 border rounded-md space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium">Başvuru #{index + 1}</span>
                                                    {assistanceItems.length > 1 && (
                                                        <button
                                                            onClick={() => removeAssistanceItem(index)}
                                                            className="text-destructive hover:underline text-xs"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="space-y-2.5">
                                                    {/* Type and Date side by side */}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-muted-foreground">Yardım Türü</label>
                                                            <select
                                                                value={item.assistance_type}
                                                                onChange={(e) => updateAssistanceItem(index, 'assistance_type', e.target.value)}
                                                                className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                                                            >
                                                                {HELP_TYPES.map(type => (
                                                                    <option key={type} value={type}>{type}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-muted-foreground">Başvuru Tarihi</label>
                                                            <input
                                                                type="date"
                                                                value={item.application_date}
                                                                onChange={(e) => updateAssistanceItem(index, 'application_date', e.target.value)}
                                                                className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-medium text-muted-foreground">Notlar</label>
                                                        <textarea
                                                            value={item.notes}
                                                            onChange={(e) => updateAssistanceItem(index, 'notes', e.target.value)}
                                                            placeholder="İnceleme notları, komisyon kararı vb..."
                                                            className="flex min-h-[50px] w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs resize-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Modal Footer */}
                        {!loadingAgendas && agendas.length > 0 && (
                            <div className="flex items-center justify-end gap-2 p-4 border-t">
                                <button
                                    onClick={() => setShowAddToAgendaModal(false)}
                                    className="px-3 py-1.5 text-sm rounded-md border border-input hover:bg-accent"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={addPersonToAgenda}
                                    disabled={isSubmitting}
                                    className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Ekleniyor...' : `Gündeme Ekle (${assistanceItems.length} başvuru)`}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
