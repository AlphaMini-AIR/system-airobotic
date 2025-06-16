'use client'
import Image from 'next/image';


export default function Image({ src, alt }) {
    return (
        <div style={{ width: '100%', aspectRatio: 1, cursor: 'pointer', borderRadius: '3px', overflow: 'hidden' }}>
            <Image src={src} alt={alt} fill style={{ objectFit: 'cover' }} />
        </div>
    )
}