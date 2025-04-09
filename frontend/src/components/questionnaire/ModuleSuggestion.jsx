

function ModuleSuggestionBox(props) {
   
    const title = props?.title;
    const description = props?.description;

    return (
        <div className="suggestion-box mb-1"> 
            <h3> {title}</h3>
            <p> Description: {description}</p>
        </div>
    )

}

export default ModuleSuggestionBox