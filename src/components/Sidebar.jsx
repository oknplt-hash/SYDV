import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings } from 'lucide-react';

export function Sidebar() {
    const navItems = [
        { to: "/", icon: LayoutDashboard, label: "Ana Sayfa" },
        { to: "/persons", icon: Users, label: "Haneler" },
        { to: "/agendas", icon: FileText, label: "Gündemler" },
    ];

    return (
        <aside className="w-64 border-r bg-card flex flex-col">
            <div className="p-6 border-b">
                <h1 className="text-xl font-bold text-primary">Şiran SYDV</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Gündem Sistemi</p>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive
                                ? "bg-primary text-primary-foreground"
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
                <button className="flex items-center gap-3 px-3 py-2 w-full text-muted-foreground hover:text-foreground">
                    <Settings size={20} />
                    <span>Ayarlar</span>
                </button>
            </div>
        </aside>
    );
}
