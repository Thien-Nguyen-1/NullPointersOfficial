import styles from "../../styles/AddModule.module.css";



const Headings = (headingSize, key) => {
    return (
        <div>
            <input
                type="text"
                placeholder="Enter Heading here..."
                className={`${styles["heading-input"]} ${styles[headingSize.headingSize]}`}
                key={key}
                />
        </div>
    );
};

export default Headings;


