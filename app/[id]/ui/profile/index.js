'use client'

import AnimatedButton from '@/components/(button)/button';
import { Svg_link } from '@/components/svg';
import Link from 'next/link';
import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Dialog from '@/components/(popup)/popup';
import ImageSelector from './pic_avt';

export default function Profile({ data }) {
    const textareaRef = useRef(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'start', paddingBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    <p className="text_3">Hồ sơ điện tử</p>
                    <Link href={`https://system.airobotic.edu.vn/student/AI0001`} target="_blank">
                        <Svg_link w={20} h={20} c={'blue'} />
                    </Link>
                </div>
            </div>
            <div style={{
                padding: 12,
                border: 'thin solid',
                borderColor: '#d3d5d7',
                borderRadius: 6,
                background: 'white',
                paddingBottom: 0
            }}>
                <p className="text_4" style={{ paddingBottom: 12, borderBottom: 'thin solid var(--border-color)' }}>Giới thiệu bản thân</p>
                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 8 }}>
                        <textarea
                            ref={textareaRef}
                            className="text_4_m"
                            style={{
                                border: 'none',
                                padding: '8px 0',
                                outline: 'none',
                                textAlign: 'justify',
                                width: '100%',
                                maxWidth: '100%',
                                minWidth: '100%',
                                overflow: 'hidden',
                                resize: 'none',
                                lineHeight: 1.5,
                                height: '200px'
                            }}
                            defaultValue={'dfg'}
                        ></textarea>
                    </div>
                    <div style={{ width: 200, padding: 12, paddingRight: 0 }}>
                        <div
                            style={{
                                width: '100%',
                                position: 'relative',
                                aspectRatio: 1,
                                borderRadius: 3,
                                overflow: 'hidden',
                                cursor: 'pointer'
                            }}
                            onClick={() => setIsDialogOpen(true)}
                        >
                            <Image
                                src="https://lh3.googleusercontent.com/d/1-MMBsDT8EUgmYIuRHpWq96ViWwsyu0cT"
                                fill
                                alt="Image"
                                style={{ objectFit: 'cover' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Dialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                title="Chọn hình ảnh đại diện"
                body={<ImageSelector />}
                width={900}
                height={300}
                button={
                    <AnimatedButton onClick={() => setIsDialogOpen(false)}>
                        <p className='text_6_400' style={{ color: 'white' }}>Lưu</p>
                    </AnimatedButton>
                }
            />
        </>
    );
}
