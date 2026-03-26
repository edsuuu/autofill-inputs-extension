import React from 'react';

interface MenuAction {
    icon: React.ReactNode;
    label: string;
    action: () => void;
}

interface FloatingMenuProps {
    isMenuOpen: boolean;
    setIsMenuOpen: (open: boolean) => void;
    floatingPos: { x: number, y: number };
    handleMouseDown: (e: React.MouseEvent) => void;
    menuActions: MenuAction[];
    onToggle: () => void;
}

export const FloatingMenu: React.FC<FloatingMenuProps> = ({
    isMenuOpen,
    setIsMenuOpen,
    floatingPos,
    handleMouseDown,
    menuActions,
    onToggle
}) => {
    return (
        <div
            style={{
                left: `${floatingPos.x}px`,
                top: `${floatingPos.y}px`,
                position: 'fixed',
                zIndex: 999999
            }}
            className="select-none"
        >
            {isMenuOpen && menuActions.map((item, i) => {
                const angle = (i * (360 / menuActions.length)) - 90;
                const radius = 50;
                const x = Math.cos(angle * Math.PI / 180) * radius;
                const y = Math.sin(angle * Math.PI / 180) * radius;

                return (
                    <div
                        key={i}
                        onClick={(e) => {
                            e.stopPropagation();
                            item.action();
                            setIsMenuOpen(false);
                        }}
                        style={{
                            transform: `translate(${x}px, ${y}px)`,
                            transitionDelay: `${i * 50}ms`
                        }}
                        className="absolute left-0 top-0 w-8 h-8 bg-slate-800 border border-white/10 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-600 hover:scale-110 transition-all shadow-xl animate-in fade-in zoom-in duration-300 group"
                        title={item.label}
                    >
                        {item.icon}
                        <span className={`absolute ${y > 0 ? '-bottom-8' : '-top-8'} left-1/2 -translate-x-1/2 bg-slate-900/95 text-[11px] font-bold px-2.5 py-1 rounded shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-white/5 pointer-events-none`}>
                            {item.label}
                        </span>
                    </div>
                );
            })}

            <div
                onMouseDown={handleMouseDown}
                onClick={onToggle}
                className={`w-8 h-8 bg-indigo-600 rounded-lg shadow-lg cursor-grab active:cursor-grabbing flex items-center justify-center hover:bg-indigo-700 transition-all z-10 animate-in fade-in zoom-in duration-300 ${isMenuOpen ? 'rotate-90 scale-110' : ''}`}
                title="Menu AutoFill"
            >
                {isMenuOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                )}
            </div>
        </div>
    );
};
