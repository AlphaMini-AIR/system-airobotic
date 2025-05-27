import { Data_calendar } from "@/data/course";
import Today from "@/app/calendar/ui/today";

export default async function Page() {
  const now = new Date();
  const today = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const data = await Data_calendar(month, year);
  const todayEvents = data.filter(ev => {
    const [d, m, y] = ev.day.split('/').map(Number);
    return d === today && m === month && y === year;
  });
  console.log(todayEvents);

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: 400 }}>
        <Today month={month} year={year} />
      </div>
      <div style={{ flex: 1 }}></div>
    </div>
  );
}


