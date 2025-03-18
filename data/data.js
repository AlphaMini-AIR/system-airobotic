import fetchApi from "@/utils/fetchApi";

export async function Read_Area_All() {
    let data;
    try { data = await fetchApi('/area_r', { method: 'POST', next: { tags: ["area_all"] }, cache: "force-cache", body: { source: 1 } }) }
    catch (error) { data = [] }
    if (!data) data = []
    return data
}



