/* eslint-disable import/named */
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <div className="shrink-0 flex items-center">
                            <img src="/favicon-32x32.png" alt="Logo" className="h-8 w-8" />
                            <span className="ml-2 text-xl font-bold text-gray-900">Auto Preenchimento</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-8">
                        <Link
                            to="/"
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                isActive('/')
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            Formulários
                        </Link>
                        <Link
                            to="/como-usar"
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                isActive('/como-usar')
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            Como Usar
                        </Link>
                        <Link
                            to="/configuracoes"
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                isActive('/configuracoes')
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            Configurações
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
