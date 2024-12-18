
const HomeHeader = ({professor}) => {
    return ( 
        <div>
            <h1>{professor ? `Hello Professor ${professor.name}` : "No professor found"}</h1>
        </div>
    )
}

export default HomeHeader;