'use client';

import { useState, useMemo } from 'react';
import styles from './index.module.css';
import Title from '@/components/(features)/(popup)/title';
import Menu from '@/components/(ui)/(button)/menu';

const TDHT_OPTIONS = [
    'Nhiệt tình và chăm chỉ',
    'Tích cực và chủ động',
    'Kiên trì và cầu tiến',
    'Sáng tạo và linh hoạt',
    'Tích cực hợp tác và tương tác',
    'Thiếu tập trung trong giờ học',
    'Hạn chế trong việc lắng nghe và tiếp thu ý kiến',
];
const KQHT_OPTIONS = [
    'Nắm bắt tốt các kiến thức cơ bản',
    'Kết quả học tập ổn định',
    'Thể hiện tư duy tốt nhưng cần thêm thời gian để hoàn thiện',
    'Tiềm năng lớn nhưng chưa tối đa hóa',
    'Cần cải thiện kỹ năng trình bày và làm việc nhóm',
    'Còn hạn chế ở một số kiến thức nâng cao',
];
const DCCT_OPTIONS = [
    'Cần tăng cường sự tập trung',
    'Phát triển tư duy phân tích',
    'Cải thiện tính tự giác',
    'Chú ý hơn đến cách trình bày và tính cẩn thận',
    'Khắc phục tính dễ nản khi gặp bài khó',
    'Tăng cường tính tương tác trong giờ học',
    'Cố gắng tiếp tục phát huy những điểm mạnh của mình',
];


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

    // State lưu các giá trị đã chọn
    const [tdht, setTdht] = useState(init.filter((v) => TDHT_OPTIONS.includes(v)));
    const [kqht, setKqht] = useState(init.filter((v) => KQHT_OPTIONS.includes(v)));
    const [dcct, setDcct] = useState(init.filter((v) => DCCT_OPTIONS.includes(v)));

    // --- MỚI: Logic để khởi tạo và quản lý state cho textarea ---
    const initialOtherComment = useMemo(() => {
        if (!Array.isArray(initialComment)) return '';
        const allOptions = [...TDHT_OPTIONS, ...KQHT_OPTIONS, ...DCCT_OPTIONS];
        return initialComment.find(comment => !allOptions.includes(comment)) || '';
    }, [initialComment]);

    const [otherComment, setOtherComment] = useState(initialOtherComment);
    // --- KẾT THÚC PHẦN MỚI ---

    // State kiểm soát việc mở/đóng cho từng Menu
    const [isTdhtMenuOpen, setTdhtMenuOpen] = useState(false);
    const [isKqhtMenuOpen, setKqhtMenuOpen] = useState(false);
    const [isDcctMenuOpen, setDcctMenuOpen] = useState(false);

    const handleReset = () => {
        setTdht([]);
        setKqht([]);
        setDcct([]);
        setOtherComment(''); // <-- SỬA: Reset cả state của textarea
    };

    // Hàm chung để xử lý khi chọn một mục
    const handleSelect = (setter, setMenuOpen, option) => {
        setter(prev => [...prev, option]);
        setMenuOpen(false);
    };

    // Hàm chung để xử lý khi xóa một mục (chip)
    const handleRemove = (setter, option) => {
        setter(prev => prev.filter(v => v !== option));
    };

    // Hàm chung để render danh sách các mục trong menu
    const renderMenuItems = (options, selectedValues, setter, setMenuOpen) => useMemo(() => (
        <div className={styles.list_menuwrap}>
            <div className="flex_col" style={{ gap: 3 }}>
                {options
                    .filter(o => !selectedValues.includes(o))
                    .map((option) => (
                        <p
                            key={option}
                            onClick={() => handleSelect(setter, setMenuOpen, option)}
                            className={`${styles.list_li} text_7_400`}
                        >
                            {option}
                        </p>
                    ))}
                {options.filter(o => !selectedValues.includes(o)).length === 0 && (
                    <p className={`${styles.list_li} ${styles.disabled}`}>Đã chọn hết</p>
                )}
            </div>
        </div>
    ), [options, selectedValues]);


    return (
        <>
            <Title content={'Nhận xét học sinh'} click={onCancel} />
            <div className={styles.root}>
                <div style={{ padding: 16 }}>
                    {/* --- Student Info & Reset Button --- */}
                    <div className={styles.infoBar}>
                        <div className={styles.infoBox}>
                            <p className='text_6'>Tên học sinh: <span> {student?.Name}</span></p>
                            <p className='text_6'>ID học sinh: <span> {student?.ID}</span></p>
                        </div>
                        {/* --- SỬA: Cập nhật điều kiện disabled cho nút Reset --- */}
                        <button type="button" onClick={handleReset} disabled={!tdht.length && !kqht.length && !dcct.length && !otherComment.length} className={styles.resetButton}>
                            <p className='text_6_400'>Reset</p>
                        </button>
                    </div>

                    {/* --- Menu cho Thái độ học tập --- */}
                    <div className={styles.field}>
                        <p className='text_6' style={{ padding: '8px 0 2px 0' }}>Thái độ học tập</p>
                        <Menu
                            isOpen={isTdhtMenuOpen}
                            onOpenChange={setTdhtMenuOpen}
                            menuItems={renderMenuItems(TDHT_OPTIONS, tdht, setTdht, setTdhtMenuOpen)}
                            customButton={
                                <div
                                    className={`${styles.inputBox} ${isTdhtMenuOpen ? styles.focus : ''}`}
                                    onClick={() => setTdhtMenuOpen(true)}
                                >
                                    {tdht.length === 0 ? <span className={`${styles.placeholder} text_7_400`}>Chọn nhận xét</span> : tdht.map(v => (
                                        <span key={v} className={`${styles.chip} text_7_400`} onClick={e => e.stopPropagation()}>
                                            {v}
                                            <span className={styles.removeChip} onClick={() => handleRemove(setTdht, v)}>×</span>
                                        </span>
                                    ))}
                                    <span className={styles.arrow}>{isTdhtMenuOpen ? '▴' : '▾'}</span>
                                </div>
                            }
                        />
                    </div>

                    {/* --- Menu cho Kết quả học tập --- */}
                    <div className={styles.field}>
                        <p className='text_6' style={{ padding: '8px 0 2px 0' }}>Kết quả học tập</p>
                        <Menu
                            isOpen={isKqhtMenuOpen}
                            onOpenChange={setKqhtMenuOpen}
                            menuItems={renderMenuItems(KQHT_OPTIONS, kqht, setKqht, setKqhtMenuOpen)}
                            menuPosition='top'
                            customButton={
                                <div className={`${styles.inputBox} ${isKqhtMenuOpen ? styles.focus : ''}`} onClick={() => setKqhtMenuOpen(true)}   >
                                    {kqht.length === 0 ? <span className={`${styles.placeholder} text_7_400`}>Chọn nhận xét</span> : kqht.map(v => (
                                        <span key={v} className={`${styles.chip} text_7_400`} onClick={e => e.stopPropagation()}>
                                            {v} <span className={styles.removeChip} onClick={() => handleRemove(setKqht, v)}>×</span>
                                        </span>
                                    ))}
                                    <span className={styles.arrow}>{isKqhtMenuOpen ? '▴' : '▾'}</span>
                                </div>
                            }
                        />
                    </div>

                    {/* --- Menu cho Điều cần cải thiện --- */}
                    <div className={styles.field}>
                        <p className='text_6' style={{ padding: '8px 0 2px 0' }}>Điều cần cải thiện</p>
                        <Menu
                            isOpen={isDcctMenuOpen}
                            onOpenChange={setDcctMenuOpen}
                            menuItems={renderMenuItems(DCCT_OPTIONS, dcct, setDcct, setDcctMenuOpen)}
                            menuPosition='top'
                            customButton={
                                <div
                                    className={`${styles.inputBox} ${isDcctMenuOpen ? styles.focus : ''}`}
                                    onClick={() => setDcctMenuOpen(true)}
                                >
                                    {dcct.length === 0 ? <span className={`${styles.placeholder} text_7_400`}>Chọn nhận xét</span> : dcct.map(v => (
                                        <span key={v} className={`${styles.chip} text_7_400`} onClick={e => e.stopPropagation()}>
                                            {v}
                                            <span className={styles.removeChip} onClick={() => handleRemove(setDcct, v)}>×</span>
                                        </span>
                                    ))}
                                    <span className={styles.arrow}>{isDcctMenuOpen ? '▴' : '▾'}</span>
                                </div>
                            }
                        />
                    </div>
                    <p className='text_6' style={{ padding: '8px 0 2px 0', marginBottom: 8 }}>Nhận xét khác</p>
                    {/* --- SỬA: Gán value và onChange cho textarea --- */}
                    <textarea
                        placeholder="Nhập nội dung nhận xét tại đây..."
                        className='input'
                        style={{ resize: 'none', height: 100, width: 'calc(100% - 26px)' }}
                        value={otherComment}
                        onChange={(e) => setOtherComment(e.target.value)}
                    />
                </div>

                {/* --- Nút bấm xác nhận và thoát --- */}
                <div className={styles.btnRow}>
                    <button className={styles.cancel} onClick={onCancel}>
                        <p>Thoát</p>
                    </button>
                    {/* --- SỬA: Cập nhật hàm onClick để bao gồm giá trị từ textarea --- */}
                    <button className={styles.save} onClick={() => {
                        const finalComments = [...tdht, ...kqht, ...dcct, otherComment.trim()].filter(Boolean);
                        onSave(finalComments);
                    }}>
                        <p>Xác nhận</p>
                    </button>
                </div>
            </div>
        </>
    );
}