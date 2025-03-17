
import { useState, useCallback } from "react"
import {useDropzone} from 'react-dropzone'


function FileUploader(){


    const onDrop = (acceptedFile) => {
        //save the file
    }


    //check for heic 

    const {getRootProps, getInputProps, acceptedFiles, fileRejections} = useDropzone({
        onDrop,
        accept: {

            'image/png': ['.png'],
            'image/jpeg' : ['.jpeg', '.jpg'],
            'application/pdf' : ['.pdf'],
            

        }
    })


   
    const files = acceptedFiles.map((file) => (
        <li key={file.path}>
            {file.path}
        </li>
    ))
    
  
    

    return (
        <div>

            <div {...getRootProps({className:"dropzone"})}>
                <input className="input-zone" {...getInputProps()} />

                <p> Click to Upload</p>



            </div>

            <ul> {files}</ul>
            

            


        </div>
    )
}


export default FileUploader