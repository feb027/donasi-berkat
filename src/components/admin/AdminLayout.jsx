import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShieldCheckIcon, HomeIcon, UsersIcon, GiftIcon, SparklesIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

function AdminLayout() {
    const location = useLocation(); // Get location

    // Basic sidebar navigation items (can be expanded later)
    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: HomeIcon, current: location.pathname === '/admin' },
        { name: 'Users', href: '/admin/users', icon: UsersIcon, current: location.pathname.startsWith('/admin/users') },
        { name: 'Donations', href: '/admin/donations', icon: GiftIcon, current: location.pathname.startsWith('/admin/donations') },
        { name: 'Badges', href: '/admin/badges', icon: SparklesIcon, current: location.pathname.startsWith('/admin/badges') },
        // Add more admin sections here
    ];

    function classNames(...classes) {
        return classes.filter(Boolean).join(' ')
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-gray-800 text-white flex flex-col flex-shrink-0">
                <div className="flex items-center justify-center h-16 bg-gray-900 shadow-md px-4">
                    <Link to="/admin" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
                        <ShieldCheckIcon className="h-7 w-7 text-emerald-400" />
                        <span className="text-xl font-semibold">Admin Panel</span>
                    </Link>
                </div>
                <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={classNames(
                                item.current
                                    ? 'bg-gray-700 text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150'
                            )}
                            aria-current={item.current ? 'page' : undefined}
                        >
                            <item.icon
                                className={classNames(
                                    item.current ? 'text-gray-200' : 'text-gray-400 group-hover:text-gray-200',
                                    'mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-150'
                                )}
                                aria-hidden="true"
                            />
                            {item.name}
                        </Link>
                    ))}
                </nav>
                {/* Optional: Footer or User Info in Sidebar */}
                <div className="mt-auto p-4 border-t border-gray-700">
                   <Link 
                      to="/" 
                      className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150">
                      <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-200" />
                      Kembali ke Situs
                   </Link>
                </div>
            </div>

            {/* Main content area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Optional: Header bar within the main content */}
                {/* <header className="bg-white shadow-sm h-14 flex items-center justify-between px-6">
                   <h1 className="text-lg font-semibold text-gray-800">Admin Dashboard</h1>
                   <p>Welcome, {profile?.nama_pengguna || 'Admin'}!</p> 
                </header> */}
                
                {/* Page Content */} 
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6 md:p-8">
                    {/* Child routes will render here */}
                    <Outlet /> 
                </main>
            </div>
        </div>
    );
}

export default AdminLayout; 