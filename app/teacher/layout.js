import Nav from "./nav";

export default function Layout({ children }) {
    return (
        <div className="flex_col" style={{ height: '100%', width: '100%'}}>
            <Nav />
            {children}
        </div>
    )
} 