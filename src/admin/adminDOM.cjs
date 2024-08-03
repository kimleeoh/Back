function showLoginStatus() {
    $.post("/admin/login",{
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    },function(data,status){
        console.log(data);
        console.log(status);
        var loginStatus = document.getElementById('loginStatus');
        if (loginStatus) {
            loginStatus.innerHTML = data;
        }
    }
    );
}

module.exports= {showLoginStatus };