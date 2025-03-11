


function Bubble(props) {

    const msg = props.message
    const color = props.background_color

    return (
        <div className={`bubble-item  ${color} mt-1`}>
            <p>{msg}</p>
        </div>
    )
}

export default Bubble