import { useEffect } from 'react';
import { useNavigate  } from 'react-router-dom';

export default function userCheckIfStaff() {
    const navigate = useNavigate();

    useEffect(() => {
        const userRole = localStorage.getItem('user_role');

        if (userRole !== 'Admin') {
            navigate('/forbidden');
        }
    }, [history]);
}