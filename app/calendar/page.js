import Today from './ui/today';
import Title from './ui/month';
import Calendar from './ui/listlesson';
import { Data_calendar } from '@/data/course';

export default async function Page(props) {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { month: monthParam, year: yearParam } = await props.searchParams;
  const viewMonth = parseInt(monthParam, 10) || currentMonth;
  const viewYear = parseInt(yearParam, 10) || currentYear;

  const viewPromise = await Data_calendar(viewMonth, viewYear);
  console.log(viewPromise);
  
  const todayPromise = viewMonth === currentMonth && viewYear === currentYear
    ? viewPromise
    : await Data_calendar(currentMonth, currentYear);


  const [viewData, todayData] = await Promise.all([viewPromise, todayPromise]);
  const todayEvents = todayData.filter(ev => {
    const [d, m, y] = [ev.day, ev.month, ev.year]
    return d === currentDay && m === currentMonth && y === currentYear;
  });
  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: 'calc(100% - 2px)',
      border: '1px solid var(--border-color)',
      borderRadius: 8,
      overflow: 'hidden'
    }}>
      <div style={{ width: 450 }}>
        <Today data={todayEvents} today={currentDay} month={currentMonth} year={currentYear} />
      </div>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid var(--border-color)'
      }}>
        <Title month={viewMonth} year={viewYear} />
        <Calendar data={viewData} day={currentDay} month={viewMonth} year={viewYear} />
      </div>
    </div>
  );
}
