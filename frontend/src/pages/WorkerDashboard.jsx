import React, { useEffect, useState } from "react";
import StatsCards from "../components/StatsCards";
import LearningChart from "../components/LearningChart";
import CoursesList from "../components/CoursesList";
import axios from "axios";

export default function WorkerDashboard() {
  const [userName, setUserName] = useState("User");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moduleStats, setModuleStats] = useState({
    completed_modules: 0,
    in_progress_modules: 0,
    total_modules: 0
  });
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        // Get token from localStorage instead of hardcoding it
        const token = localStorage.getItem('token');
        
        // Check if token exists
        if (!token) {
          throw new Error('No authentication token found');
        }
        const response = await axios.get('/api/user/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        setUserName(response.data.first_name || "User");
        // Set module statistics
        setModuleStats({
          completed_modules: response.data.completed_modules || 0,
          in_progress_modules: response.data.in_progress_modules || 0,
          total_modules: response.data.total_modules || 0
        });
        
        // Transform modules into course-like format
        const transformedCourses = response.data.modules.map(module => ({
          id: module.id,
          title: module.title,
          progress_percentage: module.progress_percentage,
          pinned: module.pinned,
          completed: module.completed
        }));
        setCourses(transformedCourses);
      } catch (error) {
        console.error('Error fetching user details:', error);
        setError('Failed to fetch user details. Please log in again.');
        setUserName("User");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserDetails();
  }, []);

  const learningHours = [
    { day: "Mon", hours: 2.0 },
    { day: "Tue", hours: 3.7 },
    { day: "Wed", hours: 0.8 },
    { day: "Thu", hours: 3.8 },
    { day: "Fri", hours: 2.0 },
    { day: "Sat", hours: 1.0 },
    { day: "Sun", hours: 3.2 }
  ];

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  console.log(courses)
  return (
    <div className="dashboard-container">
      <div className="top-row">
        <StatsCards 
          userName={userName} 
          completedModules={moduleStats.completed_modules}
          inProgressModules={moduleStats.in_progress_modules}
        />
      </div>
      <div className="bottom-row">
        <CoursesList courses={courses} />
        <LearningChart data={learningHours} />
      </div>
    </div>
  );
}