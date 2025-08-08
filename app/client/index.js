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

function TableSkeleton() {
    return <div style={{ height: '500px', background: '#f8f9fa', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đang tải dữ liệu...</div>;
}

export default function CustomerView({ initialResult, user, sources, labelData, formData, zaloData, users, variant }) {

    const [selectedCustomers, setSelectedCustomers] = useState(new Map());
    const handleActionComplete = () => {
        setSelectedCustomers(new Map());
    };

    return (
        <div className={styles.container}>
            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <SettingZalo user={user[0]} zalo={zaloData} />
                        <RunningActions user={user} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <BulkActions
                            selectedCustomers={selectedCustomers}
                            onActionComplete={handleActionComplete}
                        />
                        <SettingVariant data={variant} />
                        <SettingLabel data={labelData} />
                        <SettingData data={formData} />
                    </div>
                </div>
            </div>
            <FilterControls zaloAccounts={zaloData} users={users.filter(u => u.role[0] == 'Sale' || u.role[0] == 'Admin')} labels={labelData} sources={sources} areas={['Biên Hòa', 'Long Khánh', 'Long Thành', 'TP HCM', 'Khác']} />
            <Suspense fallback={<TableSkeleton />}>
                <CustomerTable
                    data={initialResult.data}
                    total={initialResult.total}
                    user={user}
                    selectedCustomers={selectedCustomers}
                    setSelectedCustomers={setSelectedCustomers}
                />
            </Suspense>
        </div>
    );
}