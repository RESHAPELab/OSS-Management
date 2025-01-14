import React, { useEffect, useState } from 'react';
import axios from 'axios'
import "./Home.css"
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
            console.log("logged in user:", authUser.profName)
            fetchGroups()
        }
    }, [authUser])
    
    useEffect(() => {
        console.log('Updated Prof groups:', profGroups);
    }, [profGroups]);
    
    const fetchGroups = async () => {
        try{ 
            const response = await axios.get(`${baseURL}/api/group/${authUser._id}/groups`)
            console.log('response', response.data.groups)
            setProfGroups(response.data.groups)
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


    const createGroup = async (groupName) => {
        try {
            const response = await axios.post(`${baseURL}/api/group/${authUser._id}/groups`, groupName);
            console.log('New group added:', response.data);
            setProfGroups(prevGroups => [...prevGroups, response.data]);
        } catch (error) { 
            console.error('Error creating new group: ', error);
        }
    }

    const handleOpenGroup = async () => {

    }

    return (
        <div>
            <HomeHeader className="header"/>
            <GroupComponent className="group" professor={authUser} groups={profGroups} createGroup={createGroup}/>
        </div>
    )
}

export default Home