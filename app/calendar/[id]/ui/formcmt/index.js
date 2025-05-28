'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import styles from './index.module.css';
import Title from '@/components/(popup)/title';

const TDHT = [
    'Nhiệt tình và chăm chỉ',
    'Tích cực và chủ động',
    'Kiên trì và cầu tiến',
    'Sáng tạo và linh hoạt',
    'Tích cực hợp tác và tương tác',
    'Thiếu tập trung trong giờ học',
    'Hạn chế trong việc lắng nghe và tiếp thu ý kiến',
];
const KQHT = [
    'Nắm bắt tốt các kiến thức cơ bản',
    'Kết quả học tập ổn định',
    'Thể hiện tư duy tốt nhưng cần thêm thời gian để hoàn thiện',
    'Tiềm năng lớn nhưng chưa tối đa hóa',
    'Cần cải thiện kỹ năng trình bày và làm việc nhóm',
    'Còn hạn chế ở một số kiến thức nâng cao',
];
const DCCT = [
    'Cần tăng cường sự tập trung',
    'Phát triển tư duy phân tích',
    'Cải thiện tính tự giác',
    'Chú ý hơn đến cách trình bày và tính cẩn thận',
    'Khắc phục tính dễ nản khi gặp bài khó',
    'Tăng cường tính tương tác trong giờ học',
    'Cố gắng tiếp tục phát huy những điểm mạnh của mình',
];

