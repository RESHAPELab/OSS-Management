
const GroupComponent = ({professor}) => {


    return (
        <h1>{professor.ownedGroups ? `Groups:` : `Create groups to track student progress!`}</h1>
    )
}

export default GroupComponent