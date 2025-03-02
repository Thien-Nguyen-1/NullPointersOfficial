import { Link } from "react-router-dom";
import "../styles/Courses.css";


function Courses({ role }) {
    return (
        <div>
            <h1 className="page-title">Courses</h1>
            <p className="mt-2 text-gray-600">Your courses are coming soon.</p>
            

            {/* Show the "Create Module" button only if the user is an Admin */}
            {role === "admin" && (
                <Link to="/admin/courses/create-and-manage-module" className="create-module-btn">
                    Create Module
                </Link>
            )}
        </div>
    );
}
    
export default Courses;
    