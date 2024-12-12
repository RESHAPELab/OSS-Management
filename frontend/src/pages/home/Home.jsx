import React, { useEffect, useState } from 'react';
import axios from 'axios'
import { useAuthContext } from '../../context/AuthContext';
import HomeHeader from './components/HomeHeader';
import GroupComponent from './components/GroupComponent';
let baseURL = `http://localhost:${process.env.PORT || 8080}`;

const Home = () => {
    const [profGroups, setProfGroups] = useState([])
    const [openGroup, setOpenGroup] = useState()
    const [groupStudents, setGroupStudents] = useState([])
    const {authUser} = useAuthContext(); 

    useEffect(() => {
        if (authUser) { 
            console.log("logged in user:", authUser.name)
            fetchGroups();
        }
    }, [authUser])
    
    
    const fetchGroups = async () => {
        try{ 
            const response = await axios.get(`${baseURL}/api/group/${authUser._id}/groups`)
            console.log('Prof groups: ', response.data)
            setProfGroups(response.data)
        } catch(error) { 
            console.error('Error fetching professor groups: ', error)
        }
    }
    
    const fetchStudents = async (groupID) => {
        try{ 
            const response = await axios.get(`${baseURL}/api/students/${groupID}`)
            console.log(`Group's students: `, response.data)
            setGroupStudents(response.data);
        } catch(error) { 
            console.error('Error fetching students: ', error)
        }
    }

    const handleOpenGroup = async () => {

    }


    return (
        <div>
            <HomeHeader professor={authUser}/>
            <GroupComponent professor={authUser} />
        </div>
    )
}

export default Home