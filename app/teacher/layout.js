import checkAuthToken from "@/utils/checktoken"

export default async function Layout({ children }) {
    let user = await checkAuthToken()
    if (!user.role.includes('Admin')) {
        return (
            <div className="flex_center" style={{ height: '100%', width: '100%' }}>
                <h4 style={{ fontStyle: 'italic' }}>Bạn không có quyền truy cập trang này</h4>
            </div>
        )
    }

    return (
        <div className="flex_col" style={{ height: '100%', width: '100%' }}>
            {children}
        </div>
    )
} 