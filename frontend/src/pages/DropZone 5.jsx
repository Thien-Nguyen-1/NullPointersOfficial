
import React from 'react'
import {useDropzone} from 'react-dropzone'


function DropZoneTest() {   

    const {getRootProps, getInputProps, acceptedFiles} = useDropzone({
        onDrop: (acceptedFiles) =>{
            console.log(acceptedFiles)
        }
    })

    const files  = acceptedFiles.map((file) => (
        <li key={file.path}>
            {file.path}
        </li>
    ))

    return (
        <>
        <div {...getRootProps( )} >
            <input {...getInputProps()} />
            <button> CLICK ME </button>
        </div>

        <div>
            <ul> {files}</ul>
        </div>

        </>

    )



}   

export default DropZoneTest