import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Loading = () => {
    return (
        <main className="container loading-page">
            <FontAwesomeIcon icon={faCircleNotch} />
        </main>
    );
};

export default Loading;
