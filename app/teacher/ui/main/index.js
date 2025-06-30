'use client'

import { useState, useMemo } from 'react'
import styles from './index.module.css'
import Menu from '@/components/(ui)/(button)/menu'; // Đường dẫn import Menu như trong ví dụ của bạn

const Main = ({ initialTeachers }) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterRole, setFilterRole] = useState('all')
    const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

    const filteredTeachers = useMemo(() => {
        return initialTeachers.filter((teacher) => {
            const nameMatch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
            const phoneMatch = teacher.phone.includes(searchTerm)
            const searchMatch = nameMatch || phoneMatch

            if (filterRole === 'all') {
                return searchMatch
            }

            const roleMatch = teacher.role && teacher.role.includes(filterRole)
            return searchMatch && roleMatch
        })
    }, [initialTeachers, searchTerm, filterRole]);

    const allRoles = useMemo(() => {
        const roles = new Set()
        initialTeachers.forEach(teacher => {
            if (teacher.role) {
                teacher.role.forEach(r => roles.add(r))
            }
        })
        return ['all', ...Array.from(roles)]
    }, [initialTeachers]);

    const roleMenuItems = (
        <div className={styles.list_menu}>
            {allRoles.map(role => {
                const displayName = role === 'all' ? 'Tất cả vai trò' : role.charAt(0).toUpperCase() + role.slice(1);
                return (
                    <p
                        key={role}
                        onClick={() => {
                            setFilterRole(role);
                            setIsRoleMenuOpen(false);
                        }}
                        className={`${styles.roleItem} text_6_400`}
                    >
                        {displayName}
                    </p>
                )
            })}
        </div>
    );

    // -- BẮT ĐẦU THAY ĐỔI --
    // 1. Tách nút bấm ra một biến riêng và **KHÔNG** có onClick
    const roleMenuButton = (
        <div className='input' style={{ width: 120, cursor: 'pointer' }}>
            {filterRole === 'all' ? 'Tất cả vai trò' : filterRole.charAt(0).toUpperCase() + filterRole.slice(1)}
        </div>
    );
    // -- KẾT THÚC THAY ĐỔI --

    return (
        <>
            <div className={styles.filterSection}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='input'
                        style={{ width: '400px' }}
                    />
                    <div>
                        <Menu
                            isOpen={isRoleMenuOpen}
                            onOpenChange={setIsRoleMenuOpen}
                            menuItems={roleMenuItems}
                            menuPosition="bottom"
                            customButton={roleMenuButton}
                        />
                    </div>
                </div>
            </div>

            <div style={{ overflow: 'hidden', flex: 1, overflowY: 'auto', paddingTop: 16 }}>
                {filteredTeachers.length > 0 ? (
                    <div className={styles.teacherGrid}>
                        {filteredTeachers.map((teacher, index) => (
                            <div key={index} className={styles.teacherBox}>
                                <div className={styles.teacherInfo}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 12 }}>
                                        <img
                                            src={teacher.avt || 'https://lh3.googleusercontent.com/d/1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG'}
                                            alt={`Avatar của ${teacher.name}`}
                                            className={styles.avatar}
                                        />
                                        <div>
                                            <p className='text_4'>{teacher.name}</p>
                                            <p className='text_6_400'>Chức vụ:  {teacher.role.map(r => <span key={r}>{r}</span>)}</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <p className='text_6_400'><strong>Email:</strong> {teacher.email}</p>
                                        <p className='text_6_400'><strong>SĐT:</strong> {teacher.phone}</p>
                                        <p className='text_6_400'><strong>Địa chỉ:</strong> {teacher.address}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={styles.noResults}>Không tìm thấy giáo viên nào.</p>
                )}
            </div>
        </>
    )
}

export default Main;