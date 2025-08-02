const SCRIPT_URL_SEND_MESSAGE = 'https://script.google.com/macros/s/AKfycbxPF49FIUFKMoGshlLpERTLx1tuW3txICdlrBGUyomMYWhgANSwY0oTNV_Eppqmo5Mruw/exec';
const SCRIPT_URL_GET_UID = 'https://script.google.com/macros/s/AKfycbxMMwrvLEuqhsyK__QRCU0Xi6-qu-HkUBx6fDHDRAYfpqM9d4SUq4YKVxpPnZtpJ_b6wg/exec';

export async function senMesByPhone({ message, uid, phone }) {
    const url = new URL(SCRIPT_URL_SEND_MESSAGE);
    url.searchParams.set('mes', message);
    if (uid) { url.searchParams.set('uid', `[${uid},' - ']`) }
    else if (phone) {
        url.searchParams.set('phone', phone);
    } else {
        throw new Error('Cần cung cấp Uid hoặc Số điện thoại để gọi Google Script.');
    }
    const response = await fetch(url.toString());
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Script (gửi tin) trả về lỗi HTTP: ${response.status} - ${errorText}`);
    }
    return response.json();
}

export async function getZaloUid(phone) {
    if (!phone) {
        return { uid: null, success: false, message: 'Yêu cầu số điện thoại.' };
    }
    try {
        const url = `${SCRIPT_URL_GET_UID}?phone=${encodeURIComponent(phone)}`;
        const response = await fetch(url);
        if (!response.ok) {
            return { uid: null, success: false, message: 'Dịch vụ lấy Zalo UID không khả dụng.' };
        }
        const result = await response.json();
        if (result.status === 2 && result.data?.uid) {
            return { uid: result.data.uid, success: true, message: result.mes };
        }
        return { uid: null, success: false, message: result.mes || 'Không tìm thấy UID, vui lòng kiểm tra lại số điện thoại.' };
    } catch (error) {
        return { uid: null, success: false, message: 'Đã xảy ra lỗi trong quá trình lấy Zalo UID.' };
    }
}