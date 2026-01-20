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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gündemler</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Tüm toplantı ve yardım komitesi gündemleri
                    </p>
                </div>
                <button
                    onClick={() => navigate('/agenda/new')}
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-6 gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    <Plus size={18} />
                    <span>Yeni Gündem</span>
                </button>
            </div>

            {/* Agendas List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-sm text-muted-foreground font-medium">Yükleniyor...</p>
                </div>
            ) : agendas.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed p-12 text-center bg-card/50">
                    <FileText size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-bold">Gündem Yok</h3>
                    <p className="text-sm text-muted-foreground mt-1">Henüz oluşturulmuş bir gündem bulunmuyor.</p>
                    <button
                        onClick={() => navigate('/agenda/new')}
                        className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                    >
                        <Plus size={18} />
                        İlk Gündemi Oluştur
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Desktop Table */}
                    <div className="hidden md:block rounded-2xl border bg-card shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="border-b bg-muted/30">
                                <tr>
                                    <th className="h-12 px-6 font-bold text-slate-700">Gündem Başlığı</th>
                                    <th className="h-12 px-6 font-bold text-slate-700">Toplantı Tarihi</th>
                                    <th className="h-12 px-6 font-bold text-slate-700">Madde Sayısı</th>
                                    <th className="h-12 px-6 font-bold text-slate-700 text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {agendas.map((agenda) => (
                                    <tr key={agenda.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="p-6">
                                            <div>
                                                <div className="font-bold text-slate-900 text-base">{agenda.title}</div>
                                                {agenda.description && (
                                                    <div className="text-xs text-slate-500 mt-1 line-clamp-1 italic">
                                                        {agenda.description}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2 text-slate-600 font-medium">
                                                <Calendar size={16} className="text-primary/60" />
                                                <span>{formatDate(agenda.meeting_date)}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600 border border-indigo-100">
                                                {agenda.item_count} Madde
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => navigate(`/agenda/${agenda.id}/presentation`)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
                                                >
                                                    <Presentation size={14} /> Sunum
                                                </button>
                                                <button
                                                    onClick={() => window.open(`/api/agenda/${agenda.id}/report.xlsx`, '_blank')}
                                                    className="p-1.5 border border-emerald-100 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all"
                                                    title="Excel Raporu"
                                                >
                                                    <FileText size={16} />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/agenda/${agenda.id}/edit`)}
                                                    className="p-1.5 border border-slate-200 bg-slate-50 text-slate-600 rounded-lg hover:border-slate-300 transition-all"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card Grid */}
                    <div className="md:hidden grid gap-4">
                        {agendas.map((agenda) => (
                            <div key={agenda.id} className="bg-white rounded-2xl border p-5 space-y-4 shadow-sm active:scale-[0.98] transition-all">
                                <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1 truncate">{agenda.title}</h3>
                                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                            <Calendar size={14} className="text-primary/60" />
                                            {formatDate(agenda.meeting_date)}
                                        </p>
                                    </div>
                                    <span className="shrink-0 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase border border-indigo-100">
                                        {agenda.item_count} Madde
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate(`/agenda/${agenda.id}/presentation`)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                                    >
                                        <Presentation size={16} /> Sunum Başlat
                                    </button>
                                    <button
                                        onClick={() => navigate(`/agenda/${agenda.id}/edit`)}
                                        className="w-12 h-12 flex items-center justify-center border border-slate-100 bg-slate-50 text-slate-600 rounded-xl transition-all"
                                    >
                                        <Edit3 size={18} />
                                    </button>
                                    <button
                                        onClick={() => window.open(`/api/agenda/${agenda.id}/report.xlsx`, '_blank')}
                                        className="w-12 h-12 flex items-center justify-center border border-emerald-50 bg-emerald-50 text-emerald-600 rounded-xl transition-all"
                                    >
                                        <FileText size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
