import $ from 'jquery';
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
        $.get('/admin/session-time-left', (data) => {
            if(data.status === 200){
                data.message.session.user.authCode = authCode;
                alert(`남은 로그인 시간: ${data.message.time}\n시간 초과 시 재로그인하세요.`);
            }
        }).fail((err) => {
            console.error(err);
        });
    };
    // Set interval to update the auth code every 2 hours
    setInterval(updateAuthCode, 7200000); // 7200000 milliseconds = 2 hours

    return {
        get: () => authCode,
    };
})();

export {ADMIN_AUTH_CODE};