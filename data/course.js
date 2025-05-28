'use server';
import fetchApi from '@/utils/fetchApi';
import { revalidateTag } from 'next/cache';


export async function Data_calendar(month, year) {
    const url = month != '' && year != '' ? `/calendar?month=${month}&year=${year}` : `/calendar`;
    try {
        const res = await fetchApi(url, {
            method: 'GET',
            cache: "force-cache",
            next: { tags: [`data_calendar${month}-${year}`] }
        });

        return res.data || [];
    } catch (err) {
        return { data: [] };
    }
}

export async function Data_lesson(id){
    try {
        const res = await fetchApi(`/calendar/${id}`, {
            method: 'GET',
            cache: "force-cache",
            next: { tags: [`data_lesson${id}`] }
        });

        return res.data || [];
    } catch (err) {
        return { data: [] };
    }
}

export async function Re_calendar(month, year) {
    revalidateTag(`data_calendar${month}-${year}`);
}