/* ─────────────────── generic multiselect ─────────────────── */
function MultiSelect({ label, options, value, onChange }) {
    const [open, setOpen] = useState(false);
    const boxRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (boxRef.current && !boxRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        window.addEventListener('mousedown', handleClickOutside);
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (opt) => {
        if (!value.includes(opt)) {
            onChange([...value, opt]);
        }
        // Không đóng dropdown, cho phép chọn tiếp
    };
    const handleRemove = (opt) => {
        onChange(value.filter((v) => v !== opt));
    };

    return (
        <div className={styles.field} ref={boxRef}>
            <p className='text_6' style={{ padding: '8px 0 2px 0' }}>{label}</p>
            <div
                className={`${styles.inputBox} ${open ? styles.focus : ''}`}
                onClick={() => setOpen(!open)}
                style={{
                    background: '#f8fafc',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    minHeight: 36,
                    fontWeight: 500,
                    padding: '6px 16px 2px',
                    flexWrap: 'wrap',
                    position: 'relative',
                    zIndex: 1
                }}
            >
                {value.length === 0 && (
                    <span className={`${styles.placeholder} text_6_400`}> Chọn… </span>
                )}
                {value.map((v) => (
                    <span
                        key={v}
                        className={`${styles.chip} text_6`}
                        style={{
                            background: 'var(--border-color)',
                            color: 'var(--main_d)',
                            padding: '6px 16px',
                            marginRight: 6,
                            marginBottom: 4,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {v}
                        <span
                            style={{ marginLeft: 4, cursor: 'pointer', color: '#0097a7', fontWeight: 700 }}
                            onClick={e => { e.stopPropagation(); handleRemove(v); }}
                        >×</span>
                    </span>
                ))}
                <span
                    className={styles.arrow}
                    style={{ color: '#00796b', fontSize: 18 }}
                >
                    {open ? '▴' : '▾'}
                </span>
            </div>
            {open && (
                <ul
                    className={styles.dropdown}
                    style={{
                        border: '1.5px solid var(--border-color)',
                        borderRadius: 10,
                        boxShadow: '0 6px 24px rgba(0,0,0,0.10)',
                        top: '100%',
                        left: 0,
                        right: 0,
                        position: 'absolute',
                        zIndex: 10,
                        marginTop: 4
                    }}
                >
                    {options.filter(o => !value.includes(o)).map((o) => (
                        <li
                            key={o}
                            onClick={() => handleSelect(o)}
                            style={{
                                fontWeight: 500,
                                color: 'var(--text-primary)',
                                fontSize: 15,
                                borderRadius: 6,
                                margin: 2,
                                background: 'transparent',
                                cursor: 'pointer'
                            }}
                        >
                            {o}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/* ─────────────────── Form chính ─────────────────── */
export default function CommentForm({
    student,
    initialComment = [],
    onSave,
    onCancel,
}) {
    const init = useMemo(
        () => (Array.isArray(initialComment) ? initialComment : []),
        [initialComment]
    );
    const [tdht, setTdht] = useState(init.filter((v) => TDHT.includes(v)));
    const [kqht, setKqht] = useState(init.filter((v) => KQHT.includes(v)));
    const [dcct, setDcct] = useState(init.filter((v) => DCCT.includes(v)));

    // Hàm reset tất cả input
    const handleReset = () => {
        setTdht([]);
        setKqht([]);
        setDcct([]);
    };

    return (
        <>
            <Title content={'Nhận xét học sinh'} click={onCancel} />
            <div
                className={styles.root}
                style={{
                    background: '#f4fafe',
                    borderRadius: 18,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.07)'
                }}
            >
                <div style={{ padding: 16 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',

                            marginBottom: 8,
                            justifyContent: 'space-between',
                            borderRadius: 5
                        }}
                    >
                        <div style={{
                            padding: 10,
                            gap: 16,
                            background: 'var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            flex: 1,
                            borderRadius: 5,
                        }}>
                            <p className='text_6' style={{ margin: 0 }}>Tên học sinh:
                                <span style={{ fontWeight: 400 }}> {student?.Name}</span>
                            </p>
                            <p className='text_6' style={{ margin: 0 }}>ID học sinh:
                                <span style={{ fontWeight: 400 }}>  {student?.ID}</span>
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={tdht.length === 0 && kqht.length === 0 && dcct.length === 0}
                            style={{
                                marginLeft: 12,
                                background: 'var(--main_d)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 5,
                                padding: '6px 18px',
                                cursor: (tdht.length === 0 && kqht.length === 0 && dcct.length === 0) ? 'not-allowed' : 'pointer',
                                opacity: (tdht.length === 0 && kqht.length === 0 && dcct.length === 0) ? 0.5 : 1,
                                boxShadow: '0 1px 4px #e0e0e0',
                                transition: 'background 0.2s',
                                height: 36
                            }}
                        >
                            <p className='text_6_400' style={{ color: 'white', margin: 0 }}>Reset</p>
                        </button>
                    </div>
                    <MultiSelect
                        label="Thái độ học tập"
                        options={TDHT}
                        value={tdht}
                        onChange={setTdht}
                    />
                    <MultiSelect
                        label="Kết quả học tập"
                        options={KQHT}
                        value={kqht}
                        onChange={setKqht}
                    />
                    <MultiSelect
                        label="Điều cần cải thiện"
                        options={DCCT}
                        value={dcct}
                        onChange={setDcct}
                    />
                </div>
                <div
                    className={styles.btnRow}
                    style={{ marginTop: 18, display: 'flex', gap: 12, justifyContent: 'flex-end', padding: '8px 16px', borderTop: 'thin solid var(--border-color)' }}
                >
                    <button
                        className={styles.cancel}
                        style={{
                            background: 'var(--border-color)',
                            padding: '10px 20px',
                            borderRadius: 5,
                            width: 'max-content'
                        }}
                        onClick={onCancel}
                    >
                        <p className='text_6_400' style={{ margin: 0 }}>Thoát</p>
                    </button>
                    <button
                        className={styles.save}
                        style={{
                            background: 'var(--main_d)',
                            padding: '10px 20px',
                            borderRadius: 5,
                            width: 'max-content'
                        }}
                        onClick={() => onSave([...tdht, ...kqht, ...dcct].filter(Boolean))}
                    >
                        <p className='text_6_400' style={{ color: 'white', margin: 0 }}>Xác nhận</p>
                    </button>
                </div>
            </div>
        </>
    );
}
