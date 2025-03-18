import air from './index.module.css'

export default function WrapIcon({ icon, w }) {
    return (
        <div style={{ width: `${w}` }} className={`${air.WrapIcon} flex_center`}>
            {icon}
        </div>
    )
}