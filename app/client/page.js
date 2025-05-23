'use client';

import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
    memo,
    useDeferredValue,
    useRef,
} from 'react';
import {
    usePathname,
    useRouter,
    useSearchParams,
} from 'next/navigation';
import styles from './index.module.css';
import SidePanel from './ui/more';
import { Data_Client, Re_Client } from '@/data/client';
import Senmes from './ui/senmes';
import AddLabelButton from './ui/addlabel';

/* ------------------------------------------------------------------ */
/* ---------------------------  CONSTANTS  -------------------------- */

const PAGE_SIZE = 10;
const HIDDEN_KEYS = [];                  // không ẩn cột nào – SidePanel lo chi tiết
const ACCOUNTS = [
    { id: 1, name: 'Tài khoản chính' },
    { id: 2, name: 'Tài khoản kinh doanh' },
    { id: 3, name: 'Tài khoản hỗ trợ' },
];

/* ------------------------------------------------------------------ */
/* -------------------------  HELPER FUNCS  ------------------------- */

const toTitleCase = (s) =>
    s
        .toLowerCase()
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(' ');

// ⭐ THÊM: hàm chuẩn hoá chuỗi để so khớp không dấu, không HOA-thường
const normalize = (str = '') =>
    str
        .toLowerCase()
        .normalize('NFD')           // tách base + dấu
        .replace(/[\u0300-\u036f]/g, ''); // xoá toàn bộ dấu

