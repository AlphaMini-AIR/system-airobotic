'use server';

import fetchApi from '@/utils/fetchApi';
import { revalidateTag } from 'next/cache';

export async function Read_Area() {
    let data;
    try { data = await fetchApi('/area', { method: 'POST', next: { tags: ["data_area"] }, cache: "force-cache", body: { source: 1 } }) }
    catch (error) { data = [] }
    if (!data) data = []
    return data
}
