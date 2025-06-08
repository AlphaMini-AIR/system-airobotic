import Link from "next/link"
import Dot from "./dot"

export default function Timeline({ data, props }) {
    console.log(props);
    
    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%', flex: 1.6 }}>

            <div style={{
                borderRadius: '8px', padding: 16, background: 'linear-gradient(90deg, rgba(32,97,165,1) 0%, rgba(18,57,98,1) 100%)',
                boxShadow: 'var(--box)', overflow: 'hidden',
            }}><Link href={`/course/${data.ID}`}>
                    <div className="text_4_m" style={{ color: 'white', fontWeight: '500' }}>{data.Type}</div>
                    <div className="text_2" style={{ margin: '4px 0', color: 'white' }}>Lớp: {data.ID}</div>
                    <div className="text_4_m" style={{ color: 'white' }}>Từ {data.TimeStart} đến {data.TimeEnd}</div>
                </Link>
            </div>


            <div style={{ flex: 1, overflow: 'hidden', overflowY: 'scroll' }}>
                {data.Detail.map((e, i) => (
                    i == data.Detail.length - 1 ?
                        <Dot key={i} props={props} course={data.ID} type="end" index={i} data={e} /> :
                        i == 0 ? <Dot key={i} props={props} course={data.ID} type="center" index={i} data={e} /> :
                            <Dot key={i} props={props} course={data.ID} type="main" index={i} data={e} />
                ))}
            </div>
        </div>
    )
}

