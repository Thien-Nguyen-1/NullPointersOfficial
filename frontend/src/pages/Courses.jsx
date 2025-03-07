import { Link, useSearchParams } from "react-router-dom";
import "../styles/Courses.css";
import "../App.css";

import { AuthContext } from "../services/AuthContext";
import { useContext, useEffect, useState } from "react";
import { GrAdd } from "react-icons/gr";
import CourseItem from "../components/CourseItem";
import { GetModule, GetAllProgressTracker, SaveProgressTracker , SaveUserModuleInteract, GetUserModuleInteract} from "../services/api";
import { IoMdArrowDropupCircle } from "react-icons/io";
import { MdOutlineUnsubscribe } from "react-icons/md";



function Courses({ role }) {

    const {user, token} = useContext(AuthContext)
    
    const [filterOption, setFilter] = useState("All Courses")
    const [active, setActiveTab] = useState("")
    const [modules, setModules] = useState([])

   
    const [userInteractions, setInteract] = useState([])

    if(!user){
        return (<><h3> Placeholder: Authorization Failed mate. Please log in </h3></>)
    }

    useEffect(()=> {
        
        async function fetchModules(){
            const allModules = await GetModule();
           
            setModules(allModules || [])
            
            
        }

        async function fetchInteractions(){
            
            const allInteractions = await GetUserModuleInteract(token)
           
            setInteract(allInteractions || [])

        }
       
        fetchModules()
        fetchInteractions()
       
        
    }, [filterOption] )


    const FILTER_MAP = {
        
        "Your Courses": user ? render_user_list() : (<div>NOHING</div>),
        "All Courses": user ? render_list(modules) : (<div>NOHING</div>),
        "Popular" : user ? render_order_list() : (<div>NOHING</div>),

    }


    function handle_option_chosen(option, index){
        setActiveTab(index)
        setFilter(option)
    }

    function render_user_list(){
        
        const user_mods = userInteractions
            .map( (trck) => modules.filter( (mod) => (trck.module === mod.id) && (trck.hasPinned === true))).flat()
          
        return render_list(user_mods)
    }

    function render_order_list(){
        const like_mods = [...modules].sort( (a,b) => b.upvotes - a.upvotes)
        return render_list(like_mods)
    }

    function render_list(mods){

        return mods.map( (module) => (
            
            <CourseItem 
                key={module.id} 
                module={module} 
                userInteractTarget={userInteractions?.find((obj) => obj.module === module.id)}
                update_interact_module={update_interact_module}
            
            />
        ))

    }

    async function update_interact_module(modId, objInteract){
        if(objInteract){
            const response = await SaveUserModuleInteract(modId, objInteract, token)

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
                

                { FILTER_MAP[filterOption] }

                <h4> Feel free to change the styling Im </h4>
                
               
                
                {user?.user_type == "admin" && (
                    <Link to="/admin/create-module" className="create-module-btn">
                    Create Module </Link>
                )}

                
           
             </section>



        </div>


        
    );
}
    
export default Courses;