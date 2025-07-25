'use client';

import { Svg_link, Svg_Save, Svg_Pen, Svg_Add } from '@/components/(icon)/svg';
import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import styles from './index.module.css';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import CourseAndImageSelection from '../pickimage';
import { useRouter } from 'next/navigation';

const CloseIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const ArrowIcon = ({ isOpen }) => (<svg style={{ transform: isOpen ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>);

const extractId = (urlOrId) => { if (!urlOrId || typeof urlOrId !== 'string') return ''; if (urlOrId.includes('drive.google.com') || urlOrId.includes('googleusercontent.com')) { const match = urlOrId.match(/id=([^&]+)/) || urlOrId.match(/\/d\/([^/]+)/) || urlOrId.match(/uc\?id=([^&]+)/) || urlOrId.match(/picture\/([^?]+)/); return match ? match[1] : urlOrId; } return urlOrId; };
const buildUrl = (id) => id ? `https://drive.google.com/uc?id=${id}` : '';

// **Định nghĩa giá trị mặc định cho Profile**
const defaultProfile = {
    Intro: '',
    Avatar: '',
    ImgSkill: '',
    ImgPJ: [],
    Skill: {
        "Sự tiến bộ và Phát triển": "50",
        "Kỹ năng giao tiếp": "50",
        "Diễn giải vấn đề": "50",
        "Tự tin năng động": "50",
        "Đổi mới sáng tạo": "50",
        "Giao lưu hợp tác": "50"
    },
    Present: []
};

export default function Profile({ data, onSave }) {
    const [editableProfile, setEditableProfile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [isAvatarPopupOpen, setIsAvatarPopupOpen] = useState(false);
    const [isImgPjPopupOpen, setIsImgPjPopupOpen] = useState(false);
    const [isImgSkillPopupOpen, setIsImgSkillPopupOpen] = useState(false);
    const [presentImgPopup, setPresentImgPopup] = useState({ isOpen: false, bookId: null });
    const [presentVideoPopup, setPresentVideoPopup] = useState({ isOpen: false, bookId: null });
    const [expandedPresentation, setExpandedPresentation] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const profile = data.Profile ? { ...defaultProfile, ...data.Profile } : defaultProfile;

        const completedCourses = data.Course?.filter(c => c.enrollmentStatus === 2) || [];
        const presentMap = new Map((profile.Present || []).map(p => [p.bookId, p]));

        const syncedPresent = completedCourses.map(course => {
            if (!course.Book?.ID) return null;
            const bookId = course.Book.ID;
            const existingPresent = presentMap.get(bookId);
            if(!existingPresent.course) {
                existingPresent.course = course._id;
            }
            return existingPresent || { bookId: bookId, bookName: course.Book.Name|| course.Book.ID, Video: '', Img: '', Comment: '', course: course._id };
        }).filter(Boolean);

        const parsedProfile = {
            ...profile,
            Avatar: extractId(profile.Avatar),
            ImgSkill: extractId(profile.ImgSkill),
            ImgPJ: (profile.ImgPJ || []).map(extractId),
            Present: syncedPresent.map(p => ({ ...p, Img: extractId(p.Img), Video: extractId(p.Video) }))
        };
        setEditableProfile(parsedProfile);
    }, [data]);

    const handleIntroChange = useCallback((e) => setEditableProfile(p => ({ ...p, Intro: e.target.value })), []);
    const handleSkillChange = useCallback((skill, value) => setEditableProfile(p => ({ ...p, Skill: { ...p.Skill, [skill]: value } })), []);
    const handleAvatarSelect = useCallback((id) => { setEditableProfile(p => ({ ...p, Avatar: id })); setIsAvatarPopupOpen(false); }, []);
    const handleImgPjSelect = useCallback((ids) => setEditableProfile(p => ({ ...p, ImgPJ: ids })), []);
    const handleImgSkillSelect = useCallback((id) => { setEditableProfile(p => ({ ...p, ImgSkill: id })); setIsImgSkillPopupOpen(false); }, []);
    const handleRemoveImgPj = useCallback((idToRemove) => setEditableProfile(p => ({ ...p, ImgPJ: p.ImgPJ.filter(id => id !== idToRemove) })), []);

    const handleTogglePresentation = useCallback((bookId) => setExpandedPresentation(prev => (prev === bookId ? null : bookId)), []);
    const handlePresentationChange = useCallback((bookId, field, value) => {
        setEditableProfile(prev => ({ ...prev, Present: prev.Present.map(p => p.bookId === bookId ? { ...p, [field]: value } : p) }));
    }, []);

    const handleOpenPresentImgPopup = (bookId) => setPresentImgPopup({ isOpen: true, bookId });
    const handleOpenPresentVideoPopup = (bookId) => setPresentVideoPopup({ isOpen: true, bookId });
    const handlePresentImageSelect = useCallback((id) => { const { bookId } = presentImgPopup; if (bookId) handlePresentationChange(bookId, 'Img', id); setPresentImgPopup({ isOpen: false, bookId: null }); }, [presentImgPopup, handlePresentationChange]);
    const handlePresentVideoSelect = useCallback((id) => { const { bookId } = presentVideoPopup; if (bookId) handlePresentationChange(bookId, 'Video', id); setPresentVideoPopup({ isOpen: false, bookId: null }); }, [presentVideoPopup, handlePresentationChange]);

    const handleSaveChanges = useCallback(async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/student/${data._id}/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editableProfile) });
            const result = await response.json();
            if (result.status) {
                onSave?.(editableProfile); alert('Cập nhật hồ sơ thành công!');
                router.refresh();
            } else { alert(`Có lỗi xảy ra: ${result.mes}`); }
        } catch (error) { alert('Không thể kết nối đến máy chủ.'); }
        finally { setIsSaving(false); }
    }, [data._id, editableProfile, onSave, router]);

    // **SỬA LỖI: Điều kiện kiểm tra an toàn hơn**
    if (!editableProfile) return <div>Đang xử lý dữ liệu...</div>;

    const { Intro, Avatar, ImgPJ, Skill, ImgSkill, Present } = editableProfile;
    const avatarUrl = Avatar ? buildUrl(Avatar) : 'https://lh3.googleusercontent.com/d/1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG';
    const imgSkillUrl = ImgSkill ? buildUrl(ImgSkill) : 'https://lh3.googleusercontent.com/d/1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG';

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <p className="text_3">Hồ sơ điện tử</p>
                    <Link href={data.e || `https://eportfolio.airobotic.edu.vn/e-Portfolio/?ID=${data.ID}`} target="_blank"><Svg_link w={20} h={20} c={'blue'} /></Link>
                </div>
                <button onClick={handleSaveChanges} className={styles.saveButton} disabled={isSaving}><Svg_Save w={18} h={18} c={'white'} /> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            </div>
            <div className={styles.profileBody}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}><p className={styles.cardTitle}>Giới thiệu bản thân</p></div>
                    <div className={styles.cardContent}>
                        <div className={styles.textareaWrapper}><textarea className={`input text_4_m ${styles.textarea}`} placeholder='Nhập giới thiệu bản thân' value={Intro || ''} onChange={handleIntroChange} /></div>
                        <div className={styles.imageContainer}><div className={styles.imageWrapper} onClick={() => setIsAvatarPopupOpen(true)}><Image src={avatarUrl} fill alt="Student Avatar" className={styles.profileImage} /><div className={styles.editOverlay}><Svg_Pen w={20} h={20} c="white" /></div></div></div>
                    </div>
                </div>
                <div className={styles.card}>
                    <div className={styles.cardHeader}><p className={styles.cardTitle}>Kĩ năng cá nhân</p></div>
                    <div className={styles.skillCardContent}>
                        <div className={styles.skillsContainer}>{Skill && Object.entries(Skill).map(([name, value]) => (<div key={name} className={styles.skillItem}><label className={styles.skillLabel}>{name}</label><input type="range" min="0" max="100" value={value} className={styles.skillSlider} onChange={(e) => handleSkillChange(name, e.target.value)} /><span className={styles.skillValue}>{value}%</span></div>))}</div>
                        <div className={styles.skillImageContainer}><div className={styles.imageWrapper} onClick={() => setIsImgSkillPopupOpen(true)}><Image src={imgSkillUrl} fill alt="Skill Image" className={styles.profileImage} /><div className={styles.editOverlay}><Svg_Pen w={20} h={20} c="white" /></div></div></div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}><p className={styles.cardTitle}>Hình ảnh sản phẩm</p></div>

                    <div className={styles.productImageGrid}>

                        <button onClick={() => setIsImgPjPopupOpen(true)} className={styles.addCard}><Svg_Add w={32} h={32} c={'var(--green)'} /><p className='text_6_400'>Thêm ảnh</p></button>

                        {ImgPJ?.map(id => (<div key={id} className={styles.productImageWrapper}><Image src={buildUrl(id)} alt="Ảnh sản phẩm" fill sizes="150px" className={styles.profileImage} /><button className={styles.removeImageButton} onClick={() => handleRemoveImgPj(id)}><CloseIcon /></button></div>))}

                    </div>

                </div>

                <div className={styles.card}>

                    <div className={styles.cardHeader}><p className={styles.cardTitle}>Thuyết trình tổng kết</p></div>

                    <div className={styles.presentationContainer}>

                        {Present.length == 0 ? <p>Học sinh chưa hoàn thành khóa học nào</p> :
                            <>
                                {Present?.map(presentation => {
                                    const bookId = presentation.bookId;
                                    if (!bookId) return null;
                                    const isExpanded = expandedPresentation === bookId;
                                    return (
                                        <div key={bookId} className={styles.presentationItem}>
                                            <button className={styles.presentationHeader} onClick={() => handleTogglePresentation(bookId)}><span>{presentation.bookName}</span><ArrowIcon isOpen={isExpanded} /></button>
                                            <div className={`${styles.presentationContent} ${isExpanded ? styles.expandedContent : ''}`}>
                                                <div className={styles.presentationGrid}>
                                                    <div className={styles.presentationMedia}>
                                                        <div className={styles.mediaItem} onClick={() => handleOpenPresentVideoPopup(bookId)}>
                                                            {presentation.Video ? <Image src={`https://drive.google.com/thumbnail?id=${presentation.Video}`} fill alt="Thumbnail" className={styles.mediaPreview} /> : <div className={styles.mediaPlaceholder}>Chưa có video</div>}
                                                            <div className={styles.editOverlay}><Svg_Pen w={18} h={18} c="white" /></div>
                                                        </div>
                                                        <div className={styles.mediaItem} onClick={() => handleOpenPresentImgPopup(bookId)}>
                                                            {presentation.Img ? <Image src={buildUrl(presentation.Img)} fill alt="Thumbnail" className={styles.mediaPreview} /> : <div className={styles.mediaPlaceholder}>Chưa có ảnh</div>}
                                                            <div className={styles.editOverlay}><Svg_Pen w={18} h={18} c="white" /></div>
                                                        </div>
                                                    </div>
                                                    <div className={styles.presentationComment}>
                                                        <p className='text_6'>Nhận xét tổng kết khóa</p>
                                                        <textarea className="input" style={{ height: '100%' }} placeholder="Nhập nhận xét của bạn..." value={presentation.Comment || ''} onChange={e => handlePresentationChange(bookId, 'Comment', e.target.value)}></textarea>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>}
                    </div>

                </div>
            </div>

            {/* Popups */}
            <FlexiblePopup open={isAvatarPopupOpen} onClose={() => setIsAvatarPopupOpen(false)} title="Chọn ảnh đại diện" width={800} renderItemList={() => (<CourseAndImageSelection studentData={data} selectionMode="single" selected={Avatar} onSelectionChange={handleAvatarSelect} filterType="image" />)} />
            <FlexiblePopup open={isImgPjPopupOpen} onClose={() => setIsImgPjPopupOpen(false)} title="Chọn ảnh sản phẩm" width={800} renderItemList={() => (<CourseAndImageSelection studentData={data} selectionMode="multiple" selected={ImgPJ} onSelectionChange={handleImgPjSelect} filterType="image" />)} />
            <FlexiblePopup open={isImgSkillPopupOpen} onClose={() => setIsImgSkillPopupOpen(false)} title="Chọn ảnh kĩ năng" width={800} renderItemList={() => (<CourseAndImageSelection studentData={data} selectionMode="single" selected={ImgSkill} onSelectionChange={handleImgSkillSelect} filterType="image" />)} />
            <FlexiblePopup open={presentImgPopup.isOpen} onClose={() => setPresentImgPopup({ isOpen: false, bookId: null })} title="Chọn ảnh đại diện video" width={800} renderItemList={() => (<CourseAndImageSelection studentData={data} selectionMode="single" selected={Present?.find(p => p.bookId === presentImgPopup.bookId)?.Img} onSelectionChange={handlePresentImageSelect} filterType="image" />)} />
            <FlexiblePopup open={presentVideoPopup.isOpen} onClose={() => setPresentVideoPopup({ isOpen: false, bookId: null })} title="Chọn video thuyết trình" width={800} renderItemList={() => (<CourseAndImageSelection studentData={data} selectionMode="single" selected={Present?.find(p => p.bookId === presentVideoPopup.bookId)?.Video} onSelectionChange={handlePresentVideoSelect} filterType="video" />)} />
        </>
    );
}