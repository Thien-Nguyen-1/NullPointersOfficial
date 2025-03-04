import { Link, useSearchParams } from "react-router-dom";
import "../styles/Courses.css";
import "../App.css";

import { AuthContext } from "../services/AuthContext";
import { useContext, useState } from "react";
import { GrAdd } from "react-icons/gr";
import CourseItem from "../components/CourseItem";




function Courses({ role }) {

    const {user} = useContext(AuthContext)
    
    const [filterOption, setFilter] = useState("All Courses")
    const [active, setActiveTab] = useState("")

    const FILTER_MAP = {
        //"All Courses": user ? user.module.map( (module, index) => <div key={index}>hi</div>  ) : (<div> No </div>),
        
        "Your Courses": user ? (<CourseItem module={user.module[0]}/>) : (<> Unavailable Mate</>),

        "All Courses": user ? (<></>) : (<div>NOHING</div>),

        "Popular" : (<div></div>),

    }


    function handle_option_chosen(option, index){
        setActiveTab(index)
        setFilter(option)
    }

    function render_list(){

    }

    function handle_module_select(){

    }

    return (

        <div className="course-container mt-2">

            <h1 className="page-title"> Your Tags </h1>
            {console.log(user)}
            <section className="tag-course-container mb-2 ">
        
                {user && (
                   user.tags.map(
                    (obj, index)=> (
                        <div className="tag-course" key={index}>
                            <p> {obj.tag} </p>
                        </div>
                    )
                   )
                )}

                <div className="tag-course edit-button" onClick={(e) => {}}> 
                    <GrAdd />
                </div>
                
            </section>
            

            <section className="course-selection-container">

                <h1 className="page-title">Courses</h1>

                <div className="filter-container">
                    
                    <div className="tabs-filter">
                        {Object.keys(FILTER_MAP).map( (option, index) => (
                            <button key={index} 
                                    onClick={() => handle_option_chosen(option, index)}
                                    className= {active === index ? "active":""}
                                    
                            > {option} </button>
                        ))}
                    </div>

                </div>
                

                {FILTER_MAP[filterOption]}


                {/* Show the "Create Module" button only if the user is an Admin */}
                {role === "admin" && (
                    <Link to="/admin/create-module" className="create-module-btn">
                    Create Module
                </Link>
            )}
             </section>






        </div>


        
    );
}
    
export default Courses;
    