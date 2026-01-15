import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, FileText, ChevronRight, Presentation, Edit3 } from 'lucide-react';

export function Agendas() {
    const [agendas, setAgendas] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAgendas = async () => {
            try {
                const response = await axios.get('/api/agendas');
                setAgendas(response.data.agendas);
            } catch (error) {
                console.error("Error fetching agendas:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAgendas();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "Tarih Yok";
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gündemler</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Tüm toplantı ve yardım komitesi gündemleri
                    </p>
                </div>
                <button
                    onClick={() => navigate('/agenda/new')}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 gap-2"
                >
                    <Plus size={16} />
                    Yeni Gündem
                </button>
            </div>

            {/* Agendas List */}
            {loading ? (
                <div className="text-center p-8">Yükleniyor...</div>
            ) : agendas.length === 0 ? (
                <div className="text-center p-12 border rounded-lg bg-card border-dashed">
                    <h3 className="mt-2 text-sm font-semibold">Gündem Yok</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Henüz oluşturulmuş bir gündem bulunmuyor.</p>
                    <button
                        onClick={() => navigate('/agenda/new')}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                        <Plus size={16} />
                        İlk Gündemi Oluştur
                    </button>
                </div>
            ) : (
                <div className="rounded-lg border bg-card shadow-sm">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/50">
                                <tr>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Gündem Başlığı</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Toplantı Tarihi</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Madde Sayısı</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Oluşturulma</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agendas.map((agenda) => (
                                    <tr key={agenda.id} className="border-b hover:bg-muted/50">
                                        <td className="p-4 align-middle">
                                            <div>
                                                <div className="font-medium">{agenda.title}</div>
                                                {agenda.description && (
                                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                                        {agenda.description}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar size={14} />
                                                <span>{formatDate(agenda.meeting_date)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                                {agenda.item_count} Madde
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle text-muted-foreground">
                                            {new Date(agenda.created_at).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/agenda/${agenda.id}/presentation`)}
                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 gap-1"
                                                >
                                                    <Presentation size={14} />
                                                    Sunum
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/agenda/${agenda.id}/edit`)}
                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 gap-1"
                                                >
                                                    <Edit3 size={14} />
                                                    Düzenle
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
        </div>
    );
}
