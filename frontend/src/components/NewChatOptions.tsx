import { useState } from "react";
import Options from "./Options";

import CreateDMModal from "./CreateDMModal";
import CreateGroupModal from "./CreateGroupModal";

const OPTIONS = ["Create a DM", "Create a Group"];
const NewChatOptions = () => {
    const [selectedIdx, setSelectedIdx] = useState<number>(-1);

    return (
        <>
            <CreateDMModal isOpen={selectedIdx === 0} setIdx={setSelectedIdx} />
            <CreateGroupModal isOpen={selectedIdx === 1} setIdx={setSelectedIdx} />
            <Options
                options={OPTIONS.map((x) => ({ name: x }))}
                setOptionSelectedIdx={setSelectedIdx}
            />
        </>
    );
};

export default NewChatOptions;
