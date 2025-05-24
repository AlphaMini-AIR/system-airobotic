'use server';
import fetchApi from '@/utils/fetchApi';
import { revalidateTag } from 'next/cache';


export async function Data_Client() {
    try {
        const res = await fetchApi(`/client`, {
            method: 'GET',
            cache: "force-cache",
            next: { tags: ['data_client'] }
        });

        return res;
    } catch (err) {
        return { data: [] };
    }
}

export async function Re_Client() {
    revalidateTag('data_client');
}

export async function Data_Label() {
    try {
        const res = await fetchApi(`/label`, {
            method: 'GET',
            cache: "force-cache",
            next: { tags: ['get_label'] }
        });

        return res;
    } catch (err) {
        return { data: [] };
    }
}

export async function Re_Label() {
    revalidateTag('get_label');
}


