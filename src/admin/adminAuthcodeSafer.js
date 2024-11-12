import axios from "axios";
const ADMIN_AUTH_CODE = (() => {

    let authCode = generateAuthCode();

    // Function to generate a new auth code
    function generateAuthCode() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    // Function to update the auth code
    const updateAuthCode = () => {
        authCode = generateAuthCode();
        console.log(`Auth code updated to: ${authCode}`);
        axios.post('http://localhost:4502/admin/session-time-left', { authCode: authCode })
    .then((response) => {
        if (response.status === 200 && response.data.time>0) {
            alert(`남은 로그인 시간: ${response.data.time}\n시간 초과 시 재로그인하세요.`);
        }else{
            alert('세션이 만료되었습니다. 다시 로그인하세요.');
        }
    })
    .catch((error) => {
        console.error(error);
    });
    };
    // Set interval to update the auth code every 2 hours
    setInterval(updateAuthCode, 7200000); // 7200000 milliseconds = 2 hours

    return {
        get: () => authCode,
    };
})();

export {ADMIN_AUTH_CODE};
