import { Link, useSearchParams } from "react-router-dom";
import styles from "../styles/Courses.module.css";
import "../App.css";

import { AuthContext } from "../services/AuthContext";
import { useContext, useEffect, useState } from "react";
import { GrAdd } from "react-icons/gr";
import CourseItem from "../components/CourseItem";
import ModuleFiltering from "../components/ModuleFiltering";
import { GetModule, SaveUserModuleInteract, GetUserModuleInteract, tagApi} from "../services/api";
import CoursesTagList from "../components/CoursesTagList";


function Courses({ role }) {

    const {user, token} = useContext(AuthContext)
    
    const [filterOption, setFilter] = useState("All Courses")
    const [modules, setModules] = useState([])
    const [tags, setTags] = useState([]);
    const [selectedTag, setSelectedTag] = useState(null);
    const [userInteractions, setInteract] = useState([])

    const [items, setItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;


    if(!user){
        return (<><h3> Placeholder: Authorization Failed mate. Please log in </h3></>)
    }


    useEffect(()=> {
        
        async function fetchModules(){
            const allModules = await GetModule();
            console.log(`api response all modules : ${allModules}`)
           
            setModules(allModules || [])
            
            
        }

        async function fetchInteractions(){
            
            const allInteractions = await GetUserModuleInteract(token)
            
            console.log(`all interactions: ${allInteractions}`);
            setInteract(allInteractions || [])

        }
       
        async function fetchTags(user) {
            try {
                if (user?.user_type === "admin" || user?.user_type === "superadmin") {
                    const response = await tagApi.getAll();
                    console.log(`all tags: ${response.data}`)
                    setTags(response.data);
                } else {
                    console.log(`user tags: ${user.tags}`)
                    setTags(user.tags);
                }
            } catch (err) {
                console.error("Error fetching tags: ", err);
            }
        };


        fetchModules()
        fetchInteractions()
        fetchTags(user)

    }, [filterOption] )

     // Filter courses by selected tag
     const filteredModules = selectedTag 
        ? modules.filter(module => module.tags && module.tags.includes(selectedTag)) 
        : modules;

    const FILTER_MAP = {
        
        "Your Courses": user ? render_user_list() : (<div>NOHING</div>),
        "All Courses": user ? render_list(filteredModules) : (<div>NOHING</div>),
        "Popular" : user ? render_order_list() : (<div>NOHING</div>),

    }



    function render_user_list(){
        
        const user_mods = userInteractions
            .map( (trck) => filteredModules.filter( (mod) => (trck.module === mod.id) && (trck.hasPinned === true))).flat()
        
        return render_list(user_mods)
    }

    function render_order_list(){
        const like_mods = [...filteredModules].sort( (a,b) => b.upvotes - a.upvotes)
        return render_list(like_mods)
    }

    function render_list(mods){

        return mods.map( (module) => (
            
            <CourseItem 
                key={module.id} 
                module={module} 
                role={user?.user_type} // Pass the user's role
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
        <div className={styles.courseContainer}>
        
            
            <CoursesTagList tags={tags} selectedTag={selectedTag} setSelectedTag={setSelectedTag} isUser={user.user_type==="service user"}/>

            <section className={styles.courseSelectionContainer}>

                <h1 className={styles.subheading}>Courses</h1>
                
                <div className={styles.filterContainer}>

                    <ModuleFiltering handleSort={setFilter} currentSortOption={filterOption} />

                    <div className={styles["add-course-btn-container"]}>
                        {(user?.user_type === "admin" || user?.user_type === "superadmin") && (
                        <Link to="/admin/all-courses/create-and-manage-module" className={styles.createModuleBtn}>
                            +
                        </Link>
                        )}
                    </div>

                </div>
                        
                        


                { FILTER_MAP[filterOption] }

                
           
             </section>


        </div>
    );
}
    
export default Courses;