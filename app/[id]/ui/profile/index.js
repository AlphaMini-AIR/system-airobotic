'use client';

import { Svg_link, Svg_Save, Svg_Pen, Svg_Add } from '@/components/(icon)/svg';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './index.module.css';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import CourseAndImageSelection from '../pickimage';
import { useRouter } from 'next/navigation';
import { reloadStudent } from '@/data/actions/reload';

const CloseIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const ArrowIcon = ({ isOpen }) => (<svg style={{ transform: isOpen ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>);

const extractId = (urlOrId) => { if (!urlOrId || typeof urlOrId !== 'string') return ''; const match = urlOrId.match(/id=([^&]+)/) || urlOrId.match(/\/d\/([^/]+)/); return match ? match[1] : urlOrId; };
const buildUrl = (id) => id ? `https://lh3.googleusercontent.com/d/${id}` : 'https://lh3.googleusercontent.com/d/1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG';

const defaultProfile = { Intro: '', Avatar: '', ImgSkill: '', ImgPJ: [], Skill: { "Sự tiến bộ và Phát triển": "50", "Kỹ năng giao tiếp": "50", "Diễn giải vấn đề": "50", "Tự tin năng động": "50", "Đổi mới sáng tạo": "50", "Giao lưu hợp tác": "50" }, Present: [] };

export default function Profile({ data, onSave }) {
    const [editableProfile, setEditableProfile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [popupState, setPopupState] = useState({ type: null, bookId: null });
    const [expandedPresentation, setExpandedPresentation] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const profile = { ...defaultProfile, ...(data.Profile || {}) };
        const completedCourses = data.Course?.filter(c => c.enrollmentStatus === 2) || [];
        const presentMap = new Map((profile.Present || []).map(p => [p.course, p]));
        const syncedPresent = completedCourses.map(course => {
            const existingPresent = presentMap.get(course._id) || {};
            return {
                bookId: course.Book.ID,
                bookName: course.Book.Name,
                Video: extractId(existingPresent.Video || ''),
                Img: extractId(existingPresent.Img || ''),
                Comment: existingPresent.Comment || '',
                course: existingPresent.course || course._id
            };
        }).filter(Boolean);

        setEditableProfile({
            ...profile,
            Avatar: extractId(profile.Avatar),
            ImgSkill: extractId(profile.ImgSkill),
            ImgPJ: (profile.ImgPJ || []).map(extractId),
            Present: syncedPresent
        });
    }, [data]);

    const handleInputChange = (field, value) => setEditableProfile(p => ({ ...p, [field]: value }));
    const handleSkillChange = (skill, value) => setEditableProfile(p => ({ ...p, Skill: { ...p.Skill, [skill]: value } }));
    const handleRemoveImgPj = (idToRemove) => setEditableProfile(p => ({ ...p, ImgPJ: p.ImgPJ.filter(id => id !== idToRemove) }));
    const handlePresentationChange = (bookId, field, value) => {
        setEditableProfile(p => ({ ...p, Present: p.Present.map(item => item.bookId === bookId ? { ...item, [field]: value } : item) }));
    };

    const handleSelectionChange = (id) => {
        const { type, bookId } = popupState;
        if (type === 'presentImg') handlePresentationChange(bookId, 'Img', id);
        else if (type === 'presentVideo') handlePresentationChange(bookId, 'Video', id);
        else if (type === 'avatar') handleInputChange('Avatar', id);
        else if (type === 'imgSkill') handleInputChange('ImgSkill', id);
        else if (type === 'imgPj') handleInputChange('ImgPJ', id);
        setPopupState({ type: null, bookId: null });
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/student/${data._id}/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editableProfile) });
            const result = await response.json();
            if (response.ok) {
                onSave?.(editableProfile);
                alert('Cập nhật hồ sơ thành công!');
                router.refresh();
            } else { alert(`Có lỗi xảy ra: ${result.mes || 'Không rõ lỗi'}`); }
        } catch (error) { alert('Không thể kết nối đến máy chủ.'); }
        finally { setIsSaving(false); }
    };

    if (!editableProfile) return <div>Đang xử lý dữ liệu...</div>;
    console.log(editableProfile);
    
    const { Intro, Avatar, ImgPJ, Skill, ImgSkill, Present } = editableProfile;
    const popups = {
        avatar: { title: "Chọn ảnh đại diện", mode: "single", selected: Avatar },
        imgPj: { title: "Chọn ảnh sản phẩm", mode: "multiple", selected: ImgPJ },
        imgSkill: { title: "Chọn ảnh kĩ năng", mode: "single", selected: ImgSkill },
        presentImg: { title: "Chọn ảnh đại diện video", mode: "single", selected: Present.find(p => p.bookId === popupState.bookId)?.Img },
        presentVideo: { title: "Chọn video thuyết trình", mode: "single", selected: Present.find(p => p.bookId === popupState.bookId)?.Video, filter: "video" }
    };
    const currentPopup = popups[popupState.type];

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerContent}><p className="text_3">Hồ sơ điện tử</p><Link href={`https://eportfolio.airobotic.edu.vn/e-Portfolio/?ID=${data._id}`} target="_blank"><Svg_link w={20} h={20} c={'blue'} /></Link></div>
                <button onClick={handleSaveChanges} className={styles.saveButton} disabled={isSaving}><Svg_Save w={18} h={18} c={'white'} /> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            </div>
            <div className={styles.profileBody}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}><p className={styles.cardTitle}>Giới thiệu bản thân</p></div>
                    <div className={styles.cardContent}>
                        <div className={styles.textareaWrapper}><textarea className={`input text_4_m ${styles.textarea}`} placeholder='Nhập giới thiệu bản thân' value={Intro || ''} onChange={(e) => handleInputChange('Intro', e.target.value)} /></div>
                        <div className={styles.imageContainer}><div className={styles.imageWrapper} onClick={() => setPopupState({ type: 'avatar' })}><Image src={buildUrl(Avatar)} fill alt="Avatar" className={styles.profileImage} /><div className={styles.editOverlay}><Svg_Pen w={20} h={20} c="white" /></div></div></div>
                    </div>
                </div>
                <div className={styles.card}>
                    <div className={styles.cardHeader}><p className={styles.cardTitle}>Kĩ năng cá nhân</p></div>
                    <div className={styles.skillCardContent}>
                        <div className={styles.skillsContainer}>{Skill && Object.entries(Skill).map(([name, value]) => (<div key={name} className={styles.skillItem}><label className={styles.skillLabel}>{name}</label><input type="range" min="0" max="100" value={value} className={styles.skillSlider} onChange={(e) => handleSkillChange(name, e.target.value)} /><span className={styles.skillValue}>{value}%</span></div>))}</div>
                        <div className={styles.skillImageContainer}><div className={styles.imageWrapper} onClick={() => setPopupState({ type: 'imgSkill' })}><Image src={buildUrl(ImgSkill)} fill alt="Skill Image" className={styles.profileImage} /><div className={styles.editOverlay}><Svg_Pen w={20} h={20} c="white" /></div></div></div>
                    </div>
                </div>
                <div className={styles.card}>
                    <div className={styles.cardHeader}><p className={styles.cardTitle}>Hình ảnh sản phẩm</p></div>
                    <div className={styles.productImageGrid}>
                        <button onClick={() => setPopupState({ type: 'imgPj' })} className={styles.addCard}><Svg_Add w={32} h={32} c={'var(--green)'} /><p className='text_6_400'>Thêm ảnh</p></button>
                        {ImgPJ?.map(id => (<div key={id} className={styles.productImageWrapper}><Image src={buildUrl(id)} alt="Ảnh sản phẩm" fill sizes="150px" className={styles.profileImage} /><button className={styles.removeImageButton} onClick={() => handleRemoveImgPj(id)}><CloseIcon /></button></div>))}
                    </div>
                </div>
                <div className={styles.card}>
                    <div className={styles.cardHeader}><p className={styles.cardTitle}>Thuyết trình tổng kết</p></div>
                    <div className={styles.presentationContainer}>
                        {Present.length === 0 ? <p>Học sinh chưa hoàn thành khóa học nào</p> : Present.map(p => {
                            console.log(p);
                            
                            const isExpanded = expandedPresentation === p.bookId;
                            return (
                                <div key={p.bookId} className={styles.presentationItem}>
                                    <button className={styles.presentationHeader} onClick={() => setExpandedPresentation(prev => (prev === p.bookId ? null : p.bookId))}><span>{p.bookName}</span><ArrowIcon isOpen={isExpanded} /></button>
                                    <div className={`${styles.presentationContent} ${isExpanded ? styles.expandedContent : ''}`}>
                                        <div className={styles.presentationGrid}>
                                            <div className={styles.presentationMedia}>
                                                <div className={styles.mediaItem} onClick={() => setPopupState({ type: 'presentVideo', bookId: p.bookId })}>
                                                    {p.Video ? <Image src={`https://drive.google.com/thumbnail?id=${p.Video}`} fill alt="Thumbnail" className={styles.mediaPreview} /> : <div className={styles.mediaPlaceholder}>Chưa có video</div>}
                                                    <div className={styles.editOverlay}><Svg_Pen w={18} h={18} c="white" /></div>
                                                </div>
                                                <div className={styles.mediaItem} onClick={() => setPopupState({ type: 'presentImg', bookId: p.bookId })}>
                                                    {p.Img ? <Image src={buildUrl(p.Img)} fill alt="Thumbnail" className={styles.mediaPreview} /> : <div className={styles.mediaPlaceholder}>Chưa có ảnh</div>}
                                                    <div className={styles.editOverlay}><Svg_Pen w={18} h={18} c="white" /></div>
                                                </div>
                                            </div>
                                            <div className={styles.presentationComment}>
                                                <p className='text_6'>Nhận xét tổng kết khóa</p>
                                                <textarea className="input" style={{ height: '100%' }} placeholder="Nhập nhận xét của bạn..." value={p.Comment || ''} onChange={e => handlePresentationChange(p.bookId, 'Comment', e.target.value)}></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {currentPopup && (
                <FlexiblePopup open={!!popupState.type} onClose={() => setPopupState({ type: null, bookId: null })} title={currentPopup.title} width={800} renderItemList={() => (<CourseAndImageSelection studentData={data} selectionMode={currentPopup.mode} selected={currentPopup.selected} onSelectionChange={handleSelectionChange} filterType={currentPopup.filter || "image"} />)} />
            )}
        </>
    );
}