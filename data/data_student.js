import fetchApi from "@/utils/fetchApi";


export async function Read_Student_All() {
    let data;
    try { data = await fetchApi('/student_all', { method: 'POST', next: { tags: ["student__id"] }, cache: "force-cache", body: { source: 1 } }) }
    catch (error) { data = [] }
    if (!data) data = []
    return data
}

// export async function Read_Student_One(_id) {
//     let data;
//     try { data = await fetchApi('/student_id', { method: 'POST', next: { tags: [`student_${_id}`] }, cache: "force-cache", body: { source: 1, _id } }) }
//     catch (error) { data = [] }
//     if (!data) data = []
//     return data
// }