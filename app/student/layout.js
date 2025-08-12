
export default function Layout({ children }) {
    return (
        <>
            <div className="flex_col" style={{ height: '100%', width: '100%' }}>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    {children}
                </div>
            </div>
        </>
    )
} 