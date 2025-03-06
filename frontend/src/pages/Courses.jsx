import { Link, useSearchParams } from "react-router-dom";
import "../styles/Courses.css";
import "../App.css";

import { AuthContext } from "../services/AuthContext";
import { useContext, useEffect, useState } from "react";
import { GrAdd } from "react-icons/gr";
import CourseItem from "../components/CourseItem";
import { GetModule, GetAllProgressTracker, SaveProgressTracker } from "../services/api";
import { IoMdArrowDropupCircle } from "react-icons/io";



function Courses({ role }) {

    const {user} = useContext(AuthContext)
    
    const [filterOption, setFilter] = useState("All Courses")
    const [active, setActiveTab] = useState("")
    const [modules, setModules] = useState([])

    const [userTracker, setTracker] = useState([])

    useEffect(()=> {
        
        async function fetchModules(){
            const allModules = await GetModule();
           
            setModules(allModules || [])
            
        }


        async function fetchProgressTrackers(){

            const allTrackers = await GetAllProgressTracker();
            

            if(allTrackers && user){
                const userTrackers = allTrackers.filter( (track) => track.user == user.id )
              
                setTracker(userTrackers)
             
            }
          
        }
        
        fetchModules()
        fetchProgressTrackers()
       
        
    }, [] )



    const FILTER_MAP = {
        
      //  "Your Courses": user ? (<CourseItem module={user.module[0]} userTracker={userTracker} update_progress_tracker={update_progress_tracker}/>) : (<> Unavailable Mate</>),
        "Your Courses": user ? render_user_list() : (<div>NOHING</div>),

        "All Courses": user ? render_list(modules) : (<div>NOHING</div>),

        "Popular" : (<div></div>),

    }


    function handle_option_chosen(option, index){
        setActiveTab(index)
        setFilter(option)
    }

    function render_user_list(){
        
        const user_mods = userTracker
            .map( (trck) => modules.filter( (mod) => trck.module === mod.id)).flat()
          
       
        render_list(user_mods)
    }

    function render_list(mods){

        return mods.map( (module) => (
            
            <CourseItem 
                key={module.id} 
                module={module} 
                userTracker={userTracker}
                update_progress_tracker = {update_progress_tracker}
            
            />
        ))

    }

    async function update_progress_tracker(tracker){
        if(tracker){
            console.log("SAVING progress")
            console.log(tracker)
            const response = await SaveProgressTracker(tracker, tracker.id)

            if(response){
                console.log(response)
            }


        }
    }



    
    return (

        <div className="course-container mt-2">
           
            <h1 className="page-title"> Your Tags </h1>
           
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
    