export const parseLabels = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(String);
    return val
        .toString()
        .replace(/[\[\]'"`]/g, '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
};

const getCustomerType = (row) => {
    if (row.study) return 'Nhập học';
    if (row.studyTry) return 'Học thử';
    if (row.care) return 'Có nhu cầu';
    return 'Mới';
};

/* ------------------------------------------------------------------ */
/* -----------  ÁP DỤNG BỘ LỌC (đã sửa phần tìm kiếm)  -------------- */

const applyFiltersToData = (data, { label, search, area, source, type }) =>
    data.filter((row) => {
        /* ----- label ----- */
        if (label) {
            const rowLabels = parseLabels(row.labels).join(',').toLowerCase();
            const parts = label.toLowerCase().split(',').map((s) => s.trim());
            if (!parts.some((p) => p && rowLabels.includes(p))) return false;
        }

        /* ----- search  – KHÔNG DẤU & KHÔNG HOA-thường ⭐ ----- */
        if (search) {
            const q = normalize(search);
            const name = normalize(row.name || '');
            const phone = normalize(row.phone || ''); // vô hại với số
            if (!name.includes(q) && !phone.includes(q)) return false;
        }

        /* ----- area / source / type (giữ nguyên) ----- */
        if (!row.area.toString().toLowerCase().includes(area.toLowerCase()))
            return false;
        if (!row.source.toString().toLowerCase().includes(source.toLowerCase()))
            return false;
        if (!getCustomerType(row).toLowerCase().includes(type.toLowerCase()))
            return false;

        return true;
    });

/* ------------------------------------------------------------------ */
/* -------------------------  SUB-COMPONENTS  ------------------------ */

/** Badge màu loại KH */
function renderCustomerTypeBadge(type) {
    const badgeBy = {
        'Mới': styles.typeNew,
        'Có nhu cầu': styles.typeInterested,
        'Học thử': styles.typeTrial,
        'Nhập học': styles.typeEnrolled,
    };
    return (
        <span className={`${styles.typeBadge} ${badgeBy[type] || styles.typeNew}`}>
            {type}
        </span>
    );
}

/** ---------- Grid Row (click mở panel) ---------- */
const Row = memo(function Row({ row, visibleKeys, onOpen }) {
    return (
        <div className={styles.gridRow} onClick={() => onOpen(row)}>
            {visibleKeys.map((k) => {
                if (k === 'labels') {
                    const valu = parseLabels(row[k]);
                    return (
                        <div key={k} className={styles.gridCell}>
                            {valu.length}
                        </div>
                    );
                }
                if (k === 'source' || k === 'care' || k === 'studyTry' || k === 'study')
                    return null;
                return (
                    <div key={k} className={styles.gridCell}>
                        {k === 'type'
                            ? renderCustomerTypeBadge(getCustomerType(row))
                            : Array.isArray(row[k])
                                ? row[k].join(', ')
                                : row[k]}
                    </div>
                );
            })}
        </div>
    );
});

export default function Client() {
    /* ---------- router ---------- */
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    /* ---------- state ---------- */
    const [data, setData] = useState([]);
    const [filters, setFilters] = useState({
        label: searchParams.get('label') || '',
        search: searchParams.get('search') || '',
        area: searchParams.get('area') || '',
        source: searchParams.get('source') || '',
        type: searchParams.get('type') || '',
    });
    const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
    const [showLabelPopup, setShowLabelPopup] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(1);
    const [isReloading, setIsReloading] = useState(false);

    /* side-panel state */
    const [selectedRow, setSelectedRow] = useState(null);
    const [panelOpen, setPanelOpen] = useState(false);

    /* danh sách nhãn từ DB */
    const [labelsDB, setLabelsDB] = useState([]);
    const [loadingLabels, setLoadingLabels] = useState(false);

    /* ---------- data fetch ---------- */
    const loadData = useCallback(async () => {
        try {
            setIsReloading(true);
            const res = await Data_Client();
            setData(res.data || []);
        } catch (e) {
            console.error(e);
            alert('Không thể tải dữ liệu từ Google Sheets!');
        } finally {
            setIsReloading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    /* ---------- fetch labels ---------- */
    const loadLabels = useCallback(async () => {
        try {
            setLoadingLabels(true);
            const res = await fetch('/api/label', { cache: 'no-store' });
            if (!res.ok) throw new Error(await res.text());
            const items = await res.json();          // [{ _id, title, ... }]
            setLabelsDB(items.map((i) => i.title));
        } catch (e) {
            console.error(e);
            alert('Không lấy được danh sách nhãn!');
        } finally {
            setLoadingLabels(false);
        }
    }, []);

    useEffect(() => { loadLabels(); }, [loadLabels]);

    /* ---------- memo values ---------- */
    const deferredSearch = useDeferredValue(filters.search);

    const filteredData = useMemo(
        () => applyFiltersToData(data, { ...filters, search: deferredSearch }),
        [data, filters, deferredSearch],
    );

    const totalPages = Math.max(Math.ceil(filteredData.length / PAGE_SIZE), 1);

    const currentRows = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredData.slice(start, start + PAGE_SIZE);
    }, [filteredData, page]);

    const visibleKeys = useMemo(
        () =>
            currentRows[0]
                ? Object.keys(currentRows[0]).filter((k) => !HIDDEN_KEYS.includes(k))
                : [],
        [currentRows],
    );

    const uniqueAreas = useMemo(() => {
        const set = new Set();
        data.forEach((r) => r.area && set.add(toTitleCase(r.area.toString().trim())));
        return [...set].sort();
    }, [data]);

    const uniqueSources = useMemo(() => {
        const set = new Set();
        data.forEach((r) => r.source && set.add(toTitleCase(r.source.toString().trim())));
        return [...set].sort();
    }, [data]);

    const uniqueLabels = useMemo(
        () =>
            [...labelsDB].sort((a, b) =>
                a.localeCompare(b, 'vi', { sensitivity: 'base' }),
            ),
        [labelsDB],
    );

    /* chỉ 6 nhãn “hot” để hiển thị chip */
    const MAX_INLINE = 6;
    const inlineLabels = useMemo(
        () => uniqueLabels.slice(0, MAX_INLINE),
        [uniqueLabels],
    );

    /* ---------- handlers ---------- */
    const handleFilterChange = (key) => (e) => {
        setPage(1);
        setFilters((f) => ({ ...f, [key]: e.target.value.trim() }));
    };

    const resetFilters = useCallback(() => {
        setFilters({ label: '', search: '', area: '', source: '', type: '' });
        setPage(1);
    }, []);

    const toggleLabel = useCallback(
        (txt) => {
            const labels = filters.label
                ? filters.label.split(',').map((l) => l.trim())
                : [];
            const idx = labels.indexOf(txt);
            if (idx >= 0) labels.splice(idx, 1);
            else labels.push(txt);
            setFilters((f) => ({ ...f, label: labels.join(', ') }));
            setPage(1);
        },
        [filters.label],
    );

    const reloadData = useCallback(async () => {
        await Re_Client();
        window.location.reload();
    }, []);

    const sendMessage = useCallback(async () => {
        if (!filteredData.length) {
            alert('Không có dữ liệu để gửi tin nhắn!');
            return;
        }
        try {
            const res = await fetch('/api/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clients: filteredData,
                    accountId: selectedAccount,
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            alert(`Đã gửi tin nhắn cho ${filteredData.length} khách hàng!`);
        } catch (err) {
            console.error(err);
            alert('Có lỗi khi gửi tin nhắn.');
        }
    }, [filteredData, selectedAccount]);

    const title = [
        'Tên',
        'SĐT',
        'Tên học viên',
        'Email',
        'Tuổi',
        'Khu vực',
        'Nhãn',
    ];

    /* side-panel helpers */
    const closePanel = () => {
        setPanelOpen(false);
        setSelectedRow(null);
    };

    const saveNotes = async (vals) => {
        if (!selectedRow) return;
        try {
            await fetch('/api/client/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedRow.id, ...vals }),
            });
            // update local
            setData((d) =>
                d.map((r) => (r.id === selectedRow.id ? { ...r, ...vals } : r)),
            );
            alert('Đã lưu!');
            closePanel();
        } catch (e) {
            console.error(e);
            alert('Lưu thất bại');
        }
    };

    /* ---------- URL sync ---------- */
    useEffect(() => {
        const sp = new URLSearchParams();
        if (page > 1) sp.set('page', String(page));
        Object.entries(filters).forEach(([k, v]) => v && sp.set(k, v));
        router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    }, [page, filters, router, pathname]);

    /* ---------- render ---------- */
    return (
        <div className={styles.container}>
            {/* ===== Bộ lọc ===== */}
            <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                    <h2 className={styles.filterTitle}>Lọc dữ liệu</h2>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <button
                            className={`${styles.btnReset} ${!Object.values(filters).some(Boolean) ? styles.btnDisabled : ''
                                }`}
                            onClick={resetFilters}
                            disabled={!Object.values(filters).some(Boolean)}
                        >
                            Xoá bộ lọc
                        </button>
                        <button
                            className={`${styles.btnAction} ${styles.btnReload}`}
                            onClick={reloadData}
                            disabled={isReloading}
                        >
                            {isReloading ? 'Đang tải...' : 'Làm mới dữ liệu'}
                        </button>
                    </div>
                </div>

                {/* ----- Nhãn phổ biến ----- */}
                <div className={styles.filterChips}>
                    <span className="text_6">Nhãn phổ biến:</span>
                    {inlineLabels.map((lbl) => {
                        const act = filters.label.includes(lbl);
                        return (
                            <button
                                key={lbl}
                                className={`${styles.chip} ${act ? styles.chipActive : ''}`}
                                onClick={() => toggleLabel(lbl)}
                            >
                                {lbl}
                                {act && <span className={styles.chipRemove}>×</span>}
                            </button>
                        );
                    })}
                    {uniqueLabels.length > MAX_INLINE && (
                        <button
                            className={styles.chip}
                            onClick={() => setShowLabelPopup(true)}
                        >
                            …
                        </button>
                    )}
                    {/* nút + Nhãn */}
                    <AddLabelButton onCreated={loadLabels} />
                </div>

                {/* controls */}
                <div className={styles.filterControls}>
                    {/* search */}
                    <div className={styles.filterGroup}>
                        <label htmlFor="nameFilter" className="text_6">
                            Tìm kiếm (tên/SĐT):
                        </label>
                        <input
                            id="nameFilter"
                            className={styles.filterInput}
                            placeholder="Nhập tên hoặc số điện thoại..."
                            value={filters.search}
                            onChange={handleFilterChange('search')}
                        />
                    </div>

                    {/* area */}
                    <div className={styles.filterGroup}>
                        <label htmlFor="areaFilter" className="text_6">
                            Khu vực:
                        </label>
                        <select
                            id="areaFilter"
                            className={styles.filterSelect}
                            value={filters.area}
                            onChange={handleFilterChange('area')}
                        >
                            <option value="">-- Tất cả khu vực --</option>
                            {uniqueAreas.map((a) => (
                                <option key={a} value={a}>
                                    {a}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* source */}
                    <div className={styles.filterGroup}>
                        <label htmlFor="sourceFilter" className="text_6">
                            Nguồn:
                        </label>
                        <select
                            id="sourceFilter"
                            className={styles.filterSelect}
                            value={filters.source}
                            onChange={handleFilterChange('source')}
                        >
                            <option value="">-- Tất cả nguồn --</option>
                            {uniqueSources.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* type */}
                    <div className={styles.filterGroup}>
                        <label htmlFor="typeFilter" className="text_6">
                            Loại khách hàng:
                        </label>
                        <select
                            id="typeFilter"
                            className={styles.filterSelect}
                            value={filters.type}
                            onChange={handleFilterChange('type')}
                        >
                            <option value="">-- Tất cả loại --</option>
                            {['Mới', 'Có nhu cầu', 'Học thử', 'Nhập học'].map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* ===== Gửi tin nhắn ===== */}
            <div className={styles.messageSection}>
                <div className={styles.accountSelector} style={{ flex: 1 }}>
                    <label htmlFor="accountSelect" className="text_6">
                        Gửi từ tài khoản:
                    </label>
                    <select
                        id="accountSelect"
                        className={styles.accountSelect}
                        value={selectedAccount}
                        onChange={(e) => setSelectedAccount(Number(e.target.value))}
                    >
                        {ACCOUNTS.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                                {acc.name}
                            </option>
                        ))}
                    </select>
                </div>
                {/* truyền toàn bộ uniqueLabels để Senmes có combo đủ nhãn */}
                <Senmes
                    data={filteredData}
                    labelOptions={uniqueLabels}
                    onSend={sendMessage}
                />
            </div>

            {/* ===== Data / Loading / Empty ===== */}
            {data.length === 0 ? (
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner} />
                    <p className={styles.loadingText}>Đang tải dữ liệu...</p>
                </div>
            ) : filteredData.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>📋</div>
                    <p className={styles.emptyStateText}>
                        Không tìm thấy dữ liệu nào phù hợp với bộ lọc
                    </p>
                    <button className={styles.btnReset} onClick={resetFilters}>
                        Xoá bộ lọc
                    </button>
                </div>
            ) : (
                <>
                    {/* grid */}
                    <div className={styles.dataGrid}>
                        <div className={styles.gridHeader}>
                            {title.map((k) => (
                                <div key={k} className="text_6" style={{ padding: 16 }}>
                                    {k}
                                </div>
                            ))}
                        </div>
                        <div className={styles.gridBody}>
                            {currentRows.map((r, idx) => (
                                <Row
                                    key={idx}
                                    row={r}
                                    visibleKeys={visibleKeys}
                                    onOpen={(row) => {
                                        setSelectedRow(row);
                                        setPanelOpen(true);
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* pagination */}
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            {page > 1 && (
                                <button
                                    onClick={() => setPage(page - 1)}
                                    className={styles.pageBtn}
                                >
                                    &laquo; Trang trước
                                </button>
                            )}

                            <div className={styles.pageNumbers}>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) pageNum = i + 1;
                                    else if (page <= 3) pageNum = i + 1;
                                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = page - 2 + i;

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            className={`${styles.pageBtn} ${pageNum === page ? styles.pageBtnActive : ''
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            {page < totalPages && (
                                <button
                                    onClick={() => setPage(page + 1)}
                                    className={styles.pageBtn}
                                >
                                    Trang sau &raquo;
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ===== Popup nhãn ===== */}
            {showLabelPopup && (
                <div
                    className={styles.labelModalBackdrop}
                    onClick={() => setShowLabelPopup(false)}
                >
                    <div
                        className={styles.labelModal}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className={styles.labelModalTitle}>Chọn nhãn để lọc</h3>
                        <div className={styles.labelModalGrid}>
                            {uniqueLabels.map((lbl) => {
                                const act = filters.label.includes(lbl);
                                return (
                                    <button
                                        key={lbl}
                                        className={`${styles.chipLarge} ${act ? styles.chipActive : ''
                                            }`}
                                        onClick={() => {
                                            toggleLabel(lbl);
                                            setShowLabelPopup(false);
                                        }}
                                    >
                                        {lbl}
                                        {act && <span className={styles.chipRemove}>×</span>}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            className={styles.btnCloseModal}
                            onClick={() => setShowLabelPopup(false)}
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}

            {/* ===== Side Panel ===== */}
            <SidePanel
                open={panelOpen}
                row={selectedRow}
                labels={parseLabels(selectedRow?.labels || [])}
                onClose={closePanel}
                onSave={saveNotes}
            />
        </div>
    );
}
