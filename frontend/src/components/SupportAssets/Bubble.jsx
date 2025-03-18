


//Replace this with Environmental Variable
const BASE_URL = "http://localhost:8000"


export function Bubble(props) {

    const msg = props.message
    const color = props.background_color

    return (
        <div className={`bubble-item  ${color} mt-1`}>
            <p>{msg}</p>
        </div>
    )
}

export function FileBubble(props){
    const file_url = props.file_url
    const color = props.background_color

    return (
        <div className={`bubble-item ${color} mt-1`}>
            
             <div className="bubble-file"> 
                <img src="https://img.icons8.com/?size=100&id=11651&format=png&color=000000" alt="" ></img>
                <a download href={`${BASE_URL + file_url}`} target="_blank" rel="noopener noreferrer" > {file_url.split('files/')[1]} </a>

             </div> 
            
        </div>
    )



}



