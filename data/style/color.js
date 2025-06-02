export function colorText_noti({ key }) {
    if (key == 'blue') {
        return { color: 'var(--main_d)', background: '#e3f1ff' }
    }
    else {
        return { color: 'var(--text-primary)', background: 'var(--bg-secondary)' }
    }
}