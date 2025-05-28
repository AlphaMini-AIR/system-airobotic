'use client';

import React, { useState, useEffect } from 'react';
import styles from './index.module.css';
import { useParams } from 'next/navigation';

export default function CourseLessonPage() {
    const { id } = useParams();                // id = `${courseId}_${lessonId}`
    const [students, setStudents] = useState([]);     // danh sách học viên
    const [present, setPresent] = useState({});       // map studentId → boolean
    const [files, setFiles] = useState([]);           // FileList
    const [previews, setPreviews] = useState([]);     // preview URLs
    const [loading, setLoading] = useState(false);

    // Tách courseId và lessonId nếu cần
    const [courseId, lessonId] = id.split('_');

    useEffect(() => {
        // TODO: gọi API để fetch danh sách học viên và trạng thái điểm danh cũ
        async function loadAttendance() {
            try {
                const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/students`);
                const data = await res.json();
                setStudents(data.students);
                // Ví dụ API trả về mảng { id, name, present }
                const initial = {};
                data.students.forEach(s => initial[s.id] = s.present);
                setPresent(initial);
            } catch (err) {
                console.error(err);
            }
        }
        loadAttendance();
    }, [courseId, lessonId]);

    const togglePresent = (stuId) => {
        setPresent(prev => ({ ...prev, [stuId]: !prev[stuId] }));
    };

    const saveAttendance = async () => {
        setLoading(true);
        try {
            await fetch(
                `/api/courses/${courseId}/lessons/${lessonId}/attendance`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ present }),
                }
            );
            alert('Lưu điểm danh thành công!');
        } catch (err) {
            console.error(err);
            alert('Có lỗi khi lưu điểm danh.');
        } finally {
            setLoading(false);
        }
    };

    const onFileChange = (e) => {
        const fl = Array.from(e.target.files);
        setFiles(fl);
        // tạo preview
        setPreviews(fl.map(f => URL.createObjectURL(f)));
    };

    const uploadImages = async () => {
        if (!files.length) return;
        setLoading(true);
        try {
            const form = new FormData();
            files.forEach(f => form.append('images', f));
            await fetch(
                `/api/courses/${courseId}/lessons/${lessonId}/images`,
                { method: 'POST', body: form }
            );
            alert('Tải ảnh lên thành công!');
            // reset
            setFiles([]);
            setPreviews([]);
        } catch (err) {
            console.error(err);
            alert('Có lỗi khi tải ảnh.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1>Buổi học: {lessonId} (Khóa: {courseId})</h1>

            <section className={styles.section}>
                <h2>1. Điểm danh</h2>
                <ul className={styles.list}>
                    {students.map(s => (
                        <li key={s.id} className={styles.item}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={!!present[s.id]}
                                    onChange={() => togglePresent(s.id)}
                                />{' '}
                                {s.name}
                            </label>
                        </li>
                    ))}
                </ul>
                <button
                    className={styles.button}
                    onClick={saveAttendance}
                    disabled={loading}
                >
                    {loading ? 'Đang lưu...' : 'Lưu điểm danh'}
                </button>
            </section>

            <section className={styles.section}>
                <h2>2. Cập nhật hình ảnh buổi học</h2>
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={onFileChange}
                />
                <button
                    className={styles.button}
                    onClick={uploadImages}
                    disabled={loading || !files.length}
                >
                    {loading ? 'Đang tải...' : 'Tải lên'}
                </button>

                {previews.length > 0 && (
                    <div className={styles.previewContainer}>
                        {previews.map((src, idx) => (
                            <img
                                key={idx}
                                src={src}
                                alt={`Preview ${idx + 1}`}
                                className={styles.previewImg}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
