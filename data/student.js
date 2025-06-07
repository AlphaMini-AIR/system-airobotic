'use server';
import fetchApi from "@/utils/fetchApi";
import { revalidateTag } from 'next/cache';

export async function Read_Student_All() {
    let data;
    try { data = await fetchApi('/student_all', { method: 'POST', next: { tags: ["student_all"] }, cache: "force-cache", body: { source: 1 } }) }
    catch (error) { data = [] }
    if (!data) data = []
    return data.data
}

export async function Re_Student_All() {
    revalidateTag(`student_all`);
}
