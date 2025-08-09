'use client';
import styles from './index.module.css';
import { useState, Suspense } from 'react';
import CustomerTable from './ui/table';
import FilterControls from "./ui/filter";
import SettingLabel from "./ui/label";
import SettingData from "./ui/data";
import SettingZalo from './ui/zalo';
import BulkActions from './ui/run';
import RunningActions from './ui/action';
import SettingVariant from './ui/variant';
import SettingZaloRoles from './ui/zalos';
import { reloadRunningSchedules } from '@/data/actions/reload';
function TableSkeleton() {
    return <div style={{ height: '500px', background: '#f8f9fa', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đang tải dữ liệu...</div>;
}
export default function CustomerView({ running, initialResult, user, sources, labelData, formData, zaloData, users, variant }) {
    const [selectedCustomers, setSelectedCustomers] = useState(new Map());
    const [viewMode, setViewMode] = useState('manage'); 
    
    const handleActionComplete = () => {
        setSelectedCustomers(new Map());
    };
    const toggleViewMode = () => {
        setViewMode(prev => prev === 'manage' ? 'view' : 'manage');
    };

    
    return (
        <div className={styles.container}>
            {viewMode === 'manage' && (
                <>
                    <div className={styles.filterSection}>
                        <div className={styles.filterHeader}>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <SettingZalo user={user[0]} zalo={zaloData} />
                                <RunningActions user={user} zalo={zaloData} running={running} />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <BulkActions
                                    selectedCustomers={selectedCustomers}
                                    onActionComplete={handleActionComplete}
                                    labels={labelData}
                                    variants={variant}
                                    users={users.filter(u => u.role[0] === 'Sale' || u.role[0] === 'Admin')}
                                />
                                <SettingZaloRoles data={zaloData} allUsers={users.filter(u => u.role[0] === 'Sale' || u.role[0] === 'Admin')} />
                                <SettingVariant data={variant} />
                                <SettingLabel data={labelData} />
                                <SettingData data={formData} />
                            </div>
                        </div>
                    </div>
                    <FilterControls zaloAccounts={zaloData} users={users.filter(u => u.role[0] === 'Sale' || u.role[0] === 'Admin')} labels={labelData} sources={sources} areas={['Biên Hòa', 'Long Khánh', 'Long Thành', 'TP HCM', 'Khác']} />
                </>
            )}
            <Suspense fallback={<TableSkeleton />}>
                <CustomerTable
                    data={initialResult.data}
                    total={initialResult.total}
                    user={user}
                    selectedCustomers={selectedCustomers}
                    setSelectedCustomers={setSelectedCustomers}
                    viewMode={viewMode}
                    onToggleViewMode={toggleViewMode}
                />
            </Suspense>
        </div>
    );
}