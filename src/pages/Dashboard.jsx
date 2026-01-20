import React, { useEffect, useState } from 'react';
import api from '../api';

import { useNavigate } from 'react-router-dom';
import { Users, FileText, Activity, TrendingUp, Calendar, ArrowRight, Sparkles, Home, Plus, ChevronRight } from 'lucide-react';

export function Dashboard() {
    const [stats, setStats] = useState({
        householdCount: 0,
        agendaCount: 0,
    });
    const [recentAgendas, setRecentAgendas] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [personsRes, agendasRes] = await Promise.all([
                    api.get('/persons?per_page=1'),
                    api.get('/agendas')
                ]);

                setStats({
                    householdCount: personsRes.data.total_count,
                    agendaCount: agendasRes.data.agendas.length
                });
                setRecentAgendas(agendasRes.data.agendas.slice(0, 5));
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-16 space-y-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                </div>
                <p className="text-muted-foreground font-medium">Yükleniyor...</p>
            </div>
        );
    }

    const totalApplications = recentAgendas.reduce((sum, a) => sum + parseInt(a.item_count || 0), 0);

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 md:p-10 shadow-2xl">
                <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]"></div>
                <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>

                <div className="relative z-10 space-y-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                            <Home className="text-white" size={window.innerWidth < 768 ? 24 : 32} />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-lg">
                                Hoşgeldiniz
                            </h1>
                            <p className="text-indigo-100 text-sm md:text-lg font-medium mt-1 md:mt-2">
                                SYDV Yönetim Sistemi - Gündemlerinizi ve haneleri kolayca yönetin
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Toplam Hane"
                    value={stats.householdCount}
                    icon={Users}
                    description="Sisteme kayıtlı hane"
                    gradient="from-blue-500 to-cyan-500"
                    onClick={() => navigate('/persons')}
                />
                <StatCard
                    title="Toplam Gündem"
                    value={stats.agendaCount}
                    icon={FileText}
                    description="Oluşturulan gündem"
                    gradient="from-violet-500 to-purple-500"
                    onClick={() => navigate('/agendas')}
                />
                <StatCard
                    title="Toplam Başvuru"
                    value={totalApplications}
                    icon={TrendingUp}
                    description="Tüm gündemlerdeki başvurular"
                    gradient="from-pink-500 to-rose-500"
                />
                <StatCard
                    title="Sistem Durumu"
                    value="Aktif"
                    icon={Activity}
                    description="Sorunsuz çalışıyor"
                    gradient="from-emerald-500 to-teal-500"
                    isStatus
                />
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2">
                <QuickActionCard
                    title="Yeni Gündem Oluştur"
                    description="Toplantı için yeni bir gündem oluşturun ve başvuruları ekleyin"
                    icon={FileText}
                    gradient="from-indigo-600 to-purple-600"
                    onClick={() => navigate('/agenda/new')}
                />
                <QuickActionCard
                    title="Yeni Hane Ekle"
                    description="Sisteme yeni bir hane kaydı ekleyin ve bilgilerini girin"
                    icon={Users}
                    gradient="from-pink-600 to-rose-600"
                    onClick={() => navigate('/person/new')}
                />
            </div>

            {/* Recent Agendas */}
            <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-lg overflow-hidden">
                <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl">
                                <Calendar className="text-white" size={20} md:size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg md:text-xl font-bold text-foreground">Son Gündemler</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">En son oluşturulan gündemler</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/agendas')}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-foreground hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                        >
                            Tümünü Gör
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
                <div className="p-4 md:p-6">
                    {recentAgendas.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
                                <FileText className="text-indigo-600 dark:text-indigo-400" size={32} />
                            </div>
                            <p className="text-sm font-semibold text-foreground">Henüz gündem bulunmuyor</p>
                            <p className="text-xs text-muted-foreground mt-1">İlk gündeminizi oluşturmak için yukarıdaki butonu kullanın</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentAgendas.map((agenda, index) => (
                                <div
                                    key={agenda.id}
                                    onClick={() => navigate(`/agenda/${agenda.id}/edit`)}
                                    className="group flex items-center justify-between p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-lg shadow-lg">
                                            {agenda.item_count}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                                {agenda.title}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {new Date(agenda.created_at).toLocaleDateString('tr-TR')}
                                                </span>
                                                {agenda.meeting_date && (
                                                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                                        Toplantı: {new Date(agenda.meeting_date).toLocaleDateString('tr-TR')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight className="text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all group-hover:translate-x-1" size={20} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, description, gradient, onClick, isStatus }) {
    return (
        <div
            onClick={onClick}
            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 shadow-lg transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-2xl hover:scale-105' : ''}`}
        >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
            <div className="relative">
                <div className="flex items-center justify-between mb-3">
                    <Icon className="text-white/80" size={28} />
                    {isStatus && (
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    )}
                </div>
                <div className="text-4xl font-black text-white mb-1">{value}</div>
                <div className="text-sm font-semibold text-white/90">{description}</div>
            </div>
            {onClick && (
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="text-white" size={20} />
                </div>
            )}
        </div>
    );
}

function QuickActionCard({ title, description, icon: Icon, gradient, onClick }) {
    return (
        <div
            onClick={onClick}
            className="group relative overflow-hidden rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 p-6 md:p-8 cursor-pointer hover:border-solid hover:shadow-xl transition-all duration-300"
        >
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity" style={{ background: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}></div>
            <div className="relative flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
                <div className={`p-4 bg-gradient-to-br ${gradient} rounded-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="text-white" size={28} md:size={32} />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-bold text-foreground mb-1 md:mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {title}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                        {description}
                    </p>
                </div>
                <Plus className="hidden sm:block text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:rotate-90 transition-all" size={24} />
            </div>
        </div>
    );
}
