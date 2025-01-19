import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

const CalendarScreen = () => {
  // מצב לשמירת המשימות
  const [events, setEvents] = useState([]);

  // פונקציה לטעינת משימות מה-API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('http://localhost:5000/tasks/dates?start_date=2025-01-01&end_date=2025-01-31');
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const data = await response.json();
        // המרת המשימות לפורמט שמתאים ל-FullCalendar
        const formattedEvents = data.map((task) => ({
          title: task.title,
          date: task.due_date.split('T')[0], // פורמט YYYY-MM-DD
        }));
        setEvents(formattedEvents);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, []);

  return (
    <div>
      <h1>Calendar Screen</h1>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events} // משימות דינמיות
      />
    </div>
  );
};

export default CalendarScreen;
