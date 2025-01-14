import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css"
import "./GroupComponent.css";
import { useNavigate } from 'react-router-dom'


const GroupComponent = ({ professor, groups, createGroup }) => {
    const [createGroupOpen, setCreateGroupOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [nameSearch, setNameSearch] = useState("");
    const [showActiveOnly, setShowActiveOnly] = useState(true);
    const navigate = useNavigate();

    const handleClassClick = (classId) => {
        navigate(`/class/${classId}`)
    }

    const toggleCreateGroupForm = () => {
        setCreateGroupOpen((prevState) => !prevState);
    };

    const handleGroupNameChange = (e) => {
        setNewGroupName(e.target.value);
    };

    const handleNameSearchChange = (e) => {
        setNameSearch(e.target.value);
    };

    const handleAddGroup = () => {
        if (newGroupName.trim() !== "") {
            createGroup({ groupName: newGroupName });
            setNewGroupName("");
            setCreateGroupOpen(false);
        }
    };

    const handleCancel = () => {
        setNewGroupName("");  // Clear the input field
        setCreateGroupOpen(false);  // Close the form
    };

    const handleShowActiveOnlyChange = (e) => {
        setShowActiveOnly(e.target.checked);
    };

    const filteredGroups = groups.filter((group) => {
        const nameMatches = group.groupName.toLowerCase().includes(nameSearch.toLowerCase());
        const activeMatches = showActiveOnly ? group.active : true;
        return nameMatches && activeMatches;
    });

    return (
        <div className="group-container">
            <h1> Welcome! </h1>
            <h2> {professor.groups
                ? `Your Classes:`
                : `Create groups to track student progress!`}</h2>
            <div className="table-header">
                <div class="filter">
                    <h5 className='name-includes'>Name Includes: </h5>
                    <input
                        type="text"
                        value={nameSearch}
                        onChange={handleNameSearchChange}
                        placeholder="Class Name"
                        className="form-control"
                    />
                    <h5><input type="checkbox" checked={showActiveOnly} onChange={handleShowActiveOnlyChange}/>Show Active Classes Only</h5>
                </div>
                <div className="group-creation">
                    {createGroupOpen ? (
                        <div className="create-group-form">
                            <h5>Enter Name:</h5>
                            <input
                                type="text"
                                value={newGroupName}
                                onChange={handleGroupNameChange}
                                placeholder="Class Name"
                                className="form-control"
                            />
                            <h5 className="add-group" onClick={handleAddGroup}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check" viewBox="0 0 16 16">
                                    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z" />
                                </svg>
                            </h5>
                            <h5 className="cancel-add-group" onClick={handleCancel}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
                                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                                </svg>
                            </h5>
                        </div>
                    ) : (
                        <h5 className="group-create-button" onClick={toggleCreateGroupForm}>
                            Create new class
                        </h5>
                    )}
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-bordered classes">
                    <thead>
                        <tr>
                            <th scope="col">Class Name</th>
                            <th scope="col">Code</th>
                            <th scope="col">Student Count</th>
                            <th scope="col">Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredGroups.length > 0 ? (
                            filteredGroups.map((group, index) => (
                                <tr key={index} onClick={() => handleClassClick(group._id)}>
                                    <td>{group.groupName}</td>
                                    <td>{group.classCode}</td>
                                    <td>{group.studentCount || "N/A"}</td>
                                    <td>{group.active ? "Yes" : "No"}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center">
                                    No classes available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GroupComponent;
