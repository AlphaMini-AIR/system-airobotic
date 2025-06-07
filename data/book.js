'use server';

import fetchApi from '@/utils/fetchApi';
import { revalidateTag } from 'next/cache';


export async function Data_book() {
    try {
        const res = await fetchApi(`/book`, {
            method: 'GET',
            cache: "force-cache",
            next: { tags: [`data_book`] }
        });

        return res.data || [];
    } catch (err) {
        return { data: [] };
    }
}

export async function Re_book() {
    revalidateTag(`data_book`);
}