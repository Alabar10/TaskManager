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
        // שליפת ה-token מה-localStorage
        const token = localStorage.getItem('auth_token');
        const userId = localStorage.getItem('user_id'); // שליפת user_id מה-localStorage
        if (!token || !userId) {
          console.error('Auth token or user_id is missing. Please log in.');
          return;
        }

        // בקשת API עם token ו-user_id
        const response = await fetch(
          `http://localhost:5000/tasks/dates?start_date=2025-01-01&end_date=2025-01-31&user_id=${userId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`, // הוספת token ל-Header
            },
          }
        );

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
