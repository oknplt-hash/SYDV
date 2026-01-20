import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, X } from 'lucide-react';

export function Sidebar({ isOpen, setIsOpen }) {
    const navItems = [
        { to: "/", icon: LayoutDashboard, label: "Ana Sayfa" },
        { to: "/persons", icon: Users, label: "Haneler" },
        { to: "/agendas", icon: FileText, label: "Gündemler" },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`
                fixed inset-y-0 left-0 w-64 border-r bg-card flex flex-col z-50 transition-transform duration-300 ease-in-out md:relative md:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-primary">Şiran SYDV</h1>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Gündem Sistemi</p>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-secondary rounded-md md:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive
                                    ? "bg-primary text-primary-foreground font-semibold"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                }`
                            }
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t">
                    <button className="flex items-center gap-3 px-3 py-2 w-full text-muted-foreground hover:text-foreground transition-colors rounded-md">
                        <Settings size={20} />
                        <span>Ayarlar</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
