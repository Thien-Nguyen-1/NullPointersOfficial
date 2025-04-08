
import { useState, useCallback} from "react"
import {useDropzone} from 'react-dropzone'
import { FaUpload } from "react-icons/fa";


function FileUploader(props){


    const onDrop = (acceptedFiles) => {
        props.setFileState(acceptedFiles[0])
       
    }
        

    const {getRootProps, getInputProps, acceptedFiles, fileRejections} = useDropzone({
        onDrop,
        accept: {

            'image/png': ['.png'],
            'image/jpeg' : ['.jpeg', '.jpg'],
            'application/pdf' : ['.pdf'],
            

        }
    })


    return (
        

            <div  {...getRootProps({className:"dropzone"})}  data-testid="dropzone-div">
                <input className="input-zone" {...getInputProps()} />


                <button type="button" style={{'height':'2rem', 'width':'4rem'}}> <FaUpload /></button>


            </div>

    )
}


export default FileUploader