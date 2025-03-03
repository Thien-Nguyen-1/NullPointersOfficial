import { Link } from "react-router-dom";
import "../styles/Courses.css";
import "../App.css"
import { AuthContext } from "../services/AuthContext";
import { useContext } from "react";
import { GrAdd } from "react-icons/gr";



function Courses({ role }) {

    const {user} = useContext(AuthContext)

    return (

        <div className="course-container mt-2">

            <h1 className="page-title"> Your Tags </h1>

            <div className="tag-course-container mb-2 ">
        
                {user && (
                   user.tags.map(
                    (tag, index)=> (
                        <div className="tag-course" key={index}>
                            <p> {tag} </p>
                        </div>
                    )
                   )
                )}


                <div className="tag-course edit-button">
                    <GrAdd />
                </div>
                
            </div>
            

            <div>
                <h1 className="page-title">Courses</h1>
                 <p className="mt-2 text-gray-600">Your courses are coming soon.</p>
            

                {/* Show the "Create Module" button only if the user is an Admin */}
                {role === "admin" && (
                    <Link to="/admin/create-module" className="create-module-btn">
                    Create Module
                </Link>
            )}
             </div>






        </div>


        
    );
}
    
export default Courses;
    