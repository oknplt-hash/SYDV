import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
            const response = await axios.get(`/api/persons?page=${page}&search=${search}`);
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
            await axios.delete(`/api/person/${id}`);
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
            const response = await axios.get('/api/agendas');
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

    const addPersonToAgenda = async () => {
        if (!selectedAgendaId) {
            alert("Lütfen bir gündem seçin");
            return;
        }

        try {
            // Add all assistance items
            for (const item of assistanceItems) {
                await axios.post(`/api/agenda/${selectedAgendaId}/add_item`, {
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Haneler</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Sisteme kayıtlı {pagination.total_count} hane bulunuyor
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="search"
                            placeholder="Hane ara..."
                            className="h-10 rounded-md border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-[200px] lg:w-[300px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </form>
                    <button
                        onClick={() => navigate('/person/new')}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 gap-2"
                    >
                        <UserPlus size={16} />
                        Yeni Hane
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border bg-card shadow-sm">
                <div className="relative w-full overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Dosya No</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Ad Soyad</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Telefon</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Sosyal Güvence</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Kayıt Tarihi</th>
                                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="h-24 text-center">Yükleniyor...</td>
                                </tr>
                            ) : persons.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="h-32 text-center">
                                        {searchPerformed && searchTerm ? (
                                            <div className="flex flex-col items-center gap-4 py-4">
                                                <div className="text-muted-foreground">
                                                    <p className="font-semibold">"{searchTerm}" için kayıt bulunamadı.</p>
                                                    <p className="text-sm mt-1">Bu dosya numarası ile yeni bir hane oluşturabilirsiniz.</p>
                                                </div>
                                                <button
                                                    onClick={() => navigate('/person/new', { state: { file_no: searchTerm } })}
                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 gap-2"
                                                >
                                                    <UserPlus size={16} />
                                                    Yeni Hane Oluştur
                                                </button>
                                            </div>
                                        ) : (
                                            "Kayıt bulunamadı."
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                persons.map((person) => (
                                    <tr key={person.id} className="border-b hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium">{person.file_no}</td>
                                        <td className="p-4 align-middle">{person.full_name}</td>
                                        <td className="p-4 align-middle">{person.phone || "-"}</td>
                                        <td className="p-4 align-middle">{person.social_security || "-"}</td>
                                        <td className="p-4 align-middle">
                                            {person.created_at ? new Date(person.created_at).toLocaleDateString('tr-TR') : "-"}
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleAddToAgenda(person)}
                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 gap-1"
                                                    title="Gündeme Ekle"
                                                >
                                                    <Plus size={14} />
                                                    Gündem
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(person.id)}
                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8"
                                                    title="Düzenle"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(person.id)}
                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-destructive hover:text-destructive-foreground h-8 w-8"
                                                    title="Sil"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
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
                                    className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    Gündeme Ekle ({assistanceItems.length} başvuru)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
