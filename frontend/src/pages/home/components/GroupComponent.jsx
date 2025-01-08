import { useState } from 'react';

const GroupComponent = ({professor, groups, createGroup}) => {
    const [createGroupOpen, setCreateGroupOpen] = useState(false); 
    const [newGroupName, setNewGroupName] = useState('')

    const toggleCreateGroupForm = () => {
        setCreateGroupOpen((prevState) => !prevState);
    };

    const handleGroupNameChange = (e) => {
        setNewGroupName(e.target.value);
    };

    const handleAddGroup = () => {
        if (newGroupName.trim() !== '') {
            createGroup({ groupName: newGroupName });
            setNewGroupName('');
            setCreateGroupOpen(false);
        }
    };

    return (
        <div>
        <h1>{professor.ownedGroups ? `Groups:` : `Create groups to track student progress!`}</h1>
        <ul>
        <li onClick={toggleCreateGroupForm}>
                    {createGroupOpen ? 'Cancel' : 'Create new group'}
                </li>
                {createGroupOpen && (
                    <li>
                        <div>
                            <input
                                type="text"
                                placeholder="Group Name"
                                id="new-group-name"
                                value={newGroupName}
                                onChange={handleGroupNameChange}
                            />
                            <button onClick={() => handleAddGroup()}>
                                Add Group
                            </button>
                        </div>
                    </li>
                )}
                    {groups.map((group, index) => (
                        <li key={index}>
                            <h3>{group.groupName}</h3>
                            <p>{group.classCode}</p>
                        </li>
                    ))}
        </ul>
        </div>
    )
}

export default GroupComponent