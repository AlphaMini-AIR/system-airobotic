const getUid = 'https://script.google.com/macros/s/AKfycbxMMwrvLEuqhsyK__QRCU0Xi6-qu-HkUBx6fDHDRAYfpqM9d4SUq4YKVxpPnZtpJ_b6wg/exec';

// Truyền vào số điện thoại để lấy Zalo UID
export async function getZaloUid(phone) {
    if (!phone) { return { uid: null, success: false, message: 'Yêu cầu số điện thoại.' }; }
    try {
        const url = `${getUid}?phone=${encodeURIComponent(phone)}`;
        const response = await fetch(url);
        if (!response.ok) { return { uid: null, success: false, message: 'Dịch vụ lấy Zalo UID không khả dụng.' } }
        const result = await response.json();
        if (result.status === 2 && result.data?.uid) { return { uid: result.data.uid, success: true, message: result.mes }; }
        return { uid: null, success: false, message: result.mes ? result.mes : 'Không tìm thấy UID, vui lòng kiểm tra lại số điện thoại liên hệ.' };
    } catch {
        return { uid: null, success: false, message: 'Đã xảy ra lỗi trong quá trình lấy Zalo UID.' };
    }
}
